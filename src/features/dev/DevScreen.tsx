import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMiningContext } from '@/features/mining/MiningProvider';
import { useMining } from '@/features/mining/useMining';
import { formatGold, formatKrw, krwToUnits, unitsToKrw } from '@/features/wallet/gold';
import { useWallet } from '@/features/wallet/WalletProvider';
import { toLocalDateKey } from '@/utils/date';

// 개발자 모드에서 만드는 내역·보상의 key. 매번 달라야 해서 시각 + 난수로 만든다
function createDevKey(): string {
  return `dev:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

const ADD_KRW_OPTIONS = [1_000, 10_000, 100_000, 1_000_000];
const SPEED_OPTIONS = [100, 1_000, 3_000];

// 테스트·시연용 개발자 모드 (홈 왼쪽 위를 20번 누르면 열림)
// 잔액을 직접 바꾸지 않고 "개발자 모드" 내역을 추가해서, 잔액 = 내역의 합 원칙을 그대로 지킨다
export default function DevScreen() {
  const { balance, earn, spend, reset: resetWallet } = useWallet();
  const { mined, speedPercent } = useMining();
  const { addBoost, devFill, devRemoveBoosts, reset: resetMining } = useMiningContext();
  const [todayKey] = useState(() => toLocalDateKey());
  const [message, setMessage] = useState<string | null>(null);

  const addGold = (krw: number) => {
    earn({ amount: krwToUnits(krw), title: '개발자 모드 지급', source: 'dev', key: createDevKey() });
    setMessage(`금 ${formatKrw(krw)}어치를 추가했어요`);
  };

  const clearGold = () => {
    if (balance <= 0) return;
    spend({ amount: balance, title: '개발자 모드 차감', source: 'dev', key: createDevKey() });
    setMessage('보유 금을 0으로 만들었어요');
  };

  const addSpeed = (percent: number) => {
    addBoost({ title: '개발자 모드 가속', percent, key: createDevKey(), expiresAt: null });
    setMessage(`채굴 속도 +${percent}%`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.status}>
          <Text style={styles.statusText}>보유 금 {formatGold(balance)} ({formatKrw(unitsToKrw(balance))})</Text>
          <Text style={styles.statusText}>채굴 속도 {speedPercent}%</Text>
          <Text style={styles.statusText}>채굴량 {formatGold(mined)}</Text>
        </View>

        {message ? <Text style={styles.message}>✓ {message}</Text> : null}

        <Section title="보유 금 (내역으로 추가·차감)">
          {ADD_KRW_OPTIONS.map((krw) => (
            <DevButton key={krw} label={`+${formatKrw(krw)}어치`} onPress={() => addGold(krw)} />
          ))}
          <DevButton label="0으로 만들기" danger onPress={clearGold} />
        </Section>

        <Section title="채굴 속도">
          {SPEED_OPTIONS.map((p) => (
            <DevButton
              key={p}
              label={`+${String(p).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}%`}
              onPress={() => addSpeed(p)}
            />
          ))}
          <DevButton
            label="개발자 가속 제거"
            danger
            onPress={() => {
              devRemoveBoosts((b) => b.key.startsWith('dev:'));
              setMessage('개발자 모드로 올린 속도를 없앴어요');
            }}
          />
        </Section>

        <Section title="채굴량">
          <DevButton
            label="바로 상한까지 채우기"
            onPress={() => {
              devFill();
              setMessage('채굴량을 상한까지 채웠어요');
            }}
          />
        </Section>

        <Section title="오늘 기록 초기화">
          <DevButton
            label="출석 다시 하기"
            onPress={() => {
              devRemoveBoosts((b) => b.key === `attendance:${todayKey}`);
              setMessage('오늘 출석 기록을 지웠어요');
            }}
          />
          <DevButton
            label="룰렛 횟수 초기화"
            onPress={() => {
              devRemoveBoosts((b) => b.key.startsWith(`roulette:${todayKey}:`));
              setMessage('오늘 룰렛 기록을 지웠어요');
            }}
          />
        </Section>

        <Section title="전체">
          <DevButton
            label="처음 설치한 상태로 초기화"
            danger
            onPress={() => {
              resetWallet();
              resetMining();
              setMessage('지갑은 샘플 내역으로, 채굴은 처음부터 다시 시작해요');
            }}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.buttons}>{children}</View>
    </View>
  );
}

function DevButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable style={[styles.button, danger && styles.buttonDanger]} onPress={onPress} accessibilityRole="button">
      <Text style={[styles.buttonText, danger && styles.buttonTextDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    gap: 20,
  },
  status: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1E1E24',
    gap: 4,
  },
  statusText: {
    color: '#9FE870',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  message: {
    fontSize: 14,
    color: '#2F6FE4',
    fontWeight: '600',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1EEFF',
  },
  buttonDanger: {
    backgroundColor: '#FDECEA',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B4FD8',
  },
  buttonTextDanger: {
    color: '#D9381E',
  },
});
