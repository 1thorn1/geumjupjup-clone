import { ScrollView, StyleSheet } from 'react-native';

import { AttendanceCard } from './AttendanceCard';

// 출석체크 화면 (홈의 이벤트 배너·[출석체크] 타일에서 들어옴)
export default function AttendanceScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AttendanceCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
});
