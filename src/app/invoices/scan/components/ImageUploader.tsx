'use client';

import * as React from 'react';
import Image from 'next/image';
import { Upload, ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ImageUploaderProps = {
  imagePreview: string | null;
  isScanning: boolean;
  onFileSelect: (file: File) => void;
  onClear: () => void;
};

export function ImageUploader({
  imagePreview,
  isScanning,
  onFileSelect,
  onClear,
}: ImageUploaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  if (!imagePreview) {
    return (
      <div
        className={`flex h-full min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type='file'
          accept='image/jpeg,image/png,image/webp,image/gif'
          onChange={handleInputChange}
          className='hidden'
        />
        <ImageIcon className='text-muted-foreground mb-4 h-16 w-16' />
        <p className='mb-2 text-sm font-medium'>
          거래명세서 이미지를 드래그하거나
        </p>
        <p className='text-muted-foreground mb-4 text-xs'>
          JPEG, PNG, WebP, GIF (최대 10MB)
        </p>
        <Button
          variant='outline'
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          size='lg'
          className='cursor-pointer'
        >
          <Upload className='mr-2 h-4 w-4' />
          파일 선택
        </Button>
      </div>
    );
  }

  return (
    <div className='relative h-full min-h-[300px]'>
      <div className='relative h-full w-full'>
        <Image
          src={imagePreview}
          alt='업로드된 거래명세서'
          fill
          className='rounded-lg object-contain'
          unoptimized
        />
      </div>
      <Button
        variant='ghost'
        size='icon'
        aria-label='이미지 제거'
        className='bg-background/80 hover:bg-background absolute top-2 right-2'
        onClick={onClear}
        disabled={isScanning}
      >
        <X className='h-4 w-4' />
      </Button>
      {isScanning && (
        <div className='bg-background/80 absolute inset-0 flex items-center justify-center rounded-lg'>
          <div className='flex flex-col items-center gap-2'>
            <Loader2 className='text-primary h-8 w-8 animate-spin' />
            <span className='text-sm font-medium'>이미지 분석 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}
