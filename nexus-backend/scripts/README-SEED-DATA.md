# 📊 Scripts de População de Dados - Dashboard NexusTransit

## 🎯 Visão Geral

Dois scripts SQL para popular o banco de dados PostgreSQL com dados de teste para o dashboard.

---

## 📁 Scripts Disponíveis

### 1. `seed-dashboard-data.sql` - **Dados Completos** (Recomendado)
- ✅ 5 clientes
- ✅ 5 motoristas
- ✅ 5 veículos
- ✅ 40 rotas
- ✅ 120 entregas
- ✅ Tentativas de entrega
- ✅ Histórico de status completo
- ✅ Dados dos últimos 60 dias

**Use quando**: Quiser dados robustos para testes completos do dashboard

### 2. `seed-minimal-data.sql` - **Dados Mínimos**
- ✅ 5 clientes
- ✅ 3 motoristas
- ✅ 3 veículos
- ✅ 20 rotas
- ✅ 60 entregas
- ✅ Histórico básico
- ✅ Dados dos últimos 30 dias

**Use quando**: Quiser apenas validar funcionalidade básica

---

## 🚀 Como Executar

### Opção 1: Via psql (PostgreSQL CLI)

```bash
# Conectar ao banco
psql -U postgres -d nexus_transit

# Executar script completo
\i scripts/seed-dashboard-data.sql

# OU executar script mínimo
\i scripts/seed-minimal-data.sql
```

### Opção 2: Via pgAdmin

1. Abra o **pgAdmin**
2. Conecte ao banco `nexus_transit`
3. Clique com botão direito no banco → **Query Tool**
4. Abra o arquivo `seed-dashboard-data.sql` ou `seed-minimal-data.sql`
5. Clique em **Execute** (F5)

### Opção 3: Via DBeaver

1. Abra o **DBeaver**
2. Conecte ao banco `nexus_transit`
3. Clique com botão direito no banco → **SQL Editor** → **New SQL Script**
4. Cole o conteúdo do script
5. Clique em **Execute SQL Script** (Ctrl+Enter)

### Opção 4: Via Linha de Comando

```bash
# Executar script completo
psql -U postgres -d nexus_transit -f scripts/seed-dashboard-data.sql

# Executar script mínimo
psql -U postgres -d nexus_transit -f scripts/seed-minimal-data.sql
```

### Opção 5: Via Docker (se estiver usando container)

```bash
# Copiar arquivo para dentro do container
docker cp scripts/seed-dashboard-data.sql postgres_container:/tmp/

# Executar dentro do container
docker exec -it postgres_container psql -U postgres -d nexus_transit -f /tmp/seed-dashboard-data.sql
```

---

## 📊 Dados Gerados

### Status das Entregas

| Status | Quantidade | Percentual |
|--------|-----------|-----------|
| DELIVERED | ~90 | 75% |
| FAILED | ~12 | 10% |
| IN_TRANSIT | ~8 | 7% |
| OUT_FOR_DELIVERY | ~5 | 4% |
| PENDING | ~5 | 4% |

### Status das Rotas

| Status | Quantidade |
|--------|-----------|
| COMPLETED | 30 |
| IN_PROGRESS | 5 |
| PLANNED | 5 |

### Status dos Motoristas

| Status | Quantidade |
|--------|-----------|
| AVAILABLE | 3-4 |
| ON_ROUTE | 1 |
| UNAVAILABLE | 1 |

### Status dos Veículos

| Status | Quantidade |
|--------|-----------|
| ACTIVE | 3-4 |
| IN_ROUTE | 1 |
| MAINTENANCE | 1 |

---

## 🧹 Limpeza de Dados

Se quiser limpar os dados e recomeçar:

```sql
-- ⚠️ ATENÇÃO: Isso irá deletar TODOS os dados!

TRUNCATE TABLE 
  delivery_attempts,
  delivery_status_history,
  deliveries,
  routes,
  vehicles,
  drivers,
  customers
CASCADE;

-- Resetar sequences (se aplicável)
-- ALTER SEQUENCE customers_id_seq RESTART WITH 1;
```

---

## 🔍 Verificação dos Dados

