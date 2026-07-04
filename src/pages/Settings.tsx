import { useState, useEffect, useRef } from 'react';
import type { Settings } from '../types';
import { useSettings } from '../hooks/useSettingsContext';
import { exportBackup, importBackup, type BackupData } from '../services/db';

const CURRENCIES = ['د.ك', 'ر.س', 'ر.ع', 'د.إ', 'د.ب', 'ر.ق', 'دولار', 'يورو'];

export default function SettingsPage() {
  const { settings, saveSettings } = useSettings();
  const [form, setForm] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const [backupError, setBackupError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleExport() {
    setBackupError('');
    setBackupMsg('');
    try {
      const data = await exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `coffee-pos-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupMsg('✅ تم تنزيل النسخة الاحتياطية بنجاح');
      setTimeout(() => setBackupMsg(''), 5000);
    } catch {
      setBackupError('حدث خطأ أثناء تصدير النسخة الاحتياطية');
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupError('');
    setBackupMsg('');

    const confirmed = window.confirm(
      'استعادة النسخة الاحتياطية ستستبدل كل البيانات الحالية (المنتجات، المبيعات، الإعدادات) بالكامل. هل أنت متأكد؟'
    );
    if (!confirmed) {
      e.target.value = '';
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;
      if (!data || !Array.isArray(data.products) || !Array.isArray(data.sales)) {
        throw new Error('invalid file');
      }
      await importBackup(data);
      setBackupMsg('✅ تم استعادة النسخة الاحتياطية بنجاح — يفضل إعادة تحميل الصفحة');
      setTimeout(() => window.location.reload(), 2000);
    } catch {
      setBackupError('⚠️ الملف غير صالح أو تالف، يرجى التأكد من اختيار ملف النسخة الاحتياطية الصحيح');
    } finally {
      setImporting(false);
      e.target.value = '';
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
        <h2 className="card-title" style={{ marginBottom: 8 }}>🗄️ النسخ الاحتياطي والاستعادة</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          احتفظ بنسخة من كل بياناتك (المنتجات، المبيعات، الإعدادات) بملف واحد.
          يُنصح بتنزيل نسخة احتياطية بشكل دوري لتفادي فقدان البيانات.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            style={{ width: 'fit-content' }}
          >
            ⬇️ تنزيل نسخة احتياطية
          </button>

          <div>
            <button
              className="btn btn-secondary"
              onClick={handleImportClick}
              disabled={importing}
              style={{ width: 'fit-content' }}
            >
              {importing ? '⏳ جاري الاستعادة...' : '⬆️ استعادة من نسخة احتياطية'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={handleFileSelected}
            />
            <div style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 6 }}>
              ⚠️ الاستعادة تستبدل كل البيانات الحالية بالكامل ولا يمكن التراجع عنها
            </div>
          </div>

          {backupMsg && <div className="alert alert-success">{backupMsg}</div>}
          {backupError && <div className="alert alert-danger">{backupError}</div>}
        </div>
      </div>

      <div className="card" style={{ maxWidth: 520, marginTop: 16 }}>
        <h2 className="card-title" style={{ marginBottom: 16 }}>ℹ️ معلومات النظام</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'اسم النظام', value: 'نظام إدارة مبيعات محل القهوة' },
            { label: 'الإصدار', value: '1.0.0' },
            { label: 'قاعدة البيانات', value: 'Supabase (سحابية)' },
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
