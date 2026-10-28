import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ROULETTE_DAILY_LIMIT } from '@/data/rewards';
import { COLORS } from '@/features/layout/theme';
import { useMiningContext } from '@/features/mining/MiningProvider';
import { countTodaySpins, remainingSpins } from '@/features/roulette/roulette';
import { toLocalDateKey } from '@/utils/date';

// 홈 맨 아래 타일 2개: [행운추첨](룰렛) [출석체크]
export function QuickTiles() {
  const { state, hasBoostKey } = useMiningContext();
  const [todayKey] = useState(() => toLocalDateKey());

  const remaining = remainingSpins(countTodaySpins(state?.boosts ?? [], todayKey));
  const checkedIn = hasBoostKey(`attendance:${todayKey}`);

  return (
    <View style={styles.row}>
      <Pressable style={styles.tile} onPress={() => router.push('/roulette')} accessibilityRole="button">
        <View style={styles.info}>
          <Text style={styles.title}>행운추첨</Text>
          <Text style={styles.sub}>
            {remaining > 0 ? `오늘 ${remaining}/${ROULETTE_DAILY_LIMIT}회` : '오늘 완료'}
          </Text>
        </View>
        <Text style={styles.emoji}>🎡</Text>
      </Pressable>

      <Pressable style={styles.tile} onPress={() => router.push('/attendance')} accessibilityRole="button">
        <View style={styles.info}>
          <Text style={styles.title}>출석체크</Text>
          <Text style={styles.sub}>{checkedIn ? '오늘 완료' : '광고 보고 출석'}</Text>
        </View>
        <Text style={styles.emoji}>📅</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  info: {
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  sub: {
    fontSize: 12,
    color: COLORS.subText,
  },
  emoji: {
    fontSize: 34,
  },
});
