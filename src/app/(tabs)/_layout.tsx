import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/features/layout/AppHeader';
import { COLORS } from '@/features/layout/theme';

// 탭 바가 주는 color는 null도 허용하는 타입이라 Ionicons color와 맞지 않는다
// → 선택 여부(focused)만 받아서 색을 직접 고른다
function TabIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return <Ionicons name={name} size={30} color={focused ? COLORS.primary : COLORS.muted} />;
}

// 실제 앱처럼: 모든 탭 위에 공통 상단 바, 하단 탭은 아이콘만 (선택된 탭은 보라색)
export default function TabLayout() {
  // 안드로이드는 앱이 시스템 버튼(뒤로가기·홈) 영역 밑까지 그려진다
  // 탭 바 높이를 고정하면 아이콘이 그 버튼과 겹치므로, 기기의 아래 여백만큼 높이를 더한다 (웹·여백 없는 기기는 0)
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        header: () => <AppHeader />,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: { height: 64 + insets.bottom, backgroundColor: COLORS.surface },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: '홈',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pedometer"
        options={{
          title: '만보기',
          tabBarIcon: ({ focused }) => <TabIcon name="footsteps" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="exchange"
        options={{
          title: '선물',
          tabBarIcon: ({ focused }) => <TabIcon name="gift" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '프로필',
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
