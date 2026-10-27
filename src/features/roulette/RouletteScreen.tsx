import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import {
  ROULETTE_DAILY_LIMIT,
  ROULETTE_RANDOM_PERCENTS,
  ROULETTE_SEGMENTS,
} from '@/data/rewards';
import { watchAd } from '@/features/ads/ads';
import { useMiningContext } from '@/features/mining/MiningProvider';
import { RewardPopup } from '@/features/reward/RewardPopup';
import { toLocalDateKey } from '@/utils/date';

import {
  countTodaySpins,
  needsAdForNextSpin,
  remainingSpins,
  rouletteDayPrefix,
} from './roulette';

const WHEEL_SIZE = 280;
const SEGMENT_ANGLE = 360 / ROULETTE_SEGMENTS.length;
const SPIN_DURATION_MS = 4000;
const EXTRA_TURNS = 5; // 결과 칸에 멈추기 전에 더 도는 바퀴 수

export default function RouletteScreen() {
  const { state, addBoost } = useMiningContext();
  // 오늘 날짜 (기기 시간 기준). 예: '2026-10-27'
  const [todayKey] = useState(() => toLocalDateKey());
  const [isSpinning, setIsSpinning] = useState(false);
  // 방금 나온 결과 (%). 0이면 꽝. 값이 있으면 결과 팝업을 띄운다
  const [result, setResult] = useState<number | null>(null);
  const rotation = useSharedValue(0);

  const isLoading = state === null;
  // 남은 횟수·광고 필요 여부는 따로 저장하지 않고 보상 내역에서 계산
  const spinsToday = countTodaySpins(state?.boosts ?? [], todayKey);
  const remaining = remainingSpins(spinsToday);
  const needsAd = needsAdForNextSpin(spinsToday);
  const canSpin = !isLoading && !isSpinning && remaining > 0;

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // 룰렛이 멈춘 뒤 기록(꽝 포함) + 결과 팝업
  const handleSpinEnd = (round: number, percent: number) => {
    addBoost({
      title: percent > 0 ? '룰렛' : '룰렛 (꽝)',
      percent,
      key: `${rouletteDayPrefix(todayKey)}${round}`,
      expiresAt: null,
    });
    setIsSpinning(false);
    setResult(percent);
  };

  const startSpin = (round: number) => {
    setIsSpinning(true);
    // 결과 칸을 먼저 정하고, 그 칸의 가운데가 맨 위(바늘)에 오도록 돌린다
    const index = Math.floor(Math.random() * ROULETTE_SEGMENTS.length);
    const percent =
      ROULETTE_SEGMENTS[index] === 'random'
        ? ROULETTE_RANDOM_PERCENTS[Math.floor(Math.random() * ROULETTE_RANDOM_PERCENTS.length)]
        : 0;
    const segmentCenter = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    // 지금 각도에서 이어서 돌도록, 현재 바퀴 수를 기준으로 목표 각도를 잡는다
    const base = Math.ceil(rotation.get() / 360) * 360;
    const target = base + 360 * EXTRA_TURNS + (360 - segmentCenter);
    rotation.set(
      withTiming(target, { duration: SPIN_DURATION_MS, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) scheduleOnRN(handleSpinEnd, round, percent);
      }),
    );
  };

  const handleSpin = () => {
    if (!canSpin) return;
    const round = spinsToday + 1;
    if (needsAd) {
      // 두 번째부터는 광고를 끝까지 봐야 돌아간다
      watchAd(() => startSpin(round));
    } else {
      startSpin(round);
    }
  };

  const buttonText =
    remaining === 0
      ? '내일 다시 돌릴 수 있어요'
      : isSpinning
        ? '돌리는 중…'
        : needsAd
          ? '광고 보고 돌리기'
          : '무료로 돌리기';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Text style={styles.title}>룰렛을 돌려 채굴 속도를 올려요</Text>
      <Text style={styles.count}>
        오늘 남은 횟수 {remaining} / {ROULETTE_DAILY_LIMIT}
      </Text>

      <View style={styles.wheelArea}>
        <Ionicons name="caret-down" size={40} color="#D9381E" style={styles.pointer} />
        <Animated.View style={[styles.wheel, wheelStyle]}>
          {/* 칸 구성은 고정이라 순서(i)를 key로 쓴다 */}
          {ROULETTE_SEGMENTS.map((_, i) => (
            <View
              key={`line-${i}`}
              style={[styles.divider, { transform: [{ rotate: `${i * SEGMENT_ANGLE}deg` }] }]}
            />
          ))}
          {ROULETTE_SEGMENTS.map((segment, i) => (
            <View
              key={`label-${i}`}
              style={[
                styles.labelHolder,
                { transform: [{ rotate: `${i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2}deg` }] },
              ]}
            >
              <Text style={[styles.label, segment === 'lose' && styles.labelLose]}>
                {segment === 'random' ? '랜덤' : '꽝'}
              </Text>
            </View>
          ))}
          <View style={styles.hub} />
        </Animated.View>
      </View>

      <Text style={styles.hint}>
        첫 번째는 무료, 두 번째부터는 광고를 보면 돌릴 수 있어요{'\n'}랜덤 칸: 채굴 속도 +5 ~ +20%
      </Text>

      <Pressable
        style={[styles.button, !canSpin && styles.buttonDisabled]}
        disabled={!canSpin}
        onPress={handleSpin}
        accessibilityRole="button"
      >
        {needsAd && canSpin ? <Ionicons name="play-circle" size={20} color="#fff" /> : null}
        <Text style={styles.buttonText}>{buttonText}</Text>
      </Pressable>

      <RewardPopup
        visible={result !== null}
        title={result ? '룰렛 당첨!' : '아쉬워요, 꽝!'}
        value={result ? `채굴 속도 +${result}%` : '다음 기회에'}
        message={
          remaining > 0
            ? `오늘 ${remaining}번 더 돌릴 수 있어요.`
            : '오늘 룰렛을 모두 돌렸어요. 내일 다시 만나요!'
        }
        onClose={() => setResult(null)}
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
    gap: 16,
  },
  title: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  count: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B7FE8',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#6B4FD8',
  },
  labelLose: {
    color: '#8A7A66',
  },
  hub: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B7FE8',
  },
  hint: {
    fontSize: 13,
    color: '#60646C',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
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
