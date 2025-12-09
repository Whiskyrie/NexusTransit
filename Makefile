.PHONY: help install build dev clean test lint format docker-up docker-down migration-run setup

# Cores para output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## 📖 Mostrar esta mensagem de ajuda
	@echo "$(BLUE)NexusTransit - Comandos Disponíveis$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

setup: ## 🚀 Setup inicial completo (primeira vez)
	@echo "$(BLUE)Executando setup inicial...$(NC)"
	@./setup.sh

install: ## 📦 Instalar dependências
	@echo "$(BLUE)Instalando dependências...$(NC)"
	@pnpm install

build: ## 🔨 Build de todos os pacotes
	@echo "$(BLUE)Buildando pacotes...$(NC)"
	@pnpm build

clean: ## 🧹 Limpar node_modules e builds
	@echo "$(YELLOW)Limpando arquivos...$(NC)"
	@pnpm clean

clean-build: ## 🗑️  Limpar apenas builds
	@echo "$(YELLOW)Limpando builds...$(NC)"
	@pnpm clean:build

dev: ## 🚀 Iniciar todos os serviços em modo dev
	@echo "$(GREEN)Iniciando todos os serviços...$(NC)"
	@pnpm dev

dev-api: ## 🌐 Iniciar apenas API
	@echo "$(GREEN)Iniciando API...$(NC)"
	@pnpm dev:api

dev-auth: ## 🔐 Iniciar apenas Auth Service
	@echo "$(GREEN)Iniciando Auth Service...$(NC)"
	@pnpm dev:auth

test: ## 🧪 Executar testes
	@echo "$(BLUE)Executando testes...$(NC)"
	@pnpm test

test-cov: ## 📊 Executar testes com cobertura
	@echo "$(BLUE)Executando testes com cobertura...$(NC)"
	@pnpm test:cov

lint: ## 🔍 Executar lint
	@echo "$(BLUE)Executando lint...$(NC)"
	@pnpm lint

format: ## ✨ Formatar código
	@echo "$(BLUE)Formatando código...$(NC)"
	@pnpm format

docker-up: ## 🐳 Subir containers Docker
	@echo "$(GREEN)Subindo containers Docker...$(NC)"
	@docker-compose -f docker-compose.dev.yml up -d

docker-down: ## ⬇️  Parar containers Docker
	@echo "$(YELLOW)Parando containers Docker...$(NC)"
	@docker-compose -f docker-compose.dev.yml down

docker-logs: ## 📜 Ver logs do Docker
	@docker-compose -f docker-compose.dev.yml logs -f

docker-rebuild: ## 🔄 Rebuild containers Docker
	@echo "$(BLUE)Rebuilding containers...$(NC)"
	@docker-compose -f docker-compose.dev.yml up -d --build

migration-generate-api: ## 📝 Gerar migration da API
	@read -p "Nome da migration: " name; \
	cd apps/api && pnpm migration:generate -- $$name

migration-run-api: ## ▶️  Executar migrations da API
	@echo "$(GREEN)Executando migrations da API...$(NC)"
	@cd apps/api && pnpm migration:run

migration-revert-api: ## ⏮️  Reverter última migration da API
	@echo "$(YELLOW)Revertendo última migration da API...$(NC)"
	@cd apps/api && pnpm migration:revert

migration-generate-auth: ## 📝 Gerar migration do Auth Service
	@read -p "Nome da migration: " name; \
	cd apps/auth-service && pnpm migration:generate -- $$name

migration-run-auth: ## ▶️  Executar migrations do Auth Service
	@echo "$(GREEN)Executando migrations do Auth Service...$(NC)"
	@cd apps/auth-service && pnpm migration:run

migration-revert-auth: ## ⏮️  Reverter última migration do Auth Service
	@echo "$(YELLOW)Revertendo última migration do Auth Service...$(NC)"
	@cd apps/auth-service && pnpm migration:revert

db-reset-api: ## 🔄 Reset database da API (CUIDADO!)
	@echo "$(RED)⚠️  ATENÇÃO: Isso irá apagar todos os dados da API!$(NC)"
	@read -p "Confirma? (y/N) " confirm; \
	if [ "$$confirm" = "y" ]; then \
		cd apps/api && pnpm migration:revert:all && pnpm migration:run; \
		echo "$(GREEN)Database resetado!$(NC)"; \
	fi

db-reset-auth: ## 🔄 Reset database do Auth Service (CUIDADO!)
	@echo "$(RED)⚠️  ATENÇÃO: Isso irá apagar todos os dados do Auth!$(NC)"
	@read -p "Confirma? (y/N) " confirm; \
	if [ "$$confirm" = "y" ]; then \
		cd apps/auth-service && pnpm migration:revert:all && pnpm migration:run; \
		echo "$(GREEN)Database resetado!$(NC)"; \
	fi

seed: ## 🌱 Popular banco com dados de teste
	@echo "$(BLUE)Populando banco de dados...$(NC)"
	@pnpm seed

logs-api: ## 📜 Ver logs da API
	@docker-compose -f docker-compose.dev.yml logs -f api

logs-auth: ## 📜 Ver logs do Auth Service
	@docker-compose -f docker-compose.dev.yml logs -f auth-service

health: ## ❤️  Verificar health dos serviços
	@echo "$(BLUE)Verificando saúde dos serviços...$(NC)"
	@echo "API: " && curl -s http://localhost:3000/health | jq || echo "$(RED)Offline$(NC)"
	@echo "Auth: " && curl -s http://localhost:3001/health | jq || echo "$(RED)Offline$(NC)"

docs: ## 📚 Abrir documentação Swagger
	@echo "$(GREEN)Abrindo documentação...$(NC)"
	@echo "API: http://localhost:3000/api/docs"
	@echo "Auth: http://localhost:3001/api/docs"
	@xdg-open http://localhost:3000/api/docs 2>/dev/null || open http://localhost:3000/api/docs 2>/dev/null || echo "Abra manualmente"

info: ## ℹ️  Informações do projeto
	@echo "$(BLUE)NexusTransit - Informações$(NC)"
	@echo ""
	@echo "$(GREEN)Node:$(NC) $$(node --version)"
	@echo "$(GREEN)pnpm:$(NC) $$(pnpm --version)"
	@echo "$(GREEN)Docker:$(NC) $$(docker --version 2>/dev/null || echo 'não instalado')"
	@echo ""
	@echo "$(GREEN)Aplicações:$(NC)"
	@echo "  - API: http://localhost:3000"
	@echo "  - Auth: http://localhost:3001"
	@echo ""
	@echo "$(GREEN)Documentação:$(NC)"
	@echo "  - DEVELOPMENT.md"
	@echo "  - QUICKSTART.md"
	@echo "  - copilot-instructions.md"

.DEFAULT_GOAL := help
