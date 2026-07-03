import { useState, useEffect, useCallback } from 'react';
import type { Sale, ReportData } from '../types';
import { getAllSales } from '../services/db';
import { getTodayDate, getWeekStartDate, getMonthStartDate, formatDate } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatUtils';
import { useSettings } from '../hooks/useSettingsContext';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

function groupByDate(sales: Sale[]): ReportData[] {
  const map: Record<string, ReportData> = {};
  for (const s of sales) {
    if (!map[s.date]) {
      map[s.date] = { date: s.date, totalRevenue: 0, totalCost: 0, totalProfit: 0, salesCount: 0 };
    }
    map[s.date].totalRevenue += s.totalRevenue;
    map[s.date].totalCost += s.totalCost;
    map[s.date].totalProfit += s.totalProfit;
    map[s.date].salesCount += 1;
  }
  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
}

export default function Reports() {
  const { settings } = useSettings();
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [customStart, setCustomStart] = useState(getTodayDate());
  const [customEnd, setCustomEnd] = useState(getTodayDate());

  const load = useCallback(async () => {
    const sales = await getAllSales();
    setAllSales(sales);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let start = '';
    let end = getTodayDate();
    if (period === 'daily') { start = getTodayDate(); end = getTodayDate(); }
    else if (period === 'weekly') { start = getWeekStartDate(); }
    else if (period === 'monthly') { start = getMonthStartDate(); }
    else { start = customStart; end = customEnd; }

    const result = allSales.filter((s) => s.date >= start && s.date <= end);
    setFilteredSales(result);
    setReportData(groupByDate(result));
  }, [period, allSales, customStart, customEnd]);

  const totalRevenue = filteredSales.reduce((a, s) => a + s.totalRevenue, 0);
  const totalCost = filteredSales.reduce((a, s) => a + s.totalCost, 0);
  const totalProfit = filteredSales.reduce((a, s) => a + s.totalProfit, 0);

  // Product breakdown
  const productMap: Record<string, { name: string; qty: number; revenue: number; profit: number }> = {};
  filteredSales.forEach((s) => {
    if (!productMap[s.productName]) {
      productMap[s.productName] = { name: s.productName, qty: 0, revenue: 0, profit: 0 };
    }
    productMap[s.productName].qty += s.quantity;
    productMap[s.productName].revenue += s.totalRevenue;
    productMap[s.productName].profit += s.totalProfit;
  });
  const productBreakdown = Object.values(productMap).sort((a, b) => b.profit - a.profit);

  function handlePrint() {
    window.print();
  }

  const periodLabel: Record<ReportPeriod, string> = {
    daily: 'اليوم', weekly: 'هذا الأسبوع', monthly: 'هذا الشهر', custom: 'مخصص',
  };

  return (
    <div className="fade-in">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">التقارير</h1>
          <p className="page-subtitle">تقارير المبيعات والأرباح</p>
        </div>
        <button className="btn btn-secondary" onClick={handlePrint}>🖨️ طباعة</button>
      </div>

      <div className="tabs no-print">
        {(['daily', 'weekly', 'monthly', 'custom'] as ReportPeriod[]).map((p) => (
          <button key={p} className={`tab-btn${period === p ? ' active' : ''}`} onClick={() => setPeriod(p)}>
            {periodLabel[p]}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="card no-print" style={{ marginBottom: 16 }}>
          <div className="form-grid" style={{ maxWidth: 400 }}>
            <div className="form-group">
              <label className="form-label">من تاريخ</label>
              <input type="date" className="form-control" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">إلى تاريخ</label>
              <input type="date" className="form-control" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Print header */}
      <div style={{ display: 'none' }} className="print-header">
        <h2>{settings.shopName} - تقرير المبيعات ({periodLabel[period]})</h2>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-icon accent">💵</div>
          <div className="stat-card-label">إجمالي الإيرادات</div>
          <div className="stat-card-value accent">{formatCurrency(totalRevenue, settings.currency)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon brown">📦</div>
          <div className="stat-card-label">إجمالي التكاليف</div>
          <div className="stat-card-value">{formatCurrency(totalCost, settings.currency)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green">💰</div>
          <div className="stat-card-label">صافي الأرباح</div>
          <div className="stat-card-value green">{formatCurrency(totalProfit, settings.currency)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon blue">🛒</div>
          <div className="stat-card-label">عدد العمليات</div>
          <div className="stat-card-value">{filteredSales.length}</div>
        </div>
      </div>

      {filteredSales.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-text">لا توجد مبيعات في هذه الفترة</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Daily breakdown */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📅 تقرير حسب الأيام</span>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>العمليات</th>
                    <th>الإيراد</th>
                    <th>الربح</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r) => (
                    <tr key={r.date}>
                      <td style={{ fontWeight: 600 }}>{formatDate(r.date)}</td>
                      <td>{r.salesCount}</td>
                      <td>{formatCurrency(r.totalRevenue, settings.currency)}</td>
                      <td>
                        <span className={r.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}>
                          {formatCurrency(r.totalProfit, settings.currency)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product breakdown */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📦 تقرير حسب المنتج</span>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>الإيراد</th>
                    <th>الربح</th>
                  </tr>
                </thead>
                <tbody>
                  {productBreakdown.map((p) => (
                    <tr key={p.name}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.qty}</td>
                      <td>{formatCurrency(p.revenue, settings.currency)}</td>
                      <td>
                        <span className={p.profit >= 0 ? 'profit-positive' : 'profit-negative'}>
                          {formatCurrency(p.profit, settings.currency)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Full Sales Detail */}
      {filteredSales.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <span className="card-title">📋 تفاصيل جميع المبيعات</span>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>المنتج</th>
                  <th>الكمية</th>
                  <th>سعر البيع</th>
                  <th>التكلفة</th>
                  <th>الإيراد</th>
                  <th>الربح</th>
                </tr>
              </thead>
              <tbody>
                {[...filteredSales].reverse().map((s) => (
                  <tr key={s.id}>
                    <td className="muted">{formatDate(s.date)}</td>
                    <td style={{ fontWeight: 600 }}>{s.productName}</td>
                    <td>{s.quantity}</td>
                    <td>{formatCurrency(s.salePrice, settings.currency)}</td>
                    <td className="muted">{formatCurrency(s.totalCost, settings.currency)}</td>
                    <td>{formatCurrency(s.totalRevenue, settings.currency)}</td>
                    <td>
                      <span className={s.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}>
                        {formatCurrency(s.totalProfit, settings.currency)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
