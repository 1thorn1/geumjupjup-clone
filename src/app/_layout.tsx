import { Stack } from 'expo-router';

import { MiningProvider } from '@/features/mining/MiningProvider';
import { WalletProvider } from '@/features/wallet/WalletProvider';

export default function RootLayout() {
  return (
    <WalletProvider>
      <MiningProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="roulette" options={{ title: '룰렛 미션', headerBackTitle: '홈' }} />
          <Stack.Screen name="history" options={{ title: '금 내역', headerBackTitle: '홈' }} />
          <Stack.Screen name="dev" options={{ title: '개발자 모드', presentation: 'modal' }} />
          <Stack.Screen
            name="ad"
            options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }}
          />
        </Stack>
      </MiningProvider>
    </WalletProvider>
  );
}
