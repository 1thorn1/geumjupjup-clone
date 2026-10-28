import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { groupsOf, productSections, type Product } from '@/data/products';
import { COLORS } from '@/features/layout/theme';
import { RewardPopup } from '@/features/reward/RewardPopup';
import { useWallet } from '@/features/wallet/WalletProvider';

import { BalanceCards } from './BalanceCards';
import { BrandSection } from './BrandSection';
import { ExchangeConfirmModal } from './ExchangeConfirmModal';

// 확인 팝업에 띄운 교환 요청. key는 팝업이 열릴 때 한 번만 만든다
type Pending = { product: Product; key: string };

// 같은 상품도 여러 번 교환할 수 있어서, 교환 요청마다 key를 새로 만든다
function createExchangeKey(productId: string): string {
  return `exchange:${productId}:${Date.now()}`;
}

// 선물 탭 (실제 앱 배치): 보유 금 ⇅ 원화 카드 → ▼ 금 상품 / ▼ 기프티콘 → 브랜드별 가로 카드
export default function ExchangeScreen() {
  const { balance, isLoaded, canAfford, spend } = useWallet();
  const [pending, setPending] = useState<Pending | null>(null);
  const [completed, setCompleted] = useState<Product | null>(null);
  const [popup, setPopup] = useState<'lacking' | 'guide' | null>(null);

  const handlePressProduct = (product: Product) => {
    if (!canAfford(product.cost)) {
      setPopup('lacking');
      return;
    }
    setPending({ product, key: createExchangeKey(product.id) });
  };

  const handleConfirm = () => {
    if (pending === null) return;
    const { product, key } = pending;
    if (!canAfford(product.cost)) {
      setPending(null);
      setPopup('lacking');
      return;
    }
    // [교환하기]를 연타해도 key가 같아서 지갑이 한 번만 차감한다
    spend({ amount: product.cost, title: product.fullName, source: 'exchange', key });
    setPending(null);
    setCompleted(product);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <BalanceCards />

        {productSections.map((section, i) => (
          <View key={section.category} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="caret-down" size={26} color={COLORS.gold} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {/* 실제 앱처럼 첫 분류 제목 옆에만 [가이드] [구매 내역] */}
              {i === 0 ? (
                <View style={styles.headerButtons}>
                  <Pressable style={styles.guide} onPress={() => setPopup('guide')} accessibilityRole="button">
                    <Text style={styles.guideText}>가이드</Text>
                  </Pressable>
                  <Pressable
                    style={styles.history}
                    onPress={() => router.push({ pathname: '/history', params: { tab: 'spend' } })}
                    accessibilityRole="button"
                  >
                    <Text style={styles.historyText}>구매 내역</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            {groupsOf(section.category).map(({ group, items }) => (
              <BrandSection
                key={group}
                group={group}
                items={items}
                isAffordable={(p) => isLoaded && canAfford(p.cost)}
                onPressProduct={handlePressProduct}
              />
            ))}
          </View>
        ))}
      </ScrollView>

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
        value={completed?.fullName}
        message="구매 내역에서 확인할 수 있어요."
        onClose={() => setCompleted(null)}
      />

      {/* 실제 앱과 같은 잔액 부족 안내 */}
      <RewardPopup
        visible={popup === 'lacking'}
        icon="alert-circle"
        title="보유하신 금이 부족합니다."
        message="금을 더 모은 뒤 다시 교환해 주세요."
        buttonLabel="닫기"
        onClose={() => setPopup(null)}
      />
      <RewardPopup
        visible={popup === 'guide'}
        icon="help-circle"
        title="교환 가이드"
        message="모은 금으로 금 상품이나 기프티콘을 교환할 수 있어요. 교환한 상품은 구매 내역에서 확인해요."
        onClose={() => setPopup(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    gap: 28,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  guide: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
  },
  guideText: {
    color: '#fff',
    fontWeight: '700',
  },
  history: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#C8C8CE',
  },
  historyText: {
    color: COLORS.text,
    fontWeight: '700',
  },
});
