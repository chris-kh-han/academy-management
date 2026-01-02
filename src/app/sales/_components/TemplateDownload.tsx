'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Menu = {
  id: string;
  name: string;
  price: number;
};

type TemplateDownloadProps = {
  menus: Menu[];
};

export function TemplateDownload({ menus }: TemplateDownloadProps) {
  const downloadTemplate = () => {
    // CSV 헤더
    const headers = ['판매일자', '메뉴ID', '메뉴명', '판매수량', '단가', '총액'];

    // 샘플 데이터 (현재 등록된 메뉴 목록 포함)
    const today = new Date().toISOString().split('T')[0];
    const sampleRows = menus.slice(0, 3).map((menu) => {
      const quantity = 5;
      const total = menu.price * quantity;
      return [today, menu.id, menu.name, quantity, menu.price, total];
    });

    // CSV 문자열 생성
    const csvContent = [
      headers.join(','),
      ...sampleRows.map((row) => row.join(',')),
    ].join('\n');

    // BOM 추가 (한글 깨짐 방지)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    // 다운로드
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_template_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={downloadTemplate} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      CSV 템플릿 다운로드
    </Button>
  );
}
