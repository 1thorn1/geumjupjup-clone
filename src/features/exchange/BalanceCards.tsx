import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/features/layout/theme';
import { RewardPopup } from '@/features/reward/RewardPopup';
import { formatGold, formatKrw, KRW_PER_GRAM, unitsToKrw } from '@/features/wallet/gold';
import { useWallet } from '@/features/wallet/WalletProvider';

// 선물 화면 위쪽: [보유 금 카드] ⇅ [원화 카드] (실제 앱 배치)
export function BalanceCards() {
  const { balance, isLoaded } = useWallet();
  const [showPrice, setShowPrice] = useState(false);

  const krw = String(unitsToKrw(balance)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <View>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>보유 금</Text>
          <Pressable style={styles.priceButton} onPress={() => setShowPrice(true)} accessibilityRole="button">
            <Ionicons name="trending-up" size={14} color={COLORS.text} />
            <Text style={styles.priceButtonText}>금시세 확인</Text>
          </Pressable>
        </View>
        <Text style={styles.value}>{isLoaded ? formatGold(balance).replace(/g$/, ' g') : '…'}</Text>
      </View>

      {/* 두 카드 사이에 걸친 ⇅ 아이콘 */}
      <View style={styles.swap}>
        <Ionicons name="swap-vertical" size={22} color={COLORS.primary} />
      </View>

      <View style={[styles.card, styles.krwCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>원화</Text>
          <Text style={styles.note}>출금은 불가능하며 당일 금 시세에 맞춰 치환한 원화 가치입니다.</Text>
        </View>
        <Text style={styles.value}>{isLoaded ? `${krw} KRW` : '…'}</Text>
      </View>

      <RewardPopup
        visible={showPrice}
        icon="trending-up"
        title="오늘의 금 시세"
        value={`1g = ${formatKrw(KRW_PER_GRAM)}`}
        message="모작에서는 고정 시세를 사용해요."
        onClose={() => setShowPrice(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    gap: 10,
    borderRadius: 18,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  krwCard: {
    marginTop: -6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  note: {
    flex: 1,
    fontSize: 10,
    color: COLORS.subText,
  },
  priceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.text,
  },
  priceButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  value: {
    alignSelf: 'flex-end',
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  swap: {
    alignSelf: 'center',
    zIndex: 1,
    marginTop: -14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
});
