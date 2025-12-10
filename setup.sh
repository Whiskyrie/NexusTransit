#!/usr/bin/env bash

# NexusTransit - Script de Setup Inicial
# Execute: chmod +x setup.sh && ./setup.sh

set -e

echo "🚀 Iniciando setup do NexusTransit..."
echo ""

# Verificar pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm não encontrado. Instalando..."
    npm install -g pnpm
    echo "✅ pnpm instalado com sucesso!"
else
    echo "✅ pnpm encontrado: $(pnpm --version)"
fi

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker não encontrado. Você precisará instalar Docker para usar containers."
    echo "   Visite: https://docs.docker.com/get-docker/"
else
    echo "✅ Docker encontrado: $(docker --version)"
fi

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
pnpm install

# Criar arquivos .env
echo ""
echo "📝 Configurando variáveis de ambiente..."

if [ ! -f "apps/api/.env" ]; then
    echo "   Copiando apps/api/.env.example -> apps/api/.env"
    cp apps/api/.env.example apps/api/.env
    echo "   ⚠️  Edite apps/api/.env com suas configurações!"
else
    echo "   ✅ apps/api/.env já existe"
fi

# Build
echo ""
echo "🔨 Buildando pacotes..."
pnpm build

echo ""
echo "✨ Setup concluído com sucesso!"
echo ""
echo "📚 Próximos passos:"
echo ""
echo "1. Revisar e configurar arquivo .env:"
echo "   - apps/api/.env"
echo ""
echo "2. Iniciar banco de dados:"
echo "   docker-compose -f docker-compose.dev.yml up -d postgres redis"
echo ""
echo "3. Executar migrations:"
echo "   cd apps/api && pnpm migration:run"
echo ""
echo "4. Iniciar aplicação:"
echo "   pnpm dev              # Todos os serviços"
echo "   pnpm dev:api          # Apenas API"
echo ""
echo "📖 Documentação completa: ./DEVELOPMENT.md"
echo "🚀 Guia rápido: ./QUICKSTART.md"
echo ""
