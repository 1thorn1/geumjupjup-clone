import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { dummyUser } from '@/data/user';
import { EventBanner } from '@/features/home/EventBanner';
import { COLORS } from '@/features/layout/theme';
import { RewardPopup } from '@/features/reward/RewardPopup';

type MenuItem = { label: string; onPress: () => void };

// 프로필 탭 (실제 앱 배치): 이벤트 배너 → 상위 n% → 캐릭터·닉네임·회원번호 → 메뉴 카드 3개
// 사용자 정보는 더미 데이터(dummyUser)를 보여 주고, 메뉴는 이미 있는 화면으로 보내거나 "준비 중"을 띄운다
export default function SettingsScreen() {
  const [soon, setSoon] = useState(false);
  const showSoon = () => setSoon(true);

  const activity: MenuItem[] = [
    { label: '적립 내역', onPress: () => router.push('/history') },
    { label: '채굴 속도 내역', onPress: showSoon },
    { label: '출석 체크', onPress: () => router.push('/attendance') },
    { label: '금줍줍 인스타그램', onPress: showSoon },
  ];
  const invite: MenuItem[] = [
    { label: '추천인 등록', onPress: showSoon },
    { label: '추천인 초대하기', onPress: showSoon },
    { label: '추천인 채굴', onPress: showSoon },
  ];
  const support: MenuItem[] = [
    { label: '설정', onPress: showSoon },
    { label: '문의하기', onPress: showSoon },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <EventBanner />

        <View style={styles.profile}>
          <View style={styles.rank}>
            <Text style={styles.rankText}>
              당신은 현재 <Text style={styles.rankHighlight}>상위 {dummyUser.rankPercent}%</Text> 입니다!!
            </Text>
          </View>

          <View>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>{dummyUser.avatar}</Text>
            </View>
            <EditButton style={styles.avatarEdit} onPress={showSoon} />
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.nickname}>{dummyUser.nickname}</Text>
            <EditButton onPress={showSoon} />
          </View>
          <Text style={styles.memberNo}>회원번호: {dummyUser.memberNo}</Text>
        </View>

        <MenuSection title="내 활동" items={activity} />
        <MenuSection title="친구 초대" items={invite} />
        <MenuSection title="설정 및 문의" items={support} />
      </ScrollView>

      <RewardPopup
        visible={soon}
        icon="construct"
        title="준비 중이에요"
        message="이 기능은 곧 열려요."
        buttonLabel="닫기"
        onClose={() => setSoon(false)}
      />
    </View>
  );
}

// 연필 버튼 (프로필 사진·닉네임 수정)
function EditButton({ onPress, style }: { onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable style={[styles.edit, style]} onPress={onPress} accessibilityRole="button" accessibilityLabel="수정">
      <Ionicons name="pencil" size={16} color={COLORS.primary} />
    </Pressable>
  );
}

// 회색 소제목 + 흰 카드 안의 메뉴 줄들
function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {items.map((item, i) => (
          <Pressable
            key={item.label}
            style={[styles.row, i > 0 && styles.rowDivider]}
            onPress={item.onPress}
            accessibilityRole="button"
          >
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={22} color={COLORS.text} />
          </Pressable>
        ))}
      </View>
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
    gap: 24,
    paddingBottom: 40,
  },
  profile: {
    alignItems: 'center',
    gap: 12,
  },
  rank: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: COLORS.surface,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  rankHighlight: {
    color: '#E07A00',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 64,
  },
  avatarEdit: {
    position: 'absolute',
    right: 0,
    bottom: 4,
  },
  edit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nickname: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },
  memberNo: {
    fontSize: 13,
    color: COLORS.subText,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.subText,
  },
  card: {
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E6E6EA',
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
});
