# Dashboard Module - NexusTransit

Módulo completo de dashboard com métricas, KPIs e análises para o sistema de gerenciamento de logística e entregas.

## 📊 Funcionalidades

### Métricas Disponíveis

#### 1. **Métricas de Entregas**
- Total de entregas
- Entregas concluídas, pendentes, em andamento
- Taxa de sucesso e cancelamento
- Tempo médio de entrega
- Pontualidade (entregas no prazo vs atrasadas)
- Taxa de tentativas

#### 2. **Métricas de Motoristas**
- Motoristas ativos, disponíveis, em rota
- Taxa de utilização
- Média de entregas por motorista
- Top performers (ranking)

#### 3. **Métricas de Veículos**
- Frota total, ativa, em manutenção
- Taxa de utilização da frota
- Distância percorrida
- Veículos que precisam de manutenção

#### 4. **Métricas de Rotas**
- Rotas planejadas, em andamento, completadas
- Taxa de conclusão
- Eficiência de rotas (distância planejada vs real)

#### 5. **Métricas Financeiras**
- Receita total e custo total
- Lucro bruto e margem de lucro
- Receita e custo médio por entrega
- Custo estimado de combustível

#### 6. **Métricas de Performance**
- Score de eficiência operacional
- Score de qualidade de serviço
- Score de satisfação do cliente
- Tempo médio de resposta
- Taxa de sucesso na primeira tentativa
- Produtividade (entregas por hora)

---

## 🚀 Endpoints

### 1. Overview Completo

```http
GET /dashboard/overview?period=LAST_30_DAYS
```

Retorna todas as métricas consolidadas do sistema.

**Query Parameters:**
- `period` (opcional): Período de análise
  - `TODAY`, `LAST_7_DAYS`, `LAST_30_DAYS`, `CURRENT_MONTH`, `LAST_MONTH`
  - `LAST_3_MONTHS`, `LAST_6_MONTHS`, `CURRENT_YEAR`, `CUSTOM`
- `start_date` (opcional): Data de início (formato: YYYY-MM-DD) - obrigatório se period=CUSTOM
- `end_date` (opcional): Data de fim (formato: YYYY-MM-DD) - obrigatório se period=CUSTOM

**Response:**
```json
{
  "period": "LAST_30_DAYS",
  "start_date": "2024-10-14T00:00:00Z",
  "end_date": "2024-11-13T23:59:59Z",
  "metrics": {
    "deliveries": {
      "total": 1250,
      "completed": 1100,
      "pending": 80,
      "in_progress": 50,
      "cancelled": 15,
      "failed": 5,
      "success_rate": 88.0,
      "cancellation_rate": 1.2,
      "average_delivery_time": 45,
      "average_attempts": 1.2,
      "on_time_deliveries": 1050,
      "delayed_deliveries": 50,
      "on_time_rate": 95.5
    },
    "drivers": { ... },
    "vehicles": { ... },
    "routes": { ... },
    "financial": { ... },
    "performance": { ... }
  },
  "comparison": {
    "deliveries_growth": 15.3,
    "revenue_growth": 12.8,
    "success_rate_change": 2.1,
    "efficiency_change": 3.5
  },
  "generated_at": "2024-11-13T12:00:00Z"
}
```

---

### 2. Dados de Tendência (Gráficos de Linha)

```http
GET /dashboard/trends/:metricName?period=LAST_30_DAYS
```

Retorna série temporal de uma métrica para visualização em gráficos.

**Métricas disponíveis:**
- `deliveries`: Número de entregas por período
- `revenue`: Receita por período
- `routes`: Número de rotas por período

**Response:**
```json
{
  "period": "LAST_30_DAYS",
  "metric_name": "deliveries",
  "data": [
    { "label": "01/11", "value": 45, "date": "2024-11-01T00:00:00Z" },
    { "label": "02/11", "value": 52, "date": "2024-11-02T00:00:00Z" },
    ...
  ],
  "total": 1250,
  "average": 41.7,
  "min": 28,
  "max": 68,
  "trend": "crescimento",
  "change_percentage": 15.3
}
```

---

### 3. Distribuição por Categoria (Gráficos de Pizza/Donut)

```http
GET /dashboard/distribution/:categoryType?period=LAST_30_DAYS
```

Retorna distribuição de dados por categorias.

