import { NextRequest, NextResponse } from 'next/server';
import {
  extractInvoiceFromImage,
  matchSupplierFromOCR,
  autoMatchItemsWithTemplate,
} from '@/lib/ocr/gemini-vision';
import { createClient } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/server';
import type { InvoiceItemMatchStatus } from '@/types';

/**
 * POST /api/ocr/invoice
 * 거래명세서 이미지를 Gemini Vision으로 직접 분석하여 품목 정보 반환
 *
 * Request: multipart/form-data
 *   - image: File (필수)
 *   - branchId: string (선택 - 자동 명세서 생성 + 자동 매칭 활성화)
 *
 * Response:
 *   - branchId 없음: OCR 결과만 반환 (기존 동작)
 *   - branchId 있음: OCR → 공급업체 자동매칭 → 명세서 자동생성 → 품목 자동매칭
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
    const branchId = formData.get('branchId') as string | null;

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
    const ocrResult = await extractInvoiceFromImage(base64, imageFile.type);

    if (!ocrResult.success) {
      return NextResponse.json(ocrResult);
    }

    // branchId가 없으면 OCR 결과만 반환 (기존 동작)
    if (!branchId) {
      return NextResponse.json(ocrResult);
    }

    // ========== 자동 처리 파이프라인 (branchId 있을 때) ==========

    const serviceClient = createServiceRoleClient();

    // 1. 공급업체 자동 매칭
    let supplierId: string | null = null;
    if (ocrResult.supplier) {
      supplierId = await matchSupplierFromOCR(branchId, ocrResult.supplier);
    }

    // 2. 템플릿 기반 품목 자동 매칭
    const matchedItems = supplierId
      ? await autoMatchItemsWithTemplate(branchId, supplierId, ocrResult.items)
      : ocrResult.items.map((item) => ({
          ...item,
          matched_ingredient_id: null as string | null,
          match_status: 'unmatched' as const,
        }));

    // 3. 총 금액 계산
    const totalAmount = matchedItems.reduce(
      (sum, item) => sum + (item.total_price ?? 0),
      0,
    );

    // 4. 명세서 자동 생성 (status = 'received')
    const { data: invoice, error: invoiceError } = await serviceClient
      .from('invoices')
      .insert({
        branch_id: branchId,
        supplier_id: supplierId,
        invoice_no: ocrResult.referenceNo || null,
        total_amount: totalAmount,
        confirmed_amount: 0,
        status: 'received',
        delivery_status: 'pending',
      })
      .select('id')
      .single();

    if (invoiceError || !invoice) {
      console.error('Auto-create invoice error:', invoiceError);
      // 명세서 생성 실패해도 OCR 결과는 반환
      return NextResponse.json({
        ...ocrResult,
        supplierId: supplierId ?? undefined,
      });
    }

    // 5. 품목 일괄 삽입
    const itemsData = matchedItems.map((item) => ({
      invoice_id: invoice.id,
      item_name: item.name,
      quantity: item.quantity,
      unit: item.unit || null,
      unit_price: item.unit_price ?? 0,
      total_price: item.total_price ?? 0,
      box_qty: item.box ?? 0,
      ea_qty: item.ea ?? 0,
      matched_ingredient_id: item.matched_ingredient_id ?? null,
      match_status: (item.match_status ??
        'unmatched') as InvoiceItemMatchStatus,
    }));

    const { error: itemsError } = await serviceClient
      .from('invoice_items')
      .insert(itemsData);

    if (itemsError) {
      console.error('Auto-create invoice items error:', itemsError);
      // 롤백: 명세서 삭제
      await serviceClient.from('invoices').delete().eq('id', invoice.id);
      return NextResponse.json({
        ...ocrResult,
        supplierId: supplierId ?? undefined,
      });
    }

    // 6. 응답에 invoiceId와 supplierId 추가
    return NextResponse.json({
      ...ocrResult,
      supplierId: supplierId ?? undefined,
      invoiceId: invoice.id,
      items: matchedItems,
    });
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
