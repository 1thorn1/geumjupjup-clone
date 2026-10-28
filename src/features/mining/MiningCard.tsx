import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { watchAd } from '@/features/ads/ads';
import { COLORS } from '@/features/layout/theme';
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

  // 실제 앱 배치: 갈색 광산 카드(그림 대신 이모지) + 오른쪽 위 속도 % + 채굴량 칸
  // + 카드 아래쪽에 걸친 [AD 광고 보고 금 줍기] 버튼
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.speed}>{formatPercent(speedPercent)}</Text>
        <Text style={styles.scene}>⛏️🐥{'\n'}🪙🪙🪙</Text>
        <View style={styles.bottom}>
          <Text style={styles.status}>
            {isLoading
              ? '채굴 정보를 불러오는 중…'
              : isFull
                ? '금을 모두 모아 휴식중이에요'
                : '열심히 채굴 중이에요'}
          </Text>
          <View style={styles.amountPill}>
            <Text style={styles.amount}>채굴량 {formatGold(mined).replace(/g$/, ' g')}</Text>
          </View>
        </View>
      </View>

      <Pressable
        style={[styles.button, !canCollect && styles.buttonDisabled]}
        disabled={!canCollect}
        onPress={handleCollect}
        accessibilityRole="button"
      >
        <View style={styles.adBadge}>
          <Text style={styles.adText}>AD</Text>
        </View>
        <Text style={styles.buttonText}>
          광고 보고 <Text style={styles.buttonGold}>금 줍기</Text>
        </Text>
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

const BUTTON_OVERLAP = 28; // 버튼이 카드 아래로 걸쳐 나오는 길이

const styles = StyleSheet.create({
  wrap: {
    marginBottom: BUTTON_OVERLAP,
  },
  card: {
    height: 240,
    borderRadius: 20,
    padding: 16,
    paddingBottom: BUTTON_OVERLAP + 12,
    backgroundColor: '#7A4A1C',
    overflow: 'hidden',
  },
  speed: {
    alignSelf: 'flex-end',
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    textDecorationLine: 'underline',
    fontVariant: ['tabular-nums'],
  },
  scene: {
    position: 'absolute',
    left: 20,
    top: 56,
    fontSize: 44,
    lineHeight: 56,
  },
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    gap: 8,
  },
  status: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  amountPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: '#FFE7A8',
  },
  amount: {
    color: '#3B2A14',
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  // 카드 오른쪽 아래에 절반쯤 걸쳐 나오는 버튼
  button: {
    position: 'absolute',
    right: 0,
    bottom: -BUTTON_OVERLAP,
    width: '68%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#A9A2D8',
  },
  adBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#E5484D',
  },
  adText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  buttonGold: {
    color: COLORS.gold,
  },
});