**Categorias disponíveis:**
- `deliveries_by_status`: Entregas por status
- `vehicles_by_type`: Veículos por tipo
- `drivers_by_status`: Motoristas por status

**Response:**
```json
{
  "metric_name": "deliveries_by_status",
  "total": 1250,
  "distribution": [
    {
      "category": "COMPLETED",
      "count": 1100,
      "percentage": 88.0,
      "color": "#10b981"
    },
    {
      "category": "PENDING",
      "count": 80,
      "percentage": 6.4,
      "color": "#f59e0b"
    },
    ...
  ]
}
```

---

### 4. Ranking de Performance

```http
GET /dashboard/ranking/:rankingType?period=LAST_30_DAYS
```

Retorna ranking de entidades do sistema (top 10).

**Rankings disponíveis:**
- `top_drivers`: Motoristas com mais entregas
- `top_vehicles`: Veículos mais utilizados

**Response:**
```json
{
  "ranking_type": "top_drivers",
  "period": "LAST_30_DAYS",
  "metric": "deliveries_count",
  "ranking": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "João Silva",
      "score": 125,
      "rank": 1,
      "metadata": {
        "deliveries": 125,
        "completed": 122,
        "success_rate": 97.6
      }
    },
    ...
  ]
}
```

---

### 5. KPIs Específicos

Endpoints otimizados para buscar apenas métricas específicas:

#### KPIs de Entregas
```http
GET /dashboard/kpis/deliveries?period=LAST_30_DAYS
```

#### KPIs Financeiros
```http
GET /dashboard/kpis/financial?period=LAST_30_DAYS
```

#### KPIs de Performance
```http
GET /dashboard/kpis/performance?period=LAST_30_DAYS
```

#### KPIs da Frota (Veículos + Motoristas)
```http
GET /dashboard/kpis/fleet?period=LAST_30_DAYS
```

---

## 📅 Períodos Disponíveis

| Período | Descrição |
|---------|-----------|
| `TODAY` | Apenas hoje |
| `LAST_7_DAYS` | Últimos 7 dias |
| `LAST_30_DAYS` | Últimos 30 dias (padrão) |
| `CURRENT_MONTH` | Mês atual |
| `LAST_MONTH` | Mês anterior |
| `LAST_3_MONTHS` | Últimos 3 meses |
| `LAST_6_MONTHS` | Últimos 6 meses |
| `CURRENT_YEAR` | Ano atual |
| `CUSTOM` | Período customizado (requer start_date e end_date) |

---

## 💡 Exemplos de Uso

### Exemplo 1: Dashboard Principal

```typescript
// Buscar overview completo dos últimos 30 dias
const response = await fetch('/dashboard/overview?period=LAST_30_DAYS');
const data = await response.json();

// Exibir KPIs principais
console.log(`Total de entregas: ${data.metrics.deliveries.total}`);
console.log(`Taxa de sucesso: ${data.metrics.deliveries.success_rate}%`);
console.log(`Receita total: R$ ${data.metrics.financial.total_revenue}`);
console.log(`Crescimento: ${data.comparison.deliveries_growth}%`);
```

### Exemplo 2: Gráfico de Tendência

```typescript
// Buscar tendência de entregas dos últimos 7 dias
const response = await fetch('/dashboard/trends/deliveries?period=LAST_7_DAYS');
const data = await response.json();

// Usar dados no Chart.js ou similar
const chartData = {
  labels: data.data.map(d => d.label),
  datasets: [{
    label: 'Entregas',
    data: data.data.map(d => d.value),
  }]
};
```

### Exemplo 3: Gráfico de Pizza

```typescript
// Buscar distribuição de entregas por status
const response = await fetch('/dashboard/distribution/deliveries_by_status?period=CURRENT_MONTH');
const data = await response.json();

// Usar dados no Chart.js
const pieData = {
  labels: data.distribution.map(d => d.category),
  datasets: [{
    data: data.distribution.map(d => d.count),
    backgroundColor: data.distribution.map(d => d.color),
  }]
};
```

### Exemplo 4: Widget de Top Performers

