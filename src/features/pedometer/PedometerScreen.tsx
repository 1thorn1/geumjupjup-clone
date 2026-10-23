import { StyleSheet, Text, View } from 'react-native';

export default function PedometerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>만보기</Text>
      <Text style={styles.sub}>준비 중인 기능입니다</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: '700',
  },
  sub: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
  },
});