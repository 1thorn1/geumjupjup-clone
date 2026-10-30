-- 금줍줍 모작 DB 스키마 (Supabase / PostgreSQL)
-- 설계 문서: docs/api-db.md
--
-- 원칙
-- 1. 잔액은 저장하지 않는다. 항상 gold_transactions의 합으로 계산한다
-- 2. 금은 정수(bigint)로 저장한다. 1 = 0.000000000001g (10^-12 g)
-- 3. 같은 보상은 한 번만: 사용자별 idempotency_key 유니크 제약
-- 4. 앱은 테이블을 직접 고치지 못한다. 읽기는 RLS로 "내 것만", 쓰기는 아래 함수(RPC)로만

-- ============================================================
-- 1. 테이블
-- ============================================================

-- 사용자. Supabase 익명 로그인으로 기기마다 auth.users가 하나씩 생기고, 그 id를 그대로 쓴다
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  member_no bigint generated always as identity (start with 47304) unique,
  nickname text not null default '줍줍이',
  created_at timestamptz not null default now()
);

-- 오퍼(캠페인) 목록. 홈의 미션 타일 하나 = 오퍼 하나
create table public.offers (
  id text primary key,                 -- 주소에 쓰는 이름. 예: 'nyang-escape' → /offer/nyang-escape
  tile_id text unique,                 -- 홈 미션 타일. 예: 'bomb'
  category text not null,              -- 예: '폭발 미션'
  title text not null,                 -- 예: '냥탈출'
  campaign_type text not null check (campaign_type in ('app_install', 'signup', 'game', 'survey', 'apply')),
  emoji text not null,                 -- 이미지 대신
  color text not null,                 -- 상세 화면 큰 배경색
  deadline_days int not null check (deadline_days > 0),
  multiplier numeric(3, 1) not null default 1.0 check (multiplier > 0),
  is_featured boolean not null default false,
  sort_order int not null default 0,
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now()
);

-- 오퍼의 단계와 단계별 보상 (금 + 채굴 속도)
create table public.offer_steps (
  id bigint generated always as identity primary key,
  offer_id text not null references public.offers (id) on delete cascade,
  step_order int not null,
  label text not null,
  reward_gold bigint not null default 0 check (reward_gold >= 0),
  reward_boost_percent int not null default 0 check (reward_boost_percent >= 0),
  unique (offer_id, step_order)
);

-- 누가 어떤 오퍼에 참여했나 (참여 중). 같은 오퍼에는 한 번만 참여
-- 기한이 지났는지는 저장하지 않고 expires_at과 지금 시각으로 계산한다
create table public.offer_participations (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  offer_id text not null references public.offers (id) on delete cascade,
  status text not null default 'joined' check (status in ('joined', 'completed')),
  joined_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz,
  unique (user_id, offer_id)
);

