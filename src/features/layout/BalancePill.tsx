import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { formatGold, formatKrw, unitsToKrw } from '@/features/wallet/gold';
import { useWallet } from '@/features/wallet/WalletProvider';

import { COLORS } from './theme';

const PILL_HEIGHT = 44;
// 원화 ↔ 금(g) 표시를 바꾸는 간격 (밀리초)
const SWITCH_MS = 3000;

// 상단 가운데 보라색 알약: 잔액을 "91원"과 "0.000534119079 g"로 번갈아 보여 준다
// 두 줄(원화, 금)을 세로로 쌓아 두고, 알약 높이만큼 위아래로 밀어서 한 줄씩 보이게 한다
// 누르면 금 내역으로 이동
export function BalancePill() {
  const { balance, isLoaded } = useWallet();
  const [showGold, setShowGold] = useState(false);
  const offset = useSharedValue(0);

  useEffect(() => {
    const id = setInterval(() => setShowGold((v) => !v), SWITCH_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    offset.set(withTiming(showGold ? -PILL_HEIGHT : 0, { duration: 350 }));
  }, [showGold, offset]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  const krw = formatKrw(unitsToKrw(balance)).slice(0, -1); // 예: '91'
  const gold = formatGold(balance).replace(/g$/, ''); // 예: '0.000534119079'

  return (
    <Pressable style={styles.pill} onPress={() => router.push('/history')} accessibilityRole="button">
      {isLoaded ? (
        <Animated.View style={slideStyle}>
          <View style={styles.line}>
            <Text style={styles.value}>{krw}</Text>
            <Text style={styles.unit}>원</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.value}>{gold} </Text>
            <Text style={styles.unit}>g</Text>
          </View>
        </Animated.View>
      ) : (
        <View style={styles.line}>
          <Text style={styles.value}>…</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    height: PILL_HEIGHT,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    overflow: 'hidden',
  },
  line: {
    height: PILL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: '800',
  },
});
