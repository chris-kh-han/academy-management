// 최소 로딩 시간을 보장하는 유틸리티
export const minDelay = (ms: number = 1000) =>
  new Promise((resolve) => setTimeout(resolve, ms));
