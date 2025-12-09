#!/usr/bin/env fish

# Script para gerenciar migrations do NexusTransit API
# Uso: ./migration.sh [comando]
# Comandos:
#   run      - Executa todas as migrations pendentes
#   revert   - Reverte a última migration executada
#   show     - Mostra o status de todas as migrations
#   create   - Cria uma nova migration (requer nome como segundo argumento)

set -l COMMAND $argv[1]
set -l NAME $argv[2]

cd (dirname (status -f))

function run_migration
    echo "🚀 Executando migrations..."
    pnpm typeorm migration:run
end

function revert_migration
    echo "⏪ Revertendo última migration..."
    pnpm typeorm migration:revert
end

function show_migrations
    echo "📋 Status das migrations:"
    pnpm typeorm migration:show
end

function create_migration
    if test -z "$NAME"
        echo "❌ Erro: Nome da migration é obrigatório"
        echo "Uso: ./migration.sh create NomeDaMigration"
        exit 1
    end
    
    echo "✨ Criando nova migration: $NAME"
    pnpm typeorm migration:create "src/database/migrations/$NAME"
end

switch $COMMAND
    case run
        run_migration
    case revert
        revert_migration
    case show
        show_migrations
    case create
        create_migration
    case '*'
        echo "❌ Comando inválido: $COMMAND"
        echo ""
        echo "Uso: ./migration.sh [comando]"
        echo ""
        echo "Comandos disponíveis:"
        echo "  run      - Executa todas as migrations pendentes"
        echo "  revert   - Reverte a última migration executada"
        echo "  show     - Mostra o status de todas as migrations"
        echo "  create   - Cria uma nova migration (requer nome)"
        echo ""
        echo "Exemplo:"
        echo "  ./migration.sh run"
        echo "  ./migration.sh create CreateUsersTable"
        exit 1
end
