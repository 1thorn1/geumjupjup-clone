import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AD_DURATION_SECONDS, cancelAd, completeAd } from './ads';

export default function AdScreen() {
  const [remaining, setRemaining] = useState(AD_DURATION_SECONDS);
  const completedRef = useRef(false);
  const done = remaining === 0;

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // 광고가 끝나기 전에는 안드로이드 뒤로 가기를 막는다
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => !done);
    return () => sub.remove();
  }, [done]);

  // 보상 없이 화면이 닫히면 대기 중인 콜백을 버린다
  useEffect(() => {
    return () => {
      if (!completedRef.current) cancelAd();
    };
  }, []);

  const handleClose = () => {
    completedRef.current = true;
    router.back();
    completeAd();
  };

  const progress = (AD_DURATION_SECONDS - remaining) / AD_DURATION_SECONDS;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>AD</Text>
        <Text style={styles.countdown}>{done ? '시청 완료' : `${remaining}초 남음`}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>광고 시청 중</Text>
        <Text style={styles.sub}>실제 광고 대신 보여주는 mock 화면이에요</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Pressable
        style={[styles.closeButton, !done && styles.closeButtonDisabled]}
        disabled={!done}
        onPress={handleClose}
        accessibilityRole="button"
      >
        <Text style={styles.closeText}>{done ? '닫고 보상 받기' : '광고가 끝나면 닫을 수 있어요'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    color: '#111',
    backgroundColor: '#E8A100',
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  countdown: {
    color: '#ccc',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  sub: {
    color: '#888',
    fontSize: 14,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E8A100',
  },
  closeButton: {
    backgroundColor: '#E8A100',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeButtonDisabled: {
    backgroundColor: '#444',
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
