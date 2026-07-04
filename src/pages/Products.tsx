import { useState, useEffect, useCallback } from 'react';
import type { Product, ProductFormData, Unit } from '../types';
import { getAllProducts, addProduct, updateProduct, deleteProduct } from '../services/db';
import { formatCurrency } from '../utils/formatUtils';
import { formatDate } from '../utils/dateUtils';
import { useSettings } from '../hooks/useSettingsContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const UNITS: Unit[] = ['حبة', 'كيلو', 'كرتون'];

const emptyForm: ProductFormData = { name: '', unit: 'حبة', costPrice: 0, salePrice: 0 };

import DecimalInput from '../components/ui/DecimalInput';

function ProductForm({
  value,
  onChange,
  currency,
}: {
  value: ProductFormData;
  onChange: (v: ProductFormData) => void;
  currency: string;
}) {
  const profit = (value.salePrice || 0) - (value.costPrice || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="form-group">
        <label className="form-label">اسم المنتج</label>
        <input
          className="form-control"
          placeholder="مثال: قهوة عربية"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          autoFocus
        />
      </div>
      <div className="form-group">
        <label className="form-label">الوحدة</label>
        <select
          className="form-control"
          value={value.unit}
          onChange={(e) => onChange({ ...value, unit: e.target.value as Unit })}
        >
          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">تكلفة الشراء ({currency})</label>
          <DecimalInput
            value={value.costPrice}
            onChange={(v) => onChange({ ...value, costPrice: v })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">سعر البيع ({currency})</label>
          <DecimalInput
            value={value.salePrice}
            onChange={(v) => onChange({ ...value, salePrice: v })}
          />
        </div>
      </div>
      <div className="summary-row">
        <div className="summary-item">
          <span className="summary-item-label">الربح المحسوب</span>
          <span className={`summary-item-value ${profit >= 0 ? 'green' : ''}`}>
            {formatCurrency(profit, currency)}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-item-label">هامش الربح</span>
          <span className="summary-item-value">
            {value.salePrice > 0 ? ((profit / value.salePrice) * 100).toFixed(1) : '0'}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof Product>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const data = await getAllProducts();
    setProducts(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), 'ar');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    setFiltered(result);
  }, [products, search, sortKey, sortDir]);

  function openAdd() {
    setEditProduct(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setForm({ name: p.name, unit: p.unit, costPrice: p.costPrice, salePrice: p.salePrice });
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('يرجى إدخال اسم المنتج'); return; }
    if (form.costPrice < 0 || form.salePrice < 0) { setError('يرجى إدخال أسعار صحيحة'); return; }
    setSaving(true);
    setError('');
    try {
      const profit = form.salePrice - form.costPrice;
      if (editProduct) {
        await updateProduct({ ...editProduct, ...form, profit });
      } else {
        await addProduct({ ...form, profit, createdAt: new Date().toISOString() });
      }
      await load();
      setModalOpen(false);
    } catch {
      setError('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      await load();
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function toggleSort(key: keyof Product) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  const sortIcon = (key: keyof Product) =>
    sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">المنتجات</h1>
          <p className="page-subtitle">{products.length} منتج مسجل</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>➕ إضافة منتج</button>
      </div>

      <div className="card">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              className="form-control search-input"
              placeholder="ابحث عن منتج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-control"
            style={{ width: 160 }}
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as keyof Product)}
          >
            <option value="createdAt">ترتيب: التاريخ</option>
            <option value="name">ترتيب: الاسم</option>
            <option value="profit">ترتيب: الربح</option>
            <option value="salePrice">ترتيب: السعر</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-text">
              {search ? 'لا توجد نتائج للبحث' : 'لا توجد منتجات بعد، أضف منتجًا جديدًا'}
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('name')}>الاسم{sortIcon('name')}</th>
                  <th>الوحدة</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('costPrice')}>تكلفة الشراء{sortIcon('costPrice')}</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('salePrice')}>سعر البيع{sortIcon('salePrice')}</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('profit')}>الربح{sortIcon('profit')}</th>
                  <th>تاريخ الإضافة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="badge badge-primary">{p.unit}</span></td>
                    <td className="muted">{formatCurrency(p.costPrice, settings.currency)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(p.salePrice, settings.currency)}</td>
                    <td>
                      <span className={p.profit >= 0 ? 'profit-positive' : 'profit-negative'}>
                        {formatCurrency(p.profit, settings.currency)}
                      </span>
                    </td>
                    <td className="muted">{formatDate(p.createdAt.split('T')[0])}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏️ تعديل</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(p)}>🗑️ حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
        footer={
          <>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '⏳ جاري الحفظ...' : '💾 حفظ'}
            </button>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>إلغاء</button>
          </>
        }
      >
        <ProductForm value={form} onChange={setForm} currency={settings.currency} />
        {error && <div className="alert alert-danger">⚠️ {error}</div>}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف المنتج"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        loading={deleting}
      />
    </div>
  );
}
