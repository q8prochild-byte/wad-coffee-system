import { useState, useEffect, useCallback } from 'react';
import type { Product, Sale, SaleFormData } from '../types';
import { getAllProducts, getAllSales, addSale, updateSale, deleteSale } from '../services/db';
import { getTodayDate, formatDate } from '../utils/dateUtils';
import { formatCurrency, formatQuantity } from '../utils/formatUtils';
import { useSettings } from '../hooks/useSettingsContext';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DecimalInput from '../components/ui/DecimalInput';

type SaleMode = 'quantity' | 'amount';

const emptyForm: SaleFormData = { productId: 0, quantity: 1, salePrice: 0 };

export default function Sales() {
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [dateSales, setDateSales] = useState<Sale[]>([]);
  const [form, setForm] = useState<SaleFormData>(emptyForm);
  const [saleDate, setSaleDate] = useState<string>(getTodayDate());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saleMode, setSaleMode] = useState<SaleMode>('quantity');
  const [customerAmount, setCustomerAmount] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const load = useCallback(async (dateFilter: string) => {
    const [prods, sales] = await Promise.all([getAllProducts(), getAllSales()]);
    setProducts(prods);
    setDateSales(sales.filter((s) => s.date === dateFilter).reverse());
  }, []);

  useEffect(() => { load(saleDate); }, [load, saleDate]);

  function handleProductChange(productId: number) {
    const p = products.find((pr) => pr.id === productId) ?? null;
    setSelectedProduct(p);
    setForm((f) => ({ ...f, productId, salePrice: p?.salePrice ?? 0 }));
    setCustomerAmount(0);
  }

  function handleModeChange(mode: SaleMode) {
    setSaleMode(mode);
    setCustomerAmount(0);
    setForm((f) => ({ ...f, quantity: 1 }));
  }

  // حساب الكمية من المبلغ المدفوع
  const calcQuantityFromAmount = () => {
    if (!selectedProduct || !customerAmount || selectedProduct.salePrice <= 0) return 0;
    return customerAmount / selectedProduct.salePrice;
  };

  // الحسابات الرئيسية
  const computedQuantity = saleMode === 'amount' ? calcQuantityFromAmount() : (form.quantity || 0);
  const totalRevenue = saleMode === 'amount' ? (customerAmount || 0) : (form.salePrice || 0) * (form.quantity || 0);
  const totalCost = selectedProduct ? selectedProduct.costPrice * computedQuantity : 0;
  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  function openEditSale(sale: Sale) {
    const p = products.find((pr) => pr.id === sale.productId) ?? null;
    setSelectedProduct(p);
    setSaleMode('quantity');
    setCustomerAmount(0);
    setForm({ productId: sale.productId, quantity: sale.quantity, salePrice: sale.salePrice });
    setEditingSale(sale);
    setError('');
    setSuccess('');
  }

  function cancelEdit() {
    setEditingSale(null);
    setForm(emptyForm);
    setSelectedProduct(null);
    setCustomerAmount(0);
    setError('');
  }

  async function handleSave() {
    if (!form.productId) { setError('يرجى اختيار المنتج'); return; }
    if (!selectedProduct) { setError('المنتج غير موجود'); return; }

    if (saleMode === 'quantity') {
      if (form.quantity <= 0) { setError('يرجى إدخال كمية صحيحة'); return; }
      if (form.salePrice <= 0) { setError('يرجى إدخال سعر البيع'); return; }
    } else {
      if (customerAmount <= 0) { setError('يرجى إدخال المبلغ المدفوع'); return; }
      if (selectedProduct.salePrice <= 0) { setError('سعر البيع في المنتج يجب أن يكون أكبر من صفر'); return; }
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (editingSale) {
        await updateSale({
          ...editingSale,
          quantity: computedQuantity,
          salePrice: saleMode === 'amount' ? selectedProduct.salePrice : form.salePrice,
          totalCost,
          totalRevenue,
          totalProfit,
          date: saleDate,
        });
        setSuccess(`✅ تم تحديث عملية البيع بنجاح`);
        setEditingSale(null);
      } else {
        await addSale({
          productId: selectedProduct.id!,
          productName: selectedProduct.name,
          quantity: computedQuantity,
          costPrice: selectedProduct.costPrice,
          salePrice: saleMode === 'amount' ? selectedProduct.salePrice : form.salePrice,
          totalCost,
          totalRevenue,
          totalProfit,
          date: saleDate,
          createdAt: new Date().toISOString(),
        });
        setSuccess(`✅ تم تسجيل بيع ${selectedProduct.name} بنجاح — الربح: ${formatCurrency(totalProfit, settings.currency)}`);
      }
      setForm(emptyForm);
      setSelectedProduct(null);
      setCustomerAmount(0);
      await load(saleDate);
      setTimeout(() => setSuccess(''), 5000);
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
      await deleteSale(deleteTarget.id);
      await load(saleDate);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const todayRevenue = dateSales.reduce((a, s) => a + s.totalRevenue, 0);
  const todayProfit = dateSales.reduce((a, s) => a + s.totalProfit, 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">المبيعات اليومية</h1>
          <p className="page-subtitle">تسجيل مبيعات اليوم</p>
        </div>
      </div>

      <div className="sales-layout">
        {/* Form */}
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 16 }}>
            {editingSale ? '✏️ تعديل عملية بيع' : '➕ تسجيل عملية بيع'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* تاريخ البيع */}
            <div className="form-group">
              <label className="form-label">تاريخ البيع</label>
              <input
                type="date"
                className="form-control"
                value={saleDate}
                max={getTodayDate()}
                onChange={(e) => setSaleDate(e.target.value || getTodayDate())}
              />
            </div>

            {/* اختيار المنتج */}
            <div className="form-group">
              <label className="form-label">المنتج</label>
              <select
                className="form-control"
                value={form.productId || ''}
                onChange={(e) => handleProductChange(parseInt(e.target.value))}
                disabled={!!editingSale}
              >
                <option value="">-- اختر المنتج --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                ))}
              </select>
            </div>

            {/* طريقة البيع */}
            {!editingSale && (
            <div className="form-group">
              <label className="form-label">طريقة البيع</label>
              <div className="tabs" style={{ marginBottom: 0 }}>
                <button
                  className={`tab-btn${saleMode === 'quantity' ? ' active' : ''}`}
                  onClick={() => handleModeChange('quantity')}
                >
                  📦 بالكمية
                </button>
                <button
                  className={`tab-btn${saleMode === 'amount' ? ' active' : ''}`}
                  onClick={() => handleModeChange('amount')}
                >
                  💵 بالمبلغ
                </button>
              </div>
            </div>
            )}

            {/* بالكمية */}
            {saleMode === 'quantity' && (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">الكمية</label>
                  <DecimalInput
                    value={form.quantity}
                    onChange={(v) => setForm((f) => ({ ...f, quantity: v }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">سعر البيع ({settings.currency})</label>
                  <DecimalInput
                    value={form.salePrice}
                    onChange={(v) => setForm((f) => ({ ...f, salePrice: v }))}
                  />
                </div>
              </div>
            )}

            {/* بالمبلغ */}
            {saleMode === 'amount' && (
              <div className="form-group">
                <label className="form-label">المبلغ الذي دفعه الزبون ({settings.currency})</label>
                <DecimalInput
                  value={customerAmount}
                  onChange={setCustomerAmount}
                  style={{ fontSize: 18, fontWeight: 700, padding: '12px 14px' }}
                  placeholder="مثال: 1.000"
                  autoFocus
                />
                {selectedProduct && customerAmount > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    الكمية المحسوبة: {formatQuantity(computedQuantity)} {selectedProduct.unit}
                    {' '}(السعر {formatCurrency(selectedProduct.salePrice, settings.currency)}/{selectedProduct.unit})
                  </span>
                )}
              </div>
            )}

            {/* ملخص الحسابات */}
            {selectedProduct && (computedQuantity > 0 || totalRevenue > 0) && (
              <div style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 2 }}>
                  📊 ملخص العملية
                </div>
                <div className="responsive-grid-2" style={{ gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>الكمية</div>
                    <div style={{ fontWeight: 700 }}>{formatQuantity(computedQuantity)} {selectedProduct.unit}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>التكلفة</div>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(totalCost, settings.currency)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>الإيراد</div>
                    <div style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{formatCurrency(totalRevenue, settings.currency)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>هامش الربح</div>
                    <div style={{ fontWeight: 700 }}>{profitMargin.toFixed(1)}%</div>
                  </div>
                </div>
                <div style={{
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>صافي الربح</span>
                  <span style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: totalProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                  }}>
                    {formatCurrency(totalProfit, settings.currency)}
                  </span>
                </div>
              </div>
            )}

            {error && <div className="alert alert-danger">⚠️ {error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-success"
                onClick={handleSave}
                disabled={saving}
                style={{ flex: 1, padding: '12px', fontSize: 15 }}
              >
                {saving ? '⏳ جاري الحفظ...' : editingSale ? '💾 تحديث العملية' : '💾 تسجيل البيع'}
              </button>
              {editingSale && (
                <button
                  className="btn btn-secondary"
                  onClick={cancelEdit}
                  disabled={saving}
                  style={{ padding: '12px 18px' }}
                >
                  إلغاء
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Today's sales */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 مبيعات {formatDate(saleDate)} ({dateSales.length})</span>
          </div>

          {dateSales.length > 0 && (
            <div className="summary-row" style={{ marginBottom: 16 }}>
              <div className="summary-item">
                <span className="summary-item-label">إجمالي الإيرادات</span>
                <span className="summary-item-value accent">{formatCurrency(todayRevenue, settings.currency)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-item-label">إجمالي الأرباح</span>
                <span className="summary-item-value green">{formatCurrency(todayProfit, settings.currency)}</span>
              </div>
            </div>
          )}

          {dateSales.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <div className="empty-state-text">لا توجد مبيعات مسجلة بهذا التاريخ بعد</div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>الإيراد</th>
                    <th>التكلفة</th>
                    <th>الربح</th>
                    <th>الوقت</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {dateSales.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.productName}</td>
                      <td className="muted">{formatQuantity(s.quantity)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--color-accent)' }}>
                        {formatCurrency(s.totalRevenue, settings.currency)}
                      </td>
                      <td className="muted">{formatCurrency(s.totalCost, settings.currency)}</td>
                      <td>
                        <span className={s.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}>
                          {formatCurrency(s.totalProfit, settings.currency)}
                        </span>
                      </td>
                      <td className="muted">
                        {new Date(s.createdAt).toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEditSale(s)} title="تعديل">✏️</button>
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteTarget(s)} title="حذف">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف عملية البيع"
        message={`هل أنت متأكد من حذف عملية بيع "${deleteTarget?.productName}"؟`}
        confirmLabel="حذف"
        loading={deleting}
      />
    </div>
  );
}
