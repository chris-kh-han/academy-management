'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AuthModal } from '@/components/auth/AuthModal';
import { Package, ChefHat, BarChart3, FileText, ArrowRight, Check, ChevronLeft, ChevronRight } from 'lucide-react';

type Feature = {
  title: string;
  description: string;
  icon: string;
};

type MockupScreen = {
  title: string;
  content: React.ReactNode;
};

type FeatureDemoData = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  highlights: string[];
  screens: MockupScreen[];
};

// 재고 관리 화면들
const inventoryScreens: MockupScreen[] = [
  {
    title: '실시간 재고 현황 대시보드',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium text-slate-700'>재고 현황</span>
          <span className='text-xs text-slate-500'>오늘 기준</span>
        </div>
        <div className='grid grid-cols-3 gap-2'>
          {[
            { name: '밀가루', qty: '25kg', status: 'good' },
            { name: '설탕', qty: '8kg', status: 'warning' },
            { name: '버터', qty: '2kg', status: 'danger' },
          ].map((item) => (
            <div key={item.name} className='bg-white rounded-lg p-3 border'>
              <p className='text-xs text-slate-500'>{item.name}</p>
              <p className='text-lg font-semibold'>{item.qty}</p>
              <div className={`h-1 rounded mt-2 ${
                item.status === 'good' ? 'bg-emerald-400' :
                item.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'
              }`} />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: '입고/출고 내역 자동 기록',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium text-slate-700'>입출고 내역</span>
          <span className='text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full'>오늘 12건</span>
        </div>
        <div className='bg-white rounded-lg border divide-y'>
          {[
            { action: '입고', item: '밀가루 10kg', time: '14:30', by: '김직원' },
            { action: '출고', item: '설탕 2kg', time: '13:15', by: '레시피 사용' },
            { action: '입고', item: '버터 5kg', time: '11:00', by: '김직원' },
            { action: '출고', item: '우유 3L', time: '10:30', by: '레시피 사용' },
          ].map((log, i) => (
            <div key={i} className='flex items-center justify-between p-3 text-xs'>
              <span className={`px-2 py-0.5 rounded ${log.action === '입고' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                {log.action}
              </span>
              <span className='text-slate-700 flex-1 ml-3'>{log.item}</span>
              <span className='text-slate-400'>{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: '재고 부족 시 알림 설정',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium text-slate-700'>재고 알림</span>
          <span className='text-xs text-red-500'>3개 부족</span>
        </div>
        <div className='space-y-2'>
          {[
            { name: '버터', current: '2kg', min: '5kg', urgent: true },
            { name: '설탕', current: '8kg', min: '10kg', urgent: false },
            { name: '우유', current: '2L', min: '5L', urgent: true },
          ].map((item) => (
            <div key={item.name} className={`bg-white rounded-lg p-3 border ${item.urgent ? 'border-red-200' : 'border-amber-200'}`}>
              <div className='flex items-center justify-between'>
                <span className='font-medium text-sm'>{item.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${item.urgent ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                  {item.urgent ? '긴급' : '주의'}
                </span>
              </div>
              <div className='flex justify-between text-xs mt-2 text-slate-500'>
                <span>현재: {item.current}</span>
                <span>최소: {item.min}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: '유통기한 관리',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium text-slate-700'>유통기한 임박</span>
          <span className='text-xs text-slate-500'>7일 이내</span>
        </div>
        <div className='space-y-2'>
          {[
            { name: '생크림', expiry: '2일 남음', qty: '500ml', color: 'red' },
            { name: '우유', expiry: '4일 남음', qty: '2L', color: 'amber' },
            { name: '계란', expiry: '6일 남음', qty: '30개', color: 'yellow' },
          ].map((item) => (
            <div key={item.name} className='bg-white rounded-lg p-3 border flex items-center justify-between'>
              <div>
                <p className='font-medium text-sm'>{item.name}</p>
                <p className='text-xs text-slate-500'>{item.qty}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                item.color === 'red' ? 'bg-red-100 text-red-600' :
                item.color === 'amber' ? 'bg-amber-100 text-amber-600' : 'bg-yellow-100 text-yellow-600'
              }`}>
                {item.expiry}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: '거래처별 입고 내역 관리',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium text-slate-700'>거래처 현황</span>
          <span className='text-xs text-slate-500'>이번 달</span>
        </div>
        <div className='space-y-2'>
          {[
            { name: '대한식자재', items: 12, amount: '450,000원' },
            { name: '신선유통', items: 8, amount: '280,000원' },
            { name: '로컬팜', items: 5, amount: '120,000원' },
          ].map((vendor) => (
            <div key={vendor.name} className='bg-white rounded-lg p-3 border'>
              <div className='flex items-center justify-between'>
                <span className='font-medium text-sm'>{vendor.name}</span>
                <span className='text-xs text-slate-500'>{vendor.items}건</span>
              </div>
              <p className='text-orange-600 font-semibold text-sm mt-1'>{vendor.amount}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

// 메뉴/레시피 화면들
const recipeScreens: MockupScreen[] = [
  {
    title: '메뉴별 레시피 등록 및 관리',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium text-slate-700'>아메리카노</span>
          <span className='px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full'>판매중</span>
        </div>
        <div className='bg-white rounded-lg p-3 border space-y-2'>
          <p className='text-xs text-slate-500'>재료 구성</p>
          {[
            { name: '에스프레소', amount: '30ml' },
            { name: '정수물', amount: '150ml' },
            { name: '얼음', amount: '100g' },
          ].map((ing) => (
            <div key={ing.name} className='flex items-center justify-between text-xs'>
              <span className='text-slate-700'>{ing.name}</span>
              <span className='text-slate-500'>{ing.amount}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: '재료 원가 자동 계산',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <span className='text-sm font-medium text-slate-700'>원가 계산</span>
        <div className='bg-white rounded-lg p-3 border space-y-2'>
          {[
            { name: '에스프레소 30ml', cost: '500원' },
            { name: '정수물 150ml', cost: '50원' },
            { name: '얼음 100g', cost: '100원' },
          ].map((ing) => (
            <div key={ing.name} className='flex items-center justify-between text-xs'>
              <span className='text-slate-600'>{ing.name}</span>
              <span className='text-slate-700'>{ing.cost}</span>
            </div>
          ))}
          <div className='border-t pt-2 mt-2 flex justify-between'>
            <span className='font-medium text-sm'>총 원가</span>
            <span className='font-bold text-orange-600'>650원</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: '메뉴 판매가 대비 마진율 분석',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <span className='text-sm font-medium text-slate-700'>수익성 분석</span>
        <div className='grid grid-cols-2 gap-2'>
          <div className='bg-white rounded-lg p-3 border text-center'>
            <p className='text-xs text-slate-500'>판매가</p>
            <p className='text-xl font-bold'>4,500원</p>
          </div>
          <div className='bg-white rounded-lg p-3 border text-center'>
            <p className='text-xs text-slate-500'>원가</p>
            <p className='text-xl font-bold text-slate-600'>650원</p>
          </div>
        </div>
        <div className='bg-emerald-50 rounded-lg p-4 border border-emerald-200 text-center'>
          <p className='text-xs text-emerald-600'>마진율</p>
          <p className='text-3xl font-bold text-emerald-600'>85.6%</p>
        </div>
      </div>
    ),
  },
  {
    title: '레시피 버전 관리',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <span className='text-sm font-medium text-slate-700'>버전 히스토리</span>
        <div className='space-y-2'>
          {[
            { version: 'v3.0', date: '2025.01.05', note: '에스프레소 30ml로 변경', active: true },
            { version: 'v2.0', date: '2024.12.15', note: '얼음량 조정', active: false },
            { version: 'v1.0', date: '2024.11.01', note: '최초 등록', active: false },
          ].map((v) => (
            <div key={v.version} className={`bg-white rounded-lg p-3 border ${v.active ? 'border-orange-300' : ''}`}>
              <div className='flex items-center justify-between'>
                <span className='font-medium text-sm'>{v.version}</span>
                {v.active && <span className='text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full'>현재</span>}
              </div>
              <p className='text-xs text-slate-500 mt-1'>{v.date} - {v.note}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: '재료 소진 시 메뉴 품절 자동 연동',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <span className='text-sm font-medium text-slate-700'>품절 알림</span>
        <div className='bg-red-50 rounded-lg p-4 border border-red-200'>
          <div className='flex items-center gap-2 mb-2'>
            <div className='w-2 h-2 bg-red-500 rounded-full animate-pulse' />
            <span className='font-medium text-red-700'>품절 메뉴 발생</span>
          </div>
          <p className='text-sm text-red-600'>생크림 재고 부족으로 3개 메뉴가 품절 처리되었습니다.</p>
        </div>
        <div className='space-y-2'>
          {['생크림 라떼', '휘핑 모카', '크림 프라푸치노'].map((menu) => (
            <div key={menu} className='bg-white rounded-lg p-3 border flex items-center justify-between'>
              <span className='text-sm'>{menu}</span>
              <span className='text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded'>품절</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

// 판매 분석 화면들
const salesScreens: MockupScreen[] = [
  {
    title: '일별/주별/월별 매출 현황',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium text-slate-700'>오늘의 매출</span>
          <span className='text-xs text-emerald-600'>+12.5%</span>
        </div>
        <div className='bg-white rounded-lg p-4 border text-center'>
          <p className='text-3xl font-bold text-slate-900'>1,234,500원</p>
          <p className='text-xs text-slate-500 mt-1'>주문 87건 | 객단가 14,190원</p>
        </div>
        <div className='h-20 bg-white rounded-lg border flex items-end p-3 gap-1'>
          {[40, 65, 45, 80, 60, 90, 75].map((h, i) => (
            <div key={i} className='flex-1 bg-orange-400 rounded-t transition-all' style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    title: '인기 메뉴 TOP 10 분석',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <span className='text-sm font-medium text-slate-700'>인기 메뉴 TOP 5</span>
        <div className='bg-white rounded-lg border divide-y'>
          {[
            { rank: 1, name: '아메리카노', sales: 145, pct: 100 },
            { rank: 2, name: '카페라떼', sales: 98, pct: 68 },
            { rank: 3, name: '바닐라라떼', sales: 76, pct: 52 },
            { rank: 4, name: '카푸치노', sales: 54, pct: 37 },
            { rank: 5, name: '모카', sales: 42, pct: 29 },
          ].map((menu) => (
            <div key={menu.rank} className='flex items-center gap-3 p-3'>
              <span className='w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold'>
                {menu.rank}
              </span>
              <span className='flex-1 text-sm'>{menu.name}</span>
              <div className='w-20 h-2 bg-slate-100 rounded-full overflow-hidden'>
                <div className='h-full bg-orange-400' style={{ width: `${menu.pct}%` }} />
              </div>
              <span className='text-xs text-slate-500 w-12 text-right'>{menu.sales}건</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: '시간대별 판매 패턴 분석',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <span className='text-sm font-medium text-slate-700'>시간대별 매출</span>
        <div className='bg-white rounded-lg p-3 border'>
          <div className='flex justify-between text-xs text-slate-500 mb-2'>
            <span>09시</span><span>12시</span><span>15시</span><span>18시</span><span>21시</span>
          </div>
          <div className='flex items-end h-24 gap-1'>
            {[30, 45, 90, 60, 85, 70, 40, 55, 75, 50, 35, 20].map((h, i) => (
              <div key={i} className={`flex-1 rounded-t ${h > 80 ? 'bg-orange-500' : 'bg-orange-300'}`} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className='bg-orange-50 rounded-lg p-3 border border-orange-200'>
          <p className='text-xs text-orange-700'>피크 타임: 12:00 - 13:00 (매출 320,000원)</p>
        </div>
      </div>
    ),
  },
  {
    title: '카테고리별 매출 비중',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <span className='text-sm font-medium text-slate-700'>카테고리별 분석</span>
        <div className='flex justify-center py-2'>
          <div className='w-32 h-32 rounded-full border-8 border-orange-400 relative'>
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='text-center'>
                <p className='text-lg font-bold'>65%</p>
                <p className='text-xs text-slate-500'>커피</p>
              </div>
            </div>
          </div>
        </div>
        <div className='space-y-2'>
          {[
            { name: '커피', pct: 65, color: 'bg-orange-400' },
            { name: '음료', pct: 20, color: 'bg-blue-400' },
            { name: '디저트', pct: 15, color: 'bg-emerald-400' },
          ].map((cat) => (
            <div key={cat.name} className='flex items-center gap-2 text-xs'>
              <div className={`w-3 h-3 rounded ${cat.color}`} />
              <span className='w-12'>{cat.name}</span>
              <div className='flex-1 h-2 bg-slate-100 rounded-full overflow-hidden'>
                <div className={`h-full ${cat.color}`} style={{ width: `${cat.pct}%` }} />
              </div>
              <span className='w-8 text-right'>{cat.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: '전년/전월 대비 성장률',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <span className='text-sm font-medium text-slate-700'>성장률 비교</span>
        <div className='grid grid-cols-2 gap-2'>
          <div className='bg-white rounded-lg p-3 border text-center'>
            <p className='text-xs text-slate-500'>전월 대비</p>
            <p className='text-2xl font-bold text-emerald-600'>+8.2%</p>
            <p className='text-xs text-slate-400'>12월 → 1월</p>
          </div>
          <div className='bg-white rounded-lg p-3 border text-center'>
            <p className='text-xs text-slate-500'>전년 대비</p>
            <p className='text-2xl font-bold text-emerald-600'>+23.5%</p>
            <p className='text-xs text-slate-400'>2024 → 2025</p>
          </div>
        </div>
        <div className='bg-emerald-50 rounded-lg p-3 border border-emerald-200'>
          <p className='text-xs text-emerald-700 text-center'>지속적인 성장세를 유지하고 있습니다</p>
        </div>
      </div>
    ),
  },
];

// 리포트 화면들
const reportScreens: MockupScreen[] = [
  {
    title: '재고 회전율 분석',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <span className='text-sm font-medium text-slate-700'>재고 회전율</span>
        <div className='bg-white rounded-lg p-4 border text-center'>
          <p className='text-4xl font-bold text-orange-600'>4.2회</p>
          <p className='text-xs text-slate-500'>월 평균 회전</p>
        </div>
        <div className='space-y-2'>
          {[
            { name: '원두', rate: '6.5회', status: '우수' },
            { name: '우유', rate: '8.2회', status: '우수' },
            { name: '시럽류', rate: '2.1회', status: '개선필요' },
          ].map((item) => (
            <div key={item.name} className='bg-white rounded-lg p-3 border flex items-center justify-between'>
              <span className='text-sm'>{item.name}</span>
              <span className='text-sm font-medium'>{item.rate}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${item.status === '우수' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: '손익 계산서 자동 생성',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium text-slate-700'>손익 계산서</span>
          <span className='text-xs text-slate-500'>2025년 1월</span>
        </div>
        <div className='bg-white rounded-lg border divide-y'>
          {[
            { label: '매출', value: '32,450,000', type: 'revenue' },
            { label: '매출원가', value: '-10,546,250', type: 'cost' },
            { label: '매출총이익', value: '21,903,750', type: 'profit' },
            { label: '판관비', value: '-12,168,750', type: 'cost' },
            { label: '영업이익', value: '9,735,000', type: 'net' },
          ].map((row) => (
            <div key={row.label} className={`flex justify-between p-3 ${row.type === 'net' ? 'bg-orange-50' : ''}`}>
              <span className={`text-sm ${row.type === 'net' ? 'font-bold' : ''}`}>{row.label}</span>
              <span className={`text-sm ${row.type === 'cost' ? 'text-red-600' : row.type === 'net' ? 'text-orange-600 font-bold' : ''}`}>
                {row.value}원
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: '원가율 추이 분석',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <span className='text-sm font-medium text-slate-700'>원가율 추이</span>
        <div className='bg-white rounded-lg p-4 border text-center'>
          <p className='text-3xl font-bold'>32.5%</p>
          <p className='text-xs text-emerald-600'>전월 대비 -2.1%</p>
        </div>
        <div className='bg-white rounded-lg p-3 border'>
          <div className='h-20 flex items-end gap-2'>
            {[38, 36, 35, 34, 33, 32.5].map((v, i) => (
              <div key={i} className='flex-1 flex flex-col items-center'>
                <span className='text-[10px] text-slate-500 mb-1'>{v}%</span>
                <div className='w-full bg-orange-400 rounded-t' style={{ height: `${v * 2}px` }} />
              </div>
            ))}
          </div>
          <div className='flex justify-between text-[10px] text-slate-400 mt-2'>
            <span>8월</span><span>9월</span><span>10월</span><span>11월</span><span>12월</span><span>1월</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: '맞춤형 보고서 다운로드',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <span className='text-sm font-medium text-slate-700'>보고서 내보내기</span>
        <div className='space-y-2'>
          {[
            { name: '월간 매출 보고서', format: 'PDF', icon: '📊' },
            { name: '재고 현황 보고서', format: 'Excel', icon: '📦' },
            { name: '원가 분석 보고서', format: 'PDF', icon: '💰' },
            { name: '메뉴별 판매 현황', format: 'Excel', icon: '🍽️' },
          ].map((report) => (
            <div key={report.name} className='bg-white rounded-lg p-3 border flex items-center gap-3'>
              <span className='text-xl'>{report.icon}</span>
              <span className='flex-1 text-sm'>{report.name}</span>
              <span className='text-xs px-2 py-1 bg-slate-100 rounded'>{report.format}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: '지점별 비교 분석',
    content: (
      <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
        <span className='text-sm font-medium text-slate-700'>지점별 실적</span>
        <div className='space-y-2'>
          {[
            { name: '강남점', sales: '42,500,000', growth: '+12%', rank: 1 },
            { name: '홍대점', sales: '38,200,000', growth: '+8%', rank: 2 },
            { name: '신촌점', sales: '32,450,000', growth: '+5%', rank: 3 },
          ].map((branch) => (
            <div key={branch.name} className='bg-white rounded-lg p-3 border'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold'>
                    {branch.rank}
                  </span>
                  <span className='font-medium text-sm'>{branch.name}</span>
                </div>
                <span className='text-xs text-emerald-600'>{branch.growth}</span>
              </div>
              <p className='text-orange-600 font-semibold mt-1'>{branch.sales}원</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const featureDemoData: Record<string, FeatureDemoData> = {
  '재고 관리': {
    title: '재고 관리',
    subtitle: '실시간으로 재고를 파악하고 효율적으로 관리하세요',
    icon: <Package className='w-8 h-8' />,
    highlights: [
      '실시간 재고 현황 대시보드',
      '입고/출고 내역 자동 기록',
      '재고 부족 시 알림 설정',
      '유통기한 관리',
      '거래처별 입고 내역 관리',
    ],
    screens: inventoryScreens,
  },
  '메뉴 / 레시피': {
    title: '메뉴 / 레시피',
    subtitle: '표준화된 레시피로 일관된 맛을 유지하세요',
    icon: <ChefHat className='w-8 h-8' />,
    highlights: [
      '메뉴별 레시피 등록 및 관리',
      '재료 원가 자동 계산',
      '메뉴 판매가 대비 마진율 분석',
      '레시피 버전 관리',
      '재료 소진 시 메뉴 품절 자동 연동',
    ],
    screens: recipeScreens,
  },
  '판매 분석': {
    title: '판매 분석',
    subtitle: '데이터 기반의 인사이트로 매출을 극대화하세요',
    icon: <BarChart3 className='w-8 h-8' />,
    highlights: [
      '일별/주별/월별 매출 현황',
      '인기 메뉴 TOP 10 분석',
      '시간대별 판매 패턴 분석',
      '카테고리별 매출 비중',
      '전년/전월 대비 성장률',
    ],
    screens: salesScreens,
  },
  '리포트': {
    title: '리포트',
    subtitle: '한눈에 보는 경영 현황 리포트',
    icon: <FileText className='w-8 h-8' />,
    highlights: [
      '재고 회전율 분석',
      '손익 계산서 자동 생성',
      '원가율 추이 분석',
      '맞춤형 보고서 다운로드',
      '지점별 비교 분석',
    ],
    screens: reportScreens,
  },
};

function CarouselPreview({ screens, currentIndex }: { screens: MockupScreen[]; currentIndex: number }) {
  return (
    <div className='relative overflow-hidden w-full'>
      <div
        className='flex transition-transform duration-300 ease-out'
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {screens.map((screen, i) => (
          <div key={i} className='w-full flex-shrink-0 min-w-0'>
            {screen.content}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FeatureDemo({ features }: { features: Feature[] }) {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);

  const demoData = selectedFeature ? featureDemoData[selectedFeature] : null;

  // 모달 열기 핸들러 - 인덱스 리셋 포함
  const openFeatureDemo = (featureTitle: string) => {
    setCurrentScreenIndex(0);
    setSelectedFeature(featureTitle);
  };

  // 모달 닫기 핸들러
  const closeFeatureDemo = () => {
    setSelectedFeature(null);
  };

  // 자동 슬라이드 (5초마다)
  useEffect(() => {
    if (!demoData) return;

    const timer = setInterval(() => {
      setCurrentScreenIndex((prev) =>
        prev >= demoData.screens.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [demoData]);

  const goToScreen = (index: number) => {
    setCurrentScreenIndex(index);
  };

  const goToPrev = () => {
    if (!demoData) return;
    setCurrentScreenIndex((prev) =>
      prev <= 0 ? demoData.screens.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    if (!demoData) return;
    setCurrentScreenIndex((prev) =>
      prev >= demoData.screens.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <>
      <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {features.map((feature) => (
          <button
            key={feature.title}
            onClick={() => openFeatureDemo(feature.title)}
            className='
              rounded-2xl p-6 text-left
              backdrop-blur-xl backdrop-saturate-150
              border border-white/50
              bg-white/70
              shadow-[0_8px_32px_rgba(0,0,0,0.06)]
              transition-all duration-300
              hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]
              hover:translate-y-[-2px]
              hover:bg-white/80
              cursor-pointer
              group
            '
          >
            <div className='text-4xl mb-4'>{feature.icon}</div>
            <h3 className='text-lg font-semibold text-slate-900 mb-2'>
              {feature.title}
            </h3>
            <p className='text-slate-600 text-sm mb-3'>{feature.description}</p>
            <span className='text-orange-500 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
              데모 보기 <ArrowRight className='w-4 h-4' />
            </span>
          </button>
        ))}
      </div>

      <Dialog open={!!selectedFeature} onOpenChange={closeFeatureDemo}>
        <DialogContent className='sm:max-w-2xl'>
          {demoData && (
            <>
              <DialogHeader>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='p-2 bg-orange-100 text-orange-600 rounded-xl'>
                    {demoData.icon}
                  </div>
                  <div>
                    <DialogTitle className='text-xl'>{demoData.title}</DialogTitle>
                    <DialogDescription>{demoData.subtitle}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className='flex flex-col-reverse md:grid md:grid-cols-2 gap-6 mt-4 w-full max-w-full overflow-hidden'>
                {/* Highlights - 클릭하면 해당 화면으로 이동 */}
                <div className='space-y-3'>
                  <h4 className='font-medium text-slate-900'>주요 기능</h4>
                  <ul className='space-y-2'>
                    {demoData.highlights.map((item, i) => (
                      <li
                        key={i}
                        onClick={() => goToScreen(i)}
                        className={`
                          flex items-start gap-2 text-sm cursor-pointer
                          p-2 rounded-lg transition-all
                          ${currentScreenIndex === i
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : 'text-slate-600 hover:bg-slate-50'
                          }
                        `}
                      >
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${currentScreenIndex === i ? 'text-orange-500' : 'text-emerald-500'}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Carousel Preview */}
                <div className='min-w-0 overflow-hidden'>
                  <div className='flex items-center justify-between mb-3'>
                    <h4 className='font-medium text-slate-900'>미리보기</h4>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={goToPrev}
                        className='p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer'
                      >
                        <ChevronLeft className='w-5 h-5 text-slate-600' />
                      </button>
                      <span className='text-xs text-slate-500'>
                        {currentScreenIndex + 1} / {demoData.screens.length}
                      </span>
                      <button
                        onClick={goToNext}
                        className='p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer'
                      >
                        <ChevronRight className='w-5 h-5 text-slate-600' />
                      </button>
                    </div>
                  </div>
                  <CarouselPreview screens={demoData.screens} currentIndex={currentScreenIndex} />
                  {/* Dots */}
                  <div className='flex justify-center gap-1.5 mt-3'>
                    {demoData.screens.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goToScreen(i)}
                        className={`
                          w-2 h-2 rounded-full transition-all cursor-pointer
                          ${currentScreenIndex === i ? 'bg-orange-500 w-4' : 'bg-slate-300 hover:bg-slate-400'}
                        `}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className='mt-6 pt-4 border-t flex flex-col sm:flex-row gap-3 justify-center'>
                <AuthModal mode='sign-up'>
                  <button className='px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition shadow-lg cursor-pointer'>
                    무료로 시작하기
                  </button>
                </AuthModal>
                <AuthModal mode='sign-in'>
                  <button className='px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition shadow-lg cursor-pointer'>
                    로그인
                  </button>
                </AuthModal>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
