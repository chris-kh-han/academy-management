/**
 * Gemini API를 사용한 거래명세서 텍스트 파싱
 *
 * OCR로 추출한 텍스트에서 재료명/수량/단가를 자동 추출
 */

import { GoogleGenAI, Type } from '@google/genai';
import { checkUsageLimit, incrementUsage } from '@/lib/api-usage';

// API 사용량 제한 설정
const GEMINI_API_NAME = 'gemini';
const GEMINI_DAILY_API_NAME = 'gemini-daily';
const DAILY_LIMIT = 50; // 일일 50회 (보수적 설정)
const MONTHLY_LIMIT = 1500; // 월간 1500회 (무료 tier)

// 파싱 결과 타입
export type ParsedItem = {
  name: string; // 품명및규격 (OCR 텍스트 그대로)
  box?: number; // BOX 수량
  ea?: number; // EA 수량
  quantity: number; // 총수량
  unit?: string; // 단위
  unit_price?: number; // 단가
  total_price?: number; // 금액
  note?: string; // 비고
};

export type ParseResult = {
  success: boolean;
  items: ParsedItem[];
  supplier?: string;
  error?: string;
  usage?: {
    daily: { current: number; limit: number };
    monthly: { current: number; limit: number };
  };
};

// 응답 스키마 정의
const invoiceResponseSchema = {
  type: Type.OBJECT,
  properties: {
    supplier: {
      type: Type.STRING,
      description: '공급처/거래처 이름',
    },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description:
              '품목명/재료명 (품명, 품명및규격, 상품명 컬럼에서 추출)',
          },
          box: {
            type: Type.NUMBER,
            description: 'BOX/박스 수량 (숫자만)',
          },
          ea: {
            type: Type.NUMBER,
            description: 'EA/낱개 수량 (숫자만)',
          },
          quantity: {
            type: Type.NUMBER,
            description: '총수량 (숫자만). BOX나 EA가 있으면 합산한 총 수량',
          },
          unit: {
            type: Type.STRING,
            description:
              '단위 (kg, g, 개, 박스, EA 등). 품명및규격에서 분리한 규격(300g, 30개 등) 포함',
          },
          unit_price: {
            type: Type.NUMBER,
            description: '단가 (숫자만, 원 단위)',
          },
          total_price: {
            type: Type.NUMBER,
            description: '금액/공급가액 (숫자만, 원 단위)',
          },
          note: {
            type: Type.STRING,
            description: '비고란의 내용',
          },
        },
        required: ['name', 'quantity'],
      },
    },
  },
  required: ['items'],
};

/**
 * 거래명세서 텍스트를 파싱하여 품목 정보 추출
 * @param ocrText OCR로 추출한 텍스트
 * @returns 파싱 결과 (품목 목록, 공급처)
 */
