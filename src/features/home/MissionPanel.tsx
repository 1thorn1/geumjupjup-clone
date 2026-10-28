import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { missionTiles, type MissionTile } from '@/data/missionTiles';
import { FEATURED_OFFER_ID, getOffer, getOfferByTile, totalReward } from '@/data/offers';
import { COLORS } from '@/features/layout/theme';
import { RewardPopup } from '@/features/reward/RewardPopup';

// 속도 표기. 예: 1515 → '1,515'
function withComma(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 오퍼월 미션 상세로 이동
function openOffer(offerId: string) {
  router.push({ pathname: '/offer/[id]', params: { id: offerId } });
}

// 홈 "▶ 채굴 속도 증가시키기" 영역 = 오퍼월 목록
// 노란 판의 미션 타일 7개 + "미션달성하고 보상받기" 카드. 누르면 미션 상세로 이동
export function MissionPanel() {
  const [popup, setPopup] = useState<'guide' | 'soon' | null>(null);
  const featured = getOffer(FEATURED_OFFER_ID);

  const handleTile = (tile: MissionTile) => {
    const offer = getOfferByTile(tile.id);
    if (offer) openOffer(offer.id);
    else setPopup('soon');
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Ionicons name="play" size={22} color={COLORS.gold} />
        <Text style={styles.title}>채굴 속도 증가시키기</Text>
        <Pressable style={styles.guide} onPress={() => setPopup('guide')} accessibilityRole="button">
          <Text style={styles.guideText}>가이드</Text>
        </Pressable>
      </View>

      {/* 실제 앱처럼 첫 줄 3개, 둘째 줄 4개 */}
      <View style={styles.panel}>
        {[missionTiles.slice(0, 3), missionTiles.slice(3)].map((row, i) => (
          <View key={i} style={styles.panelRow}>
            {row.map((tile) => (
              <Tile key={tile.id} tile={tile} onPress={() => handleTile(tile)} />
            ))}
          </View>
        ))}
      </View>

      {featured ? (
        <Pressable style={styles.featured} onPress={() => openOffer(featured.id)} accessibilityRole="button">
          <View style={[styles.featuredIcon, { backgroundColor: featured.color }]}>
            <Text style={styles.featuredEmoji}>{featured.emoji}</Text>
          </View>
          <View style={styles.featuredInfo}>
            <Text style={styles.featuredTitle}>미션달성하고 보상받기</Text>
            <Text style={styles.featuredSub}>{featured.title}</Text>
          </View>
          <View style={styles.featuredBadge}>
            {/* 단계 보상을 모두 더한 값 */}
            <Text style={styles.featuredBadgeText}>+{withComma(totalReward(featured))}%</Text>
          </View>
        </Pressable>
      ) : null}

      <RewardPopup
        visible={popup === 'guide'}
        icon="help-circle"
        title="채굴 속도 올리는 법"
        message="미션을 완료하면 채굴 속도가 올라가요. 속도가 빠를수록 금이 더 빨리 쌓여요."
        onClose={() => setPopup(null)}
      />
      <RewardPopup
        visible={popup === 'soon'}
        icon="construct"
        title="준비 중이에요"
        message="미션 상세는 곧 열려요."
        buttonLabel="닫기"
        onClose={() => setPopup(null)}
      />
    </View>
  );
}

function Tile({ tile, onPress }: { tile: MissionTile; onPress: () => void }) {
  return (
    <Pressable style={styles.tile} onPress={onPress} accessibilityRole="button">
      <View style={styles.tileIcon}>
        <Text style={styles.tileEmoji}>{tile.emoji}</Text>
        {tile.badge ? (
          <View style={styles.ribbon}>
            <Text style={styles.ribbonText}>{tile.badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.tileName}>{tile.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  guide: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
  },
  guideText: {
    color: '#fff',
    fontWeight: '700',
  },
  panel: {
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.goldPanel,
  },
  panelRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  tile: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  tileIcon: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileEmoji: {
    fontSize: 34,
  },
  ribbon: {
    position: 'absolute',
    top: -8,
    left: -10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    transform: [{ rotate: '-30deg' }],
  },
  ribbonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  tileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A3B1F',
  },
  featured: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  featuredIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFE7B3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredEmoji: {
    fontSize: 22,
  },
  featuredInfo: {
    flex: 1,
    gap: 2,
  },
  featuredTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  featuredSub: {
    fontSize: 13,
    color: COLORS.subText,
  },
  featuredBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
