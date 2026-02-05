/**
 * Gemini Vision 멀티모달 OCR + 파싱 통합 모듈
 *
 * 이미지 → Gemini Vision → JSON (OCR + 파싱 한번에)
 * - API 호출 2회 → 1회로 감소
 * - 이미지 레이아웃을 직접 보고 분석하여 정확도 향상
 */

import { GoogleGenAI, Part, Type } from '@google/genai';
import { checkUsageLimit, incrementUsage } from '@/lib/api-usage';

// API 사용량 제한 설정
const GEMINI_API_NAME = 'gemini';
const GEMINI_DAILY_API_NAME = 'gemini-daily';
const DAILY_LIMIT = 50;
const MONTHLY_LIMIT = 1500;

// 파싱 결과 타입 (gemini-parser.ts와 동일)
export type ParsedItem = {
  name: string;
  box?: number;
  ea?: number;
  quantity: number;
  unit?: string;
  unit_price?: number;
  total_price?: number;
  note?: string;
};

export type GeminiVisionResult = {
  success: boolean;
  items: ParsedItem[];
  supplier?: string;
  referenceNo?: string;
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
    reference_no: {
      type: Type.STRING,
      description: '거래명세서 번호/송장번호',
    },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: '품목명/재료명 (품명, 품명및규격, 상품명)',
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
            description: '총수량 (숫자만)',
          },
          unit: {
            type: Type.STRING,
            description: '단위 (kg, g, 개, 박스, EA 등)',
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
        required: ['name', 'quantity', 'unit_price', 'total_price'],
      },
    },
  },
  required: ['items'],
};

/**
 * Base64 이미지를 Gemini Part로 변환
 */
function imageToGenerativePart(base64Data: string, mimeType: string): Part {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
}

/**
 * 이미지에서 거래명세서 정보를 직접 추출 (OCR + 파싱 통합)
 * @param imageBase64 - Base64 인코딩된 이미지 데이터
 * @param mimeType - 이미지 MIME 타입 (예: 'image/jpeg')
 * @returns 추출 결과 (품목 목록, 공급처, 송장번호)
 */
export async function extractInvoiceFromImage(
  imageBase64: string,
  mimeType: string,
): Promise<GeminiVisionResult> {
  // API 키 확인
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      items: [],
      error: 'GEMINI_API_KEY가 설정되지 않았습니다.',
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

    // Base64 프리픽스 제거 (있는 경우)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // 이미지 Part 생성
    const imagePart = imageToGenerativePart(base64Data, mimeType);

    // 프롬프트 구성
    const prompt = `이미지에서 거래명세서 정보를 추출하세요.

## 추출할 정보
1. 공급처 (supplier): 거래처/공급업체 이름
2. 송장번호 (reference_no): 거래명세서 번호
3. 품목 목록 (items): 테이블의 모든 행

## 품목 필드 (모두 필수)
- name: 품명 (품명및규격, 상품명 컬럼)
- box: BOX 수량 (숫자만)
- ea: EA/낱개 수량 (숫자만)
- quantity: 총수량 (숫자만)
- unit_price: 단가 (숫자만, 반드시 추출)
- total_price: 금액/공급가액 (숫자만, 반드시 추출)
- note: 비고

## 중요 규칙
- 테이블의 모든 행을 빠짐없이 추출
- 합계/총계 행은 제외
- 숫자에서 쉼표, 원, 공백 제거
- **단가(unit_price)와 금액(total_price)은 반드시 추출해야 함**
- 단가/금액 컬럼이 없거나 값이 비어있으면 0으로 처리
- 빈 셀(단가/금액 제외)은 null로 처리`;

    // API 호출 (이미지 + 텍스트 프롬프트)
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [imagePart, prompt],
      config: {
        responseMimeType: 'application/json',
        responseSchema: invoiceResponseSchema,
        temperature: 0.1,
        maxOutputTokens: 8192,
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

    // JSON 파싱
    let parsed: {
      supplier?: string;
      reference_no?: string;
      items: ParsedItem[];
    };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // JSON 정리 후 재시도
      try {
        let cleanedJson = responseText
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .trim();

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
      referenceNo: parsed.reference_no || undefined,
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
    console.error('Gemini Vision error:', error);
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류';

    return {
      success: false,
      items: [],
      error: `처리 실패: ${errorMessage}`,
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
