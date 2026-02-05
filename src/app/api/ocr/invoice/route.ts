import { NextRequest, NextResponse } from 'next/server';
import { extractInvoiceFromImage } from '@/lib/ocr/gemini-vision';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/ocr/invoice
 * 거래명세서 이미지를 Gemini Vision으로 직접 분석하여 품목 정보 반환
 *
 * Request: multipart/form-data with 'image' field
 * Response: { success: boolean, items: ParsedItem[], supplier?: string, referenceNo?: string, error?: string }
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

    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, items: [], error: '이미지 파일이 필요합니다.' },
        { status: 400 },
      );
    }

    // 파일 타입 검증
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json(
        {
          success: false,
          items: [],
          error:
            '지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP, GIF만 지원)',
        },
        { status: 400 },
      );
    }

    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          items: [],
          error: '파일 크기가 너무 큽니다. (최대 10MB)',
        },
        { status: 400 },
      );
    }

    // 파일을 Base64로 변환
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Gemini Vision으로 이미지 직접 분석 (OCR + 파싱 통합)
    const result = await extractInvoiceFromImage(base64, imageFile.type);

    return NextResponse.json(result);
  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json(
      {
        success: false,
        items: [],
        error:
          error instanceof Error
            ? error.message
            : '처리 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
