import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSecretTap } from '@/features/dev/useSecretTap';
import { RewardPopup } from '@/features/reward/RewardPopup';

import { BalancePill } from './BalancePill';
import { COLORS } from './theme';

// 모든 탭 위에 붙는 공통 상단 바: 로고 / 잔액 알약 / 메시지함
// 로고 이미지는 상표라 그대로 쓰지 않고 글자로 대신한다
export function AppHeader() {
  const [showInbox, setShowInbox] = useState(false);
  // 왼쪽 위 로고를 연속 20번 누르면 개발자 모드
  const handleSecretTap = useSecretTap(() => router.push('/dev'));

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.bar}>
        <Pressable onPress={handleSecretTap}>
          <Text style={styles.logo}>금줍줍</Text>
        </Pressable>
        <BalancePill />
        <Pressable onPress={() => setShowInbox(true)} accessibilityRole="button" accessibilityLabel="메시지함">
          <Ionicons name="mail" size={34} color={COLORS.muted} />
        </Pressable>
      </View>

      <RewardPopup
        visible={showInbox}
        icon="mail"
        title="메시지함"
        message="메시지함은 준비 중이에요."
        buttonLabel="닫기"
        onClose={() => setShowInbox(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logo: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.gold,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});
