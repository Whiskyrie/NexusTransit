-- ==================================================
-- Script de Verificação e Preparação do Banco
-- Execute ANTES dos scripts de seed
-- ==================================================

-- Verificar se as tabelas existem
DO $$
BEGIN
    -- Verificar tabelas principais
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        RAISE EXCEPTION 'ERRO: Tabelas não encontradas! Execute as migrations primeiro: npm run migration:run';
    END IF;
    
    RAISE NOTICE '✅ Todas as tabelas necessárias existem!';
END $$;

-- Listar todas as tabelas do sistema
SELECT 
    'Tabelas Disponíveis:' as info,
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT IN ('nexus_migrations', 'typeorm_metadata')
ORDER BY table_name;

-- Verificar quantidade de registros atual
SELECT 'Registros Atuais:' as info;
SELECT 
    'customers' as tabela, 
    COALESCE((SELECT COUNT(*) FROM customers), 0) as total
UNION ALL
SELECT 'drivers', COALESCE((SELECT COUNT(*) FROM drivers), 0)
UNION ALL
SELECT 'vehicles', COALESCE((SELECT COUNT(*) FROM vehicles), 0)
UNION ALL
SELECT 'routes', COALESCE((SELECT COUNT(*) FROM routes), 0)
UNION ALL
SELECT 'deliveries', COALESCE((SELECT COUNT(*) FROM deliveries), 0);
