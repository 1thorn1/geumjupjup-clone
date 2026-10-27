import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';

import { ATTENDANCE_BOOST_PERCENT } from '@/data/rewards';
import { useMiningContext } from '@/features/mining/MiningProvider';
import { RewardPopup } from '@/features/reward/RewardPopup';
import { toLocalDateKey } from '@/utils/date';

// 위에서 크게 내려와 찍히는 도장 모션
const stampIn = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 2.5 }, { rotate: '-30deg' }] },
  70: { opacity: 1, transform: [{ scale: 0.9 }, { rotate: '-12deg' }], easing: Easing.out(Easing.quad) },
  100: { opacity: 1, transform: [{ scale: 1 }, { rotate: '-12deg' }] },
}).duration(450);

// 도장 모션을 보여 준 뒤 보상 팝업을 띄우기까지 기다리는 시간 (밀리초)
const POPUP_DELAY_MS = 700;

export function AttendanceCard() {
  const { state, hasBoostKey, addBoost } = useMiningContext();
  // 오늘 날짜 키 (기기 시간 기준). 예: 'attendance:2026-10-27'
  const [todayKey] = useState(() => `attendance:${toLocalDateKey()}`);
  const [justStamped, setJustStamped] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const isLoading = state === null;
  // 버튼 상태는 따로 저장하지 않고, 보상 내역에 오늘 키가 있는지로 계산
  const checkedIn = hasBoostKey(todayKey);

  const handleCheckIn = () => {
    if (isLoading || checkedIn) return;
    addBoost({ title: '출석 체크', percent: ATTENDANCE_BOOST_PERCENT, key: todayKey, expiresAt: null });
    setJustStamped(true);
    setTimeout(() => setShowPopup(true), POPUP_DELAY_MS);
  };

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title}>출석 체크</Text>
        <Text style={styles.sub}>매일 출석하면 채굴 속도가 올라가요</Text>
        <Text style={styles.reward}>채굴 속도 +{ATTENDANCE_BOOST_PERCENT}%</Text>
      </View>

      <View style={styles.stampArea}>
        {checkedIn ? (
          <Animated.View entering={justStamped ? stampIn : undefined} style={styles.stamp}>
            <Text style={styles.stampText}>출석{'\n'}완료</Text>
          </Animated.View>
        ) : (
          <View style={styles.stampPlaceholder} />
        )}
      </View>

      <Pressable
        style={[styles.button, (isLoading || checkedIn) && styles.buttonDisabled]}
        disabled={isLoading || checkedIn}
        onPress={handleCheckIn}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{checkedIn ? '오늘 출석 완료' : '출석하기'}</Text>
      </Pressable>

      <RewardPopup
        visible={showPopup}
        title="출석 완료!"
        value={`채굴 속도 +${ATTENDANCE_BOOST_PERCENT}%`}
        message="내일도 출석하면 속도가 더 올라가요."
        onClose={() => setShowPopup(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    padding: 20,
    gap: 16,
  },
  info: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  sub: {
    fontSize: 14,
    color: '#60646C',
  },
  reward: {
    fontSize: 13,
    color: '#8B7FE8',
    fontWeight: '700',
  },
  stampArea: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stamp: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: '#D9381E',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
  },
  stampText: {
    color: '#D9381E',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  stampPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#DDD',
    borderStyle: 'dashed',
  },
  button: {
    backgroundColor: '#8B7FE8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
