import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { AppHeader } from '@/features/layout/AppHeader';
import { COLORS } from '@/features/layout/theme';

// 실제 앱처럼: 모든 탭 위에 공통 상단 바, 하단 탭은 아이콘만 (선택된 탭은 보라색)
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        header: () => <AppHeader />,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: { height: 64, backgroundColor: COLORS.surface },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <Ionicons name="home" color={color} size={30} />,
        }}
      />
      <Tabs.Screen
        name="pedometer"
        options={{
          title: '만보기',
          tabBarIcon: ({ color }) => <Ionicons name="footsteps" color={color} size={30} />,
        }}
      />
      <Tabs.Screen
        name="exchange"
        options={{
          title: '선물',
          tabBarIcon: ({ color }) => <Ionicons name="gift" color={color} size={30} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '프로필',
          tabBarIcon: ({ color }) => <Ionicons name="person" color={color} size={30} />,
        }}
      />
    </Tabs>
  );
}
