/**
 * API 사용량 관리 모듈
 *
 * 외부 API 호출 횟수를 월별로 추적하고 제한합니다.
 */

import { createServiceRoleClient } from '@/utils/supabase/server';

export type UsageCheckResult = {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
};

export type UsageIncrementResult = {
  success: boolean;
  newCount: number;
  error?: string;
};

/**
 * 현재 년월을 'YYYY-MM' 형식으로 반환
 */
function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 현재 날짜를 'YYYY-MM-DD' 형식으로 반환
 */
function getCurrentYearMonthDay(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type UsagePeriod = 'monthly' | 'daily';

/**
 * API 사용량이 제한 내인지 확인
 * @param apiName - API 이름 (예: 'cloud-vision')
 * @param limit - 최대 허용 횟수
 * @param period - 기간 ('monthly' | 'daily', 기본: 'monthly')
 * @returns 사용 가능 여부와 현재 상태
 */
export async function checkUsageLimit(
  apiName: string,
  limit: number,
  period: UsagePeriod = 'monthly',
): Promise<UsageCheckResult> {
  const supabase = createServiceRoleClient();
  const yearMonth =
    period === 'daily' ? getCurrentYearMonthDay() : getCurrentYearMonth();

  const { data, error } = await supabase
    .from('api_usage')
    .select('count')
    .eq('api_name', apiName)
    .eq('year_month', yearMonth)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116: Row not found (정상 - 아직 사용 기록 없음)
    console.error('API usage check error:', error);
  }

  const currentCount = data?.count ?? 0;
  const remaining = Math.max(0, limit - currentCount);

  return {
    allowed: currentCount < limit,
    currentCount,
    limit,
    remaining,
  };
}

/**
 * 특정 API의 사용량 증가 (단일 기간)
 * RPC 함수를 사용하여 원자적으로 증가 (race condition 방지)
 */
async function incrementUsageForPeriod(
  apiName: string,
  yearMonth: string,
): Promise<UsageIncrementResult> {
  const supabase = createServiceRoleClient();

  // upsert + increment를 단일 쿼리로 처리
  const { data, error } = await supabase.rpc('increment_api_usage', {
    p_api_name: apiName,
    p_year_month: yearMonth,
  });

  if (error) {
    // RPC 함수가 없으면 기존 방식으로 fallback
    if (error.code === '42883') {
      return incrementUsageForPeriodFallback(apiName, yearMonth);
    }
    console.error('API usage increment error:', error);
    return {
      success: false,
      newCount: 0,
      error: error.message,
    };
  }

  return { success: true, newCount: data ?? 1 };
}

/**
 * RPC 함수가 없을 때 fallback (기존 방식)
 */
async function incrementUsageForPeriodFallback(
  apiName: string,
  yearMonth: string,
): Promise<UsageIncrementResult> {
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from('api_usage')
    .select('id, count')
    .eq('api_name', apiName)
    .eq('year_month', yearMonth)
    .single();

  if (existing) {
    const newCount = existing.count + 1;
    const { error } = await supabase
      .from('api_usage')
      .update({ count: newCount })
      .eq('id', existing.id);

    if (error) {
      console.error('API usage increment error:', error);
      return {
        success: false,
        newCount: existing.count,
        error: error.message,
      };
    }

    return { success: true, newCount };
  } else {
    const { error } = await supabase.from('api_usage').insert({
      api_name: apiName,
      year_month: yearMonth,
      count: 1,
    });

    if (error) {
      console.error('API usage insert error:', error);
      return {
        success: false,
        newCount: 0,
        error: error.message,
      };
    }

    return { success: true, newCount: 1 };
  }
}

/**
 * API 사용량 증가 (월별 + 일별 둘 다 증가)
 * @param apiName - API 이름 (예: 'cloud-vision')
 * @param dailyApiName - 일별 API 이름 (예: 'cloud-vision-daily', 없으면 일별 증가 안 함)
 * @returns 월별 업데이트 결과
 */
export async function incrementUsage(
  apiName: string,
  dailyApiName?: string,
): Promise<UsageIncrementResult> {
  const monthlyYearMonth = getCurrentYearMonth();
  const dailyYearMonth = getCurrentYearMonthDay();

  // 월별/일별 사용량 병렬 증가
  const promises: Promise<UsageIncrementResult>[] = [
    incrementUsageForPeriod(apiName, monthlyYearMonth),
  ];

  if (dailyApiName) {
    promises.push(incrementUsageForPeriod(dailyApiName, dailyYearMonth));
  }

  const [monthlyResult] = await Promise.all(promises);

  return monthlyResult;
}

/**
 * API 사용량 조회 (관리/디버깅용)
 * @param apiName - API 이름
 * @param yearMonth - 조회할 년월 (기본: 현재)
 */
export async function getUsage(
  apiName: string,
  yearMonth?: string,
): Promise<{ count: number; yearMonth: string }> {
  const supabase = createServiceRoleClient();
  const targetYearMonth = yearMonth ?? getCurrentYearMonth();

  const { data } = await supabase
    .from('api_usage')
    .select('count')
    .eq('api_name', apiName)
    .eq('year_month', targetYearMonth)
    .single();

  return {
    count: data?.count ?? 0,
    yearMonth: targetYearMonth,
  };
}