-- 단계 완료와 지급 상태: pending(지급 대기) → paid(지급 완료)
-- 보상 값은 완료한 순간의 값을 복사해 둔다 (나중에 오퍼 보상이 바뀌어도 이미 약속한 보상은 그대로)
create table public.offer_step_rewards (
  id bigint generated always as identity primary key,
  participation_id bigint not null references public.offer_participations (id) on delete cascade,
  step_id bigint not null references public.offer_steps (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  reward_gold bigint not null,
  reward_boost_percent int not null,
  completed_at timestamptz not null default now(),
  pay_at timestamptz not null,         -- 이 시각이 지나면 지급
  paid_at timestamptz,
  unique (participation_id, step_id)   -- 같은 단계 보상은 한 번만
);

-- 교환 상품
create table public.products (
  id text primary key,                 -- 예: 'gold-1g', 'kakao-10000'
  category text not null check (category in ('gold', 'gifticon')),
  brand text not null,
  name text not null,
  price_krw int not null check (price_krw > 0),
  cost_gold bigint not null check (cost_gold > 0),
  sort_order int not null default 0
);

-- 교환 신청. 신청 1건 = 금 차감 내역 1건
create table public.exchanges (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id text not null references public.products (id),
  cost_gold bigint not null,           -- 신청 당시 가격
  status text not null default 'completed' check (status in ('completed')),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

-- 금 내역. 잔액 = earn 합 - spend 합
create table public.gold_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('earn', 'spend')),
  amount bigint not null check (amount > 0),
  title text not null,
  source text not null check (source in ('mining', 'message', 'offer', 'exchange', 'dev')),
  idempotency_key text not null,
  offer_step_reward_id bigint references public.offer_step_rewards (id) on delete set null,
  exchange_id bigint references public.exchanges (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

-- 채굴 속도 보상 (출석, 룰렛, 오퍼, 개발자 모드). 지금 속도 = 100% + 켜져 있는 보상 합
create table public.boosts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  percent int not null check (percent >= 0),   -- 0은 룰렛 꽝 (참여 기록만)
  source text not null check (source in ('attendance', 'roulette', 'offer', 'dev')),
  idempotency_key text not null,
  offer_step_reward_id bigint references public.offer_step_rewards (id) on delete set null,
  activated_at timestamptz not null default now(),
  expires_at timestamptz,                      -- null이면 영구
  unique (user_id, idempotency_key)
);

create index on public.offer_steps (offer_id);
create index on public.offer_step_rewards (user_id, status, pay_at);
create index on public.gold_transactions (user_id, created_at desc);
create index on public.boosts (user_id, activated_at desc);

-- ============================================================
-- 2. 접근 규칙 (RLS)
-- 앱에 들어가는 키는 공개 키라서, 테이블마다 "누가 무엇을 볼 수 있나"를 DB가 직접 지킨다
-- 쓰기 정책은 하나도 없다 → 앱은 테이블을 직접 고칠 수 없고, 아래 함수로만 바꾼다
-- ============================================================

alter table public.profiles enable row level security;
alter table public.offers enable row level security;
alter table public.offer_steps enable row level security;
alter table public.offer_participations enable row level security;
alter table public.offer_step_rewards enable row level security;
alter table public.products enable row level security;
alter table public.exchanges enable row level security;
alter table public.gold_transactions enable row level security;
alter table public.boosts enable row level security;

-- 누구나 볼 수 있는 목록
create policy "오퍼는 누구나 조회" on public.offers for select using (true);
create policy "오퍼 단계는 누구나 조회" on public.offer_steps for select using (true);
create policy "상품은 누구나 조회" on public.products for select using (true);

-- 내 것만 볼 수 있는 기록
create policy "내 프로필만 조회" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "내 참여만 조회" on public.offer_participations for select to authenticated using (user_id = (select auth.uid()));
create policy "내 단계 보상만 조회" on public.offer_step_rewards for select to authenticated using (user_id = (select auth.uid()));
create policy "내 교환만 조회" on public.exchanges for select to authenticated using (user_id = (select auth.uid()));
create policy "내 금 내역만 조회" on public.gold_transactions for select to authenticated using (user_id = (select auth.uid()));
create policy "내 속도 보상만 조회" on public.boosts for select to authenticated using (user_id = (select auth.uid()));

-- ============================================================
-- 3. 서버 함수 (RPC). 앱의 모든 쓰기는 여기로 온다
-- security definer: RLS를 넘어 테이블에 쓸 수 있는 대신, 함수 안에서 규칙을 직접 검사한다
-- 에러는 message에 코드(예: INSUFFICIENT_BALANCE), detail에 사용자에게 보여 줄 문장을 담는다
-- ============================================================

-- 로그인한 사용자 id. 로그인하지 않았으면 거절
create function public.require_user() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using detail = '로그인이 필요해요';
  end if;
  return v_uid;
end;
$$;

-- 잔액 = 내역의 합
create function public.balance_of(p_user_id uuid) returns bigint
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(case when type = 'earn' then amount else -amount end), 0)::bigint
  from public.gold_transactions
  where user_id = p_user_id;
$$;

-- 같은 사용자의 돈 관련 요청을 한 줄로 세운다 (동시에 두 번 교환해서 잔액이 음수가 되는 것 방지)
create function public.lock_user(p_user_id uuid) returns void
language sql security definer set search_path = '' as $$
  select 1 from public.profiles where id = p_user_id for update;
$$;

