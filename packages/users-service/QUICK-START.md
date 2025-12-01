# 🚀 Quick Start - NexusTransit Users Service

## ⚡ Inicialização Rápida (3 comandos)

```bash
# 1. Instalar dependências (JÁ FEITO ✅)
npm install --legacy-peer-deps

# 2. Subir PostgreSQL
docker-compose up -d postgres_users

# 3. Executar migration
npm run migration:run
```

## 🔍 Verificar Status

### Verificar PostgreSQL

```bash
# Ver status do container
docker-compose ps postgres_users

# Conectar no banco
docker exec -it nexustransit-users-db psql -U nexustransit_users -d nexustransit_users_db

# Dentro do psql:
\dt          # Listar tabelas
\d users     # Ver estrutura da tabela users
\dT          # Ver tipos ENUM
\q           # Sair
```

### Verificar Migrations

```bash
# Ver migrations pendentes
npm run typeorm -- migration:show -d src/database/data-source.ts

# Executar migrations
npm run migration:run

# Reverter última migration (se necessário)
npm run migration:revert
```

## 🎯 Iniciar o Serviço

### Modo Desenvolvimento (watch mode)

```bash
npm run start:dev
```

### Modo Debug

```bash
npm run start:debug
```

### Modo Produção

```bash
npm run build
npm run start:prod
```

## 📊 Testar Endpoints

### Swagger UI

Abra no navegador: http://localhost:3003/api/docs

### Criar Usuário (via curl)

```bash
curl -X POST http://localhost:3003/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nexustransit.com",
    "password": "Admin123!",
    "first_name": "Admin",
    "last_name": "NexusTransit",
    "phone": "+5511999887766",
    "user_type": "admin",
    "status": "active"
  }'
```

### Listar Usuários

```bash
curl http://localhost:3003/api/users
```

### Buscar Usuário por ID

```bash
# Substituir {id} pelo UUID retornado na criação
curl http://localhost:3003/api/users/{id}
```

### Atualizar Usuário

```bash
curl -X PATCH http://localhost:3003/api/users/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5511988776655"
  }'
```

### Soft Delete

```bash
curl -X DELETE http://localhost:3003/api/users/{id}
```

## 🐛 Troubleshooting

### Problema: Porta 5433 em uso

```bash
# Ver processos na porta
netstat -ano | findstr :5433

# Parar container PostgreSQL
docker-compose down postgres_users

# Mudar porta no .env e docker-compose.yml
```

### Problema: Migration já executada

```bash
# Ver status das migrations
npm run typeorm -- migration:show -d src/database/data-source.ts

# Reverter se necessário
npm run migration:revert
```

### Problema: Tabela já existe

```bash
# Conectar no PostgreSQL
docker exec -it nexustransit-users-db psql -U nexustransit_users -d nexustransit_users_db

# Dropar tabela (CUIDADO!)
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS migrations;

# Executar migration novamente
npm run migration:run
```

### Problema: Erros de lint/build

```bash
# Limpar cache
rm -rf node_modules dist
npm cache clean --force
npm install --legacy-peer-deps

# Rebuild
npm run build
```

## 📝 Logs

### Ver logs do serviço

```bash
# Se rodando com docker-compose
docker-compose logs -f users_service
```

### Ver logs do PostgreSQL

```bash
docker-compose logs -f postgres_users
```

## 🔄 Recomeçar do Zero

```bash
# Parar tudo
docker-compose down

# Remover volumes (apaga dados!)
docker-compose down -v

# Subir PostgreSQL novamente
docker-compose up -d postgres_users

# Executar migration
npm run migration:run

# Iniciar serviço
npm run start:dev
```

## ✅ Checklist de Inicialização

- [x] Dependências instaladas (`npm install --legacy-peer-deps`)
- [ ] PostgreSQL rodando (`docker-compose up -d postgres_users`)
- [ ] Health check passou (`docker-compose ps`)
- [ ] Migration executada (`npm run migration:run`)
- [ ] Tabela `users` criada (verificar com `\dt`)
- [ ] Serviço iniciado (`npm run start:dev`)
- [ ] Swagger acessível (http://localhost:3003/api/docs)
- [ ] Endpoint testado (criar 1 usuário)

## 🎯 Próximos Passos

1. **Testar todos os endpoints**: Criar, listar, buscar, atualizar, deletar
2. **Validar fidelidade**: Comparar respostas com monólito
3. **Implementar testes de contrato**: Pact (Fase 2)
4. **Configurar dual-write**: Escrever em ambos (Fase 2)
5. **Documentar métricas**: Prometheus + Grafana (Fase 2)

---

**Status Atual**: ✅ Dependências instaladas - Pronto para subir PostgreSQL
**Próximo Comando**: `docker-compose up -d postgres_users`
