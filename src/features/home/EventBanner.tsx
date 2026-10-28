import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/features/layout/theme';

// 홈 맨 위 이벤트 띠 배너. 누르면 출석 화면으로 이동
export function EventBanner() {
  return (
    <Pressable style={styles.row} onPress={() => router.push('/attendance')} accessibilityRole="button">
      <View style={styles.chip}>
        <Text style={styles.chipText}>이벤트</Text>
      </View>
      <Text style={styles.text}>신규 가입 유저 출석 이벤트</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  chipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});
