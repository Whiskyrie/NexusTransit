# Exemplos de Integração Frontend - Dashboard API

Este documento mostra exemplos práticos de como consumir a API do Dashboard no frontend.

## 📦 Instalação de Dependências

```bash
# Para projetos React/Next.js
npm install axios chart.js react-chartjs-2 date-fns

# Para projetos Vue
npm install axios chart.js vue-chartjs date-fns

# Para projetos Angular
npm install chart.js ng2-charts date-fns
```

---

## 🔧 Setup Inicial

### Configurar Cliente HTTP

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adicionar token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 📊 1. Dashboard Principal - Overview Completo

### Service Layer

```typescript
// src/services/dashboard.service.ts
import api from './api';
import { DashboardPeriod } from './types';

export interface DashboardOverview {
  period: string;
  start_date: string;
  end_date: string;
  metrics: {
    deliveries: DeliveryMetrics;
    drivers: DriverMetrics;
    vehicles: VehicleMetrics;
    routes: RouteMetrics;
    financial: FinancialMetrics;
    performance: PerformanceMetrics;
  };
  comparison?: {
    deliveries_growth: number;
    revenue_growth: number;
    success_rate_change: number;
    efficiency_change: number;
  };
  generated_at: string;
}

export const dashboardService = {
  async getOverview(period: DashboardPeriod = 'LAST_30_DAYS'): Promise<DashboardOverview> {
    const { data } = await api.get('/dashboard/overview', {
      params: { period },
    });
    return data;
  },

  async getCustomOverview(startDate: string, endDate: string): Promise<DashboardOverview> {
    const { data } = await api.get('/dashboard/overview', {
      params: {
        period: 'CUSTOM',
        start_date: startDate,
        end_date: endDate,
      },
    });
    return data;
  },
};
```

### React Component

```typescript
// src/components/Dashboard/DashboardOverview.tsx
import React, { useEffect, useState } from 'react';
import { dashboardService, DashboardOverview } from '@/services/dashboard.service';

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('LAST_30_DAYS');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const overview = await dashboardService.getOverview(period);
        setData(overview);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  if (loading) return <div>Carregando...</div>;
  if (!data) return <div>Erro ao carregar dados</div>;

  return (
    <div className="dashboard-overview">
      <h1>Dashboard - {data.period}</h1>
      
      {/* KPIs Principais */}
      <div className="kpi-grid">
        <KPICard
          title="Total de Entregas"
          value={data.metrics.deliveries.total}
          growth={data.comparison?.deliveries_growth}
          icon="📦"
        />
        <KPICard
          title="Taxa de Sucesso"
          value={`${data.metrics.deliveries.success_rate}%`}
          growth={data.comparison?.success_rate_change}
          icon="✅"
        />
        <KPICard
          title="Receita Total"
          value={`R$ ${data.metrics.financial.total_revenue.toLocaleString()}`}
          growth={data.comparison?.revenue_growth}
          icon="💰"
        />
        <KPICard
          title="Motoristas Ativos"
          value={data.metrics.drivers.total_active}
          icon="🚗"
        />
      </div>

      {/* Detalhes das Entregas */}
      <div className="metrics-section">
        <h2>Entregas</h2>
        <div className="metric-cards">
          <MetricCard label="Concluídas" value={data.metrics.deliveries.completed} />
          <MetricCard label="Pendentes" value={data.metrics.deliveries.pending} />
          <MetricCard label="Em Andamento" value={data.metrics.deliveries.in_progress} />
          <MetricCard label="Canceladas" value={data.metrics.deliveries.cancelled} />
        </div>
      </div>

      {/* Filtro de Período */}
      <PeriodSelector value={period} onChange={setPeriod} />
    </div>
  );
}

function KPICard({ title, value, growth, icon }) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon">{icon}</div>
      <h3>{title}</h3>
      <div className="kpi-value">{value}</div>
      {growth !== undefined && (
        <div className={`kpi-growth ${growth >= 0 ? 'positive' : 'negative'}`}>
          {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
```

