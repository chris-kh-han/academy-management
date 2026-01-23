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
import { CheckCircle, Clock } from 'lucide-react';
import type { DailyClosing } from '@/types';

type Props = {
  history: DailyClosing[];
};

export default function ClosingHistory({ history }: Props) {
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          마감 이력이 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>마감 이력</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>날짜</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>완료 시간</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((closing) => (
              <TableRow key={closing.id}>
                <TableCell className="font-medium">
                  {closing.closing_date}
                </TableCell>
                <TableCell>
                  {closing.status === 'completed' ? (
                    <Badge className="bg-green-500 gap-1">
                      <CheckCircle className="w-3 h-3" />
                      완료
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="w-3 h-3" />
                      진행중
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {closing.closed_at
                    ? new Date(closing.closed_at).toLocaleString('ko-KR')
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
