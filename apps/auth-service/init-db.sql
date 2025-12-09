-- Script de inicialização do banco de dados
-- Cria o schema auth para o auth-service

-- Criar schema auth se não existir
CREATE SCHEMA IF NOT EXISTS auth;

-- Criar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA auth TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO postgres;

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Schema auth criado com sucesso!';
    RAISE NOTICE 'Execute as migrations com: pnpm migration:run';
END $$;