---

## 📈 2. Gráfico de Tendência (Linha)

### Service

```typescript
// src/services/dashboard.service.ts
export interface TrendData {
  period: string;
  metric_name: string;
  data: Array<{
    label: string;
    value: number;
    date: string;
  }>;
  total: number;
  average: number;
  min: number;
  max: number;
  trend: 'crescimento' | 'decrescimento' | 'estável';
  change_percentage: number;
}

export const dashboardService = {
  // ... outros métodos

  async getTrendData(metricName: string, period: string = 'LAST_30_DAYS'): Promise<TrendData> {
    const { data } = await api.get(`/dashboard/trends/${metricName}`, {
      params: { period },
    });
    return data;
  },
};
```

### React Component com Chart.js

```typescript
// src/components/Dashboard/TrendChart.tsx
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { dashboardService, TrendData } from '@/services/dashboard.service';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  metricName: 'deliveries' | 'revenue' | 'routes';
  period?: string;
}

export default function TrendChart({ metricName, period = 'LAST_30_DAYS' }: Props) {
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getTrendData(metricName, period);
        setTrendData(data);
      } catch (error) {
        console.error('Erro ao carregar tendência:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [metricName, period]);

  if (loading) return <div>Carregando gráfico...</div>;
  if (!trendData) return <div>Erro ao carregar dados</div>;

  const chartData = {
    labels: trendData.data.map((d) => d.label),
    datasets: [
      {
        label: getMetricLabel(metricName),
        data: trendData.data.map((d) => d.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${getMetricLabel(metricName)} - ${trendData.period}`,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = formatValue(metricName, context.parsed.y);
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="trend-chart">
      <Line data={chartData} options={options} />
      
      <div className="trend-stats">
        <div className="stat">
          <span className="label">Total:</span>
          <span className="value">{formatValue(metricName, trendData.total)}</span>
        </div>
        <div className="stat">
          <span className="label">Média:</span>
          <span className="value">{formatValue(metricName, trendData.average)}</span>
        </div>
        <div className="stat">
          <span className="label">Tendência:</span>
          <span className={`trend-badge ${trendData.trend}`}>
            {getTrendIcon(trendData.trend)} {trendData.trend}
          </span>
        </div>
        <div className="stat">
          <span className="label">Variação:</span>
          <span className={`change ${trendData.change_percentage >= 0 ? 'positive' : 'negative'}`}>
            {trendData.change_percentage >= 0 ? '+' : ''}{trendData.change_percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function getMetricLabel(metric: string): string {
  const labels = {
    deliveries: 'Entregas',
    revenue: 'Receita',
    routes: 'Rotas',
  };
  return labels[metric] || metric;
}

function formatValue(metric: string, value: number): string {
  if (metric === 'revenue') {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }
  return value.toLocaleString('pt-BR');
}

function getTrendIcon(trend: string): string {
  const icons = {
    crescimento: '📈',
    decrescimento: '📉',
    estável: '➡️',
  };
  return icons[trend] || '';
}
```

---

## 🥧 3. Gráfico de Pizza/Donut

### Service

```typescript
// src/services/dashboard.service.ts
export interface CategoryDistribution {
  metric_name: string;
  total: number;
  distribution: Array<{
    category: string;
    count: number;
    percentage: number;
    color?: string;
  }>;
}

export const dashboardService = {
  // ... outros métodos

  async getCategoryDistribution(
    categoryType: string,
    period: string = 'LAST_30_DAYS'
  ): Promise<CategoryDistribution> {
    const { data } = await api.get(`/dashboard/distribution/${categoryType}`, {
      params: { period },
    });
    return data;
  },
};
```

### React Component

```typescript
// src/components/Dashboard/DistributionChart.tsx
import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { dashboardService, CategoryDistribution } from '@/services/dashboard.service';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  categoryType: 'deliveries_by_status' | 'vehicles_by_type' | 'drivers_by_status';
  period?: string;
}

