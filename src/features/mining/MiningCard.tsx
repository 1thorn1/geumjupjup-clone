import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { watchAd } from '@/features/ads/ads';
import { RewardPopup } from '@/features/reward/RewardPopup';
import { formatGold } from '@/features/wallet/gold';
import { useWallet } from '@/features/wallet/WalletProvider';

import { useMining } from './useMining';

// 속도 표기. 예: 3062 → '3,062%'
function formatPercent(percent: number): string {
  return `${String(percent).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}%`;
}

export function MiningCard() {
  const { mined, isFull, isLoading, speedPercent, collect } = useMining();
  const { earn } = useWallet();
  // 방금 주운 양. 값이 있으면 보상 팝업을 띄우고, 닫을 때까지 버튼을 막는다
  const [collected, setCollected] = useState<number | null>(null);

  const canCollect = !isLoading && mined > 0 && collected === null;

  const handleCollect = () => {
    if (!canCollect) return;
    // 실제 앱처럼 광고를 끝까지 봐야 금을 주울 수 있다
    // 광고를 보는 동안 쌓인 양까지 포함하도록, 채굴량은 광고가 끝난 순간에 꺼낸다
    watchAd(() => {
      const result = collect();
      if (result === null) return;
      earn({ amount: result.amount, title: '금 줍기', source: 'mining', key: result.key });
      setCollected(result.amount);
    });
  };

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

      <Pressable
        style={[styles.button, !canCollect && styles.buttonDisabled]}
        disabled={!canCollect}
        onPress={handleCollect}
        accessibilityRole="button"
      >
        <Ionicons name="play-circle" size={22} color="#fff" />
        <Text style={styles.buttonText}>광고 보고 금 줍기</Text>
      </Pressable>

      <RewardPopup
        visible={collected !== null}
        title="금을 주웠어요!"
        value={`+${formatGold(collected ?? 0)}`}
        message="지갑에 들어갔어요. 채굴은 처음부터 다시 시작해요."
        onClose={() => setCollected(null)}
      />
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
  button: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#8B7FE8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#6B6255',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
