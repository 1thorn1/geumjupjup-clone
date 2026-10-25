import { router } from 'expo-router';

/** mock 광고 길이 (초) */
export const AD_DURATION_SECONDS = 5;

let pendingOnComplete: (() => void) | null = null;

/** 광고 화면을 띄우고, 끝까지 보면 onComplete를 부른다 */
export function watchAd(onComplete: () => void) {
  pendingOnComplete = onComplete;
  router.push('/ad');
}

/** 광고를 끝까지 봤을 때 (광고 화면에서 호출) */
export function completeAd() {
  const onComplete = pendingOnComplete;
  pendingOnComplete = null;
  onComplete?.();
}

/** 광고를 끝까지 보지 않고 나갔을 때 (광고 화면에서 호출) */
export function cancelAd() {
  pendingOnComplete = null;
}
