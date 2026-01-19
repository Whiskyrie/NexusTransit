# Arquitetura Frontend - NexusTransit

## Estrutura de Pastas (Clean Architecture + Atomic Design)

```
apps/desktop/src/
├── core/                           # Camada de Domínio (Domain Layer)
│   ├── design-system/
│   │   ├── tokens/                 # Design tokens (fonte única da verdade)
│   │   │   ├── colors.ts           # Paleta de cores
│   │   │   ├── typography.ts       # Tipografia (Inter)
│   │   │   ├── spacing.ts          # Sistema de espaçamento
│   │   │   ├── shadows.ts          # Elevações e sombras
│   │   │   ├── radius.ts           # Border radius
│   │   │   └── index.ts            # Barrel export
│   │   └── theme/
│   │       └── theme.provider.tsx  # Provider de tema (futuro)
│   │
│   └── navigation/                 # Configuração de navegação
│       ├── navigation.config.ts    # Estrutura de rotas/sidebar
│       ├── navigation.service.ts   # Lógica de navegação
│       └── index.ts
│
├── shared/                         # Camada Compartilhada (Shared Kernel)
│   ├── components/
│   │   ├── atoms/                  # Componentes atômicos
│   │   │   ├── Badge/
│   │   │   │   ├── Badge.types.ts
│   │   │   │   ├── Badge.styles.ts
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Icon/
│   │   │   └── index.ts
│   │   │
│   │   ├── molecules/              # Componentes moleculares
│   │   │   ├── NavItem/
│   │   │   ├── TabButton/
│   │   │   ├── CollapsibleSection/
│   │   │   └── index.ts
│   │   │
│   │   ├── organisms/              # Componentes complexos
│   │   │   ├── Tabs/
│   │   │   │   ├── Tabs.types.ts
│   │   │   │   ├── Tabs.tsx
│   │   │   │   ├── useTabNavigation.ts
│   │   │   │   └── index.ts
│   │   │   ├── AppSidebar/
│   │   │   └── index.ts
│   │   │
│   │   └── templates/              # Layouts de página
│   │       └── PageWithTabs/
│   │
│   └── hooks/                      # Custom hooks compartilhados
│       ├── useCollapsible.ts
│       └── index.ts
│
├── features/                       # Camada de Features (DDD Bounded Contexts)
│   ├── incidents/
│   │   ├── components/             # Componentes específicos de incidentes
│   │   │   ├── IncidentsListTab.tsx
│   │   │   ├── IncidentsStatsTab.tsx
│   │   │   └── IncidentsWebhooksTab.tsx
│   │   ├── hooks/
│   │   └── types/
│   │
│   ├── deliveries/
│   ├── tracking/
│   └── ...
│
├── pages/                          # Camada de Apresentação (Pages)
│   ├── IncidentsPage.tsx           # (migrar para refactored.tsx)
│   ├── DeliveriesPage.tsx
│   └── ...
│
├── components/                     # LEGACY (migrar gradualmente)
│   ├── layouts/
│   │   └── AppLayout.tsx           # Já refatorado
│   └── ui/                         # Migrar para shared/components
│
├── services/                       # Infraestrutura (API clients)
├── stores/                         # Estado global (Zustand)
├── hooks/                          # LEGACY (migrar para shared/hooks)
├── types/                          # Types globais
└── lib/                            # Utilities

```

---

## Design System

### Princípios

1. Single Source of Truth: Design tokens centralizados
2. Type-Safe: 100% TypeScript com inferência
3. Atomic Design: Componentização hierárquica
4. Clean Architecture: Separação de responsabilidades
5. SOLID: Cada componente segue os princípios

### Design Tokens

```typescript
import { colors, typography, spacing } from '@/core/design-system/tokens';

const backgroundColor = colors.background.primary;
const fontSize = typography.fontSize.base;
const padding = spacing[4];
```

### Componentes

#### Atoms (Atômicos)

* Badge: Status, contadores, labels
* Icon: Wrapper type-safe para lucide-react

#### Molecules (Moleculares)

* NavItem: Item de navegação sidebar
* TabButton: Botão individual de tab
* CollapsibleSection: Seção colapsável

#### Organisms (Organismos)

* Tabs: Sistema completo de tabs com acessibilidade WAI-ARIA
* AppSidebar: Sidebar refatorada com seções colapsáveis

---

## Como Usar

### 1. Importar Componentes

```typescript
import { Badge, Icon } from '@/shared/components/atoms';
import { NavItem, TabButton } from '@/shared/components/molecules';
import { Tabs, AppSidebar } from '@/shared/components/organisms';
```

### 2. Usar Tabs em Páginas

```typescript
import { Tabs } from '@/shared/components/organisms';
import type { TabItem } from '@/shared/components/organisms';

const tabs: TabItem[] = [
  { id: 'list', label: 'Lista', icon: List },
  { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
];

function MyPage() {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className="p-6 space-y-6">
      <Tabs items={tabs} activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === 'list' && <ListContent />}
      {activeTab === 'stats' && <StatsContent />}
    </div>
  );
}
```

### 3. Adicionar Item na Sidebar

```typescript
export const navigationConfig: NavSectionConfig[] = [
  {
    id: 'operations',
    title: 'Operações',
    items: [
      {
        id: 'my-feature',
        icon: MyIcon,
        label: 'Minha Feature',
        to: '/my-feature',
        badge: 5,
      },
    ],
  },
];
```

---

## Plano de Migração

### Fase 1: Fundação (Completo)

* Estrutura de pastas
* Design tokens
* Componentes atoms (Badge, Icon)
* Componentes molecules (NavItem, TabButton, CollapsibleSection)
* Componentes organisms (Tabs, AppSidebar)
* AppLayout refatorado
* Configuração Tailwind + path aliases

### Fase 2: Migração de Páginas (Em andamento)

* IncidentsPage com tabs
* DeliveriesPage
* TrackingPage
* Demais páginas

### Fase 3: Migração de Componentes UI

* Mover components/ui para shared/components/atoms
* Refatorar com design tokens
* Adicionar tipos estritos

### Fase 4: Polish

* Animações suaves
* Loading states
* Error boundaries
* Testes unitários
* Storybook (opcional)

---

## Testes

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tabs } from './Tabs';

describe('Tabs', () => {
  it('should render all tabs', () => {
    // Test implementation
  });
});
```

---

## Referências

* Clean Architecture: Robert C. Martin
* Atomic Design: Brad Frost
* Design System: Linear, Inter UI
* Acessibilidade: WAI-ARIA Authoring Practices

---

## Contribuindo

1. Sempre seguir a estrutura de pastas
2. Criar componentes com tipos estritos
3. Documentar com JSDoc
4. Escrever testes
5. Usar design tokens (nunca valores hard-coded)

---

## Convenções

### Nomenclatura

* Componentes: PascalCase
* Arquivos de componentes: PascalCase.tsx
* Hooks: camelCase com prefixo use
* Types: PascalCase com sufixo Props/Config
* Constants: UPPER_SNAKE_CASE

### Estrutura de Componente

```
ComponentName/
├── ComponentName.types.ts
├── ComponentName.styles.ts
├── ComponentName.tsx
├── ComponentName.test.tsx
└── index.ts
```

---

## Benefícios

* Escalabilidade
* Manutenibilidade
* Consistência
* Type-Safety
* Performance
* Acessibilidade
* Developer Experience
