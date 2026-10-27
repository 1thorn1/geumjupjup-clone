import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatGold } from '@/features/wallet/gold';
import type { Transaction, TransactionSource } from '@/features/wallet/types';
import { formatTime } from '@/utils/date';

// 출처별 아이콘
const SOURCE_ICONS: Record<TransactionSource, ComponentProps<typeof Ionicons>['name']> = {
  mining: 'diamond',
  attendance: 'calendar',
  message: 'mail',
  exchange: 'gift',
  dev: 'construct',
};

// 금 내역 한 줄
export function TransactionItem({ tx }: { tx: Transaction }) {
  const isEarn = tx.type === 'earn';

  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <Ionicons name={SOURCE_ICONS[tx.source]} size={20} color="#8B7FE8" />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{tx.title}</Text>
        <Text style={styles.time}>{formatTime(tx.createdAt)}</Text>
      </View>
      <Text style={[styles.amount, isEarn ? styles.earn : styles.spend]}>
        {isEarn ? '+' : '−'}
        {formatGold(tx.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    color: '#8A8F98',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  earn: {
    color: '#2F6FE4',
  },
  spend: {
    color: '#D9381E',
  },
});
