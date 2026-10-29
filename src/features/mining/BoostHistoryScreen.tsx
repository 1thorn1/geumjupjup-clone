import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/features/layout/theme';
import { formatTime, groupByMonthDay } from '@/utils/date';

import { BASE_SPEED_PERCENT, type Boost } from './mining';
import { useMining } from './useMining';

type IconName = ComponentProps<typeof Ionicons>['name'];

// key 앞부분으로 어디서 받은 보상인지 구분해 아이콘을 고른다
function iconOf(boost: Boost): IconName {
  if (boost.key.startsWith('attendance:')) return 'calendar';
  if (boost.key.startsWith('roulette:')) return 'sync-circle';
  if (boost.key.startsWith('offer:')) return 'game-controller';
  if (boost.key.startsWith('dev:')) return 'construct';
  return 'flash';
}

// 채굴 속도 내역: 출석·룰렛·오퍼월로 받은 속도 보상 목록 (최신순, 날짜별)
// 금 내역(지갑)과 따로 있는 이유: 이 보상들은 금이 아니라 채굴 속도를 올려 준다
export default function BoostHistoryScreen() {
  const { boosts, speedPercent, isLoading } = useMining();
  const sections = groupByMonthDay(boosts, (b) => b.activatedAt);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 지금 속도 = 기본 100% + 아래 보상의 합 */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>지금 채굴 속도</Text>
        <Text style={styles.summarySpeed}>{isLoading ? '불러오는 중…' : `${speedPercent}%`}</Text>
        {!isLoading ? (
          <Text style={styles.summaryNote}>
            기본 {BASE_SPEED_PERCENT}% + 받은 보상 {speedPercent - BASE_SPEED_PERCENT}%
          </Text>
        ) : null}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <BoostItem boost={item} />}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        ListEmptyComponent={<Text style={styles.empty}>아직 받은 채굴 속도 보상이 없어요</Text>}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

function BoostItem({ boost }: { boost: Boost }) {
  const isLose = boost.percent === 0; // 룰렛 꽝 (참여 기록만 남음)

  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <Ionicons name={iconOf(boost)} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{boost.title}</Text>
        <Text style={styles.time}>
          {formatTime(boost.activatedAt)} · {boost.expiresAt === null ? '영구' : `${formatTime(boost.expiresAt)}까지`}
        </Text>
      </View>
      <Text style={[styles.percent, isLose && styles.percentLose]}>{isLose ? '꽝' : `+${boost.percent}%`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  summary: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F1EEFF',
    gap: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  summarySpeed: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  summaryNote: {
    fontSize: 13,
    color: COLORS.subText,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.subText,
  },
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
  percent: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  percentLose: {
    color: '#8A8F98',
  },
  empty: {
    marginTop: 48,
    textAlign: 'center',
    fontSize: 14,
    color: '#8A8F98',
  },
});