-- 처음 실행한 사용자에게 주는 샘플 내역 (잔액 약 1,580원: 1만 원 상품은 부족, 개발자 모드로 채워서 교환 시연)
create function public.seed_welcome(p_user_id uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.gold_transactions (user_id, type, amount, title, source, idempotency_key, created_at)
  values
    (p_user_id, 'earn', 10000000000, '신규 가입 축하 금', 'message', 'message:welcome', now() - interval '2 days'),
    (p_user_id, 'earn', 10000000, '금 줍기', 'mining', 'mining:seed-1', now() - interval '1 day 23 hours'),
    (p_user_id, 'earn', 120000000, '금 줍기', 'mining', 'mining:seed-2', now() - interval '1 day')
  on conflict (user_id, idempotency_key) do nothing;
$$;

-- POST /me (앱 시작 시): 프로필이 없으면 만들고 샘플 내역을 넣는다. 여러 번 불러도 한 번만 만들어진다
create function public.ensure_profile() returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_user();
  v_profile public.profiles;
begin
  insert into public.profiles (id) values (v_uid) on conflict (id) do nothing;
  if found then
    perform public.seed_welcome(v_uid);
  end if;
  select * into v_profile from public.profiles where id = v_uid;
  return v_profile;
end;
$$;

-- POST /me/gold-transactions: 금 적립 (금 줍기, 개발자 모드)
-- 금 줍기는 한 번에 채굴 상한(0.000120g)을 넘을 수 없다
create function public.earn_gold(p_amount bigint, p_title text, p_source text, p_key text)
returns public.gold_transactions
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_user();
  v_tx public.gold_transactions;
begin
  if p_source not in ('mining', 'dev') then
    raise exception 'INVALID_SOURCE' using detail = '적립할 수 없는 출처예요';
  end if;
  if p_amount <= 0 or (p_source = 'mining' and p_amount > 120000000) then
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

-- 개발자 모드: 금 차감 (잔액 0으로 만들기)
create function public.dev_spend_gold(p_amount bigint, p_key text) returns public.gold_transactions
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_user();
  v_tx public.gold_transactions;
begin
  perform public.lock_user(v_uid);
  if p_amount <= 0 or p_amount > public.balance_of(v_uid) then
    raise exception 'INSUFFICIENT_BALANCE' using detail = '보유하신 금이 부족합니다';
  end if;
  insert into public.gold_transactions (user_id, type, amount, title, source, idempotency_key)
  values (v_uid, 'spend', p_amount, '개발자 모드 차감', 'dev', p_key)
  on conflict (user_id, idempotency_key) do nothing
  returning * into v_tx;
  if v_tx.id is null then
    select * into v_tx from public.gold_transactions where user_id = v_uid and idempotency_key = p_key;
  end if;
  return v_tx;
end;
$$;

-- POST /exchanges: 교환 신청. 가격은 앱이 보낸 값이 아니라 서버의 상품 가격을 쓴다
create function public.exchange_product(p_product_id text, p_key text) returns public.gold_transactions
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_user();
  v_product public.products;
  v_exchange_id bigint;
  v_tx public.gold_transactions;
begin
  perform public.lock_user(v_uid);

  -- 같은 key로 이미 교환했으면 그 결과를 돌려준다 (버튼 연타, 재전송)
  select * into v_tx from public.gold_transactions where user_id = v_uid and idempotency_key = p_key;
  if v_tx.id is not null then
    return v_tx;
  end if;

  select * into v_product from public.products where id = p_product_id;
  if v_product.id is null then
    raise exception 'PRODUCT_NOT_FOUND' using detail = '상품을 찾을 수 없어요';
  end if;
  if v_product.cost_gold > public.balance_of(v_uid) then
    raise exception 'INSUFFICIENT_BALANCE' using detail = '보유하신 금이 부족합니다';
  end if;

  insert into public.exchanges (user_id, product_id, cost_gold, idempotency_key)
  values (v_uid, v_product.id, v_product.cost_gold, p_key)
  returning id into v_exchange_id;

  insert into public.gold_transactions (user_id, type, amount, title, source, idempotency_key, exchange_id)
  values (v_uid, 'spend', v_product.cost_gold, v_product.name, 'exchange', p_key, v_exchange_id)
  returning * into v_tx;
  return v_tx;
end;
$$;

-- POST /me/boosts: 속도 보상 (출석, 룰렛, 개발자 모드). 출처는 key 앞부분으로 정한다
-- 출석·룰렛은 한 번에 100%를 넘을 수 없다
create function public.add_boost(p_title text, p_percent int, p_key text, p_expires_at timestamptz default null)
returns public.boosts
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_user();
  v_source text := split_part(p_key, ':', 1);
  v_boost public.boosts;
begin
  if v_source not in ('attendance', 'roulette', 'dev') then
    raise exception 'INVALID_SOURCE' using detail = '받을 수 없는 보상이에요';
  end if;
  if p_percent < 0 or (v_source <> 'dev' and p_percent > 100) then
    raise exception 'INVALID_AMOUNT' using detail = '받을 수 없는 보상이에요';
  end if;

  insert into public.boosts (user_id, title, percent, source, idempotency_key, expires_at)
  values (v_uid, p_title, p_percent, v_source, p_key, p_expires_at)
  on conflict (user_id, idempotency_key) do nothing
  returning * into v_boost;
  if v_boost.id is null then
    select * into v_boost from public.boosts where user_id = v_uid and idempotency_key = p_key;
  end if;
  return v_boost;
end;
$$;

-- 개발자 모드: key가 이 글자로 시작하는 내 속도 보상 삭제 (예: 'dev:', 'attendance:2026-10-31')
create function public.dev_delete_boosts(p_key_prefix text) returns void
language sql security definer set search_path = '' as $$
  delete from public.boosts
  where user_id = public.require_user()
    and source <> 'offer'
    and idempotency_key like p_key_prefix || '%';
$$;

-- 개발자 모드: 처음 설치한 상태로 (내 기록을 지우고 샘플 내역을 다시 넣음)
create function public.dev_reset() returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_user();
begin
  delete from public.gold_transactions where user_id = v_uid;
  delete from public.boosts where user_id = v_uid;
  delete from public.exchanges where user_id = v_uid;
  delete from public.offer_participations where user_id = v_uid;
  perform public.seed_welcome(v_uid);
end;
$$;

-- POST /offers/{offerId}/participations: 오퍼 참여
create function public.join_offer(p_offer_id text) returns public.offer_participations
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_user();
  v_offer public.offers;
  v_participation public.offer_participations;
begin
  select * into v_offer from public.offers where id = p_offer_id;
  if v_offer.id is null or v_offer.status <> 'active' then
    raise exception 'OFFER_NOT_FOUND' using detail = '참여할 수 없는 미션이에요';
  end if;

  insert into public.offer_participations (user_id, offer_id, expires_at)
  values (v_uid, p_offer_id, now() + make_interval(days => v_offer.deadline_days))
  on conflict (user_id, offer_id) do nothing
  returning * into v_participation;
  if v_participation.id is null then
    select * into v_participation from public.offer_participations where user_id = v_uid and offer_id = p_offer_id;
  end if;
  return v_participation;
end;
$$;

-- POST /offers/{offerId}/steps/{stepId}/completions: 단계 완료 → 지급 대기 (3초 뒤 지급)
-- 참여 중이고, 기한 안이고, 앞 단계를 다 완료했을 때만. 같은 단계는 한 번만
create function public.complete_offer_step(p_step_id bigint) returns public.offer_step_rewards
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_user();
  v_step public.offer_steps;
  v_offer public.offers;
  v_participation public.offer_participations;
  v_reward public.offer_step_rewards;
  v_prev_missing int;
begin
  select * into v_step from public.offer_steps where id = p_step_id;
  if v_step.id is null then
    raise exception 'STEP_NOT_FOUND' using detail = '미션 단계를 찾을 수 없어요';
  end if;
  select * into v_offer from public.offers where id = v_step.offer_id;

  select * into v_participation from public.offer_participations
  where user_id = v_uid and offer_id = v_step.offer_id;
  if v_participation.id is null then
    raise exception 'NOT_PARTICIPATING' using detail = '먼저 미션에 참여해 주세요';
  end if;

  -- 이미 완료한 단계면 그때 기록을 그대로 돌려준다 (연타, 재전송)
  select * into v_reward from public.offer_step_rewards
  where participation_id = v_participation.id and step_id = p_step_id;
  if v_reward.id is not null then
    return v_reward;
  end if;

  if v_participation.expires_at < now() then
    raise exception 'OFFER_EXPIRED' using detail = '참여 기한이 지났어요';
  end if;

  select count(*) into v_prev_missing
  from public.offer_steps s
  where s.offer_id = v_step.offer_id
    and s.step_order < v_step.step_order
    and not exists (
      select 1 from public.offer_step_rewards r
      where r.participation_id = v_participation.id and r.step_id = s.id
    );
  if v_prev_missing > 0 then
    raise exception 'STEP_LOCKED' using detail = '앞 단계를 먼저 완료해 주세요';
  end if;

  insert into public.offer_step_rewards
    (participation_id, step_id, user_id, reward_gold, reward_boost_percent, pay_at)
  values (
    v_participation.id, p_step_id, v_uid,
    round(v_step.reward_gold * v_offer.multiplier)::bigint,
    round(v_step.reward_boost_percent * v_offer.multiplier)::int,
    now() + interval '3 seconds'
  )
  returning * into v_reward;
  return v_reward;
end;
$$;

-- POST /me/offer-rewards/settlements: 지급 시각이 지난 내 보상을 지급한다
-- (따로 타이머 서버를 두지 않고, 앱이 조회할 때 처리한다)
-- 보상 상태 변경 + 금 내역 + 속도 보상이 한 트랜잭션 안에서 함께 처리된다
create function public.settle_my_offer_rewards()
returns table (reward_id bigint, offer_id text, offer_title text, reward_gold bigint, reward_boost_percent int)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_user();
  r record;
begin
  perform public.lock_user(v_uid);

  for r in
    select rw.*, s.offer_id as o_id, o.title as o_title
    from public.offer_step_rewards rw
    join public.offer_steps s on s.id = rw.step_id
    join public.offers o on o.id = s.offer_id
    where rw.user_id = v_uid and rw.status = 'pending' and rw.pay_at <= now()
    order by rw.pay_at
  loop
    update public.offer_step_rewards set status = 'paid', paid_at = now() where id = r.id;

    if r.reward_gold > 0 then
      insert into public.gold_transactions
        (user_id, type, amount, title, source, idempotency_key, offer_step_reward_id)
      values (v_uid, 'earn', r.reward_gold, r.o_title || ' 미션', 'offer', 'offer:' || r.o_id || ':' || r.step_id, r.id)
      on conflict (user_id, idempotency_key) do nothing;
    end if;

    if r.reward_boost_percent > 0 then
      insert into public.boosts
        (user_id, title, percent, source, idempotency_key, offer_step_reward_id)
      values (v_uid, r.o_title || ' 미션', r.reward_boost_percent, 'offer', 'offer:' || r.o_id || ':' || r.step_id, r.id)
      on conflict (user_id, idempotency_key) do nothing;
    end if;

    -- 모든 단계를 지급받았으면 참여 완료
    update public.offer_participations p
    set status = 'completed', completed_at = now()
    where p.id = r.participation_id
      and p.status = 'joined'
      and not exists (
        select 1 from public.offer_steps s
        where s.offer_id = p.offer_id
          and not exists (
            select 1 from public.offer_step_rewards x
            where x.participation_id = p.id and x.step_id = s.id and x.status = 'paid'
          )
      );

    reward_id := r.id;
    offer_id := r.o_id;
    offer_title := r.o_title;
    reward_gold := r.reward_gold;
    reward_boost_percent := r.reward_boost_percent;
    return next;
  end loop;
end;
$$;

-- 함수는 로그인한 사용자만 부를 수 있다 (내부용 함수는 막는다)
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.ensure_profile(),
  public.earn_gold(bigint, text, text, text),
  public.dev_spend_gold(bigint, text),
  public.exchange_product(text, text),
  public.add_boost(text, int, text, timestamptz),
  public.dev_delete_boosts(text),
  public.dev_reset(),
  public.join_offer(text),
  public.complete_offer_step(bigint),
  public.settle_my_offer_rewards()
to authenticated;
revoke execute on function public.require_user(), public.balance_of(uuid), public.lock_user(uuid), public.seed_welcome(uuid)
from authenticated;

-- ============================================================
-- 4. 기본 데이터 (오퍼 7개, 교환 상품 7개)
-- 금 보상 단위: 1g = 1,000,000,000,000. 예) 200000000 = 0.000200g ≈ 31원
-- ============================================================

