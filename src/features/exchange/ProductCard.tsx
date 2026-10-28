import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Product } from '@/data/products';
import { COLORS } from '@/features/layout/theme';

type Props = {
  product: Product;
  affordable: boolean; // 지금 잔액으로 교환할 수 있는지
  onPress: () => void;
};

// 배지 표기. 예: 10000 → '+10,000%'
function formatBadge(percent: number): string {
  return `+${String(percent).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}%`;
}

// 선물 화면 가로 카드 한 개: 이미지 자리(색 카드) + 오른쪽 위 배지 + 작은 제목 + 큰 이름
// 금이 부족하면 흐리게 보여 주고, 누르면 잔액 부족 안내가 뜬다
export function ProductCard({ product, affordable, onPress }: Props) {
  const isGold = product.category === 'gold';

  return (
    <Pressable
      style={[styles.card, !affordable && styles.cardLacking]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={affordable ? '교환하기' : '보유한 금이 부족해요'}
    >
      <View style={[styles.visual, { backgroundColor: product.color }]}>
        <Text style={styles.emoji}>{product.emoji}</Text>
        <Text style={[styles.visualText, isGold ? styles.visualTextGold : styles.visualTextGift]}>
          {product.visual}
        </Text>
      </View>

      <View style={[styles.badge, isGold ? styles.badgeGold : styles.badgeGift]}>
        <Text style={[styles.badgeText, isGold && styles.badgeTextGold]}>{formatBadge(product.badgePercent)}</Text>
      </View>

      <Text style={styles.subtitle} numberOfLines={1}>
        {product.subtitle}
      </Text>
      <Text style={styles.name}>{product.name}</Text>
      {!affordable ? <Text style={styles.lacking}>금이 부족해요</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 170,
    padding: 12,
    gap: 4,
    borderRadius: 18,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLacking: {
    opacity: 0.6,
  },
  visual: {
    height: 110,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  emoji: {
    fontSize: 30,
  },
  visualText: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  visualTextGold: {
    color: '#F4D27A',
  },
  visualTextGift: {
    color: '#3B2A14',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeGold: {
    backgroundColor: COLORS.gold,
  },
  badgeGift: {
    backgroundColor: COLORS.primary,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  badgeTextGold: {
    color: '#3B2A14',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.subText,
  },
  name: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  lacking: {
    fontSize: 11,
    color: '#D9381E',
    fontWeight: '700',
  },
});
