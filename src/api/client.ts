import { isSupabaseConfigured, supabase } from '@/lib/supabase';

// API 실패. code는 서버가 정한 에러 코드(예: INSUFFICIENT_BALANCE), message는 사용자에게 보여 줄 문장
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

type SupabaseError = { message: string; details?: string | null };

// 서버 함수는 message에 에러 코드, details에 안내 문장을 담아 보낸다 (supabase/migrations 참고)
// 그 밖의 실패(네트워크 끊김 등)는 NETWORK_ERROR로 묶는다
export function toApiError(error: SupabaseError): ApiError {
  if (/^[A-Z_]+$/.test(error.message)) {
    return new ApiError(error.message, error.details || '요청을 처리하지 못했어요');
  }
  return new ApiError('NETWORK_ERROR', '서버와 연결하지 못했어요. 잠시 후 다시 시도해 주세요');
}

// 화면에 보여 줄 에러 문장
export function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : '알 수 없는 오류가 났어요';
}

let sessionPromise: Promise<void> | null = null;

// 모든 요청 전에 한 번: 로그인 확인 → 없으면 익명 로그인 → 내 프로필 준비(처음이면 샘플 내역 지급)
// 여러 화면이 동시에 불러도 로그인은 한 번만 한다 (같은 Promise를 함께 기다림)
export function ensureSession(): Promise<void> {
  sessionPromise ??= (async () => {
    if (!isSupabaseConfigured) {
      throw new ApiError('NOT_CONFIGURED', '서버 설정이 없어요 (.env.local 확인)');
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw toApiError(error);
    }
    const { error } = await supabase.rpc('ensure_profile');
    if (error) throw toApiError(error);
  })().catch((e: unknown) => {
    sessionPromise = null; // 실패하면 다음 요청 때 다시 시도
    throw e;
  });
  return sessionPromise;
}

// 서버 함수 호출 (POST /rest/v1/rpc/{name})
export async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  await ensureSession();
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw toApiError(error);
  return data as T;
}

// 테이블 조회 (GET /rest/v1/{table}). RLS 때문에 내 기록만 돌아온다
export async function select<T>(
  query: (db: typeof supabase) => PromiseLike<{ data: unknown; error: SupabaseError | null }>,
): Promise<T> {
  await ensureSession();
  const { data, error } = await query(supabase);
  if (error) throw toApiError(error);
  return data as T;
}