export async function parseInvoiceText(ocrText: string): Promise<ParseResult> {
  // API 키 확인
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      items: [],
      error: 'GEMINI_API_KEY가 설정되지 않았습니다.',
    };
  }

  // 텍스트 유효성 검사
  if (!ocrText || ocrText.trim().length === 0) {
    return {
      success: false,
      items: [],
      error: '파싱할 텍스트가 없습니다.',
    };
  }

  // 일일/월간 사용량 병렬 확인
  const [dailyCheck, monthlyCheck] = await Promise.all([
    checkUsageLimit(GEMINI_DAILY_API_NAME, DAILY_LIMIT, 'daily'),
    checkUsageLimit(GEMINI_API_NAME, MONTHLY_LIMIT, 'monthly'),
  ]);

  if (!dailyCheck.allowed) {
    return {
      success: false,
      items: [],
      error: `일일 사용량 한도 초과 (${dailyCheck.currentCount}/${dailyCheck.limit})`,
      usage: {
        daily: { current: dailyCheck.currentCount, limit: dailyCheck.limit },
        monthly: { current: 0, limit: MONTHLY_LIMIT },
      },
    };
  }

  if (!monthlyCheck.allowed) {
    return {
      success: false,
      items: [],
      error: `월간 사용량 한도 초과 (${monthlyCheck.currentCount}/${monthlyCheck.limit})`,
      usage: {
        daily: { current: dailyCheck.currentCount, limit: dailyCheck.limit },
        monthly: {
          current: monthlyCheck.currentCount,
          limit: monthlyCheck.limit,
        },
      },
    };
  }

  try {
    // Gemini 클라이언트 초기화
    const ai = new GoogleGenAI({ apiKey });

    // 프롬프트 구성
    const prompt = `거래명세서에서 모든 품목을 빠짐없이 추출하세요.

## 중요: 누락 금지
- 테이블의 모든 행을 추출해야 합니다
- 마지막 행까지 포함 (끝까지 확인하세요)
- 번호가 있으면 모든 번호의 행이 있어야 합니다

## 컬럼 매핑
| OCR 텍스트 컬럼 | 출력 필드 |
|----------------|----------|
| 품명, 품명및규격, 상품명 | name |
| BOX, 박스 | box (숫자만) |
| EA, 낱개, 개 | ea (숫자만) |
| 수량, qty, 수 | quantity (숫자만) |
| 단가, 가격 | unit_price (숫자만) |
| 금액, 공급가액 | total_price (숫자만) |
| 비고 | note |

## 추출 규칙
1. BOX 컬럼에 숫자가 있으면 반드시 box 필드에 저장 (빈칸이면 null)
2. EA 컬럼에 숫자가 있으면 반드시 ea 필드에 저장 (빈칸이면 null)
3. quantity(수량)는 "수" 또는 "수량" 컬럼의 값 그대로 (BOX×EA 계산하지 마세요)
4. 금액이 없으면 total_price는 null (계산하지 마세요)
5. 품명에서 규격(1kg, 10pk 등)은 name에 포함하세요
6. 쉼표, 원, 공백 제거하고 숫자만 추출
7. 합계/총계 행은 제외

## OCR 텍스트
${ocrText}`;

    // API 호출
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: invoiceResponseSchema,
        temperature: 0.1, // 낮은 temperature로 일관된 결과
        maxOutputTokens: 8192, // 긴 응답 허용 (기본값보다 높게)
      },
    });

    // 사용량 증가 (성공 시에만)
    await incrementUsage(GEMINI_API_NAME, GEMINI_DAILY_API_NAME);

    // 응답 파싱
    const responseText = response.text;
    if (!responseText) {
      return {
        success: false,
        items: [],
        error: 'API 응답이 비어있습니다.',
        usage: {
          daily: {
            current: dailyCheck.currentCount + 1,
            limit: dailyCheck.limit,
          },
          monthly: {
            current: monthlyCheck.currentCount + 1,
            limit: monthlyCheck.limit,
          },
        },
      };
    }

    // JSON 파싱 (Gemini가 가끔 잘못된 JSON 반환)
    let parsed: { supplier?: string; items: ParsedItem[] };
    try {
      // 먼저 그대로 파싱 시도
      parsed = JSON.parse(responseText);
    } catch {
      // 실패하면 JSON 정리 후 재시도
      try {
        // 흔한 문제들 수정: trailing comma, 잘린 JSON
        let cleanedJson = responseText
          .replace(/,\s*}/g, '}') // trailing comma before }
          .replace(/,\s*]/g, ']') // trailing comma before ]
          .trim();

        // 잘린 JSON 복구 시도 (마지막 유효한 배열까지)
        if (!cleanedJson.endsWith('}')) {
          const lastValidEnd = cleanedJson.lastIndexOf('}]}');
          if (lastValidEnd > 0) {
            cleanedJson = cleanedJson.substring(0, lastValidEnd + 3);
          }
        }

        parsed = JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return {
          success: false,
          items: [],
          error: 'API 응답 형식 오류. 다시 시도해주세요.',
          usage: {
            daily: {
              current: dailyCheck.currentCount + 1,
              limit: dailyCheck.limit,
            },
            monthly: {
              current: monthlyCheck.currentCount + 1,
              limit: monthlyCheck.limit,
            },
          },
        };
      }
    }

    // 결과 유효성 검사
    if (!parsed.items || !Array.isArray(parsed.items)) {
      return {
        success: false,
        items: [],
        error: '파싱 결과가 올바르지 않습니다.',
        usage: {
          daily: {
            current: dailyCheck.currentCount + 1,
            limit: dailyCheck.limit,
          },
          monthly: {
            current: monthlyCheck.currentCount + 1,
            limit: monthlyCheck.limit,
          },
        },
      };
    }

    // 유효한 항목만 필터링
    const validItems = parsed.items.filter(
      (item) =>
        item.name &&
        typeof item.name === 'string' &&
        item.name.trim().length > 0 &&
        typeof item.quantity === 'number' &&
        item.quantity > 0,
    );

    return {
      success: true,
      items: validItems,
      supplier: parsed.supplier || undefined,
      usage: {
        daily: {
          current: dailyCheck.currentCount + 1,
          limit: dailyCheck.limit,
        },
        monthly: {
          current: monthlyCheck.currentCount + 1,
          limit: monthlyCheck.limit,
        },
      },
    };
  } catch (error) {
    console.error('Gemini parsing error:', error);
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류';

    return {
      success: false,
      items: [],
      error: `파싱 실패: ${errorMessage}`,
      usage: {
        daily: { current: dailyCheck.currentCount, limit: dailyCheck.limit },
        monthly: {
          current: monthlyCheck.currentCount,
          limit: monthlyCheck.limit,
        },
      },
    };
  }
}
