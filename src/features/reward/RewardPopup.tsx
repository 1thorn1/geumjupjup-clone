import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

type Props = {
  visible: boolean;
  title: string;   // 예: '금을 주웠어요!'
  value: string;   // 크게 보일 보상. 예: '+0.000120000000g', '채굴 속도 +10%'
  message?: string;
  onClose: () => void;
};

// 보상을 받았을 때 띄우는 공통 연출 (금 줍기, 출석, 룰렛 등)
export function RewardPopup({ visible, title, value, message, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {visible && (
          <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.card}>
            <View style={styles.icon}>
              <Ionicons name="sparkles" size={36} color="#E8A100" />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.value}>{value}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <Pressable style={styles.button} onPress={onClose} accessibilityRole="button">
              <Text style={styles.buttonText}>확인</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF6DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: '#8A6D00',
    fontVariant: ['tabular-nums'],
  },
  message: {
    fontSize: 14,
    color: '#60646C',
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    marginTop: 12,
    backgroundColor: '#8B7FE8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
