import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { ROULETTE_BOOST_PERCENTS } from '@/data/rewards';
import { useMiningContext } from '@/features/mining/MiningProvider';
import { RewardPopup } from '@/features/reward/RewardPopup';
import { toLocalDateKey } from '@/utils/date';

const WHEEL_SIZE = 280;
const SEGMENT_ANGLE = 360 / ROULETTE_BOOST_PERCENTS.length;
const SPIN_DURATION_MS = 4000;
const EXTRA_TURNS = 5; // 결과 칸에 멈추기 전에 더 도는 바퀴 수

export default function RouletteScreen() {
  const { state, hasBoostKey, addBoost } = useMiningContext();
  // 오늘 날짜 키 (기기 시간 기준). 예: 'roulette:2026-10-27'
  const [todayKey] = useState(() => `roulette:${toLocalDateKey()}`);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPercent, setWonPercent] = useState<number | null>(null);
  const rotation = useSharedValue(0);

  const isLoading = state === null;
  // 오늘 이미 돌렸는지는 보상 내역에 오늘 키가 있는지로 계산
  const todayBoost = state?.boosts.find((b) => b.key === todayKey) ?? null;
  const canSpin = !isLoading && !isSpinning && !hasBoostKey(todayKey);

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // 룰렛이 멈춘 뒤 보상 지급 + 팝업
  const handleSpinEnd = (index: number) => {
    const percent = ROULETTE_BOOST_PERCENTS[index];
    addBoost({ title: '룰렛', percent, key: todayKey, expiresAt: null });
    setIsSpinning(false);
    setWonPercent(percent);
  };

  const handleSpin = () => {
    if (!canSpin) return;
    setIsSpinning(true);
    // 결과 칸을 먼저 정하고, 그 칸의 가운데가 맨 위(바늘)에 오도록 돌린다
    const index = Math.floor(Math.random() * ROULETTE_BOOST_PERCENTS.length);
    const segmentCenter = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const target = 360 * EXTRA_TURNS + (360 - segmentCenter);
    rotation.set(
      withTiming(target, { duration: SPIN_DURATION_MS, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) scheduleOnRN(handleSpinEnd, index);
      }),
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Text style={styles.title}>하루 한 번, 룰렛을 돌려 채굴 속도를 올려요</Text>

      <View style={styles.wheelArea}>
        <Ionicons name="caret-down" size={40} color="#D9381E" style={styles.pointer} />
        <Animated.View style={[styles.wheel, wheelStyle]}>
          {ROULETTE_BOOST_PERCENTS.map((percent, i) => (
            <View
              key={`line-${percent}`}
              style={[styles.divider, { transform: [{ rotate: `${i * SEGMENT_ANGLE}deg` }] }]}
            />
          ))}
          {ROULETTE_BOOST_PERCENTS.map((percent, i) => (
            <View
              key={`label-${percent}`}
              style={[
                styles.labelHolder,
                { transform: [{ rotate: `${i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2}deg` }] },
              ]}
            >
              <Text style={styles.label}>+{percent}%</Text>
            </View>
          ))}
          <View style={styles.hub} />
        </Animated.View>
      </View>

      <Text style={styles.result}>
        {todayBoost
          ? `오늘의 보상: 채굴 속도 +${todayBoost.percent}%`
          : isSpinning
            ? '두근두근…'
            : '최대 +100%까지 받을 수 있어요'}
      </Text>

      <Pressable
        style={[styles.button, !canSpin && styles.buttonDisabled]}
        disabled={!canSpin}
        onPress={handleSpin}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>
          {todayBoost ? '내일 다시 돌릴 수 있어요' : isSpinning ? '돌리는 중…' : '룰렛 돌리기'}
        </Text>
      </Pressable>

      <RewardPopup
        visible={wonPercent !== null}
        title="룰렛 당첨!"
        value={`채굴 속도 +${wonPercent ?? 0}%`}
        message="속도가 오르면 금이 더 빨리 쌓여요."
        onClose={() => setWonPercent(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    gap: 24,
  },
  title: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  wheelArea: {
    alignItems: 'center',
  },
  pointer: {
    marginBottom: -12,
    zIndex: 1,
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    backgroundColor: '#FFD666',
    borderWidth: 6,
    borderColor: '#8B7FE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 칸 사이 경계선: 가운데에서 위쪽으로 뻗은 선을 칸 각도만큼 돌림
  divider: {
    position: 'absolute',
    width: 2,
    height: WHEEL_SIZE,
    backgroundColor: 'rgba(139, 127, 232, 0.4)',
  },
  // 칸 이름: 바퀴 전체 크기의 상자를 칸 가운데 각도만큼 돌리고, 글자는 위쪽에 둠
  labelHolder: {
    position: 'absolute',
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    alignItems: 'center',
    paddingTop: 28,
  },
  label: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3B2A14',
  },
  hub: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B7FE8',
  },
  result: {
    fontSize: 16,
    color: '#60646C',
    fontWeight: '600',
  },
  button: {
    alignSelf: 'stretch',
    backgroundColor: '#8B7FE8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
