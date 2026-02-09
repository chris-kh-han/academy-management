'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Supplier } from '@/types';

const supplierSchema = z.object({
  name: z.string().min(1, '업체명을 입력해주세요.'),
  business_no: z.string().optional(),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email('올바른 이메일 형식을 입력해주세요.')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
  default_terms: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

type SupplierDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onSubmit: (data: SupplierFormValues) => Promise<void>;
};

export function SupplierDialog({
  open,
  onOpenChange,
  supplier,
  onSubmit,
}: SupplierDialogProps) {
  const isEditing = !!supplier;
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: standardSchemaResolver(supplierSchema),
    defaultValues: {
      name: '',
      business_no: '',
      contact_name: '',
      phone: '',
      email: '',
      address: '',
      default_terms: '',
      notes: '',
      is_active: true,
    },
  });

  const isActive = watch('is_active');

  React.useEffect(() => {
    if (open && supplier) {
      reset({
        name: supplier.name,
        business_no: supplier.business_no ?? '',
        contact_name: supplier.contact_name ?? '',
        phone: supplier.phone ?? '',
        email: supplier.email ?? '',
        address: supplier.address ?? '',
        default_terms: supplier.default_terms ?? '',
        notes: supplier.notes ?? '',
        is_active: supplier.is_active,
      });
    } else if (open && !supplier) {
      reset({
        name: '',
        business_no: '',
        contact_name: '',
        phone: '',
        email: '',
        address: '',
        default_terms: '',
        notes: '',
        is_active: true,
      });
    }
  }, [open, supplier, reset]);

  const handleFormSubmit = async (data: SupplierFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save supplier:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? '공급업체 수정' : '공급업체 추가'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? '공급업체 정보를 수정합니다.'
              : '새로운 공급업체를 등록합니다.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className='grid gap-4 py-2'
        >
          <div className='grid gap-2'>
            <Label htmlFor='name'>
              업체명 <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='name'
              placeholder='공급업체명을 입력하세요'
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className='text-xs text-red-500'>{errors.name.message}</p>
            )}
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label htmlFor='business_no'>사업자번호</Label>
              <Input
                id='business_no'
                placeholder='000-00-00000'
                {...register('business_no')}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='contact_name'>담당자</Label>
              <Input
                id='contact_name'
                placeholder='담당자명'
                {...register('contact_name')}
              />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label htmlFor='phone'>전화번호</Label>
              <Input
                id='phone'
                placeholder='02-0000-0000'
                {...register('phone')}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='email'>이메일</Label>
              <Input
                id='email'
                type='email'
                placeholder='email@example.com'
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className='text-xs text-red-500'>{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='address'>주소</Label>
            <Input
              id='address'
              placeholder='주소를 입력하세요'
              {...register('address')}
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='default_terms'>거래 조건</Label>
            <Input
              id='default_terms'
              placeholder='예: 월말 정산, 납품 후 30일'
              {...register('default_terms')}
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='notes'>비고</Label>
            <Textarea
              id='notes'
              placeholder='메모 사항을 입력하세요'
              rows={3}
              {...register('notes')}
            />
          </div>

          <div className='flex items-center justify-between'>
            <Label htmlFor='is_active'>활성 상태</Label>
            <Switch
              id='is_active'
              checked={isActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
          </div>

          <DialogFooter className='pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              {isEditing ? '수정' : '등록'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
