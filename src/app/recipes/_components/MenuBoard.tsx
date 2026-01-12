'use client';

import * as React from 'react';
import {
  Plus,
  Pencil,
  Search,
  Trash2,
  GripVertical,
  ChevronRight,
  Upload,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'react-toastify';
import { EditRecipeDialog } from './EditRecipeDialog';
import { AddMenuDialog } from './AddMenuDialog';
import { AddCategoryDialog } from './AddCategoryDialog';
import { EditCategoryDialog } from './EditCategoryDialog';
import { EditOptionDialog } from './EditOptionDialog';
import { AddOptionDialog } from './AddOptionDialog';
import { MenuUploadDialog } from './MenuUploadDialog';
import {
  deleteCategory,
  updateCategoryOrder,
} from '../_actions/categoryActions';
import { cn } from '@/lib/utils';
import type { MenuCategory, CategoryType } from '@/types';
import Image from 'next/image';

type Ingredient = {
  ingredient_id: string;
  name: string | undefined;
  category: string | undefined;
  qty: number | null;
  unit: string | undefined;
  loss_rate: number | null;
};

type Menu = {
  menu_id: string;
  menu_name: string;
  category: string;
  price: number;
  image_url?: string;
  category_id?: string;
};

type MenuOption = {
  option_id: number;
  option_name: string;
  option_category: 'edge' | 'topping' | 'beverage';
  additional_price: number;
  image_url?: string;
  is_active: boolean;
};

type RecipeRow = {
  menuId: string;
  menuName: string;
  ingredients: Ingredient[];
  imageUrl?: string;
  categoryId?: string;
};

type AllIngredient = {
  ingredient_id: string;
  ingredient_name: string;
  category: string;
  unit?: string;
};

type CategoryOption = {
  link_id: string;
  option_id: string;
  option_name: string;
  option_category: string;
  additional_price: number;
  image_url?: string;
  is_active: boolean;
};

type MenuBoardProps = {
  menus: Menu[];
  menuOptions: MenuOption[];
  categories: MenuCategory[];
  recipes: Record<
    string,
    {
      menuName: string;
      ingredients: Ingredient[];
    }
  >;
  allIngredients: AllIngredient[];
  existingCategories: string[];
  optionsByCategory: Record<string, CategoryOption[]>;
  optionsByMenu: Record<string, CategoryOption[]>;
};

// SortableCategory 컴포넌트 (메뉴 카테고리용)
type SortableCategoryProps = {
  category: MenuCategory;
  categoryMenus: Menu[];
  categoryOptions: CategoryOption[];
  optionsByMenu: Record<string, CategoryOption[]>;
  recipes: Record<string, { menuName: string; ingredients: Ingredient[] }>;
  onMenuClick: (menu: Menu) => void;
  onOptionClick: (option: CategoryOption) => void;
  onAddMenu: (categoryId: string) => void;
  onAddOption: (categoryId: string) => void;
  onEditCategory: (category: MenuCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  formatPrice: (price: number) => string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

function SortableCategory({
  category,
  categoryMenus,
  categoryOptions,
  optionsByMenu,
  recipes,
  onMenuClick,
  onOptionClick,
  onAddMenu,
  onAddOption,
  onEditCategory,
  onDeleteCategory,
  formatPrice,
  isCollapsed,
  onToggleCollapse,
}: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={cn('space-y-4', isDragging && 'opacity-50')}
    >
      {/* 카테고리 헤더 */}
      <div className='flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2'>
        <div className='flex items-center gap-3'>
          {/* 접기/펼치기 버튼 */}
          <button
            onClick={onToggleCollapse}
            className='text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 transition-colors'
          >
            <ChevronRight
              className={cn(
                'h-5 w-5 transition-transform duration-200',
                !isCollapsed && 'rotate-90',
              )}
            />
          </button>
          {/* 드래그 핸들 */}

          <span className='text-3xl'>{category.icon}</span>
          <div>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-50 uppercase tracking-wide'>
              {category.name}
            </h2>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
              {categoryMenus.length}개 메뉴
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onAddMenu(category.id)}
          >
            <Plus className='h-4 w-4 mr-1' />
            메뉴 추가
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onAddOption(category.id)}
          >
            <Plus className='h-4 w-4 mr-1' />
            옵션 추가
          </Button>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => onEditCategory(category)}
          >
            <Pencil className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => onDeleteCategory(category.id)}
          >
            <Trash2 className='h-4 w-4 text-red-500 dark:text-red-400' />
          </Button>

          <button
            {...attributes}
            {...listeners}
            className='cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 transition-colors'
          >
            <GripVertical className='h-5 w-5' />
          </button>
        </div>
      </div>

      {/* 메뉴 그리드 */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100',
        )}
      >
        {categoryMenus.length === 0 ? (
          <Card className='border-dashed bg-gray-50 dark:bg-gray-900'>
            <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
              <p className='text-sm text-gray-500 dark:text-gray-400 mb-3'>
                아직 메뉴가 없습니다. 메뉴를 추가해주세요.
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onAddMenu(category.id)}
              >
                <Plus className='h-4 w-4 mr-1' />첫 메뉴 추가하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {categoryMenus.map((menu) => (
              <Card
                key={menu.menu_id}
                className={cn(
                  'group cursor-pointer transition-all hover:shadow-lg hover:scale-105',
                  'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800',
                )}
                onClick={() => onMenuClick(menu)}
              >
                <CardContent className='p-4'>
                  <div className='flex flex-col items-center text-center space-y-3'>
                    {/* 원형 이미지 플레이스홀더 */}
                    <div className='relative w-24 h-24 rounded-full bg-linear-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 flex items-center justify-center overflow-hidden border-2 border-gray-100 dark:border-gray-800'>
                      {menu.image_url ? (
                        <Image
                          src={menu.image_url}
                          alt={menu.menu_name}
                          fill
                          className='object-cover'
                        />
                      ) : (
                        <div className='text-3xl font-bold text-orange-600 dark:text-orange-300'>
                          {menu.menu_name.charAt(0)}
                        </div>
                      )}

                      {/* 수정 버튼 오버레이 */}
                      <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                        <Pencil className='h-6 w-6 text-white' />
                      </div>
                    </div>

                    {/* 메뉴명 */}
                    <div className='flex-1 w-full'>
                      <h3 className='font-semibold text-base text-gray-900 dark:text-gray-50 line-clamp-2 min-h-12 flex items-center justify-center'>
                        {menu.menu_name}
                      </h3>
                    </div>

                    {/* 가격 */}
                    <div className='w-full pt-2 border-t border-gray-100 dark:border-gray-800'>
                      <p className='text-lg font-bold text-orange-600 dark:text-orange-400'>
                        {formatPrice(menu.price)}
                      </p>
                    </div>

                    {/* 레시피 여부 표시 */}
                    {recipes[menu.menu_id] && (
                      <div className='w-full'>
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400'>
                          레시피 {recipes[menu.menu_id].ingredients.length}개
                        </span>
                      </div>
                    )}

                    {/* 메뉴별 옵션 표시 */}
                    {optionsByMenu[menu.menu_id] && optionsByMenu[menu.menu_id].length > 0 && (
                      <div className='w-full'>
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'>
                          옵션 {optionsByMenu[menu.menu_id].length}개
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 옵션 섹션 */}
        {categoryOptions.length > 0 && (
          <div className='mt-6 pt-4 border-t border-gray-200 dark:border-gray-800'>
            <h3 className='text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3'>
              옵션 ({categoryOptions.length}개)
            </h3>
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3'>
              {categoryOptions.map((option) => (
                <Card
                  key={option.link_id}
                  className={cn(
                    'group cursor-pointer transition-all hover:shadow-md hover:scale-105',
                    'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
                  )}
                  onClick={() => onOptionClick(option)}
                >
                  <CardContent className='p-3'>
                    <div className='flex flex-col items-center text-center space-y-2'>
                      {/* 원형 이미지 */}
                      <div className='relative w-12 h-12 rounded-full bg-linear-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center overflow-hidden border border-blue-200 dark:border-blue-700'>
                        {option.image_url ? (
                          <Image
                            src={option.image_url}
                            alt={option.option_name}
                            fill
                            className='object-cover'
                          />
                        ) : (
                          <div className='text-lg font-bold text-blue-600 dark:text-blue-300'>
                            {option.option_name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* 옵션명 */}
                      <h4 className='font-medium text-xs text-gray-900 dark:text-gray-50 line-clamp-2'>
                        {option.option_name}
                      </h4>

                      {/* 추가 가격 */}
                      <p className='text-xs font-semibold text-blue-600 dark:text-blue-400'>
                        +{new Intl.NumberFormat('ko-KR').format(option.additional_price)}원
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// SortableOptionCategory 컴포넌트 (옵션 카테고리용)
type SortableOptionCategoryProps = {
  category: MenuCategory;
  categoryOptions: MenuOption[];
  onOptionClick: (option: MenuOption) => void;
  onEditCategory: (category: MenuCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  formatAdditionalPrice: (price: number) => string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

function SortableOptionCategory({
  category,
  categoryOptions,
  onOptionClick,
  onEditCategory,
  onDeleteCategory,
  formatAdditionalPrice,
  isCollapsed,
  onToggleCollapse,
}: SortableOptionCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={cn('space-y-4', isDragging && 'opacity-50')}
    >
      {/* 옵션 카테고리 헤더 */}
      <div className='flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2'>
        <div className='flex items-center gap-3'>
          {/* 접기/펼치기 버튼 */}
          <button
            onClick={onToggleCollapse}
            className='text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 transition-colors'
          >
            <ChevronRight
              className={cn(
                'h-5 w-5 transition-transform duration-200',
                !isCollapsed && 'rotate-90',
              )}
            />
          </button>
          {/* 드래그 핸들 */}
          <button
            {...attributes}
            {...listeners}
            className='cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 transition-colors'
          >
            <GripVertical className='h-5 w-5' />
          </button>
          <span className='text-3xl'>{category.icon}</span>
          <div>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-50 uppercase tracking-wide'>
              {category.name}
            </h2>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
              {categoryOptions.length}개 옵션
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => onEditCategory(category)}
          >
            <Pencil className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => onDeleteCategory(category.id)}
          >
            <Trash2 className='h-4 w-4 text-red-500 dark:text-red-400' />
          </Button>
        </div>
      </div>

      {/* 옵션 그리드 */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100',
        )}
      >
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {categoryOptions.map((option, index) => (
            <Card
              key={option.option_id ?? `option-${index}`}
              className={cn(
                'group cursor-pointer transition-all hover:shadow-lg hover:scale-105',
                'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800',
              )}
              onClick={() => onOptionClick(option)}
            >
              <CardContent className='p-4'>
                <div className='flex flex-col items-center text-center space-y-3'>
                  {/* 원형 이미지 */}
                  <div className='relative w-20 h-20 rounded-full bg-linear-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center overflow-hidden border-2 border-gray-100 dark:border-gray-800'>
                    {option.image_url ? (
                      <Image
                        src={option.image_url}
                        alt={option.option_name}
                        fill
                        className='object-cover'
                      />
                    ) : (
                      <div className='text-2xl font-bold text-blue-600 dark:text-blue-300'>
                        {option.option_name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* 옵션명 */}
                  <div className='flex-1 w-full'>
                    <h3 className='font-semibold text-sm text-gray-900 dark:text-gray-50 line-clamp-2 min-h-10 flex items-center justify-center'>
                      {option.option_name}
                    </h3>
                  </div>

                  {/* 추가 가격 */}
                  <div className='w-full pt-2 border-t border-gray-100 dark:border-gray-800'>
                    <p className='text-base font-bold text-blue-600 dark:text-blue-400'>
                      {formatAdditionalPrice(option.additional_price)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MenuBoard({
  menus,
  menuOptions,
  categories,
  recipes,
  allIngredients,
  optionsByCategory,
  optionsByMenu,
}: MenuBoardProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [editingRecipe, setEditingRecipe] = React.useState<RecipeRow | null>(
    null,
  );
  const [editingOption, setEditingOption] = React.useState<MenuOption | null>(
    null,
  );
  const [addMenuCategoryId, setAddMenuCategoryId] = React.useState<
    string | null
  >(null);
  const [addMenuOpen, setAddMenuOpen] = React.useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = React.useState(false);
  const [addCategoryType, setAddCategoryType] =
    React.useState<CategoryType>('menu');
  const [editingCategory, setEditingCategory] =
    React.useState<MenuCategory | null>(null);

  // 삭제 확인 모달 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<{
    id: string;
    menuCount: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [menuUploadOpen, setMenuUploadOpen] = React.useState(false);
  const [addOptionCategoryId, setAddOptionCategoryId] = React.useState<string | null>(null);

  // 드래그 상태
  const [activeMenuCategoryId, setActiveMenuCategoryId] = React.useState<
    string | null
  >(null);
  const [activeOptionCategoryId, setActiveOptionCategoryId] = React.useState<
    string | null
  >(null);

  // 접기/펼치기 상태
  const [collapsedCategories, setCollapsedCategories] = React.useState<
    Set<string>
  >(new Set());

  // localStorage에서 초기값 로드
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('collapsedCategories');
      if (saved) {
        setCollapsedCategories(new Set(JSON.parse(saved)));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      // localStorage에 저장
      localStorage.setItem('collapsedCategories', JSON.stringify([...next]));
      return next;
    });
  };

  // 로컬 카테고리 상태 (드래그 중 임시 순서 변경용)
  const [localMenuCategories, setLocalMenuCategories] = React.useState<
    MenuCategory[]
  >([]);
  const [localOptionCategories, setLocalOptionCategories] = React.useState<
    MenuCategory[]
  >([]);

  // 검색 필터링
  const filteredMenus = React.useMemo(() => {
    if (!searchQuery.trim()) return menus;

    const query = searchQuery.toLowerCase();
    return menus.filter(
      (menu) =>
        menu.menu_name.toLowerCase().includes(query) ||
        menu.category.toLowerCase().includes(query),
    );
  }, [menus, searchQuery]);

  // 메뉴 카테고리와 옵션 카테고리 분리
  const menuCategories = React.useMemo(
    () =>
      categories
        .filter((cat) => cat.category_type === 'menu')
        .sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  const optionCategories = React.useMemo(
    () =>
      categories
        .filter((cat) => cat.category_type === 'option')
        .sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  // 로컬 상태 초기화
  React.useEffect(() => {
    setLocalMenuCategories(menuCategories);
  }, [menuCategories]);

  React.useEffect(() => {
    setLocalOptionCategories(optionCategories);
  }, [optionCategories]);

  // 드래그 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동 후 드래그 시작
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 카테고리별 메뉴 그룹핑
  const { menusByCategory, uncategorizedMenus } = React.useMemo(() => {
    const grouped: Record<string, Menu[]> = {};
    const uncategorized: Menu[] = [];

    // 카테고리 초기화
    menuCategories.forEach((cat) => {
      grouped[cat.id] = [];
    });

    // 메뉴 할당
    filteredMenus.forEach((menu) => {
      if (menu.category_id && grouped[menu.category_id]) {
        grouped[menu.category_id].push(menu);
      } else {
        uncategorized.push(menu);
      }
    });

    return { menusByCategory: grouped, uncategorizedMenus: uncategorized };
  }, [menuCategories, filteredMenus]);


  const handleMenuClick = (menu: Menu) => {
    const recipe = recipes[menu.menu_id];
    setEditingRecipe({
      menuId: menu.menu_id,
      menuName: menu.menu_name,
      ingredients: recipe?.ingredients || [],
      imageUrl: menu.image_url,
      categoryId: menu.category_id,
    });
  };

  // 가격 포맷 (한국 원화)
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(price);
  };

  // 옵션 추가 가격 포맷
  const formatAdditionalPrice = (price: number) => {
    return `+${new Intl.NumberFormat('ko-KR').format(price)}`;
  };

  // 카테고리 삭제 핸들러 - 모달 열기
  const handleDeleteCategory = (categoryId: string) => {
    const categoryMenus = menusByCategory[categoryId] || [];
    setCategoryToDelete({ id: categoryId, menuCount: categoryMenus.length });
    setDeleteDialogOpen(true);
  };

  // 카테고리 삭제 확인
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    const result = await deleteCategory(categoryToDelete.id);

    if (result.success) {
      setLocalMenuCategories((prev) =>
        prev.filter((cat) => cat.id !== categoryToDelete.id)
      );
      toast.success('카테고리가 삭제되었습니다.');
    } else {
      toast.error('삭제 실패: ' + result.error);
    }

    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  // 메뉴 카테고리 드래그 핸들러
  const handleMenuCategoryDragStart = (event: DragStartEvent) => {
    setActiveMenuCategoryId(event.active.id as string);
  };

  const handleMenuCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveMenuCategoryId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localMenuCategories.findIndex(
      (cat) => cat.id === active.id,
    );
    const newIndex = localMenuCategories.findIndex((cat) => cat.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // 로컬 상태 업데이트 (즉시 UI 반영)
    const newOrder = arrayMove(localMenuCategories, oldIndex, newIndex);
    setLocalMenuCategories(newOrder);

    // 서버에 순서 업데이트
    const categoryIds = newOrder.map((cat) => cat.id);
    const result = await updateCategoryOrder(categoryIds);

    if (!result.success) {
      toast.error('카테고리 순서 업데이트 실패: ' + result.error);
      // 실패 시 원래 순서로 되돌림
      setLocalMenuCategories(menuCategories);
    }
  };

  // 옵션 카테고리 드래그 핸들러
  const handleOptionCategoryDragStart = (event: DragStartEvent) => {
    setActiveOptionCategoryId(event.active.id as string);
  };

  const handleOptionCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveOptionCategoryId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localOptionCategories.findIndex(
      (cat) => cat.id === active.id,
    );
    const newIndex = localOptionCategories.findIndex(
      (cat) => cat.id === over.id,
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // 로컬 상태 업데이트 (즉시 UI 반영)
    const newOrder = arrayMove(localOptionCategories, oldIndex, newIndex);
    setLocalOptionCategories(newOrder);

    // 서버에 순서 업데이트
    const categoryIds = newOrder.map((cat) => cat.id);
    const result = await updateCategoryOrder(categoryIds);

    if (!result.success) {
      toast.error('카테고리 순서 업데이트 실패: ' + result.error);
      // 실패 시 원래 순서로 되돌림
      setLocalOptionCategories(optionCategories);
    }
  };

  return (
    <div className='w-full'>
      {/* 헤더 영역 */}
      <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500' />
          <Input
            placeholder='메뉴 검색...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => setMenuUploadOpen(true)}>
            <Upload className='h-4 w-4 mr-2' />
            메뉴 업로드
          </Button>
          <Button variant='outline' onClick={() => setAddMenuOpen(true)}>
            <Plus className='h-4 w-4 mr-2' />
            메뉴 추가
          </Button>
          <Button
            onClick={() => {
              setAddCategoryType('menu');
              setAddCategoryOpen(true);
            }}
          >
            <Plus className='h-4 w-4 mr-2' />
            카테고리 추가
          </Button>
        </div>
      </div>

      {/* 메뉴 카테고리 섹션 */}
      <div className='space-y-8'>
        {localMenuCategories.length === 0 ? (
          <Card className='border-dashed'>
            <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
              <div className='rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4'>
                <Search className='h-8 w-8 text-gray-400 dark:text-gray-500' />
              </div>
              <h3 className='text-lg font-semibold mb-2 text-gray-900 dark:text-gray-50'>
                카테고리가 없습니다
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
                카테고리를 먼저 추가한 후, 각 카테고리에 메뉴를 추가하세요.
              </p>
              <Button
                onClick={() => {
                  setAddCategoryType('menu');
                  setAddCategoryOpen(true);
                }}
              >
                <Plus className='h-4 w-4 mr-2' />
                카테고리 추가
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleMenuCategoryDragStart}
            onDragEnd={handleMenuCategoryDragEnd}
          >
            <SortableContext
              items={localMenuCategories.map((cat) => cat.id)}
              strategy={verticalListSortingStrategy}
            >
              {localMenuCategories.map((category) => {
                const categoryMenus = menusByCategory[category.id] || [];
                const categoryOpts = optionsByCategory[category.id] || [];

                return (
                  <SortableCategory
                    key={category.id}
                    category={category}
                    categoryMenus={categoryMenus}
                    categoryOptions={categoryOpts}
                    optionsByMenu={optionsByMenu}
                    recipes={recipes}
                    onMenuClick={handleMenuClick}
                    onOptionClick={(opt) => {
                      setEditingOption({
                        option_id: Number(opt.option_id),
                        option_name: opt.option_name,
                        option_category: opt.option_category as 'edge' | 'topping' | 'beverage',
                        additional_price: opt.additional_price,
                        image_url: opt.image_url,
                        is_active: opt.is_active,
                      });
                    }}
                    onAddMenu={setAddMenuCategoryId}
                    onAddOption={setAddOptionCategoryId}
                    onEditCategory={setEditingCategory}
                    onDeleteCategory={handleDeleteCategory}
                    formatPrice={formatPrice}
                    isCollapsed={collapsedCategories.has(category.id)}
                    onToggleCollapse={() => toggleCategory(category.id)}
                  />
                );
              })}
            </SortableContext>
            <DragOverlay>
              {activeMenuCategoryId ? (
                <div className='opacity-60'>
                  {(() => {
                    const category = localMenuCategories.find(
                      (cat) => cat.id === activeMenuCategoryId,
                    );
                    if (!category) return null;
                    return (
                      <div className='flex items-center gap-3 p-4 bg-white dark:bg-gray-950 rounded-lg border-2 border-orange-400 dark:border-orange-600 shadow-lg'>
                        <GripVertical className='h-5 w-5 text-gray-400' />
                        <span className='text-3xl'>{category.icon}</span>
                        <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-50 uppercase tracking-wide'>
                          {category.name}
                        </h2>
                      </div>
                    );
                  })()}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* 미분류 메뉴 */}
        {uncategorizedMenus.length > 0 && (
          <Card className='border-dashed border-gray-300 dark:border-gray-700'>
            <CardHeader className='pb-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <span className='text-3xl'>📋</span>
                  <div>
                    <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-50 uppercase tracking-wide'>
                      미분류
                    </h2>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      {uncategorizedMenus.length}개 메뉴
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'>
                {uncategorizedMenus.map((menu) => (
                  <div
                    key={menu.menu_id}
                    className='group relative cursor-pointer'
                    onClick={() => handleMenuClick(menu)}
                  >
                    <div className='aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-md transition-shadow'>
                      {menu.image_url ? (
                        <img
                          src={menu.image_url}
                          alt={menu.menu_name}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center text-4xl text-gray-400'>
                          🍽️
                        </div>
                      )}
                    </div>
                    <div className='mt-2 text-center'>
                      <p className='font-medium text-sm truncate'>
                        {menu.menu_name}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {formatPrice(menu.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* 다이얼로그들 */}
      {editingRecipe && (
        <EditRecipeDialog
          open={!!editingRecipe}
          onOpenChange={(open) => !open && setEditingRecipe(null)}
          menuId={editingRecipe.menuId}
          menuName={editingRecipe.menuName}
          ingredients={editingRecipe.ingredients}
          imageUrl={editingRecipe.imageUrl}
          allIngredients={allIngredients}
          categories={menuCategories.map((cat) => ({ id: cat.id, name: cat.name }))}
          currentCategoryId={editingRecipe.categoryId}
          menuOptions={optionsByMenu[editingRecipe.menuId] || []}
        />
      )}

      {(addMenuCategoryId || addMenuOpen) && (
        <AddMenuDialog
          open={!!addMenuCategoryId || addMenuOpen}
          onOpenChange={(open) => {
            if (!open) {
              setAddMenuCategoryId(null);
              setAddMenuOpen(false);
            }
          }}
          allIngredients={allIngredients}
          categoryId={addMenuCategoryId || undefined}
        />
      )}

      <AddCategoryDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        categoryType={addCategoryType}
      />

      {editingCategory && (
        <EditCategoryDialog
          open={!!editingCategory}
          onOpenChange={(open) => !open && setEditingCategory(null)}
          category={editingCategory}
        />
      )}

      {editingOption && (
        <EditOptionDialog
          open={!!editingOption}
          onOpenChange={(open) => !open && setEditingOption(null)}
          option={editingOption}
        />
      )}

      {/* 메뉴 업로드 다이얼로그 */}
      <MenuUploadDialog
        open={menuUploadOpen}
        onOpenChange={setMenuUploadOpen}
        categories={menuCategories.map((cat) => ({ id: cat.id, name: cat.name }))}
      />

      {/* 옵션 추가 다이얼로그 */}
      <AddOptionDialog
        open={!!addOptionCategoryId}
        onOpenChange={(open) => !open && setAddOptionCategoryId(null)}
        categories={menuCategories.map((cat) => ({ id: cat.id, name: cat.name }))}
        menus={menus.map((m) => ({ menu_id: m.menu_id, menu_name: m.menu_name, category_id: m.category_id }))}
        preselectedCategoryId={addOptionCategoryId || undefined}
        optionsByCategory={optionsByCategory}
        optionsByMenu={optionsByMenu}
      />

      {/* 카테고리 삭제 확인 모달 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>카테고리 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete?.menuCount && categoryToDelete.menuCount > 0
                ? `이 카테고리와 포함된 ${categoryToDelete.menuCount}개의 메뉴를 모두 삭제하시겠습니까? 삭제된 메뉴는 복구할 수 없습니다.`
                : '이 카테고리를 삭제하시겠습니까?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className='bg-destructive text-white hover:bg-destructive/90'
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
