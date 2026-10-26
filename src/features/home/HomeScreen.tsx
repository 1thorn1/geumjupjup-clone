import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MiningCard } from '@/features/mining/MiningCard';
import { formatGold, formatKrw, unitsToKrw } from '@/features/wallet/gold';
import { useWallet } from '@/features/wallet/WalletProvider';

export default function HomeScreen() {
  const { balance, isLoaded } = useWallet();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>보유 금</Text>
        {isLoaded ? (
          <>
            <Text style={styles.balanceGold}>{formatGold(balance)}</Text>
            <Text style={styles.balanceKrw}>{formatKrw(unitsToKrw(balance))}</Text>
          </>
        ) : (
          <Text style={styles.balanceKrw}>불러오는 중…</Text>
        )}
      </View>

      <MiningCard />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    gap: 16,
  },
  balanceCard: {
    backgroundColor: '#FFF6DB',
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8A6D00',
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
