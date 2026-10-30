import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/features/layout/theme';

import { CAMPAIGN_LABEL, totalReward, type Offer } from './offer';
import { useOffer, type OfferStatus } from './OfferProvider';
import { rewardText } from './OfferScreen';

const STATUS_BADGE: Record<OfferStatus, { label: string; color: string; background: string }> = {
  notJoined: { label: '참여 가능', color: '#2F6FE4', background: '#E6F0FF' },
  joined: { label: '참여 중', color: '#C77700', background: '#FFF1DB' },
  completed: { label: '완료', color: '#1E8E4F', background: '#E3F6EA' },
  expired: { label: '기한 만료', color: '#8A8F98', background: '#F1F1F4' },
};

// 오퍼 리스트 페이지 (/offers): GET /offers 결과를 목록으로 보여 주고, 누르면 상세로 이동
export default function OfferListScreen() {
  const { offers, isLoading, error, refresh } = useOffer();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={offers}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OfferRow offer={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={isLoading && offers.length > 0} onRefresh={refresh} />}
        ListHeaderComponent={
          <Text style={styles.header}>미션을 완료하면 금과 채굴 속도를 받아요. 지급은 완료 후 몇 초 뒤에 처리돼요.</Text>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={styles.empty} color={COLORS.primary} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{error ?? '진행 중인 미션이 없어요'}</Text>
              {error ? (
                <Pressable onPress={refresh} accessibilityRole="button">
                  <Text style={styles.retry}>다시 시도</Text>
                </Pressable>
              ) : null}
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function OfferRow({ offer }: { offer: Offer }) {
  const { offerStatus, stepStatus } = useOffer();
  const status = offerStatus(offer.id);
  const badge = STATUS_BADGE[status];
  const paidCount = offer.steps.filter((s) => stepStatus(s.id) === 'paid').length;
  const total = totalReward(offer);

  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push({ pathname: '/offer/[id]', params: { id: offer.id } })}
      accessibilityRole="button"
    >
      <View style={[styles.icon, { backgroundColor: offer.color }]}>
        <Text style={styles.emoji}>{offer.emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{offer.title}</Text>
        <Text style={styles.sub}>
          {CAMPAIGN_LABEL[offer.campaignType]} · {offer.steps.length}단계
          {status === 'joined' ? ` · ${paidCount}/${offer.steps.length} 완료` : ''}
        </Text>
        <Text style={styles.reward}>{rewardText(total.gold, total.percent)}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: badge.background }]}>
        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: 16,
  },
  header: {
    fontSize: 13,
    color: COLORS.subText,
    marginBottom: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#EFEFF3',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  sub: {
    fontSize: 12,
    color: COLORS.subText,
  },
  reward: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    marginTop: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.subText,
  },
  retry: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
