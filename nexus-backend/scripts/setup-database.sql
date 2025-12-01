-- ============================================================================
-- Script de Setup do Banco de Dados NexusTransit
-- ============================================================================
-- Este script cria o banco de dados e as extensões necessárias
--
-- COMO USAR:
-- Execute este script conectado ao banco 'postgres':
-- psql -U postgres -d postgres -f scripts/setup-database.sql
--
-- Ou usando Docker:
-- docker exec -i postgres psql -U postgres -d postgres < scripts/setup-database.sql
-- ============================================================================

-- Encerrar conexões existentes com o banco (se houver)
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'nexustransit'
  AND pid <> pg_backend_pid();

-- Dropar banco se existir (CUIDADO: isso apaga todos os dados!)
DROP DATABASE IF EXISTS nexustransit;

-- Criar banco de dados
CREATE DATABASE nexustransit
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'pt_BR.UTF-8'
    LC_CTYPE = 'pt_BR.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Mensagem de sucesso
\echo '✅ Banco de dados "nexustransit" criado com sucesso!'
\echo ''
\echo '📋 Próximos passos:'
\echo '1. Execute as migrations: npm run migration:run'
\echo '2. Verifique as tabelas: npm run migration:show'
\echo '3. Popule com dados de teste: psql -U postgres -d nexustransit -f scripts/seed-dashboard-data.sql'
\echo ''
