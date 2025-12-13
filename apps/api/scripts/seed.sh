#!/usr/bin/env fish

# Script para gerenciar seeds do NexusTransit API
# Uso: ./seed.sh [comando] [seed-name]

set -l COMMAND $argv[1]
set -l SEED_NAME $argv[2]

cd (dirname (status -f))

function run_seed
    set -l seed $argv[1]
    
    if test -z "$seed"
        echo "❌ Erro: Nome do seed é obrigatório"
        echo "Uso: ./seed.sh run [seed-name]"
        exit 1
    end
    
    set -l seed_file "src/database/seeds/$seed.seed.ts"
    
    if not test -f $seed_file
        echo "❌ Erro: Seed não encontrado: $seed_file"
        exit 1
    end
    
    echo "🌱 Executando seed: $seed"
    ts-node --project tsconfig.migration.json -r tsconfig-paths/register $seed_file
end

function list_seeds
    echo "📋 Seeds disponíveis:"
    echo ""
    
    if test -d src/database/seeds
        for file in src/database/seeds/*.seed.ts
            set -l seed_name (basename $file .seed.ts)
            echo "  • $seed_name"
        end
    else
        echo "  Nenhum seed encontrado"
    end
end

function run_all_seeds
    echo "🌱 Executando todos os seeds..."
    echo ""
    
    if test -d src/database/seeds
        for file in src/database/seeds/*.seed.ts
            set -l seed_name (basename $file .seed.ts)
            echo "▶ Executando: $seed_name"
            ts-node --project tsconfig.migration.json -r tsconfig-paths/register $file
            echo ""
        end
        echo "✅ Todos os seeds executados!"
    else
        echo "❌ Diretório de seeds não encontrado"
        exit 1
    end
end

switch $COMMAND
    case run
        run_seed $SEED_NAME
    case list
        list_seeds
    case all
        run_all_seeds
    case '*'
        echo "❌ Comando inválido: $COMMAND"
        echo ""
        echo "Uso: ./seed.sh [comando] [seed-name]"
        echo ""
        echo "Comandos disponíveis:"
        echo "  run [seed-name]  - Executa um seed específico"
        echo "  list             - Lista todos os seeds disponíveis"
        echo "  all              - Executa todos os seeds"
        echo ""
        echo "Exemplo:"
        echo "  ./seed.sh run service-orders"
        echo "  ./seed.sh list"
        echo "  ./seed.sh all"
        exit 1
end
