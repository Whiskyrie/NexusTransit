-- =============================================================================
-- NexusTransit - Script de Criação de Schemas para Microserviços
-- =============================================================================
-- Este script cria todos os schemas necessários para a arquitetura de
-- microserviços do NexusTransit, seguindo o padrão de isolamento lógico
-- via schemas PostgreSQL (Multi-Schema PostgreSQL).
--
-- Database: nexustransit_dev (único banco físico)
-- Referência: docs/microservices-migration-plan.md
-- =============================================================================
-- Criar extensões globais no schema public
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA public;
-- =============================================================================
-- SCHEMAS POR SERVIÇO (Isolamento Lógico)
-- =============================================================================
-- 1. AUTH SCHEMA - auth-service
-- Responsável por: Autenticação, usuários, roles, permissões
CREATE SCHEMA IF NOT EXISTS auth;
COMMENT ON SCHEMA auth IS 'Schema para o microserviço de autenticação - users, roles, permissions, tokens';
-- 2. CUSTOMERS SCHEMA - customers-service  
-- Responsável por: Gestão de clientes e endereços
CREATE SCHEMA IF NOT EXISTS customers;
COMMENT ON SCHEMA customers IS 'Schema para o microserviço de clientes - customers, addresses, contacts';
-- 3. OPERATIONS SCHEMA - operations-service
-- Responsável por: Veículos, motoristas, rotas, entregas
CREATE SCHEMA IF NOT EXISTS operations;
COMMENT ON SCHEMA operations IS 'Schema para o microserviço de operações - vehicles, drivers, routes, deliveries';
-- 4. MONITORING SCHEMA - monitoring-service
-- Responsável por: Tracking, telemetria, eventos
CREATE SCHEMA IF NOT EXISTS monitoring;
COMMENT ON SCHEMA monitoring IS 'Schema para o microserviço de monitoramento - tracking, telemetry, events';
-- 5. COMPLIANCE SCHEMA - compliance-service
-- Responsável por: LGPD, auditoria, consentimentos
CREATE SCHEMA IF NOT EXISTS compliance;
COMMENT ON SCHEMA compliance IS 'Schema para o microserviço de compliance - audit_logs, consents, data_privacy';
-- 6. INCIDENTS SCHEMA - incidents-service (opcional)
-- Responsável por: Gestão de incidentes e ocorrências
CREATE SCHEMA IF NOT EXISTS incidents;
COMMENT ON SCHEMA incidents IS 'Schema para o microserviço de incidentes - incidents, reports, alerts';
-- 7. REPORTS SCHEMA - reports-service (opcional)
-- Responsável por: Relatórios e analytics
CREATE SCHEMA IF NOT EXISTS reports;
COMMENT ON SCHEMA reports IS 'Schema para o microserviço de relatórios - reports, dashboards, analytics';
-- =============================================================================
-- PERMISSÕES
-- =============================================================================
-- Grant permissões para o usuário postgres em todos os schemas
GRANT ALL PRIVILEGES ON SCHEMA auth TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA customers TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA operations TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA monitoring TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA compliance TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA incidents TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA reports TO postgres;
-- Grant permissões em todas as tabelas (atuais e futuras)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA customers TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA operations TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA monitoring TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA compliance TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA incidents TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA reports TO postgres;
-- Grant permissões em todas as sequências
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA customers TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA operations TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA monitoring TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA compliance TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA incidents TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA reports TO postgres;
-- =============================================================================
-- DEFAULT PRIVILEGES (para tabelas criadas no futuro)
-- =============================================================================
ALTER DEFAULT PRIVILEGES IN SCHEMA auth
GRANT ALL PRIVILEGES ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA customers
GRANT ALL PRIVILEGES ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA operations
GRANT ALL PRIVILEGES ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA monitoring
GRANT ALL PRIVILEGES ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA compliance
GRANT ALL PRIVILEGES ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA incidents
GRANT ALL PRIVILEGES ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA reports
GRANT ALL PRIVILEGES ON TABLES TO postgres;
-- =============================================================================
-- VERIFICAÇÃO
-- =============================================================================
DO $$
DECLARE schema_count INTEGER;
BEGIN
SELECT COUNT(*) INTO schema_count
FROM information_schema.schemata
WHERE schema_name IN (
        'auth',
        'customers',
        'operations',
        'monitoring',
        'compliance',
        'incidents',
        'reports'
    );
RAISE NOTICE '';
RAISE NOTICE '============================================';
RAISE NOTICE '  NexusTransit Schemas - Setup Completo!   ';
RAISE NOTICE '============================================';
RAISE NOTICE '';
RAISE NOTICE 'Schemas criados: % de 7',
schema_count;
RAISE NOTICE '';
RAISE NOTICE 'Estrutura de Microserviços:';
RAISE NOTICE '  - auth       : Autenticação e Usuários';
RAISE NOTICE '  - customers  : Gestão de Clientes';
RAISE NOTICE '  - operations : Veículos, Rotas, Entregas';
RAISE NOTICE '  - monitoring : Tracking e Telemetria';
RAISE NOTICE '  - compliance : LGPD e Auditoria';
RAISE NOTICE '  - incidents  : Gestão de Incidentes';
RAISE NOTICE '  - reports    : Relatórios e Analytics';
RAISE NOTICE '';
RAISE NOTICE 'Execute as migrations da API com:';
RAISE NOTICE '  cd apps/api && pnpm migration:run';
RAISE NOTICE '';
END $$;
-- Listar schemas criados
SELECT schema_name,
    catalog_name as database
FROM information_schema.schemata
WHERE schema_name NOT IN (
        'pg_catalog',
        'information_schema',
        'pg_toast',
        'public'
    )
ORDER BY schema_name;