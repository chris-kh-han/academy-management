export type Sale = {
  menu_name: string;
  total_sales: number;
  sales_count: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type MenuItem = {
  name: string;
  category: string;
  price: number;
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
