#!/bin/bash
# Script para gerenciar o ambiente de desenvolvimento do NexusTransit

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para mostrar help
show_help() {
    echo -e "${BLUE}NexusTransit Development Environment Manager${NC}"
    echo ""
    echo "Uso: ./dev.sh [COMANDO] [OPÇÕES]"
    echo ""
    echo "Comandos:"
    echo "  up        Inicia o ambiente de desenvolvimento"
    echo "  down      Para o ambiente de desenvolvimento"
    echo "  restart   Reinicia o ambiente de desenvolvimento"
    echo "  logs      Mostra logs dos containers"
    echo "  clean     Remove containers, volumes e imagens"
    echo "  build     Reconstrói as imagens"
    echo "  tools     Inicia ferramentas de administração (pgAdmin, Redis Commander)"
    echo "  db        Conecta ao banco PostgreSQL"
    echo "  redis     Conecta ao Redis CLI"
    echo "  help      Mostra esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  ./dev.sh up              # Inicia ambiente básico"
    echo "  ./dev.sh up --tools      # Inicia ambiente com ferramentas"
    echo "  ./dev.sh logs api        # Mostra logs apenas do serviço API"
    echo "  ./dev.sh clean --all     # Remove tudo incluindo volumes"
}

# Verificar se Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Docker não está rodando. Inicie o Docker e tente novamente.${NC}"
        exit 1
    fi
}

# Verificar se .env existe
check_env() {
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}Arquivo .env não encontrado. Copiando de .env.example...${NC}"
        cp .env.example .env
        echo -e "${GREEN}Arquivo .env criado. Configure as variáveis se necessário.${NC}"
    fi
}

# Comando UP
cmd_up() {
    echo -e "${BLUE}Iniciando ambiente de desenvolvimento NexusTransit...${NC}"
    
    check_docker
    check_env
    
    if [[ "$1" == "--tools" ]]; then
        docker-compose --profile tools up -d
        echo -e "${GREEN}Ambiente iniciado com ferramentas de administração!${NC}"
        echo -e "${YELLOW}pgAdmin: http://localhost:8080${NC}"
        echo -e "${YELLOW}Redis Commander: http://localhost:8081${NC}"
    else
        docker-compose up -d
        echo -e "${GREEN}Ambiente de desenvolvimento iniciado!${NC}"
    fi
    
    echo -e "${YELLOW}API: http://localhost:3000${NC}"
    echo -e "${YELLOW}Use './dev.sh logs' para ver os logs${NC}"
}

# Comando DOWN
cmd_down() {
    echo -e "${BLUE}Parando ambiente de desenvolvimento...${NC}"
    docker-compose --profile tools down
    echo -e "${GREEN}Ambiente parado!${NC}"
}

# Comando RESTART
cmd_restart() {
    echo -e "${BLUE}Reiniciando ambiente de desenvolvimento...${NC}"
    cmd_down
    sleep 2
    cmd_up $1
}

# Comando LOGS
cmd_logs() {
    if [ -n "$1" ]; then
        docker-compose logs -f "$1"
    else
        docker-compose logs -f
    fi
}

# Comando CLEAN
cmd_clean() {
    echo -e "${YELLOW}Limpando ambiente Docker...${NC}"
    
    if [[ "$1" == "--all" ]]; then
        echo -e "${RED}Removendo TUDO (containers, volumes, imagens)...${NC}"
        docker-compose --profile tools down -v --rmi all
    else
        echo -e "${YELLOW}Removendo containers...${NC}"
        docker-compose --profile tools down
    fi
    
    echo -e "${GREEN}Limpeza concluída!${NC}"
}

# Comando BUILD
cmd_build() {
    echo -e "${BLUE}Reconstruindo imagens...${NC}"
    docker-compose build --no-cache
    echo -e "${GREEN}Imagens reconstruídas!${NC}"
}

# Comando TOOLS
cmd_tools() {
    echo -e "${BLUE}Iniciando ferramentas de administração...${NC}"
    docker-compose --profile tools up -d pgadmin redis-commander
    echo -e "${GREEN}Ferramentas iniciadas!${NC}"
    echo -e "${YELLOW}pgAdmin: http://localhost:8080${NC}"
    echo -e "${YELLOW}Redis Commander: http://localhost:8081${NC}"
}

# Comando DB
cmd_db() {
    echo -e "${BLUE}Conectando ao PostgreSQL...${NC}"
    docker-compose exec postgres psql -U nexus_user -d nexustransit_dev
}

# Comando REDIS
cmd_redis() {
    echo -e "${BLUE}Conectando ao Redis CLI...${NC}"
    docker-compose exec redis redis-cli
}

# Main switch
case "$1" in
    "up")
        cmd_up $2
        ;;
    "down")
        cmd_down
        ;;
    "restart")
        cmd_restart $2
        ;;
    "logs")
        cmd_logs $2
        ;;
    "clean")
        cmd_clean $2
        ;;
    "build")
        cmd_build
        ;;
    "tools")
        cmd_tools
        ;;
    "db")
        cmd_db
        ;;
    "redis")
        cmd_redis
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        echo -e "${RED}Comando não reconhecido: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
