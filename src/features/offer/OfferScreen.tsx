import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getOffer, stepReward, type Offer } from '@/data/offers';
import { COLORS } from '@/features/layout/theme';
import { RewardPopup } from '@/features/reward/RewardPopup';
import { formatMonthDay } from '@/utils/date';

import { useOffer, type StepStatus } from './OfferProvider';

const STATUS_LABEL: Record<StepStatus, string> = {
  available: '참여 가능',
  pending: '지급 대기',
  paid: '지급 완료',
};

// 미션 상세 (/offer/[id]): 큰 이미지 → 제목·기한 → 단계 목록 → 하단 버튼
// 참여 전 → [참여하고 적립받기] → 참여 중 → [다음 단계 완료하기] → 지급 대기(3초) → 지급 완료
export default function OfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const offer = getOffer(id);

  if (!offer) {
    return (
      <View style={styles.notFound}>
        <Text>미션을 찾을 수 없어요</Text>
      </View>
    );
  }
  return <OfferDetail offer={offer} />;
}

function OfferDetail({ offer }: { offer: Offer }) {
  const { isJoined, joinedAt, stepStatus, join, completeStep, lastPayout } = useOffer();
  // 이 화면에서 이미 확인한 지급 시각. 이보다 새로운 지급이 생기면 팝업을 띄운다
  const [seenAt, setSeenAt] = useState(() => Date.now());
  const [showContact, setShowContact] = useState(false);

  const joined = isJoined(offer.id);
  const statuses = offer.steps.map((step) => stepStatus(offer.id, step.id));
  const hasPending = statuses.includes('pending');
  const nextIndex = statuses.indexOf('available');
  const allPaid = nextIndex === -1 && !hasPending;

  const payout =
    lastPayout && lastPayout.at > seenAt && lastPayout.key.startsWith(`offer:${offer.id}:`) ? lastPayout : null;

  const handlePress = () => {
    if (!joined) {
      join(offer.id);
      return;
    }
    if (nextIndex >= 0 && !hasPending) completeStep(offer.id, offer.steps[nextIndex].id);
  };

  const buttonLabel = !joined
    ? '참여하고 적립받기'
    : allPaid
      ? '모든 미션을 완료했어요'
      : hasPending
        ? '보상 지급 중…'
        : '다음 단계 완료하기 (테스트)';
  const buttonDisabled = joined && (allPaid || hasPending);

  const joinedIso = joinedAt(offer.id);
  const deadline = joinedIso
    ? `참여 중 · ${formatMonthDay(new Date(Date.parse(joinedIso) + offer.deadlineDays * 86_400_000).toISOString())}까지 완료`
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

          {offer.steps.map((step, i) => (
            <View key={step.id} style={styles.step}>
              <View style={[styles.chip, chipStyles[statuses[i]]]}>
                <Text style={[styles.chipText, chipTextStyles[statuses[i]]]}>{STATUS_LABEL[statuses[i]]}</Text>
              </View>
              <Text style={styles.stepLabel}>{step.label}</Text>
              <Text style={styles.stepPercent}>{stepReward(offer, step)} %</Text>
            </View>
          ))}
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
        value={`채굴 속도 +${payout?.percent ?? 0}%`}
        message={`${offer.title} 미션 보상이 지급됐어요.`}
        onClose={() => setSeenAt(payout?.at ?? Date.now())}
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
    fontSize: 15,
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
