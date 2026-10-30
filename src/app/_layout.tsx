import { Stack } from 'expo-router';

import { MiningProvider } from '@/features/mining/MiningProvider';
import { OfferProvider } from '@/features/offer/OfferProvider';
import { WalletProvider } from '@/features/wallet/WalletProvider';

export default function RootLayout() {
  return (
    <WalletProvider>
      <MiningProvider>
        {/* 오퍼 보상이 지급되면 지갑과 속도 보상을 다시 받아 와야 해서 두 Provider 안에 둔다 */}
        <OfferProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="roulette" options={{ title: '행운추첨', headerBackTitle: '홈' }} />
            <Stack.Screen name="attendance" options={{ title: '출석체크', headerBackTitle: '홈' }} />
            <Stack.Screen name="history" options={{ title: '금 내역', headerBackTitle: '홈' }} />
            <Stack.Screen name="boost-history" options={{ title: '채굴 속도 내역', headerBackTitle: '프로필' }} />
            <Stack.Screen name="offers" options={{ title: '미션 목록', headerBackTitle: '홈' }} />
            <Stack.Screen name="offer/[id]" options={{ headerBackTitle: '뒤로' }} />
            <Stack.Screen name="dev" options={{ title: '개발자 모드', presentation: 'modal' }} />
            <Stack.Screen
              name="ad"
              options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }}
            />
          </Stack>
        </OfferProvider>
      </MiningProvider>
    </WalletProvider>
  );
}
