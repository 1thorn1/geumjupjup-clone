import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#E8A100' }}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: '홈',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="pedometer"
        options={{
          title: '만보기',
          tabBarIcon: ({ color, size }) => <Ionicons name="walk" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="exchange"
        options={{
          title: '교환',
          tabBarIcon: ({ color, size }) => <Ionicons name="gift" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}