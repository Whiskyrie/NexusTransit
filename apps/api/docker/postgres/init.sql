-- Inicialização do banco de dados NexusTransit
-- Este script é executado automaticamente quando o container PostgreSQL é criado
-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis" CASCADE;
-- Comentário sobre o banco
COMMENT ON DATABASE nexustransit_dev IS 'Sistema de Gerenciamento de Transporte (SGT) - NexusTransit';
-- Log de inicialização
DO $$ BEGIN RAISE NOTICE 'NexusTransit database initialized successfully!';
END $$;