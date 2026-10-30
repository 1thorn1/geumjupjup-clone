import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/client';
import { COLORS } from '@/features/layout/theme';
import { RewardPopup } from '@/features/reward/RewardPopup';
import { formatKrw, unitsToKrw } from '@/features/wallet/gold';
import { formatMonthDay } from '@/utils/date';

import { stepReward, type Offer } from './offer';
import { useOffer, type StepStatus } from './OfferProvider';

const STATUS_LABEL: Record<StepStatus, string> = {
  available: '참여 가능',
  pending: '지급 대기',
  paid: '지급 완료',
};

// 보상 표기. 예: 금 +3원 · 속도 +75%
export function rewardText(gold: number, percent: number): string {
  const parts: string[] = [];
  if (gold > 0) parts.push(`금 +${formatKrw(unitsToKrw(gold))}`);
  if (percent > 0) parts.push(`속도 +${percent}%`);
  return parts.join(' · ');
}

// 미션 상세 (/offer/[id]): 큰 이미지 → 제목·기한 → 단계 목록 → 하단 버튼
// 참여 전 → [참여하고 적립받기] → 참여 중 → [다음 단계 완료하기] → 지급 대기(3초) → 지급 완료
// 버튼마다 서버 API를 부르고, 상태는 서버가 돌려준 값으로 바뀐다
export default function OfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOffer, isLoading, error, refresh } = useOffer();
  const offer = getOffer(id);

  if (!offer) {
    return (
      <View style={styles.notFound}>
        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <>
            <Text>{error ?? '미션을 찾을 수 없어요'}</Text>
            {error ? (
              <Pressable onPress={refresh} accessibilityRole="button">
                <Text style={styles.contact}>다시 시도</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    );
  }
  return <OfferDetail offer={offer} />;
}

function OfferDetail({ offer }: { offer: Offer }) {
  const { participationOf, offerStatus, stepStatus, join, completeStep, lastPayout } = useOffer();
  // 이 화면에서 이미 확인한 지급 시각. 이보다 새로운 지급이 생기면 팝업을 띄운다
  const [seenAt, setSeenAt] = useState(() => Date.now());
  const [showContact, setShowContact] = useState(false);
  const [isSending, setIsSending] = useState(false); // 서버 응답을 기다리는 중 (버튼 연타 방지)
  const [failure, setFailure] = useState<string | null>(null);

  const status = offerStatus(offer.id);
  const joined = status !== 'notJoined';
  const expired = status === 'expired';
  const statuses = offer.steps.map((step) => stepStatus(step.id));
  const hasPending = statuses.includes('pending');
  const nextIndex = statuses.indexOf('available');
  const allPaid = nextIndex === -1 && !hasPending;

  const payout = lastPayout && lastPayout.at > seenAt && lastPayout.offerId === offer.id ? lastPayout : null;

  const send = async (request: () => Promise<void>) => {
    setIsSending(true);
    try {
      await request();
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setIsSending(false);
    }
  };

  const handlePress = () => {
    if (!joined) {
      send(() => join(offer.id)); // POST /offers/{id}/participations
      return;
    }
    if (nextIndex >= 0 && !hasPending) send(() => completeStep(offer.steps[nextIndex].id)); // POST .../completions
  };

  const buttonLabel = isSending
    ? '서버에 요청 중…'
    : !joined
      ? '참여하고 적립받기'
      : allPaid
        ? '모든 미션을 완료했어요'
        : expired
          ? '참여 기한이 지났어요'
          : hasPending
            ? '보상 지급 중…'
            : '다음 단계 완료하기 (테스트)';
  const buttonDisabled = isSending || (joined && (allPaid || hasPending || expired));

  const participation = participationOf(offer.id);
  const deadline = participation
    ? `참여 중 · ${formatMonthDay(participation.expiresAt)}까지 완료`
    : `참여 후 ${offer.deadlineDays}일 이내 완료`;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: offer.category,
          headerRight: () => (
            <Pressable onPress={() => setShowContact(true)} accessibilityRole="button">
              <Text style={styles.contact}>문의</Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { backgroundColor: offer.color }]}>
          <Text style={styles.heroEmoji}>{offer.emoji}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{offer.title}</Text>
          <Text style={styles.deadline}>⏳ {deadline}</Text>

          {offer.steps.map((step, i) => {
            const r = stepReward(offer, step);
            return (
              <View key={step.id} style={styles.step}>
                <View style={[styles.chip, chipStyles[statuses[i]]]}>
                  <Text style={[styles.chipText, chipTextStyles[statuses[i]]]}>{STATUS_LABEL[statuses[i]]}</Text>
                </View>
                <Text style={styles.stepLabel}>{step.label}</Text>
                <Text style={styles.stepPercent}>{rewardText(r.gold, r.percent)}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Pressable
        style={[styles.button, buttonDisabled && styles.buttonDisabled]}
        disabled={buttonDisabled}
        onPress={handlePress}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </Pressable>

      <RewardPopup
        visible={payout !== null}
        title="미션 보상 지급 완료!"
        value={rewardText(payout?.rewardGold ?? 0, payout?.rewardBoostPercent ?? 0)}
        message={`${offer.title} 미션 보상이 지급됐어요.`}
        onClose={() => setSeenAt(payout?.at ?? Date.now())}
      />
      <RewardPopup
        visible={failure !== null}
        icon="cloud-offline"
        title="요청하지 못했어요"
        message={failure ?? ''}
        buttonLabel="닫기"
        onClose={() => setFailure(null)}
      />
      <RewardPopup
        visible={showContact}
        icon="chatbubbles"
        title="문의"
        message="mock 오퍼월이라 문의는 받지 않아요."
        buttonLabel="닫기"
        onClose={() => setShowContact(false)}
      />
    </SafeAreaView>
  );
}

const chipStyles = StyleSheet.create({
  available: { backgroundColor: '#E6F0FF' },
  pending: { backgroundColor: '#FFF1DB' },
  paid: { backgroundColor: '#E3F6EA' },
});

const chipTextStyles = StyleSheet.create({
  available: { color: '#2F6FE4' },
  pending: { color: '#C77700' },
  paid: { color: '#1E8E4F' },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contact: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  scroll: {
    paddingBottom: 24,
  },
  hero: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 96,
  },
  body: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  deadline: {
    fontSize: 14,
    color: COLORS.subText,
    fontWeight: '600',
    marginBottom: 4,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EFEFF3',
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  stepPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  button: {
    margin: 16,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#FFA726',
  },
  buttonDisabled: {
    backgroundColor: '#E0C9A6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
});
