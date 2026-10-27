import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { products, type Product } from '@/data/products';
import { RewardPopup } from '@/features/reward/RewardPopup';
import { formatGold, formatKrw, unitsToKrw } from '@/features/wallet/gold';
import { useWallet } from '@/features/wallet/WalletProvider';

import { ExchangeConfirmModal } from './ExchangeConfirmModal';
import { ProductCard } from './ProductCard';

// 확인 팝업에 띄운 교환 요청. key는 팝업이 열릴 때 한 번만 만든다
type Pending = { product: Product; key: string };

// 같은 상품도 여러 번 교환할 수 있어서, 교환 요청마다 key를 새로 만든다
function createExchangeKey(productId: string): string {
  return `exchange:${productId}:${Date.now()}`;
}

export default function ExchangeScreen() {
  const { balance, isLoaded, canAfford, spend } = useWallet();
  const [pending, setPending] = useState<Pending | null>(null);
  const [completed, setCompleted] = useState<Product | null>(null);
  const [showLacking, setShowLacking] = useState(false);

  const handlePressProduct = (product: Product) => {
    if (!canAfford(product.cost)) {
      setShowLacking(true);
      return;
    }
    setPending({ product, key: createExchangeKey(product.id) });
  };

  const handleConfirm = () => {
    if (pending === null) return;
    const { product, key } = pending;
    if (!canAfford(product.cost)) {
      setPending(null);
      setShowLacking(true);
      return;
    }
    // [교환하기]를 연타해도 key가 같아서 지갑이 한 번만 차감한다
    spend({ amount: product.cost, title: product.name, source: 'exchange', key });
    setPending(null);
    setCompleted(product);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>보유 금</Text>
            <Text style={styles.summaryGold}>{isLoaded ? formatGold(balance) : '불러오는 중…'}</Text>
            {isLoaded ? (
              <Text style={styles.summaryKrw}>{formatKrw(unitsToKrw(balance))}</Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            affordable={isLoaded && canAfford(item.cost)}
            onPress={() => handlePressProduct(item)}
          />
        )}
      />

      <ExchangeConfirmModal
        product={pending?.product ?? null}
        balance={balance}
        onCancel={() => setPending(null)}
        onConfirm={handleConfirm}
      />

      <RewardPopup
        visible={completed !== null}
        icon="gift"
        title="교환 완료!"
        value={completed?.name}
        message="구매 내역에서 확인할 수 있어요."
        onClose={() => setCompleted(null)}
      />

      {/* 실제 앱과 같은 잔액 부족 안내 */}
      <RewardPopup
        visible={showLacking}
        icon="alert-circle"
        title="보유하신 금이 부족합니다."
        message="금을 더 모은 뒤 다시 교환해 주세요."
        buttonLabel="닫기"
        onClose={() => setShowLacking(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  summary: {
    marginBottom: 4,
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
});
