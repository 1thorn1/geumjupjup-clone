import { ScrollView, StyleSheet } from 'react-native';

import { COLORS } from '@/features/layout/theme';
import { MiningCard } from '@/features/mining/MiningCard';

import { EventBanner } from './EventBanner';
import { MissionPanel } from './MissionPanel';
import { QuickTiles } from './QuickTiles';

// 실제 앱 홈 순서: 이벤트 배너 → 채굴 카드 → 채굴 속도 증가시키기(미션) → 행운추첨·출석체크
// 보유 금은 공통 상단 바의 잔액 칸이 보여 준다
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <EventBanner />
      <MiningCard />
      <MissionPanel />
      <QuickTiles />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    gap: 20,
  },
});