insert into public.offers (id, tile_id, category, title, campaign_type, emoji, color, deadline_days, multiplier, is_featured, sort_order) values
  ('nyang-escape',     'bomb',    '폭발 미션',     '냥탈출',               'game',        '🐱🧱', '#FF8FB8', 7,  1.0, true,  1),
  ('stock-signup',     'drill',   '드릴 미션',     '증권 앱 회원가입',     'signup',      '📈',   '#7FB3FF', 3,  1.0, false, 2),
  ('magic-puzzle',     'orb',     '마법구슬 미션', '마법 퍼즐',            'game',        '🔮✨', '#B79BFF', 7,  1.5, false, 3),
  ('shopping-install', 'pickaxe', '곡괭이 미션',   '쇼핑 앱 설치하고 실행', 'app_install', '🛍️',  '#FFB36B', 1,  1.0, false, 4),
  ('card-apply',       'wand',    '마법봉 미션',   '카드 신청',            'apply',       '💳',   '#8ED9B5', 14, 1.0, false, 5),
  ('mine-tycoon',      'cart',    '광차 미션',     '광산 키우기',          'game',        '⛏️🏔️', '#C9A27A', 7,  1.0, false, 6),
  ('survey',           'pouch',   '보따리 미션',   '설문 참여',            'survey',      '📝',   '#F4C95D', 1,  1.0, false, 7);

