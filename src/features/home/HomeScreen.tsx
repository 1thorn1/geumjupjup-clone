import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AttendanceCard } from '@/features/attendance/AttendanceCard';
import { useSecretTap } from '@/features/dev/useSecretTap';
import { MiningCard } from '@/features/mining/MiningCard';
import { RouletteEntryCard } from '@/features/roulette/RouletteEntryCard';
import { formatGold, formatKrw, unitsToKrw } from '@/features/wallet/gold';
import { useWallet } from '@/features/wallet/WalletProvider';

export default function HomeScreen() {
  const { balance, isLoaded } = useWallet();
  const handleSecretTap = useSecretTap(() => router.push('/dev'));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 왼쪽 위 숨겨진 영역: 연속 20번 누르면 개발자 모드 */}
        <Pressable style={styles.secretArea} onPress={handleSecretTap} accessibilityElementsHidden />
        {/* 보유 금을 누르면 금 내역 화면으로 이동 (실제 앱과 같은 흐름) */}
        <Pressable
          style={styles.balanceCard}
          onPress={() => router.push('/history')}
          accessibilityRole="button"
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>보유 금</Text>
            <View style={styles.historyLink}>
              <Text style={styles.historyLinkText}>금 내역</Text>
              <Ionicons name="chevron-forward" size={14} color="#8A6D00" />
            </View>
          </View>
          {isLoaded ? (
            <>
              <Text style={styles.balanceGold}>{formatGold(balance)}</Text>
              <Text style={styles.balanceKrw}>{formatKrw(unitsToKrw(balance))}</Text>
            </>
          ) : (
            <Text style={styles.balanceKrw}>불러오는 중…</Text>
          )}
        </Pressable>

        <MiningCard />

        <AttendanceCard />

        <RouletteEntryCard />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  secretArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 56,
    height: 56,
    zIndex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  balanceCard: {
    backgroundColor: '#FFF6DB',
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8A6D00',
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  historyLinkText: {
    fontSize: 13,
    color: '#8A6D00',
    fontWeight: '600',
  },
  balanceGold: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  balanceKrw: {
    fontSize: 16,
    color: '#60646C',
  },
});
