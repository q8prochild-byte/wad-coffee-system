import { supabase } from './supabaseClient';
import type { Product, Sale, Settings } from '../types';

// ===== تحويل بين أسماء أعمدة قاعدة البيانات (snake_case) وأنواع التطبيق (camelCase) =====

interface ProductRow {
  id: number;
  name: string;
  unit: string;
  cost_price: number;
  sale_price: number;
  profit: number;
  created_at: string;
}

interface SaleRow {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  cost_price: number;
  sale_price: number;
  total_cost: number;
  total_revenue: number;
  total_profit: number;
  date: string;
  created_at: string;
}

interface SettingsRow {
  id: number;
  shop_name: string;
  currency: string;
}

function productFromRow(r: ProductRow): Product {
  return {
    id: r.id,
    name: r.name,
    unit: r.unit as Product['unit'],
    costPrice: Number(r.cost_price),
    salePrice: Number(r.sale_price),
    profit: Number(r.profit),
    createdAt: r.created_at,
  };
}

function saleFromRow(r: SaleRow): Sale {
  return {
    id: r.id,
    productId: r.product_id,
    productName: r.product_name,
    quantity: Number(r.quantity),
    costPrice: Number(r.cost_price),
    salePrice: Number(r.sale_price),
    totalCost: Number(r.total_cost),
    totalRevenue: Number(r.total_revenue),
    totalProfit: Number(r.total_profit),
    date: r.date,
    createdAt: r.created_at,
  };
}

function settingsFromRow(r: SettingsRow): Settings {
  return {
    id: r.id,
    shopName: r.shop_name,
    currency: r.currency,
  };
}

// ===== المنتجات =====

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
  if (error) throw error;
  return (data as ProductRow[]).map(productFromRow);
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<number> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: product.name,
      unit: product.unit,
      cost_price: product.costPrice,
      sale_price: product.salePrice,
      profit: product.profit,
      created_at: product.createdAt,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateProduct(product: Product): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({
      name: product.name,
      unit: product.unit,
      cost_price: product.costPrice,
      sale_price: product.salePrice,
      profit: product.profit,
    })
    .eq('id', product.id);
  if (error) throw error;
}

export async function deleteProduct(id: number): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? productFromRow(data as ProductRow) : undefined;
}

// ===== المبيعات =====

export async function getAllSales(): Promise<Sale[]> {
  const { data, error } = await supabase.from('sales').select('*').order('id', { ascending: true });
  if (error) throw error;
  return (data as SaleRow[]).map(saleFromRow);
}

export async function addSale(sale: Omit<Sale, 'id'>): Promise<number> {
  const { data, error } = await supabase
    .from('sales')
    .insert({
      product_id: sale.productId,
      product_name: sale.productName,
      quantity: sale.quantity,
      cost_price: sale.costPrice,
      sale_price: sale.salePrice,
      total_cost: sale.totalCost,
      total_revenue: sale.totalRevenue,
      total_profit: sale.totalProfit,
      date: sale.date,
      created_at: sale.createdAt,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function getSalesByDate(date: string): Promise<Sale[]> {
  const { data, error } = await supabase.from('sales').select('*').eq('date', date);
  if (error) throw error;
  return (data as SaleRow[]).map(saleFromRow);
}

export async function getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate);
  if (error) throw error;
  return (data as SaleRow[]).map(saleFromRow);
}

export async function updateSale(sale: Sale): Promise<void> {
  const { error } = await supabase
    .from('sales')
    .update({
      quantity: sale.quantity,
      sale_price: sale.salePrice,
      total_cost: sale.totalCost,
      total_revenue: sale.totalRevenue,
      total_profit: sale.totalProfit,
      date: sale.date,
    })
    .eq('id', sale.id);
  if (error) throw error;
}

export async function deleteSale(id: number): Promise<void> {
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) throw error;
}

// ===== الإعدادات =====

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase.from('settings').select('*').limit(1).maybeSingle();
  if (error) throw error;
  if (data) return settingsFromRow(data as SettingsRow);

  const defaultSettings = { shop_name: 'محل القهوة', currency: 'د.ك' };
  const { data: created, error: insertError } = await supabase
    .from('settings')
    .insert(defaultSettings)
    .select('*')
    .single();
  if (insertError) throw insertError;
  return settingsFromRow(created as SettingsRow);
}

export async function updateSettings(settings: Settings): Promise<void> {
  if (settings.id) {
    const { error } = await supabase
      .from('settings')
      .update({ shop_name: settings.shopName, currency: settings.currency })
      .eq('id', settings.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('settings')
      .insert({ shop_name: settings.shopName, currency: settings.currency });
    if (error) throw error;
  }
}

// ===== النسخ الاحتياطي =====

export interface BackupData {
  version: number;
  exportedAt: string;
  products: Product[];
  sales: Sale[];
  settings: Settings[];
}

export async function exportBackup(): Promise<BackupData> {
  const [products, sales, settingsRow] = await Promise.all([
    getAllProducts(),
    getAllSales(),
    getSettings(),
  ]);
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    products,
    sales,
    settings: [settingsRow],
  };
}

export async function importBackup(data: BackupData): Promise<void> {
  // حذف كل البيانات الحالية أولًا
  await supabase.from('sales').delete().neq('id', 0);
  await supabase.from('products').delete().neq('id', 0);
  await supabase.from('settings').delete().neq('id', 0);

  if (data.products.length > 0) {
    const { error } = await supabase.from('products').insert(
      data.products.map((p) => ({
        name: p.name,
        unit: p.unit,
        cost_price: p.costPrice,
        sale_price: p.salePrice,
        profit: p.profit,
        created_at: p.createdAt,
      }))
    );
    if (error) throw error;
  }

  if (data.sales.length > 0) {
    const { error } = await supabase.from('sales').insert(
      data.sales.map((s) => ({
        product_id: s.productId,
        product_name: s.productName,
        quantity: s.quantity,
        cost_price: s.costPrice,
        sale_price: s.salePrice,
        total_cost: s.totalCost,
        total_revenue: s.totalRevenue,
        total_profit: s.totalProfit,
        date: s.date,
        created_at: s.createdAt,
      }))
    );
    if (error) throw error;
  }

  if (data.settings.length > 0) {
    const s = data.settings[0];
    const { error } = await supabase
      .from('settings')
      .insert({ shop_name: s.shopName, currency: s.currency });
    if (error) throw error;
  }
}
