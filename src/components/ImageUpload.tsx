'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Camera, X, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadMenuImage, deleteMenuImage, validateImageFile } from '@/utils/supabase/storage';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  value?: string | null; // Current image URL
  onChange: (url: string | null) => void;
  folder: 'menus' | 'options';
  className?: string;
}

export function ImageUpload({ value, onChange, folder, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);

    try {
      // Delete old image if exists
      if (value) {
        await deleteMenuImage(value);
      }

      // Upload new image
      const url = await uploadMenuImage(file, folder);

      if (url) {
        onChange(url);
      } else {
        setError('이미지 업로드에 실패했습니다.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!value) return;

    setIsUploading(true);
    try {
      const success = await deleteMenuImage(value);
      if (success) {
        onChange(null);
      } else {
        setError('이미지 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('이미지 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Image Preview Circle */}
      <div
        className={cn(
          'relative mx-auto w-[120px] h-[120px] rounded-full border-2 border-dashed cursor-pointer transition-all',
          isDragging
            ? 'border-primary bg-primary/5 scale-105'
            : 'border-gray-300 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-900',
          isUploading && 'pointer-events-none opacity-60'
        )}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {value ? (
          <>
            {/* Image Preview */}
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover rounded-full"
            />

            {/* Hover Overlay */}
            {!isUploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium">이미지 변경</span>
              </div>
            )}

            {/* Remove Button */}
            {!isUploading && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full shadow-lg"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full gap-2">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            ) : (
              <>
                <Camera className="w-8 h-8 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  이미지 추가
                </span>
              </>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleFileInput}
          disabled={isUploading}
        />
      </div>

      {/* Drag-and-Drop Hint */}
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          클릭하거나 파일을 드래그하여 업로드
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          JPG, PNG, WEBP (최대 2MB)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-950 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
