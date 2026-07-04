import { useState, useEffect, useCallback } from 'react';
import type { DashboardStats, Sale } from '../types';
import { getAllSales, getAllProducts } from '../services/db';
import { getTodayDate, getWeekStartDate, getMonthStartDate, getLast7Days } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatUtils';
import { useSettings } from '../hooks/useSettingsContext';

function BarChart({ data, maxVal, color }: { data: { label: string; value: number }[]; maxVal: number; color: string }) {
  return (
    <div className="bar-chart">
      {data.map((item, i) => {
        const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
        return (
          <div key={i} className="bar-item" title={`${item.label}: ${item.value.toFixed(3)}`}>
            <div className={`bar ${color}`} style={{ height: `${Math.max(pct, 2)}%` }} />
            <span className="bar-label">{item.label.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { settings } = useSettings();
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0, todayProfit: 0, weekProfit: 0, monthProfit: 0,
    totalProducts: 0, bestSellingProduct: '-', highestProfitProduct: '-', todaySalesCount: 0,
  });
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    const [sales, products] = await Promise.all([getAllSales(), getAllProducts()]);
    const today = getTodayDate();
    const weekStart = getWeekStartDate();
    const monthStart = getMonthStartDate();

    const todaySales = sales.filter((s) => s.date === today);
    const weekSales = sales.filter((s) => s.date >= weekStart);
    const monthSales = sales.filter((s) => s.date >= monthStart);

    const sum = (arr: Sale[], field: keyof Sale) =>
      arr.reduce((acc, s) => acc + (s[field] as number), 0);

    // Best selling product by quantity
    const qtyMap: Record<string, number> = {};
    const profitMap: Record<string, number> = {};
    sales.forEach((s) => {
      qtyMap[s.productName] = (qtyMap[s.productName] || 0) + s.quantity;
      profitMap[s.productName] = (profitMap[s.productName] || 0) + s.totalProfit;
    });
    const bestSelling = Object.entries(qtyMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';
    const highestProfit = Object.entries(profitMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';

    setStats({
      todaySales: sum(todaySales, 'totalRevenue'),
      todayProfit: sum(todaySales, 'totalProfit'),
      weekProfit: sum(weekSales, 'totalProfit'),
      monthProfit: sum(monthSales, 'totalProfit'),
      totalProducts: products.length,
      bestSellingProduct: bestSelling,
      highestProfitProduct: highestProfit,
      todaySalesCount: todaySales.length,
    });

    // Chart: last 7 days profit
    const last7 = getLast7Days();
    const chartItems = last7.map((date) => {
      const dayProfit = sales
        .filter((s) => s.date === date)
        .reduce((acc, s) => acc + s.totalProfit, 0);
      return { label: date, value: dayProfit };
    });
    setChartData(chartItems);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, [loadStats]);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⏳</div>
        <div className="empty-state-text">جاري تحميل البيانات...</div>
      </div>
    );
  }

  const maxChart = Math.max(...chartData.map((d) => d.value), 0.001);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">لوحة التحكم</h1>
          <p className="page-subtitle">نظرة عامة على أداء {settings.shopName}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon brown">🛒</div>
          <div className="stat-card-label">مبيعات اليوم</div>
          <div className="stat-card-value accent">{formatCurrency(stats.todaySales, settings.currency)}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{stats.todaySalesCount} عملية بيع</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green">💰</div>
          <div className="stat-card-label">أرباح اليوم</div>
          <div className="stat-card-value green">{formatCurrency(stats.todayProfit, settings.currency)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon accent">📅</div>
          <div className="stat-card-label">أرباح الأسبوع</div>
          <div className="stat-card-value accent">{formatCurrency(stats.weekProfit, settings.currency)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon blue">🗓️</div>
          <div className="stat-card-label">أرباح الشهر</div>
          <div className="stat-card-value">{formatCurrency(stats.monthProfit, settings.currency)}</div>
        </div>
      </div>

      <div className="responsive-grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">📦 إجمالي المنتجات</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-primary)' }}>{stats.totalProducts}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>منتج مسجل</div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">🏆 أفضل المنتجات</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 }}>الأكثر مبيعًا</div>
              <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: 15 }}>
                🥇 {stats.bestSellingProduct}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 }}>الأعلى ربحًا</div>
              <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: 15 }}>
                💎 {stats.highestProfitProduct}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">📈 الأرباح - آخر 7 أيام</span>
        </div>
        {chartData.every((d) => d.value === 0) ? (
          <div className="empty-state" style={{ padding: '24px' }}>
            <div className="empty-state-text">لا توجد بيانات مبيعات بعد</div>
          </div>
        ) : (
          <BarChart data={chartData} maxVal={maxChart} color="profit" />
        )}
      </div>
    </div>
  );
}
