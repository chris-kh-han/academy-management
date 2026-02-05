import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseInvoiceText } from '@/lib/parser/gemini-parser';
import { createClient } from '@/utils/supabase/server';

// 요청 스키마
const requestSchema = z.object({
  text: z.string().min(1, '텍스트가 필요합니다.'),
});

/**
 * POST /api/parser/invoice
 * OCR 텍스트를 Gemini API로 파싱하여 품목 정보 추출
 *
 * Request: { text: string }
 * Response: ParseResult
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, items: [], error: '인증이 필요합니다.' },
        { status: 401 },
      );
    }

    const body = await request.json();

    // 입력 검증
    const validated = requestSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          items: [],
          error: validated.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const { text } = validated.data;

    // Gemini API로 파싱
    const result = await parseInvoiceText(text);

    if (!result.success) {
      return NextResponse.json(result, {
        status: result.error?.includes('한도') ? 429 : 400,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Parser API error:', error);
    return NextResponse.json(
      {
        success: false,
        items: [],
        error:
          error instanceof Error
            ? error.message
            : '파싱 처리 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
