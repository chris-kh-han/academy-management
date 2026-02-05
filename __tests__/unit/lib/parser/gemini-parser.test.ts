/**
 * Gemini Parser 단위 테스트
 *
 * 실제 API 호출 없이 파싱 로직 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 응답을 저장할 변수
let mockGenerateResponse: { text: string } | null = null;

// Mock 설정
vi.mock('@google/genai', () => {
  // 클래스로 정의해야 생성자로 사용 가능
  class MockGoogleGenAI {
    models = {
      generateContent: vi
        .fn()
        .mockImplementation(async () => mockGenerateResponse),
    };
  }

  return {
    GoogleGenAI: MockGoogleGenAI,
    Type: {
      OBJECT: 'object',
      STRING: 'string',
      NUMBER: 'number',
      ARRAY: 'array',
    },
  };
});

vi.mock('@/lib/api-usage', () => ({
  checkUsageLimit: vi
    .fn()
    .mockResolvedValue({ allowed: true, currentCount: 0, limit: 50 }),
  incrementUsage: vi.fn().mockResolvedValue(undefined),
}));

describe('parseInvoiceText', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('GEMINI_API_KEY', 'test-api-key');
    mockGenerateResponse = null;
  });

  it('should return error when API key is missing', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');

    const { parseInvoiceText } = await import('@/lib/parser/gemini-parser');
    const result = await parseInvoiceText('sample text');

    expect(result.success).toBe(false);
    expect(result.error).toContain('GEMINI_API_KEY');
  });

  it('should return error when text is empty', async () => {
    const { parseInvoiceText } = await import('@/lib/parser/gemini-parser');
    const result = await parseInvoiceText('');

    expect(result.success).toBe(false);
    expect(result.error).toContain('텍스트가 없습니다');
  });

  it('should parse invoice with 품명및규격 column correctly', async () => {
    mockGenerateResponse = {
      text: JSON.stringify({
        supplier: '농협유통',
        items: [
          {
            name: '돼지고기 삼겹살',
            quantity: 5,
            unit: '1kg',
            unit_price: 15000,
          },
          { name: '양파', quantity: 10, unit: '1kg', unit_price: 2000 },
          { name: '대파', quantity: 3, unit: '단', unit_price: 3000 },
          { name: '마늘', quantity: 2, unit: '500g', unit_price: 5000 },
          { name: '고춧가루', quantity: 1, unit: '1kg', unit_price: 25000 },
        ],
      }),
    };

    const { parseInvoiceText } = await import('@/lib/parser/gemini-parser');

    const sampleOcrText = `
거래명세서
공급처: 농협유통
날짜: 2024-01-15

번호  품명및규격          수량    단가      금액
1     돼지고기 삼겹살 1kg   5     15,000   75,000
2     양파 1kg            10      2,000   20,000
3     대파 단              3      3,000    9,000
4     마늘 500g            2      5,000   10,000
5     고춧가루 1kg          1     25,000   25,000

합계                                      139,000
    `;

    const result = await parseInvoiceText(sampleOcrText);

    expect(result.success).toBe(true);
    expect(result.supplier).toBe('농협유통');
    expect(result.items).toHaveLength(5);
    expect(result.items[0]).toEqual({
      name: '돼지고기 삼겹살',
      quantity: 5,
      unit: '1kg',
      unit_price: 15000,
    });
  });

  it('should parse all 15 items without missing any', async () => {
    // 15개 품목 모킹
    const fifteenItems = Array.from({ length: 15 }, (_, i) => ({
      name: `재료${i + 1}`,
      quantity: i + 1,
      unit: 'kg',
      unit_price: (i + 1) * 1000,
    }));

    mockGenerateResponse = {
      text: JSON.stringify({
        supplier: '테스트공급처',
        items: fifteenItems,
      }),
    };

    const { parseInvoiceText } = await import('@/lib/parser/gemini-parser');

    const result = await parseInvoiceText('15개 품목 테스트');

    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(15);

    // 모든 품목이 누락 없이 추출되었는지 확인
    for (let i = 0; i < 15; i++) {
      expect(result.items[i].name).toBe(`재료${i + 1}`);
      expect(result.items[i].quantity).toBe(i + 1);
    }
  });

  it('should filter out invalid items (zero quantity, empty name)', async () => {
    mockGenerateResponse = {
      text: JSON.stringify({
        items: [
          { name: '유효한재료', quantity: 5, unit: 'kg' },
          { name: '', quantity: 3, unit: 'kg' }, // 빈 이름 - 필터링
          { name: '수량0', quantity: 0, unit: 'kg' }, // 수량 0 - 필터링
          { name: '또다른유효재료', quantity: 2, unit: '개' },
        ],
      }),
    };

    const { parseInvoiceText } = await import('@/lib/parser/gemini-parser');
    const result = await parseInvoiceText('필터링 테스트');

    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe('유효한재료');
    expect(result.items[1].name).toBe('또다른유효재료');
  });

  it('should handle API response with no items gracefully', async () => {
    mockGenerateResponse = {
      text: JSON.stringify({
        items: [],
      }),
    };

    const { parseInvoiceText } = await import('@/lib/parser/gemini-parser');
    const result = await parseInvoiceText('빈 결과 테스트');

    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(0);
  });
});
