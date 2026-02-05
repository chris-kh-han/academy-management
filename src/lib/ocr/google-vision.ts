/**
 * Google Cloud Vision OCR 라이브러리
 *
 * Phase 1: Google Cloud Vision API (월 1,000건 무료)
 * Phase 2: Tesseract + GPT 하이브리드로 전환 예정
 */

import { checkUsageLimit, incrementUsage } from '@/lib/api-usage';

const CLOUD_VISION_API_NAME = 'cloud-vision';
const CLOUD_VISION_DAILY_API_NAME = 'cloud-vision-daily';
const MONTHLY_LIMIT = 1000;
const DAILY_LIMIT = 33;

// OCR 결과 타입
export type OCRResult = {
  success: boolean;
  text: string;
  error?: string;
  confidence?: number;
};

// OCR 프로바이더 인터페이스 (추후 Tesseract 교체 대비)
export interface OCRProvider {
  extractText(imageBase64: string): Promise<OCRResult>;
}

/**
 * Google Cloud Vision API를 사용한 OCR 구현
 */
export class GoogleVisionOCR implements OCRProvider {
  private apiKey: string;
  private apiEndpoint = 'https://vision.googleapis.com/v1/images:annotate';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_CLOUD_API_KEY || '';
  }

  /**
   * 이미지에서 텍스트 추출
   * @param imageBase64 - Base64 인코딩된 이미지 데이터 (data:image/... 프리픽스 제외)
   */
  async extractText(imageBase64: string): Promise<OCRResult> {
    if (!this.apiKey) {
      return {
        success: false,
        text: '',
        error: 'Google Cloud API Key가 설정되지 않았습니다.',
      };
    }

    // 일별/월별 사용량 병렬 체크
    const [dailyCheck, monthlyCheck] = await Promise.all([
      checkUsageLimit(CLOUD_VISION_DAILY_API_NAME, DAILY_LIMIT, 'daily'),
      checkUsageLimit(CLOUD_VISION_API_NAME, MONTHLY_LIMIT, 'monthly'),
    ]);

    if (!dailyCheck.allowed) {
      return {
        success: false,
        text: '',
        error: `일 사용량 한도(${DAILY_LIMIT}건) 초과. 내일 다시 시도해주세요.`,
      };
    }

    if (!monthlyCheck.allowed) {
      return {
        success: false,
        text: '',
        error: `월 사용량 한도(${MONTHLY_LIMIT.toLocaleString()}건) 초과. 다음 달에 다시 시도해주세요.`,
      };
    }

    // Base64 프리픽스 제거 (있는 경우)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Data,
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION',
              maxResults: 1,
            },
          ],
          imageContext: {
            languageHints: ['ko', 'en'],
          },
        },
      ],
    };

    try {
      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          text: '',
          error: errorData.error?.message || `API 오류: ${response.status}`,
        };
      }

      const data = await response.json();

      // API 호출 성공 → 사용량 증가 (월별 + 일별 둘 다)
      await incrementUsage(CLOUD_VISION_API_NAME, CLOUD_VISION_DAILY_API_NAME);

      const annotation = data.responses?.[0]?.fullTextAnnotation;

      if (!annotation) {
        // 텍스트가 없는 경우 (빈 이미지 등)
        const textAnnotations = data.responses?.[0]?.textAnnotations;
        if (textAnnotations && textAnnotations.length > 0) {
          return {
            success: true,
            text: textAnnotations[0].description || '',
            confidence: textAnnotations[0].confidence,
          };
        }
        return {
          success: true,
          text: '',
          error: '이미지에서 텍스트를 찾을 수 없습니다.',
        };
      }

      return {
        success: true,
        text: annotation.text || '',
        confidence: annotation.pages?.[0]?.confidence,
      };
    } catch (error) {
      console.error('Google Vision OCR error:', error);
      return {
        success: false,
        text: '',
        error:
          error instanceof Error
            ? error.message
            : 'OCR 처리 중 오류가 발생했습니다.',
      };
    }
  }
}

/**
 * 기본 OCR 인스턴스 생성
 */
export function createOCRProvider(): OCRProvider {
  // Phase 1: Google Vision 사용
  // Phase 2: 환경변수로 프로바이더 선택 가능하도록 확장 예정
  return new GoogleVisionOCR();
}

/**
 * 편의 함수: 이미지에서 텍스트 추출
 */
export async function extractTextFromImage(
  imageBase64: string,
): Promise<OCRResult> {
  const provider = createOCRProvider();
  return provider.extractText(imageBase64);
}
