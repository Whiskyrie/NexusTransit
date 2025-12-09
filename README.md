# 🚚 NexusTransit

[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.6-EF4444?logo=turborepo)](https://turbo.build/)
[![pnpm](https://img.shields.io/badge/pnpm-9.0-F69220?logo=pnpm)](https://pnpm.io/)
[![Version](https://img.shields.io/badge/Version-1.0.0--MVP-blue.svg)]()

**Sistema de Gerenciamento de Transporte (SGT) - Monorepo NestJS**

> Sistema completo de gestão logística com rastreamento em tempo real, otimização de rotas e analytics avançado.

---

## 📋 Quick Links

- 📖 [Documentação Completa](./DEVELOPMENT.md)
- 🚀 [Guia Rápido](./QUICKSTART.md)
- 🏗️ [Padrões de Arquitetura](./.github/copilot-instructions.md)
- 📊 [API Docs - Swagger](http://localhost:3000/api/docs)

---

## Visão Geral

### Problemática

As empresas de transporte e logística enfrentam desafios críticos em seus processos operacionais:

- Atrasos frequentes nas entregas
- Ausência de rastreamento em tempo real  
- Baixa visibilidade sobre o desempenho da frota
- Dependência excessiva de processos manuais baseados em planilhas Excel
- Comunicação ineficiente via telefone/WhatsApp
- Retrabalho administrativo e ociosidade de veículos
- Dificuldades no cumprimento de SLA
- Impacto direto nos custos operacionais

### Solução

O NexusTransit oferece uma solução integrada que aborda cada um desses pontos de dor através de automação inteligente, interfaces modernas e ferramentas de análise avançadas.

## 🏗️ Arquitetura Monorepo

```
NexusTransit (Turborepo + pnpm)
│
├── apps/
│   ├── api/              # 🚀 API Principal (NestJS) - Porta 3000
│   └── auth-service/     # 🔐 Microserviço de Auth - Porta 3001
│
└── packages/
    └── common/           # 📦 Código compartilhado
        ├── database/     # BaseEntity, TypeORM utils
        ├── dto/          # DTOs compartilhados
        ├── interfaces/   # TypeScript interfaces
        ├── enums/        # Enumerações
        └── transformers/ # Point transformer (PostGIS)
```

**Stack Tecnológica:**
- ⚡ NestJS 11.x + TypeScript 5.7 (Strict)
- 🗄️ PostgreSQL 15 + PostGIS 3.4
- 🔄 TypeORM 0.3.26
- 💾 Redis 7 (Cache)
- 🚀 Turborepo 2.6 + pnpm 9.0
- 🐳 Docker + Docker Compose

---

## 🚀 Quick Start

### Opção 1: Docker (Recomendado)

```bash
# Clonar e configurar
git clone <repo-url>
cd NexusTransit

# Copiar variáveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/auth-service/.env.example apps/auth-service/.env

# Iniciar todos os serviços
docker-compose -f docker-compose.dev.yml up -d

# Acessar aplicações
# API: http://localhost:3000
# Auth: http://localhost:3001
# Swagger API: http://localhost:3000/api/docs
# Swagger Auth: http://localhost:3001/api/docs
```

### Opção 2: Local Development

```bash
# Instalar dependências
pnpm install

# Build de todos os pacotes
pnpm build

# Executar API
pnpm dev:api

# Executar Auth Service
pnpm dev:auth
```

📚 **Ver**: [QUICKSTART.md](./QUICKSTART.md) para mais detalhes

---

## 📦 Pacotes do Monorepo

| Pacote | Descrição | Status |
|--------|-----------|--------|
| `@nexus/api` | API principal com todos os módulos | ✅ Funcionando |
| `@nexus/auth-service` | Microserviço de autenticação | ✅ Funcionando |
| `@nexus/common` | Código compartilhado (DTOs, Entities, Utils) | ✅ Funcionando |

---

---

## 📚 Funcionalidades Principais

**Gestão de Recursos**
- Cadastro e gerenciamento de veículos, motoristas e rotas
- Sistema de permissões baseado em perfis de usuário
- Histórico completo de operações para auditoria

**Otimização de Rotas**  
- Planejamento automático de rotas com otimização básica
- Reatribuição emergencial de rotas e motoristas
- Respeitando janelas de entrega acordadas com clientes

**Rastreamento e Monitoramento**
- Rastreamento em tempo real com geolocalização GPS
- Atualizações de localização a cada 2 minutos quando online
- Dashboard operacional com indicadores de SLA

**Aplicação Mobile**
- Aplicativo nativo para motoristas (Android/iOS)
- Funcionalidade offline com sincronização automática
- Sistema de comprovação digital de entregas (foto + assinatura)
- Registro de ocorrências com geolocalização

**Notificações e Relatórios**
- Sistema de notificações automáticas para clientes
- Relatórios de desempenho e entregas
- Alertas automáticos para ocorrências críticas
- Mapa de calor de entregas por região

## Especificações Técnicas

### Requisitos de Performance

| Métrica | Especificação |
|---------|--------------|
| Tempo de Resposta | ≤ 2s para consultas de rastreamento (p95) |
| Usuários Simultâneos | Até 50 usuários ativos |
| Capacidade de Processamento | 200 entregas/dia (MVP) |
| Disponibilidade | ≥ 99% durante horário comercial |
| Tempo de Recuperação (RTO) | ≤ 2 horas |
| Backup de Dados | Automático a cada 4 horas |

### Requisitos de Segurança

- **Autenticação**: Login/senha obrigatório com controle de sessão
- **Criptografia**: SSL/TLS para todas as comunicações
- **Auditoria**: Logs completos para todas as ações críticas do sistema
- **Conformidade**: Adequação à LGPD para dados pessoais
- **API Security**: Endpoints REST seguros com rate limiting

### Compatibilidade

- **Navegadores**: Chrome, Firefox, Safari, Edge (versões atuais)
- **Mobile**: Android 8.0+ e iOS 12.0+
- **Responsividade**: Desktop, tablet e mobile
- **Exportação**: Formatos CSV e Excel
- **Integração**: APIs REST para sistemas externos

## Stakeholders e Permissões

### Perfis de Acesso

**Gestor de Frota**
- Acesso completo aos dashboards e relatórios de desempenho
- Configurações do sistema e análise de custos operacionais
- Visão estratégica da operação

**Despachante/Operador**  
- Planejamento e reatribuição de rotas
- Monitoramento em tempo real das operações
- Aprovação de ajustes emergenciais

**Motorista**
- Aplicativo mobile para visualização de rotas
- Registro de ocorrências e confirmação de entregas
- Acesso a checklists e orientações operacionais

**Cliente Final**
- Portal de consulta para acompanhamento de entregas
- Confirmação de recebimento
- Histórico de pedidos

**Administrador do Sistema**
- Configuração de parâmetros técnicos
- Gestão de usuários e permissões
- Manutenção técnica da plataforma

## Regras de Negócio

### Operacionais
- Motorista pode ter apenas uma rota ativa por vez
- Alterações de rota após início da execução requerem aprovação do despachante
- Comprovação de entrega é obrigatória para finalização da ordem
- Sistema deve respeitar janelas de entrega acordadas com clientes

### Técnicas
- Dados de localização atualizados a cada 2 minutos quando online
- Ocorrências críticas geram alertas automáticos ao gestor
- Tolerância de atraso configurável por tipo de cliente (padrão: 15 minutos)

## Modelo de Dados

### Entidades Principais

```
Veículo: {placa, categoria, capacidade, status, motorista_atual}
Motorista: {matrícula, nome, CNH, telefone, status}
Rota: {id, data, veículo, motorista, status, pontos_entrega}
Ordem_Serviço: {numero, cliente, endereço, janela_entrega, status}
Entrega: {rota, ordem, timestamp, comprovação, observações}
Ocorrência: {tipo, descrição, localização, foto, timestamp}
Cliente: {codigo, razão_social, endereços, contatos, SLA}
```

## Instalação e Configuração

### Pré-requisitos

```bash
Node.js >= 16.0.0
PostgreSQL >= 12.0
Redis >= 6.0
Docker (opcional)
```

### Setup Local

```bash
# Clone o repositório
git clone https://github.com/organizacao/nexustransit.git
cd nexustransit

# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Execute as migrações
npm run migrate

# Seed inicial (opcional)
npm run seed

# Inicie o ambiente de desenvolvimento
npm run dev
```

### Configuração de Produção

```bash
# Build da aplicação
npm run build

# Inicie o servidor de produção
npm start

# Ou usando Docker
docker-compose up -d
```

## Roadmap de Desenvolvimento

### Fase 1 - MVP (Atual)
**Status: Em Desenvolvimento**

- Cadastros básicos (veículos, motoristas, clientes)
- Planejamento manual e automático de rotas
- Rastreamento GPS básico
- Aplicativo mobile para motoristas
- Comprovação digital de entregas
- Painel operacional simplificado

### Fase 2 - Versão 1.1
**Status: Planejado**

- Otimização avançada de rotas com algoritmos aprimorados
- Sistema completo de notificações automáticas para clientes
- Relatórios gerenciais detalhados e customizáveis
- Sistema de alertas configuráveis por tipo de evento
- Portal web completo para clientes

### Fase 3 - Versões Futuras
**Status: Backlog**

- Integração com sistemas de telemetria veicular
- Análises avançadas com inteligência artificial
- Aplicativo dedicado para clientes finais
- Sistema de avaliação e gamificação para motoristas
- Módulo de manutenção preventiva

### Fora do Escopo Atual

- Módulo financeiro completo
- Sistema de gestão de RH/folha de pagamento
- Gateway de pagamentos integrado
- Marketplace de fretes

## Testes e Qualidade

### Cobertura de Testes

```bash
# Executar suite de testes
npm test

# Testes com cobertura
npm run test:coverage

# Testes end-to-end
npm run test:e2e
```

### Qualidade de Código

```bash
# Linting
npm run lint

# Formatação
npm run format

# Análise de segurança
npm audit
```

## Contribuição

### Processo de Desenvolvimento

1. Fork do repositório
2. Criação de branch feature (`git checkout -b feature/nova-funcionalidade`)
3. Implementação seguindo os padrões estabelecidos
4. Testes unitários e de integração
5. Commit seguindo conventional commits
6. Push e abertura de Pull Request
7. Code review e aprovação
8. Merge para branch principal

### Padrões de Código

- ESLint configurado com regras do projeto
- Prettier para formatação consistente
- Conventional Commits para mensagens padronizadas
- Documentação obrigatória para novas funcionalidades

## Suporte e Documentação

### Recursos Disponíveis

- **Documentação Técnica**: `/docs`
- **API Reference**: `/docs/api`
- **Guias de Usuário**: `/docs/user-guides`
- **Troubleshooting**: `/docs/troubleshooting`

### Canais de Suporte

- **Issues**: GitHub Issues para bugs e feature requests
- **Discussions**: GitHub Discussions para dúvidas gerais
- **Wiki**: Documentação colaborativa do projeto

## Licença

Este projeto está licenciado sob a MIT License - consulte o arquivo [LICENSE](LICENSE) para detalhes completos.

## Equipe de Desenvolvimento

**Core Team**
- Evandro Filho - Lead Developer
- Marlon Meireles - Backend Developer  
- Luiz Gustavo - Frontend Developer
- Marco França - Mobile Developer

---

**NexusTransit** | Transformando a logística através da tecnologia

---

## 🛠️ Scripts de Desenvolvimento

```bash
# Monorepo (Raiz)
pnpm install          # Instalar todas as dependências
pnpm build            # Build completo (Turborepo)
pnpm dev              # Iniciar todos os serviços
pnpm dev:api          # Apenas API principal
pnpm dev:auth         # Apenas Auth Service
pnpm test             # Testes em todos os pacotes
pnpm lint             # Lint em todos os pacotes
pnpm clean            # Limpar node_modules e builds
pnpm clean:build      # Limpar apenas builds

# Trabalhando em Apps Específicas
cd apps/api
pnpm dev              # Iniciar API
pnpm build            # Build API
pnpm migration:run    # Executar migrations
pnpm migration:generate -- MigrationName  # Gerar migration
```

---

## 📖 Documentação Completa

- 📘 [DEVELOPMENT.md](./DEVELOPMENT.md) - Guia completo de desenvolvimento
- 🚀 [QUICKSTART.md](./QUICKSTART.md) - Setup rápido e comandos úteis
- 🏗️ [copilot-instructions.md](./.github/copilot-instructions.md) - Padrões de arquitetura

**APIs Swagger:**
- API Principal: http://localhost:3000/api/docs
- Auth Service: http://localhost:3001/api/docs

**Health Checks:**
- API: http://localhost:3000/health
- Auth: http://localhost:3001/health

---

## 🤝 Contribuindo

1. **Fork** o repositório
2. Crie uma **branch**: `git checkout -b feature/minha-feature`
3. **Commit**: `git commit -am 'feat: adiciona nova feature'`
4. **Push**: `git push origin feature/minha-feature`
5. Abra um **Pull Request**

**Padrões:**
- Usar [Conventional Commits](https://www.conventionalcommits.org/)
- Passar nos testes: `pnpm test`
- Lint: `pnpm lint`
- Documentar APIs com Swagger

---

## 📄 Licença

**UNLICENSED** - Uso interno apenas.

---

## 👥 Equipe de Desenvolvimento

**Core Team**
- Evandro Filho - Lead Developer
- Marlon Meireles - Backend Developer  
- Luiz Gustavo - Frontend Developer
- Marco França - Mobile Developer

---

**NexusTransit** | Transformando a logística através da tecnologia  
**Última atualização**: Dezembro 2025 | **Versão**: 1.0.0-MVP
