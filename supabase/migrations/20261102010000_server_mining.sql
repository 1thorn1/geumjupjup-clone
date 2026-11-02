-- 채굴량을 서버가 계산한다
-- 지금까지는 앱이 "이만큼 캤어요"라고 금액을 보내고 서버는 상한만 확인했다 → 앱을 고치면 금을 마음대로 만들 수 있었다
-- 이제 채굴 시작 시각을 서버에 두고, 금 줍기 요청은 금액 없이 보낸다. 서버가 시작 시각과 속도 보상으로 직접 계산한다

-- 채굴 시작 시각: 사용자마다 하나라 profiles에 칸으로 둔다
alter table public.profiles add column mining_started_at timestamptz not null default now();

-- 채굴 규칙 (앱의 src/features/mining/mining.ts와 같은 값)
-- 상한 0.000120g, 기본 속도(100%)로 60초면 상한까지 찬다 → 1초에 2,000,000 알갱이
create function public.mined_amount(p_user_id uuid, p_from timestamptz, p_to timestamptz) returns bigint
language sql stable security definer set search_path = '' as $$
  -- 기본 속도로 쌓인 시간 + 각 속도 보상이 켜져 있던 시간 × 보상 %
  select floor(least(
    120000000::numeric,
    2000000::numeric * (
      greatest(0, extract(epoch from p_to - p_from))
      + coalesce((
          select sum(extract(epoch from
                   least(p_to, coalesce(b.expires_at, p_to)) - greatest(p_from, b.activated_at)
                 ) * b.percent / 100.0)
          from public.boosts b
          where b.user_id = p_user_id
            and least(p_to, coalesce(b.expires_at, p_to)) > greatest(p_from, b.activated_at)
        ), 0)
    )
  ))::bigint;
$$;

-- POST /me/mining/collections: 금 줍기. 앱은 금액을 보내지 않는다
-- 서버 시계로 쌓인 양을 계산해 내역에 넣고, 채굴을 지금부터 다시 시작한다
create function public.collect_mining() returns public.gold_transactions
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_user();
  v_started_at timestamptz;
  v_amount bigint;
  v_tx public.gold_transactions;
begin
  -- 연타·두 기기에서 동시에 주워도 같은 채굴분은 한 번만 계산된다
  perform public.lock_user(v_uid);
  select mining_started_at into v_started_at from public.profiles where id = v_uid;

  v_amount := public.mined_amount(v_uid, v_started_at, now());
  if v_amount <= 0 then
    raise exception 'NOTHING_TO_COLLECT' using detail = '아직 주울 금이 없어요';
  end if;

  -- key = 이번 채굴의 시작 시각(마이크로초). 같은 채굴분은 두 번 적립되지 않는다
  -- 밀리초로 자르면 1ms 안에 연달아 주울 때 두 채굴분의 key가 같아져서 그 뒤 금 줍기가 계속 실패한다
  insert into public.gold_transactions (user_id, type, amount, title, source, idempotency_key)
  values (v_uid, 'earn', v_amount, '금 줍기', 'mining',
          'mining:' || floor(extract(epoch from v_started_at) * 1000000)::bigint)
  returning * into v_tx;

  update public.profiles set mining_started_at = now() where id = v_uid;
  return v_tx;
end;
$$;

-- 금 적립은 이제 개발자 모드만 (금 줍기는 collect_mining으로만)
create or replace function public.earn_gold(p_amount bigint, p_title text, p_source text, p_key text)
returns public.gold_transactions
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_user();
  v_tx public.gold_transactions;
begin
  if p_source <> 'dev' then
    raise exception 'INVALID_SOURCE' using detail = '적립할 수 없는 출처예요';
  end if;
  if p_amount <= 0 then
    raise exception 'INVALID_AMOUNT' using detail = '적립할 수 없는 금액이에요';
  end if;

  insert into public.gold_transactions (user_id, type, amount, title, source, idempotency_key)
  values (v_uid, 'earn', p_amount, p_title, p_source, p_key)
  on conflict (user_id, idempotency_key) do nothing
  returning * into v_tx;

  -- 같은 key로 이미 처리했으면 그때 만든 내역을 그대로 돌려준다 (멱등성)
  if v_tx.id is null then
    select * into v_tx from public.gold_transactions where user_id = v_uid and idempotency_key = p_key;
  end if;
  return v_tx;
end;
$$;

-- 개발자 모드: 채굴량을 바로 상한까지 채운다 (시작 시각을 하루 전으로)
create function public.dev_fill_mining() returns timestamptz
language sql security definer set search_path = '' as $$
  update public.profiles set mining_started_at = now() - interval '1 day'
  where id = public.require_user()
  returning mining_started_at;
$$;

-- 개발자 모드: 처음 설치한 상태로 (채굴도 지금부터 다시 시작)
create or replace function public.dev_reset() returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_user();
begin
  delete from public.gold_transactions where user_id = v_uid;
  delete from public.boosts where user_id = v_uid;
  delete from public.exchanges where user_id = v_uid;
  delete from public.offer_participations where user_id = v_uid;
  update public.profiles set mining_started_at = now() where id = v_uid;
  perform public.seed_welcome(v_uid);
end;
$$;

-- 함수는 로그인한 사용자만 부를 수 있다. 계산 함수는 다른 사람 id를 넣을 수 있으니 내부용으로 막는다
revoke execute on function public.collect_mining(), public.dev_fill_mining() from public, anon;
grant execute on function public.collect_mining(), public.dev_fill_mining() to authenticated;
revoke execute on function public.mined_amount(uuid, timestamptz, timestamptz) from public, anon, authenticated;