```typescript
// Buscar top 10 motoristas
const response = await fetch('/dashboard/ranking/top_drivers?period=CURRENT_MONTH');
const data = await response.json();

// Exibir ranking
data.ranking.forEach(driver => {
  console.log(`#${driver.rank} - ${driver.name}: ${driver.score} entregas`);
  console.log(`Taxa de sucesso: ${driver.metadata.success_rate}%`);
});
```

### Exemplo 5: Período Customizado

```typescript
// Buscar métricas de um período específico
const response = await fetch(
  '/dashboard/overview?period=CUSTOM&start_date=2024-01-01&end_date=2024-03-31'
);
const data = await response.json();

// Análise do primeiro trimestre de 2024
console.log('Q1 2024:', data.metrics);
```

---

## 🎨 Sugestões de Visualização

### Layout Sugerido do Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  📊 Overview - Últimos 30 dias                          │
├─────────────┬─────────────┬─────────────┬──────────────┤
│ Entregas    │ Taxa Sucesso│ Receita     │ Motoristas   │
│ 1,250 ↑15% │ 88.0% ↑2.1% │ R$ 125k ↑13%│ 45 ativos    │
└─────────────┴─────────────┴─────────────┴──────────────┘

┌───────────────────────────────┬──────────────────────────┐
│  📈 Entregas por Dia          │  🥧 Status das Entregas  │
│  (Gráfico de Linha)           │  (Gráfico de Pizza)      │
│                               │                          │
│  /trends/deliveries           │  /distribution/...       │
└───────────────────────────────┴──────────────────────────┘

┌───────────────────────────────┬──────────────────────────┐
│  💰 Receita por Dia           │  🏆 Top 10 Motoristas    │
│  (Gráfico de Linha)           │  (Lista Ranking)         │
│                               │                          │
│  /trends/revenue              │  /ranking/top_drivers    │
└───────────────────────────────┴──────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  🚚 Status da Frota                                       │
│  ├─ 42 veículos ativos (84%)                             │
│  ├─ 5 em manutenção                                      │
│  └─ 45,678 km percorridos                                │
│                                                           │
│  /kpis/fleet                                             │
└───────────────────────────────────────────────────────────┘
```

---

## 🔄 Cache e Performance

### Entidade DashboardSnapshot

O sistema inclui uma entidade `DashboardSnapshot` para armazenar snapshots periódicos de métricas.

**Benefícios:**
- Cache de cálculos complexos
- Histórico de métricas
- Comparação entre períodos
- Análise de tendências de longo prazo

**Uso futuro (implementar):**
```typescript
// Gerar snapshot diário automaticamente (cron job)
@Cron('0 0 * * *') // Todo dia à meia-noite
async generateDailySnapshot() {
  const metrics = await this.dashboardService.getOverview({
    period: DashboardPeriod.TODAY
  });
  
  // Salvar snapshot no banco
  await this.snapshotRepository.save({
    period: DashboardPeriod.TODAY,
    snapshot_date: new Date(),
    delivery_metrics: metrics.deliveries,
    // ... outras métricas
    is_official: true,
  });
}
```

---

## 🔐 Autenticação

Todos os endpoints requerem autenticação via Bearer Token.

```http
Authorization: Bearer <seu-token-jwt>
```

---

## 📝 Notas Importantes

1. **Performance**: As queries são otimizadas mas podem ser lentas com grandes volumes de dados. Considere implementar cache ou snapshots.

2. **Placeholders**: Alguns cálculos ainda utilizam valores placeholder:
   - `average_attempts`: Necessita implementação real baseada em `delivery_attempts`
   - `customer_satisfaction_score`: Necessita integração com sistema de feedback
   - `average_response_time`: Necessita definição clara da métrica

3. **Extensibilidade**: O módulo foi projetado para ser facilmente extensível. Adicione novas métricas em:
   - `DashboardMetrics` interface
   - Métodos de cálculo no service
   - DTOs de resposta

4. **Filtros**: Todos os endpoints suportam filtros de período. Use `CUSTOM` para análises específicas.

---

## 🚀 Próximos Passos

1. Implementar sistema de cache com Redis
2. Criar job automático para geração de snapshots
3. Adicionar mais tipos de rankings
4. Integrar com sistema de notificações para alertas
5. Adicionar exports para PDF/Excel
6. Implementar comparações multi-período
7. Adicionar previsões e projeções

---

## 📚 Referências

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Chart.js](https://www.chartjs.org/) - Para visualização no frontend
- [Recharts](https://recharts.org/) - Alternativa para React

---

**Desenvolvido por**: NexusTransit Team  
**Versão**: 1.0.0  
**Data**: Novembro 2024
