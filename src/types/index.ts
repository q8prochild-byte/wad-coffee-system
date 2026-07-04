export type Unit = 'حبة' | 'كيلو' | 'كرتون' | 'خيشة';

export interface Product {
  id?: number;
  name: string;
  unit: Unit;
  costPrice: number;
  salePrice: number;
  profit: number;
  createdAt: string;
}

export interface Sale {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  date: string;
  createdAt: string;
}

export interface Settings {
  id?: number;
  shopName: string;
  currency: string;
}

export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  weekProfit: number;
  monthProfit: number;
  totalProducts: number;
  bestSellingProduct: string;
  highestProfitProduct: string;
  todaySalesCount: number;
}

export interface SaleFormData {
  productId: number;
  quantity: number;
  salePrice: number;
}

export interface ProductFormData {
  name: string;
  unit: Unit;
  costPrice: number;
  salePrice: number;
}

export interface ReportData {
  date: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  salesCount: number;
}
