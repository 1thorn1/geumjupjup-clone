import { Stack } from 'expo-router';

import { MiningProvider } from '@/features/mining/MiningProvider';
import { WalletProvider } from '@/features/wallet/WalletProvider';

export default function RootLayout() {
  return (
    <WalletProvider>
      <MiningProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </MiningProvider>
    </WalletProvider>
  );
}
