import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Product } from '@/data/products';
import { COLORS } from '@/features/layout/theme';

import { ProductCard } from './ProductCard';

type Props = {
  group: string;                 // 예: '삼성금거래소'
  items: Product[];
  isAffordable: (p: Product) => boolean;
  onPressProduct: (p: Product) => void;
};

// 브랜드 묶음: 제목 + 접기(^) + 가로로 넘기는 상품 카드 줄
export function BrandSection({ group, items, isAffordable, onPressProduct }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.header} onPress={() => setOpen((v) => !v)} accessibilityRole="button">
        <Text style={styles.title}>{group}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.text} />
      </Pressable>

      {open ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {items.map((p) => (
            <ProductCard key={p.id} product={p} affordable={isAffordable(p)} onPress={() => onPressProduct(p)} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  // 카드 그림자가 잘리지 않게 위아래 여백
  row: {
    gap: 12,
    paddingVertical: 6,
    paddingRight: 16,
  },
});
