import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Product, Sale, Settings } from '../types';

interface CoffeeDB extends DBSchema {
  products: {
    key: number;
    value: Product;
    indexes: { 'by-name': string };
  };
  sales: {
    key: number;
    value: Sale;
    indexes: { 'by-date': string; 'by-product': number };
  };
  settings: {
    key: number;
    value: Settings;
  };
}

let dbInstance: IDBPDatabase<CoffeeDB> | null = null;

async function getDB(): Promise<IDBPDatabase<CoffeeDB>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<CoffeeDB>('coffee-pos-db', 1, {
    upgrade(db) {
      const productStore = db.createObjectStore('products', {
        keyPath: 'id',
        autoIncrement: true,
      });
      productStore.createIndex('by-name', 'name');

      const saleStore = db.createObjectStore('sales', {
        keyPath: 'id',
        autoIncrement: true,
      });
      saleStore.createIndex('by-date', 'date');
      saleStore.createIndex('by-product', 'productId');

      db.createObjectStore('settings', {
        keyPath: 'id',
        autoIncrement: true,
      });
    },
  });
  return dbInstance;
}

// Products
export async function getAllProducts(): Promise<Product[]> {
  const db = await getDB();
  return db.getAll('products');
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<number> {
  const db = await getDB();
  return db.add('products', product as Product);
}

export async function updateProduct(product: Product): Promise<void> {
  const db = await getDB();
  await db.put('products', product);
}

export async function deleteProduct(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('products', id);
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const db = await getDB();
  return db.get('products', id);
}

// Sales
export async function getAllSales(): Promise<Sale[]> {
  const db = await getDB();
  return db.getAll('sales');
}

export async function addSale(sale: Omit<Sale, 'id'>): Promise<number> {
  const db = await getDB();
  return db.add('sales', sale as Sale);
}

export async function getSalesByDate(date: string): Promise<Sale[]> {
  const db = await getDB();
  return db.getAllFromIndex('sales', 'by-date', date);
}

export async function getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
  const db = await getDB();
  const all = await db.getAll('sales');
  return all.filter((s) => s.date >= startDate && s.date <= endDate);
}

export async function deleteSale(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('sales', id);
}

// Settings
export async function getSettings(): Promise<Settings> {
  const db = await getDB();
  const all = await db.getAll('settings');
  if (all.length > 0) return all[0];
  const defaultSettings: Settings = { shopName: 'محل القهوة', currency: 'د.ك' };
  const id = await db.add('settings', defaultSettings as Settings);
  return { ...defaultSettings, id };
}

export async function updateSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings);
}
