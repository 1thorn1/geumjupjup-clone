import { StyleSheet, Text, View } from 'react-native';

import { formatGold } from '@/features/wallet/gold';

import { useMining } from './useMining';

// 속도 표기. 예: 3062 → '3,062%'
function formatPercent(percent: number): string {
  return `${String(percent).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}%`;
}

export function MiningCard() {
  const { mined, isFull, isLoading, speedPercent } = useMining();

  return (
    <View style={styles.card}>
      <Text style={styles.speed}>{formatPercent(speedPercent)}</Text>
      <Text style={styles.status}>
        {isLoading
          ? '채굴 정보를 불러오는 중…'
          : isFull
            ? '금을 모두 모아 휴식중이에요'
            : '열심히 채굴 중이에요'}
      </Text>
      <Text style={styles.amount}>채굴량 {formatGold(mined)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#3B2A14',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  speed: {
    alignSelf: 'flex-end',
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  status: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  amount: {
    color: '#FFD666',
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