Após executar o script, você pode verificar:

```sql
-- Contagem total
SELECT 
  'Customers' as tabela, COUNT(*) as total FROM customers
UNION ALL
SELECT 'Drivers', COUNT(*) FROM drivers
UNION ALL
SELECT 'Vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'Routes', COUNT(*) FROM routes
UNION ALL
SELECT 'Deliveries', COUNT(*) FROM deliveries;

-- Estatísticas de entregas
SELECT 
  status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM deliveries), 2) as percentual
FROM deliveries
GROUP BY status
ORDER BY total DESC;

-- Verificar dados do dashboard
SELECT 
  COUNT(*) FILTER (WHERE status = 'DELIVERED') as entregas_concluidas,
  COUNT(*) FILTER (WHERE status = 'FAILED') as entregas_falhas,
  COUNT(*) FILTER (WHERE status IN ('PENDING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY')) as em_andamento,
  ROUND(AVG(declared_value), 2) as valor_medio,
  ROUND(SUM(declared_value), 2) as valor_total
FROM deliveries;
```

---

## 🧪 Testando o Dashboard

Após popular os dados, teste os endpoints:

### 1. Overview Geral
```bash
curl http://localhost:3000/api/dashboard/overview?period=LAST_30_DAYS
```

### 2. Tendências
```bash
curl http://localhost:3000/api/dashboard/trends/deliveries?period=LAST_7_DAYS
```

### 3. Distribuição
```bash
curl http://localhost:3000/api/dashboard/distribution/delivery_status?period=LAST_30_DAYS
```

### 4. Rankings
```bash
curl http://localhost:3000/api/dashboard/ranking/drivers?period=LAST_30_DAYS
```

### 5. KPIs
```bash
curl http://localhost:3000/api/dashboard/kpis/deliveries?period=LAST_30_DAYS
curl http://localhost:3000/api/dashboard/kpis/financial?period=LAST_30_DAYS
curl http://localhost:3000/api/dashboard/kpis/performance?period=LAST_30_DAYS
curl http://localhost:3000/api/dashboard/kpis/fleet?period=LAST_30_DAYS
```

---

## 🐛 Troubleshooting

### Erro: "relation does not exist"
- **Causa**: Tabelas não foram criadas pelas migrations
- **Solução**: Execute `npm run migration:run` primeiro

### Erro: "duplicate key value"
- **Causa**: Dados já existem no banco
- **Solução**: Execute o script de limpeza acima ou use `ON CONFLICT DO NOTHING`

### Erro: "permission denied"
- **Causa**: Usuário não tem permissão
- **Solução**: Use usuário com permissões de WRITE ou conecte como `postgres`

### Dados não aparecem no dashboard
- **Causa**: Datas podem estar fora do período selecionado
- **Solução**: Verifique os filtros de período no endpoint

---

## 📈 Métricas Esperadas (Aproximadas)

Com o script completo você deve ver:

| Métrica | Valor Esperado |
|---------|---------------|
| Total de Entregas | 120 |
| Taxa de Sucesso | ~75% |
| Taxa de Falha | ~10% |
| Entregas em Andamento | ~15% |
| Motoristas Ativos | 4-5 |
| Veículos Operacionais | 4 |
| Receita Total | ~R$ 45.000 |
| Valor Médio por Entrega | ~R$ 375 |

---

## 💡 Dicas

1. **Execute primeiro o script mínimo** para validar que tudo funciona
2. **Depois execute o completo** para testes mais robustos
3. **Ajuste as datas** nos scripts se quiser dados mais recentes/antigos
4. **Modifique os valores** de peso, volume, preço conforme necessário
5. **Adicione mais dados** duplicando os loops `generate_series` ou `FOR`

---

## 🔄 Regenerar Dados

Para gerar novos dados sem duplicar:

```sql
-- Limpar tudo
TRUNCATE TABLE delivery_attempts, delivery_status_history, deliveries, routes, vehicles, drivers, customers CASCADE;

-- Executar script novamente
\i scripts/seed-dashboard-data.sql
```

---

**✅ Pronto!** Agora você tem dados suficientes para testar todas as funcionalidades do dashboard! 🎉
