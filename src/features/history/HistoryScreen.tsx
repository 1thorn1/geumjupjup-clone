import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatGold, formatKrw, unitsToKrw } from '@/features/wallet/gold';
import type { Transaction, TransactionType } from '@/features/wallet/types';
import { useWallet } from '@/features/wallet/WalletProvider';
import { formatMonthDay } from '@/utils/date';

import { TransactionItem } from './TransactionItem';

// 실제 앱처럼 [상세 내역] = 적립, [구매 내역] = 차감
const TABS: { type: TransactionType; label: string; empty: string }[] = [
  { type: 'earn', label: '상세 내역', empty: '아직 적립 내역이 없어요' },
  { type: 'spend', label: '구매 내역', empty: '아직 구매 내역이 없어요' },
];

type Section = { title: string; data: Transaction[] };

// 최신순 내역을 날짜별로 묶는다 (기기 시간 기준)
function groupByDate(transactions: Transaction[]): Section[] {
  const sections: Section[] = [];
  for (const tx of transactions) {
    const title = formatMonthDay(tx.createdAt);
    const last = sections[sections.length - 1];
    if (last && last.title === title) last.data.push(tx);
    else sections.push({ title, data: [tx] });
  }
  return sections;
}

export default function HistoryScreen() {
  const { balance, transactions, isLoaded } = useWallet();
  // 선물 화면의 [구매 내역]에서 오면 주소가 /history?tab=spend → 구매 내역 탭부터 보여 준다
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<TransactionType>(params.tab === 'spend' ? 'spend' : 'earn');

  const current = TABS.find((t) => t.type === tab) ?? TABS[0];
  const sections = groupByDate(transactions.filter((tx) => tx.type === tab));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 잔액 = 아래 내역(적립 - 차감)의 합 */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>보유 금</Text>
        <Text style={styles.summaryGold}>{isLoaded ? formatGold(balance) : '불러오는 중…'}</Text>
        {isLoaded ? <Text style={styles.summaryKrw}>{formatKrw(unitsToKrw(balance))}</Text> : null}
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.type}
            style={[styles.tab, tab === t.type && styles.tabActive]}
            onPress={() => setTab(t.type)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.type }}
          >
            <Text style={[styles.tabText, tab === t.type && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(tx) => tx.id}
        renderItem={({ item }) => <TransactionItem tx={item} />}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        ListEmptyComponent={<Text style={styles.empty}>{current.empty}</Text>}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  summary: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFF6DB',
    gap: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8A6D00',
  },
  summaryGold: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  summaryKrw: {
    fontSize: 15,
    color: '#60646C',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F0F0F3',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 15,
    color: '#8A8F98',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#3B2A14',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: '700',
    color: '#60646C',
  },
  empty: {
    marginTop: 48,
    textAlign: 'center',
    fontSize: 14,
    color: '#8A8F98',
  },
});
