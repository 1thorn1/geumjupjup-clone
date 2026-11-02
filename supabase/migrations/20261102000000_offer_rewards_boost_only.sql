-- 오퍼월 보상을 채굴 속도(%)만으로 바꾼다
-- 실제 금줍줍처럼 미션 보상은 금이 아니라 채굴 속도이고, 지갑에 금이 들어오는 길은 "광고 보고 금 줍기" 하나다
-- (이미 지급된 오퍼 금 내역은 기록으로 남겨 둔다. gold_transactions.source의 'offer'도 그 때문에 유지)

-- 1. 함수부터 지운다 (돌려주는 모양이 바뀌고, 지울 칸을 쓰고 있어서)
drop function public.settle_my_offer_rewards();
drop function public.complete_offer_step(bigint);

-- 2. 금 보상 칸 삭제
alter table public.offer_steps drop column reward_gold;
alter table public.offer_step_rewards drop column reward_gold;

-- 3. POST /offers/{offerId}/steps/{stepId}/completions: 단계 완료 → 지급 대기 (3초 뒤 지급)
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

  insert into public.offer_step_rewards (participation_id, step_id, user_id, reward_boost_percent, pay_at)
  values (
    v_participation.id, p_step_id, v_uid,
    round(v_step.reward_boost_percent * v_offer.multiplier)::int,
    now() + interval '3 seconds'
  )
  returning * into v_reward;
  return v_reward;
end;
$$;

-- 4. POST /me/offer-rewards/settlements: 지급 시각이 지난 내 보상을 지급한다 (채굴 속도만)
-- 보상 상태 변경 + 속도 보상 추가 + 참여 완료 처리가 한 트랜잭션 안에서 함께 처리된다
create function public.settle_my_offer_rewards()
returns table (reward_id bigint, offer_id text, offer_title text, reward_boost_percent int)
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
    reward_boost_percent := r.reward_boost_percent;
    return next;
  end loop;
end;
$$;

-- 5. 새로 만든 함수 권한 (로그인한 사용자만)
revoke execute on function public.complete_offer_step(bigint), public.settle_my_offer_rewards() from public, anon;
grant execute on function public.complete_offer_step(bigint), public.settle_my_offer_rewards() to authenticated;
