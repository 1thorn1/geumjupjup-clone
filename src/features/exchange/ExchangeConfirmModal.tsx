import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Product } from '@/data/products';
import { formatGold } from '@/features/wallet/gold';
import type { GoldUnits } from '@/features/wallet/types';

type Props = {
  product: Product | null; // null이면 닫힘
  balance: GoldUnits;
  onCancel: () => void;
  onConfirm: () => void;
};

// 교환 전 확인 팝업: 필요한 금과 교환 후 남는 금을 보여 준다
export function ExchangeConfirmModal({ product, balance, onCancel, onConfirm }: Props) {
  return (
    <Modal visible={product !== null} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        {product && (
          <View style={styles.card}>
            <Text style={styles.title}>{product.name}을(를) 교환할까요?</Text>

            <View style={styles.rows}>
              <Row label="보유 금" value={formatGold(balance)} />
              <Row label="필요한 금" value={`−${formatGold(product.cost)}`} highlight />
              <View style={styles.divider} />
              <Row label="교환 후 남는 금" value={formatGold(balance - product.cost)} />
            </View>

            <View style={styles.buttons}>
              <Pressable style={[styles.button, styles.cancel]} onPress={onCancel} accessibilityRole="button">
                <Text style={styles.cancelText}>취소</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.confirm]} onPress={onConfirm} accessibilityRole="button">
                <Text style={styles.confirmText}>교환하기</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  rows: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 14,
    color: '#60646C',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  rowValueHighlight: {
    color: '#D9381E',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancel: {
    backgroundColor: '#F0F0F3',
  },
  confirm: {
    backgroundColor: '#8B7FE8',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#60646C',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