insert into public.offer_steps (offer_id, step_order, label, reward_gold, reward_boost_percent) values
  ('nyang-escape', 1, '5레벨 클리어',  20000000, 75),
  ('nyang-escape', 2, '10레벨 클리어', 20000000, 15),
  ('nyang-escape', 3, '15레벨 클리어', 40000000, 150),
  ('nyang-escape', 4, '20레벨 클리어', 40000000, 75),
  ('nyang-escape', 5, '25레벨 클리어', 80000000, 300),
  ('stock-signup', 1, '앱 설치하기',    100000000, 100),
  ('stock-signup', 2, '회원가입 완료',  500000000, 400),
  ('magic-puzzle', 1, '3레벨 클리어',  20000000, 40),
  ('magic-puzzle', 2, '7레벨 클리어',  40000000, 80),
  ('magic-puzzle', 3, '12레벨 클리어', 80000000, 160),
  ('shopping-install', 1, '앱 설치하기',     100000000, 60),
  ('shopping-install', 2, '설치 후 실행하기', 100000000, 60),
  ('card-apply', 1, '카드 신청서 작성',  200000000, 300),
  ('card-apply', 2, '카드 발급 완료',   1000000000, 700),
  ('mine-tycoon', 1, '10레벨 달성', 20000000, 60),
  ('mine-tycoon', 2, '20레벨 달성', 40000000, 120),
  ('mine-tycoon', 3, '30레벨 달성', 80000000, 240),
  ('survey', 1, '설문 응답하기', 50000000, 30);

insert into public.products (id, category, brand, name, price_krw, cost_gold, sort_order) values
  ('gold-1g',     'gold',     '삼성금거래소', '삼성금거래소 골드바 1g', 156000, 1000000000000, 1),
  ('gold-2g',     'gold',     '삼성금거래소', '삼성금거래소 골드바 2g', 312000, 2000000000000, 2),
  ('gold-3g',     'gold',     '삼성금거래소', '삼성금거래소 골드바 3g', 468000, 3000000000000, 3),
  ('gold-5g',     'gold',     '삼성금거래소', '삼성금거래소 골드바 5g', 780000, 5000000000000, 4),
  ('kakao-10000', 'gifticon', 'Kakao', '카카오톡 선물하기 상품권 10,000원', 10000, 64102564103, 5),
  ('kakao-20000', 'gifticon', 'Kakao', '카카오톡 선물하기 상품권 20,000원', 20000, 128205128206, 6),
  ('kakao-30000', 'gifticon', 'Kakao', '카카오톡 선물하기 상품권 30,000원', 30000, 192307692308, 7);
