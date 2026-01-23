'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CheckCircle, Clock } from 'lucide-react';
import type { OrderRecommendation } from '@/types';

type Props = {
  history: OrderRecommendation[];
};

export default function RecommendationHistory({ history }: Props) {
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          발주 추천 이력이 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>발주 추천 이력</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {history.map((rec) => (
            <AccordionItem key={rec.id} value={rec.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4 w-full">
                  <span className="font-medium">{rec.recommendation_date}</span>
                  <Badge variant="outline">
                    {rec.calculation_method === 'target'
                      ? '목표 재고'
                      : '일평균'}
                  </Badge>
                  {rec.status === 'ordered' ? (
                    <Badge className="bg-green-500 gap-1">
                      <CheckCircle className="w-3 h-3" />
                      발주완료
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="w-3 h-3" />
                      대기중
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground ml-auto mr-4">
                    {rec.items?.length || 0}개 품목
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {rec.items && rec.items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>품목명</TableHead>
                        <TableHead>카테고리</TableHead>
                        <TableHead className="text-right">현재재고</TableHead>
                        <TableHead className="text-right">추천발주량</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rec.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.ingredient_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.category || '기타'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.current_qty} {item.unit}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.recommended_qty} {item.unit}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground py-4 text-center">
                    상세 내역이 없습니다.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
