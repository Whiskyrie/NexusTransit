#!/bin/bash

# =================================
# NexusTransit Docker Development Script
# =================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Show help
show_help() {
    echo "NexusTransit Docker Development Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  up          Start all services in development mode"
    echo "  down        Stop all services"
    echo "  restart     Restart all services"
    echo "  build       Build/rebuild all services"
    echo "  logs        Show logs for all services"
    echo "  logs-api    Show logs for API service only"
    echo "  logs-db     Show logs for database services"
    echo "  shell       Open shell in API container"
    echo "  db-shell    Open PostgreSQL shell"
    echo "  redis-cli   Open Redis CLI"
    echo "  clean       Clean up containers, images and volumes"
    echo "  status      Show status of all containers"
    echo "  tools       Start pgAdmin and Redis Commander"
    echo "  help        Show this help message"
    echo ""
}

# Start services
start_services() {
    print_info "Starting NexusTransit development environment..."
    docker compose up -d postgres redis
    print_success "Database services started"
    
    print_info "Building and starting API..."
    docker compose up --build api
}

# Stop services
stop_services() {
    print_info "Stopping all services..."
    docker compose down
    print_success "All services stopped"
}

# Restart services
restart_services() {
    print_info "Restarting services..."
    docker compose restart
    print_success "Services restarted"
}

# Build services
build_services() {
    print_info "Building services..."
    docker compose build --no-cache
    print_success "Services built"
}

# Show logs
show_logs() {
    docker compose logs -f "$@"
}

# Open shell in API container
open_shell() {
    print_info "Opening shell in API container..."
    docker compose exec api sh
}

# Open database shell
open_db_shell() {
    print_info "Opening PostgreSQL shell..."
    docker compose exec postgres psql -U nexus_user -d nexustransit_dev
}

# Open Redis CLI
open_redis_cli() {
    print_info "Opening Redis CLI..."
    docker compose exec redis redis-cli
}

# Clean up
clean_up() {
    print_warning "This will remove all containers, images and volumes!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleaning up..."
        docker compose down -v --remove-orphans
        docker system prune -af
        print_success "Cleanup completed"
    else
        print_info "Cleanup cancelled"
    fi
}

# Show status
show_status() {
    print_info "Container status:"
    docker compose ps
    echo ""
    print_info "Docker system info:"
    docker system df
}

# Start tools
start_tools() {
    print_info "Starting development tools (pgAdmin and Redis Commander)..."
    docker compose --profile tools up -d pgadmin redis-commander
    print_success "Tools started"
    print_info "pgAdmin: http://localhost:8080 (admin@nexustransit.com / admin123)"
    print_info "Redis Commander: http://localhost:8081"
}

# Main script logic
case "${1:-help}" in
    up)
        check_docker
        start_services
        ;;
    down)
        check_docker
        stop_services
        ;;
    restart)
        check_docker
        restart_services
        ;;
    build)
        check_docker
        build_services
        ;;
    logs)
        show_logs
        ;;
    logs-api)
        show_logs api
        ;;
    logs-db)
        show_logs postgres redis
        ;;
    shell)
        check_docker
        open_shell
        ;;
    db-shell)
        check_docker
        open_db_shell
        ;;
    redis-cli)
        check_docker
        open_redis_cli
        ;;
    clean)
        check_docker
        clean_up
        ;;
    status)
        check_docker
        show_status
        ;;
    tools)
        check_docker
        start_tools
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
