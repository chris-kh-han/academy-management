import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromImage } from '@/lib/ocr/google-vision';

/**
 * POST /api/ocr/invoice
 * 거래명세서 이미지를 OCR 처리하여 텍스트 반환
 *
 * Request: multipart/form-data with 'image' field
 * Response: { success: boolean, text: string, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, text: '', error: '이미지 파일이 필요합니다.' },
        { status: 400 },
      );
    }

    // 파일 타입 검증
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json(
        {
          success: false,
          text: '',
          error: '지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP, GIF만 지원)',
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
          text: '',
          error: '파일 크기가 너무 큽니다. (최대 10MB)',
        },
        { status: 400 },
      );
    }

    // 파일을 Base64로 변환
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // OCR 처리
    const result = await extractTextFromImage(base64);

    return NextResponse.json(result);
  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json(
      {
        success: false,
        text: '',
        error: error instanceof Error ? error.message : 'OCR 처리 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
