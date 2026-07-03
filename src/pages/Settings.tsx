import { useState, useEffect } from 'react';
import type { Settings } from '../types';
import { useSettings } from '../hooks/useSettingsContext';

const CURRENCIES = ['د.ك', 'ر.س', 'ر.ع', 'د.إ', 'د.ب', 'ر.ق', 'دولار', 'يورو'];

export default function SettingsPage() {
  const { settings, saveSettings } = useSettings();
  const [form, setForm] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    try {
      await saveSettings(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">الإعدادات</h1>
          <p className="page-subtitle">إعدادات النظام والمحل</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        <h2 className="card-title" style={{ marginBottom: 20 }}>⚙️ إعدادات المحل</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">اسم المحل</label>
            <input
              className="form-control"
              value={form.shopName}
              onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
              placeholder="اسم محلك"
            />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              يظهر في الشريط الجانبي والرأس
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">العملة</label>
            <select
              className="form-control"
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              تستخدم لعرض جميع الأسعار في النظام
            </span>
          </div>

          {success && (
            <div className="alert alert-success">✅ تم حفظ الإعدادات بنجاح</div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ width: 'fit-content' }}
          >
            {saving ? '⏳ جاري الحفظ...' : '💾 حفظ الإعدادات'}
          </button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 520, marginTop: 16 }}>
        <h2 className="card-title" style={{ marginBottom: 16 }}>ℹ️ معلومات النظام</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'اسم النظام', value: 'نظام إدارة مبيعات محل القهوة' },
            { label: 'الإصدار', value: '1.0.0' },
            { label: 'قاعدة البيانات', value: 'IndexedDB (محلية)' },
            { label: 'الإصدار', value: 'React 19 + TypeScript' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--color-border-light)' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 13, minWidth: 130 }}>{item.label}</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
