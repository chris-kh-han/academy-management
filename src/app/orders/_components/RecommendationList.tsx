'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { OrderRecommendationItem } from '@/types';

type Props = {
  items: OrderRecommendationItem[];
};

export default function RecommendationList({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        발주가 필요한 품목이 없습니다.
      </div>
    );
  }

  // 카테고리별 그룹핑
  const groupedItems = items.reduce(
    (acc, item) => {
      const category = item.category || '기타';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, OrderRecommendationItem[]>,
  );

  const categories = Object.keys(groupedItems).sort();

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Badge variant="outline">{category}</Badge>
            <span className="text-sm text-muted-foreground">
              {groupedItems[category].length}개 품목
            </span>
          </h3>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>품목명</TableHead>
                <TableHead className="text-right">현재재고</TableHead>
                {groupedItems[category][0]?.target_qty !== undefined && (
                  <TableHead className="text-right">목표재고</TableHead>
                )}
                {groupedItems[category][0]?.avg_daily_usage !== undefined && (
                  <TableHead className="text-right">일평균</TableHead>
                )}
                <TableHead className="text-right">추천발주량</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedItems[category].map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.ingredient_name}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.current_qty} {item.unit}
                  </TableCell>
                  {item.target_qty !== undefined && (
                    <TableCell className="text-right">
                      {item.target_qty} {item.unit}
                    </TableCell>
                  )}
                  {item.avg_daily_usage !== undefined && (
                    <TableCell className="text-right">
                      {item.avg_daily_usage?.toFixed(1)} {item.unit}/일
                    </TableCell>
                  )}
                  <TableCell className="text-right font-bold text-primary">
                    {item.recommended_qty} {item.unit}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
