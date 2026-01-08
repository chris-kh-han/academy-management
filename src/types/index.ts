// ========== 브랜드/지점 관련 타입 ==========

// 브랜드 멤버 역할 (본사)
export type BrandRole = 'owner' | 'admin' | 'manager' | 'viewer';

// 지점 멤버 역할
export type BranchRole = 'manager' | 'staff' | 'viewer';

// 브랜드 (본사/프랜차이즈)
export type Brand = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website?: string;
  owner_user_id: string;
  settings?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

// 지점 (매장)
export type Branch = {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  business_hours_start: string;
  business_hours_end: string;
  timezone: string;
  manager_user_id?: string;
  is_active: boolean;
  settings?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  // joined data
  brand?: Brand;
};

// 브랜드 멤버 (본사 직원)
export type BrandMember = {
  id: string;
  brand_id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  role: BrandRole;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
  // joined data
  brand?: Brand;
};

// 지점 멤버 (지점 직원)
export type BranchMember = {
  id: string;
  branch_id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  role: BranchRole;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
  // joined data
  branch?: Branch;
};

// 현재 사용자의 브랜드/지점 컨텍스트
export type UserContext = {
  userId: string;
  currentBrand?: Brand;
  currentBranch?: Branch;
  userRole?: BrandRole | BranchRole;
  availableBranches: Branch[];
};

export type Sale = {
  menu_name: string;
  total_sales: number;
  sales_count: number;
  branch_id?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

// 메뉴 판매 기록 (menu_sales 테이블)
export type MenuSale = {
  id?: number;
  menu_id: string;
  branch_id: string;
  sold_at: string; // 판매일자 (YYYY-MM-DD)
  sales_count: number; // 판매수량
  price: number; // 단가
  total_sales: number; // 총액
  created_at?: string;
  updated_at?: string;
  // joined data
  menu_name?: string;
};

// CSV 업로드용 판매 데이터
export type SalesUploadRow = {
  sold_at: string; // 판매일자
  menu_id?: string; // 메뉴ID (자동 매칭)
  menu_name: string; // 메뉴명 (메인 식별자)
  sales_count: number; // 판매수량
  price?: number; // 단가 (선택)
  total_sales?: number; // 총액 (선택)
  transaction_id?: string; // 거래ID (선택)
  isValid?: boolean; // 검증 결과
  isNewMenu?: boolean; // 새 메뉴 여부
  error?: string; // 오류 메시지
};

// CSV 컬럼 매핑 설정
export type CSVMapping = {
  id?: string;
  branch_id: string;
  mapping_name: string;
  date_column?: string;
  menu_name_column?: string;
  quantity_column?: string;
  price_column?: string;
  total_column?: string;
  transaction_id_column?: string;
  date_format?: string;
  created_at?: string;
  updated_at?: string;
};

export type MenuItem = {
  name: string;
  category: string;
  price: number;
  branch_id?: string;
  image_url?: string;
};

// 메뉴 카테고리 타입 (메뉴용 vs 옵션용)
export type CategoryType = 'menu' | 'option';

// 메뉴 카테고리 (menu_categories 테이블)
export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  category_type: CategoryType;
  branch_id?: string;
  created_at?: string;
  updated_at?: string;
};

// 메뉴 카테고리 입력 타입
export type MenuCategoryInput = {
  name: string;
  slug: string;
  icon: string;
  sort_order?: number;
  is_active?: boolean;
  category_type: CategoryType;
  branch_id?: string;
};

// 메뉴 옵션 카테고리
export type MenuOptionCategory = 'edge' | 'topping' | 'beverage';

// 메뉴 옵션
export type MenuOption = {
  option_id: number;
  option_name: string;
  option_category: MenuOptionCategory;
  additional_price: number;
  image_url?: string;
  is_active: boolean;
  branch_id?: string;
  created_at?: string;
  updated_at?: string;
};

// Settings 타입들
export type BusinessSettings = {
  id?: number;
  business_name: string;
  address: string;
  phone: string;
  email: string;
  business_hours_start: string;
  business_hours_end: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
};

export type InventorySettings = {
  id?: number;
  low_stock_threshold: number;
  default_unit: string;
  auto_reorder_enabled: boolean;
  auto_reorder_quantity: number;
  created_at?: string;
  updated_at?: string;
};

export type RecipeSettings = {
  id?: number;
  default_margin_rate: number;
  price_rounding_unit: number;
  cost_calculation_method: 'average' | 'fifo' | 'lifo';
  created_at?: string;
  updated_at?: string;
};

export type ReportSettings = {
  id?: number;
  default_period: 'daily' | 'weekly' | 'monthly';
  auto_generate_enabled: boolean;
  auto_generate_frequency: 'daily' | 'weekly' | 'monthly';
  export_format: 'pdf' | 'excel' | 'csv';
  created_at?: string;
  updated_at?: string;
};

export type NotificationSettings = {
  id?: number;
  email_notifications: boolean;
  push_notifications: boolean;
  low_stock_alert: boolean;
  daily_sales_report: boolean;
  weekly_summary: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SystemSettings = {
  id?: number;
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en' | 'ja';
  items_per_page: number;
  currency: string;
  timezone: string;
  created_at?: string;
  updated_at?: string;
};

export type UserRole = 'admin' | 'manager' | 'staff' | 'viewer';

export type UserPermission = {
  id?: number;
  user_id: string;
  user_email: string;
  user_name: string;
  role: UserRole;
  can_access_dashboard: boolean;
  can_access_inventory: boolean;
  can_access_recipes: boolean;
  can_access_reports: boolean;
  can_access_settings: boolean;
  created_at?: string;
  updated_at?: string;
};

// 급여/근태 관련 타입
export type SalaryType = 'hourly' | 'monthly';

export type SalarySetting = {
  id?: number;
  user_id: string;
  salary_type: SalaryType;
  hourly_rate: number;
  monthly_salary?: number;
  overtime_rate: number;
  night_rate: number;
  weekend_rate: number;
  created_at?: string;
  updated_at?: string;
};

export type WorkRecordStatus = 'pending' | 'approved' | 'rejected';

export type WorkRecord = {
  id?: number;
  user_id: string;
  work_date: string;
  clock_in: string;
  clock_out?: string;
  break_minutes: number;
  work_minutes?: number;
  overtime_minutes: number;
  is_holiday: boolean;
  note?: string;
  status: WorkRecordStatus;
  created_at?: string;
  updated_at?: string;
  // joined data
  user_name?: string;
  user_email?: string;
};

export type PayrollStatus = 'draft' | 'confirmed' | 'paid';

// 재고 이동 관련 타입
export type MovementType = 'in' | 'out' | 'waste' | 'adjustment';

export type StockMovement = {
  id?: number;
  ingredient_id: number;
  movement_type: MovementType;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  reason?: string;
  reference_no?: string;
  supplier?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
  // joined data
  ingredient_name?: string;
  ingredient_unit?: string;
};

export type StockMovementInput = {
  ingredient_id: string;
  movement_type: MovementType;
  quantity: number;
  unit_price?: number;
  reason?: string;
  reference_no?: string;
  supplier?: string;
  note?: string;
};

export type Payroll = {
  id?: number;
  user_id: string;
  pay_period_start: string;
  pay_period_end: string;
  total_work_days: number;
  total_work_minutes: number;
  overtime_minutes: number;
  base_pay: number;
  overtime_pay: number;
  night_pay: number;
  weekend_pay: number;
  bonus: number;
  deductions: number;
  net_pay: number;
  status: PayrollStatus;
  paid_at?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
  // joined data
  user_name?: string;
  user_email?: string;
};
