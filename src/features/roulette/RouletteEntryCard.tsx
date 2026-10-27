import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMiningContext } from '@/features/mining/MiningProvider';
import { toLocalDateKey } from '@/utils/date';

// 홈에서 룰렛 화면으로 들어가는 카드
export function RouletteEntryCard() {
  const { hasBoostKey } = useMiningContext();
  const [todayKey] = useState(() => `roulette:${toLocalDateKey()}`);
  const done = hasBoostKey(todayKey);

  return (
    <Pressable style={styles.card} onPress={() => router.push('/roulette')} accessibilityRole="button">
      <View style={styles.icon}>
        <Ionicons name="color-filter" size={28} color="#8B7FE8" />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>룰렛 미션</Text>
        <Text style={styles.sub}>{done ? '오늘 참여 완료' : '돌리면 채굴 속도 최대 +100%'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF6DB',
    borderRadius: 16,
    padding: 16,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  sub: {
    fontSize: 13,
    color: '#60646C',
  },
});