export default function DistributionChart({ categoryType, period = 'LAST_30_DAYS' }: Props) {
  const [distribution, setDistribution] = useState<CategoryDistribution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getCategoryDistribution(categoryType, period);
        setDistribution(data);
      } catch (error) {
        console.error('Erro ao carregar distribuição:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryType, period]);

  if (loading) return <div>Carregando gráfico...</div>;
  if (!distribution) return <div>Erro ao carregar dados</div>;

  const chartData = {
    labels: distribution.distribution.map((d) => formatCategory(d.category)),
    datasets: [
      {
        data: distribution.distribution.map((d) => d.count),
        backgroundColor: distribution.distribution.map(
          (d) => d.color || getDefaultColor(d.category)
        ),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const item = distribution.distribution[context.dataIndex];
            return `${item.count} (${item.percentage.toFixed(1)}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="distribution-chart">
      <h3>{getCategoryTitle(categoryType)}</h3>
      
      <div className="chart-container">
        <Doughnut data={chartData} options={options} />
      </div>

      <div className="distribution-legend">
        {distribution.distribution.map((item, index) => (
          <div key={index} className="legend-item">
            <div
              className="color-box"
              style={{ backgroundColor: item.color || getDefaultColor(item.category) }}
            />
            <span className="category">{formatCategory(item.category)}</span>
            <span className="count">{item.count}</span>
            <span className="percentage">({item.percentage.toFixed(1)}%)</span>
          </div>
        ))}
      </div>

      <div className="total">
        <strong>Total:</strong> {distribution.total}
      </div>
    </div>
  );
}

function getCategoryTitle(categoryType: string): string {
  const titles = {
    deliveries_by_status: 'Entregas por Status',
    vehicles_by_type: 'Veículos por Tipo',
    drivers_by_status: 'Motoristas por Status',
  };
  return titles[categoryType] || categoryType;
}

function formatCategory(category: string): string {
  const translations = {
    COMPLETED: 'Concluídas',
    PENDING: 'Pendentes',
    IN_PROGRESS: 'Em Andamento',
    CANCELLED: 'Canceladas',
    FAILED: 'Falhadas',
    AVAILABLE: 'Disponíveis',
    ON_ROUTE: 'Em Rota',
    ON_BREAK: 'Em Pausa',
    INACTIVE: 'Inativos',
    ACTIVE: 'Ativos',
    MAINTENANCE: 'Em Manutenção',
  };
  return translations[category] || category;
}

function getDefaultColor(category: string): string {
  const colors = {
    COMPLETED: '#10b981',
    PENDING: '#f59e0b',
    IN_PROGRESS: '#3b82f6',
    CANCELLED: '#ef4444',
    FAILED: '#dc2626',
    AVAILABLE: '#10b981',
    ON_ROUTE: '#3b82f6',
    ON_BREAK: '#f59e0b',
    INACTIVE: '#6b7280',
    ACTIVE: '#10b981',
    MAINTENANCE: '#f59e0b',
  };
  return colors[category] || '#6b7280';
}
```

---

## 🏆 4. Ranking de Performance

### Service

```typescript
// src/services/dashboard.service.ts
export interface PerformanceRanking {
  ranking_type: string;
  period: string;
  metric: string;
  ranking: Array<{
    id: string;
    name: string;
    score: number;
    rank: number;
    metadata?: Record<string, any>;
  }>;
}

export const dashboardService = {
  // ... outros métodos

  async getPerformanceRanking(
    rankingType: string,
    period: string = 'LAST_30_DAYS'
  ): Promise<PerformanceRanking> {
    const { data } = await api.get(`/dashboard/ranking/${rankingType}`, {
      params: { period },
    });
    return data;
  },
};
```

### React Component

```typescript
// src/components/Dashboard/RankingTable.tsx
import React, { useEffect, useState } from 'react';
import { dashboardService, PerformanceRanking } from '@/services/dashboard.service';

interface Props {
  rankingType: 'top_drivers' | 'top_vehicles';
  period?: string;
}

export default function RankingTable({ rankingType, period = 'LAST_30_DAYS' }: Props) {
  const [ranking, setRanking] = useState<PerformanceRanking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getPerformanceRanking(rankingType, period);
        setRanking(data);
      } catch (error) {
        console.error('Erro ao carregar ranking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [rankingType, period]);

  if (loading) return <div>Carregando ranking...</div>;
  if (!ranking) return <div>Erro ao carregar dados</div>;

  return (
    <div className="ranking-table">
      <h3>{getRankingTitle(rankingType)}</h3>
      <p className="period-info">Período: {ranking.period}</p>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nome</th>
            <th>Entregas</th>
            {rankingType === 'top_drivers' && <th>Taxa de Sucesso</th>}
          </tr>
        </thead>
        <tbody>
          {ranking.ranking.map((item) => (
            <tr key={item.id} className={item.rank <= 3 ? `top-${item.rank}` : ''}>
              <td className="rank">
                {item.rank === 1 && '🥇'}
                {item.rank === 2 && '🥈'}
                {item.rank === 3 && '🥉'}
                {item.rank > 3 && item.rank}
              </td>
              <td className="name">{item.name}</td>
              <td className="score">{item.score}</td>
              {rankingType === 'top_drivers' && item.metadata?.success_rate && (
                <td className="success-rate">
                  {item.metadata.success_rate.toFixed(1)}%
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getRankingTitle(rankingType: string): string {
  const titles = {
    top_drivers: 'Top 10 Motoristas',
    top_vehicles: 'Top 10 Veículos',
  };
  return titles[rankingType] || rankingType;
}
```

---

## 🎨 CSS Exemplo

```css
/* src/styles/dashboard.css */

.dashboard-overview {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.kpi-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.kpi-value {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0.5rem 0;
}

.kpi-growth {
  font-size: 0.875rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.kpi-growth.positive {
  color: #10b981;
}

.kpi-growth.negative {
  color: #ef4444;
}

.trend-chart,
.distribution-chart,
.ranking-table {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.trend-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.trend-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
}

.trend-badge.crescimento {
  background-color: #d1fae5;
  color: #065f46;
}

.trend-badge.decrescimento {
  background-color: #fee2e2;
  color: #991b1b;
}

.trend-badge.estável {
  background-color: #e5e7eb;
  color: #374151;
}

.ranking-table table {
  width: 100%;
  border-collapse: collapse;
}

.ranking-table th,
.ranking-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.ranking-table .top-1 {
  background-color: #fef3c7;
}

.ranking-table .top-2 {
  background-color: #f3f4f6;
}

.ranking-table .top-3 {
  background-color: #fce7d4;
}
```

---

## 🚀 Uso Completo - Exemplo de Página Dashboard

```typescript
// src/pages/dashboard.tsx
import React, { useState } from 'react';
import DashboardOverview from '@/components/Dashboard/DashboardOverview';
import TrendChart from '@/components/Dashboard/TrendChart';
import DistributionChart from '@/components/Dashboard/DistributionChart';
import RankingTable from '@/components/Dashboard/RankingTable';

export default function DashboardPage() {
  const [period, setPeriod] = useState('LAST_30_DAYS');

  return (
    <div className="dashboard-page">
      <DashboardOverview />

      <div className="dashboard-grid">
        {/* Gráficos de Tendência */}
        <div className="chart-section">
          <TrendChart metricName="deliveries" period={period} />
        </div>
        
        <div className="chart-section">
          <TrendChart metricName="revenue" period={period} />
        </div>

        {/* Gráfico de Distribuição */}
        <div className="chart-section">
          <DistributionChart categoryType="deliveries_by_status" period={period} />
        </div>

        {/* Rankings */}
        <div className="chart-section">
          <RankingTable rankingType="top_drivers" period={period} />
        </div>
      </div>
    </div>
  );
}
```

---

**Documentação completa para integração frontend com a API do Dashboard!** 🎉
