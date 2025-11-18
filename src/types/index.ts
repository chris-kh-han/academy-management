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
