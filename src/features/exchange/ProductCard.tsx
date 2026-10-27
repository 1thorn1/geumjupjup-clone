import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Product } from '@/data/products';
import { formatGold, formatKrw } from '@/features/wallet/gold';

type Props = {
  product: Product;
  affordable: boolean; // 지금 잔액으로 교환할 수 있는지
  onPress: () => void;
};

// 교환 상품 카드 한 개. 금이 부족하면 버튼을 회색으로 보여 주고, 누르면 안내 팝업을 띄운다
export function ProductCard({ product, affordable, onPress }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{formatKrw(product.priceKrw)}</Text>
        <Text style={styles.cost}>{formatGold(product.cost)}</Text>
      </View>
      <Pressable
        style={[styles.button, !affordable && styles.buttonDisabled]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityHint={affordable ? undefined : '보유한 금이 부족해요'}
      >
        <Text style={[styles.buttonText, !affordable && styles.buttonTextDisabled]}>
          {affordable ? '교환하기' : '금이 부족해요'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#fff',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  brand: {
    fontSize: 12,
    color: '#8A8F98',
    fontWeight: '600',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  price: {
    fontSize: 13,
    color: '#60646C',
  },
  cost: {
    marginTop: 4,
    fontSize: 13,
    color: '#8A6D00',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#8B7FE8',
  },
  buttonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonTextDisabled: {
    color: '#8A8F98',
  },
});
