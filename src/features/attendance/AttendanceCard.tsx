import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';

import { watchAd } from '@/features/ads/ads';
import { formatGold } from '@/features/wallet/gold';
import { useWallet } from '@/features/wallet/WalletProvider';

import { ATTENDANCE_REWARD, hasCheckedInToday } from './attendance';

// 위에서 크게 내려와 찍히는 도장 모션
const stampIn = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 2.5 }, { rotate: '-30deg' }] },
  70: { opacity: 1, transform: [{ scale: 0.9 }, { rotate: '-12deg' }], easing: Easing.out(Easing.quad) },
  100: { opacity: 1, transform: [{ scale: 1 }, { rotate: '-12deg' }] },
}).duration(450);

export function AttendanceCard() {
  const { transactions, earn } = useWallet();
  const [justStamped, setJustStamped] = useState(false);
  const checkedIn = hasCheckedInToday(transactions);

  const handleCheckIn = () => {
    watchAd(() => {
      earn('attendance', ATTENDANCE_REWARD);
      setJustStamped(true);
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title}>출석 체크</Text>
        <Text style={styles.sub}>광고를 보고 도장을 받으세요</Text>
        <Text style={styles.reward}>+{formatGold(ATTENDANCE_REWARD)}</Text>
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
        style={[styles.button, checkedIn && styles.buttonDisabled]}
        disabled={checkedIn}
        onPress={handleCheckIn}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{checkedIn ? '오늘 출석 완료' : '출석하기'}</Text>
      </Pressable>
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
    color: '#8A6D00',
    fontVariant: ['tabular-nums'],
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
    backgroundColor: '#E8A100',
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
