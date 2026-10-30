import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// 서버 주소와 공개 키는 .env.local(로컬)과 EAS 환경 변수(APK 빌드)에서 읽는다
// 공개 키는 앱에 들어가도 되는 값이다. 데이터 보호는 DB의 RLS와 서버 함수가 맡는다
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && key);

// 웹 정적 렌더링(서버에서 미리 그리기) 중에는 window가 없어 로그인 정보를 저장하지 않는다
const canPersist = typeof window !== 'undefined';

export const supabase = createClient(url ?? 'http://localhost', key ?? 'not-configured', {
  auth: {
    storage: canPersist ? AsyncStorage : undefined,
    persistSession: canPersist,
    autoRefreshToken: canPersist,
    detectSessionInUrl: false,
  },
});

// 앱이 화면에 있을 때만 로그인 토큰을 자동 갱신한다 (Expo·Supabase 권장 방식)
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
