'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EditRecipeDialog } from './EditRecipeDialog';

type Ingredient = {
  ingredient_id: string;
  name: string | undefined;
  category: string | undefined;
  qty: number | null;
  unit: string | undefined;
  loss_rate: number | null;
};

type RecipeRow = {
  menuId: string;
  menuName: string;
  ingredients: Ingredient[];
};

type AllIngredient = {
  ingredient_id: string;
  ingredient_name: string;
  category: string;
};

type RecipesProps = {
  recipes: Record<
    string,
    {
      menuName: string;
      ingredients: Ingredient[];
    }
  >;
  allIngredients: AllIngredient[];
};

export function RecipesTable({ recipes, allIngredients }: RecipesProps) {
  const [editingRecipe, setEditingRecipe] = React.useState<RecipeRow | null>(
    null,
  );

  const data: RecipeRow[] = React.useMemo(() => {
    return Object.entries(recipes).map(([menuId, value]) => ({
      menuId,
      menuName: value.menuName,
      ingredients: value.ingredients,
    }));
  }, [recipes]);

  const columns: ColumnDef<RecipeRow>[] = React.useMemo(
    () => [
      {
        accessorKey: 'menuName',
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            메뉴 이름
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        ),
        cell: ({ row }) => (
          <div className='font-medium'>{row.getValue('menuName')}</div>
        ),
      },
      {
        accessorKey: 'ingredients',
        header: '재료 목록',
        cell: ({ row }) => {
          const ingredients = row.getValue('ingredients') as Ingredient[];
          const visibleCount = 3;
          const hasMore = ingredients.length > visibleCount;
          const visibleIngredients = ingredients.slice(0, visibleCount);

          return (
            <div className='group relative'>
              <ul className='list-disc pl-4'>
                {visibleIngredients.map((ing, idx) => (
                  <li key={idx}>
                    {ing.name ?? '알 수 없음'} - {ing.qty ?? 0}
                    {ing.unit ?? ''}
                  </li>
                ))}
              </ul>
              {hasMore && (
                <>
                  <span className='text-sm text-muted-foreground cursor-pointer'>
                    +{ingredients.length - visibleCount}개 더보기
                  </span>
                  <div className='absolute left-0 top-full z-10 hidden w-max max-w-xs rounded-md border bg-white p-2 shadow-lg group-hover:block'>
                    <ul className='list-disc pl-4'>
                      {ingredients.map((ing, idx) => (
                        <li key={idx}>
                          {ing.name ?? '알 수 없음'} - {ing.qty ?? 0}
                          {ing.unit ?? ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '수정',
        cell: ({ row }) => {
          const recipe = row.original;
          return (
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setEditingRecipe(recipe)}
            >
              <Pencil className='h-4 w-4' />
            </Button>
          );
        },
      },
    ],
    [],
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className='w-full'>
      <div className='flex items-center py-4'>
        <Input
          placeholder='메뉴 이름 검색...'
          value={
            (table.getColumn('menuName')?.getFilterValue() as string) ?? ''
          }
          onChange={(event) =>
            table.getColumn('menuName')?.setFilterValue(event.target.value)
          }
          className='max-w-sm'
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' className='ml-auto'>
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className='capitalize'
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className='overflow-hidden rounded-md border bg-white'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-end space-x-2 py-4'>
        <div className='text-muted-foreground flex-1 text-sm'>
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className='space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {editingRecipe && (
        <EditRecipeDialog
          open={!!editingRecipe}
          onOpenChange={(open) => !open && setEditingRecipe(null)}
          menuId={editingRecipe.menuId}
          menuName={editingRecipe.menuName}
          ingredients={editingRecipe.ingredients}
          allIngredients={allIngredients}
        />
      )}
    </div>
  );
}
