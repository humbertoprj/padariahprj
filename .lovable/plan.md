
# Plano: PWA Profissional Offline-First com Arquitetura de PDV Clássico

## Resumo Executivo

Transformar o sistema atual em um PWA robusto que opera 100% offline, comunicando-se exclusivamente com uma API REST local (localhost:3333). O backend na nuvem (Lovable Cloud) será usado apenas como camada de replicacao e backup, gerenciado pelo servidor Node.js local.

---

## Arquitetura Geral

```text
+-------------------+       +-------------------+       +-------------------+
|                   |       |                   |       |                   |
|   PWA Frontend    | <---> |  Backend Local    | <---> |   Lovable Cloud   |
|   (Este projeto)  |       |  (Node.js :3333)  |       |   (Supabase)      |
|                   |       |                   |       |                   |
+-------------------+       +-------------------+       +-------------------+
        |                           |
        v                           v
+-------------------+       +-------------------+
|   IndexedDB       |       |   SQLite Local    |
|   (Cache/Fila)    |       |   (Dados Master)  |
+-------------------+       +-------------------+
```

---

## CAMADA 1 - PWA Profissional

### 1.1 Atualizar Manifest.json (via vite-plugin-pwa)

**Arquivo:** `vite.config.ts`

Alteracoes no manifest:
- name: "PDV Local"
- short_name: "PDV"
- theme_color: "#111827" (cinza escuro profissional)
- background_color: "#111827"
- orientation: "any" (suporte landscape/portrait)
- display: "standalone"
- start_url: "/"
- Manter icones existentes (192x192, 512x512)

### 1.2 Configurar Service Worker Avancado

**Arquivo:** `vite.config.ts` (workbox configuration)

Estrategias de cache:
- **Paginas HTML**: CacheFirst com fallback para offline.html
- **Assets estaticos** (JS, CSS, fontes): CacheFirst (imutaveis)
- **Imagens**: CacheFirst com expiracao de 30 dias
- **API Local**: NetworkFirst com fallback para cache

### 1.3 Criar Pagina de Fallback Offline

**Novo arquivo:** `public/offline.html`

Pagina amigavel exibida quando:
- Usuario tenta acessar rota nao cacheada
- Primeira visita sem conexao

### 1.4 Suporte Multi-Plataforma

A configuracao atual ja suporta:
- Desktop Windows/Mac/Linux (via Chrome/Edge)
- Tablets Android
- iPads (via Safari)

---

## CAMADA 2 - Cliente API Local

### 2.1 Criar Servico de API Local

**Novo arquivo:** `src/services/api.ts`

```text
Responsabilidades:
- Base URL configuravel (padrao: http://localhost:3333)
- Fallback para IP alternativo (ex: 192.168.0.10:3333)
- Interceptors para tratamento de erros
- Metodos CRUD genericos tipados
```

### 2.2 Configuracao de Endpoints

**Novo arquivo:** `src/services/config.ts`

```text
Configuracoes:
- API_BASE_URL (localStorage ou padrao)
- Timeout de requisicoes
- Retry policy
- Headers padrao
```

### 2.3 Remover Dependencia Direta do Supabase no Frontend

**Arquivos a modificar:**
- `src/contexts/EmpresaContext.tsx` - Usar API local
- `src/pages/Estoque.tsx` - Usar API local
- `src/pages/PDV.tsx` - Usar API local
- Demais paginas que usam supabase client

**Importante:** O arquivo `src/integrations/supabase/client.ts` sera mantido mas nao usado diretamente pelo frontend. Pode ser usado para tipagem.

---

## CAMADA 3 - Sistema de Sincronizacao

### 3.1 Gerenciador de Fila de Sincronizacao

**Novo arquivo:** `src/services/syncQueue.ts`

```text
Interface SyncOperation:
- id: string (UUID)
- type: 'INSERT' | 'UPDATE' | 'DELETE'
- table: string
- payload: object
- timestamp: number
- status: 'pending' | 'synced' | 'error'
- retryCount: number
- errorMessage?: string
```

Funcionalidades:
- Persistencia em IndexedDB (via idb-keyval ou similar)
- Adicionar operacao a fila
- Processar fila quando online
- Retry automatico com backoff exponencial
- Resolucao de conflitos por timestamp (last-write-wins)

### 3.2 Hook de Conectividade

**Novo arquivo:** `src/hooks/useConnection.ts`

```text
Retorna:
- isOnline: boolean
- isApiAvailable: boolean
- apiLatency: number | null
- reconnect: () => void
```

### 3.3 Contexto de Sincronizacao

**Novo arquivo:** `src/contexts/SyncContext.tsx`

```text
Fornece:
- pendingCount: numero de operacoes pendentes
- isSyncing: boolean
- lastSyncTime: Date | null
- syncNow: () => Promise<void>
- clearQueue: () => void
```

---

## CAMADA 4 - UX e Indicadores Visuais

### 4.1 Componente de Status de Conexao

**Novo arquivo:** `src/components/ConnectionStatus.tsx`

```text
Exibe:
- Indicador verde: Online e sincronizado
- Indicador amarelo: Online com pendencias
- Indicador vermelho: Offline

Comportamento:
- Fixo no header ou rodape
- Clicavel para abrir painel de detalhes
- Animacao sutil quando sincronizando
```

### 4.2 Painel de Sincronizacao

**Novo arquivo:** `src/components/SyncPanel.tsx`

```text
Mostra:
- Lista de operacoes pendentes
- Historico de erros
- Botao "Sincronizar Agora"
- Configuracao de IP do servidor
```

### 4.3 Integracao no Layout

**Modificar:** `src/components/layout/Header.tsx`

Adicionar indicador de status persistente no header

**Modificar:** `src/pages/PDV.tsx`

Adicionar indicador de status no header do PDV

---

## CAMADA 5 - Seguranca

### 5.1 Remocao de Keys Expostas

O frontend NAO tera acesso a:
- SUPABASE_URL diretamente
- ANON_KEY diretamente

Toda comunicacao sera via API local que fara proxy seguro.

### 5.2 Autenticacao Local

O servidor Node.js sera responsavel por:
- Validar sessoes
- Gerenciar tokens
- Proxy autenticado para Supabase

O frontend armazenara apenas token de sessao local.

---

## Estrutura de Arquivos a Criar/Modificar

### Novos Arquivos

```text
public/
  offline.html                    # Pagina fallback offline

src/
  services/
    api.ts                        # Cliente HTTP para API local
    config.ts                     # Configuracoes da API
    syncQueue.ts                  # Gerenciador de fila de sync
    indexedDB.ts                  # Wrapper para IndexedDB
    
  hooks/
    useConnection.ts              # Hook de status de conexao
    useOfflineData.ts             # Hook para dados offline
    useSyncQueue.ts               # Hook para fila de sync
    
  contexts/
    SyncContext.tsx               # Contexto de sincronizacao
    ConnectionContext.tsx         # Contexto de conexao
    
  components/
    ConnectionStatus.tsx          # Indicador de conexao
    SyncPanel.tsx                 # Painel de sincronizacao
    OfflineBanner.tsx             # Banner quando offline
```

### Arquivos a Modificar

```text
vite.config.ts                    # Configuracoes PWA atualizadas
src/App.tsx                       # Adicionar providers de sync
src/contexts/EmpresaContext.tsx   # Usar API local
src/components/layout/Header.tsx  # Adicionar status indicator
src/pages/PDV.tsx                 # Usar API local + sync
src/pages/Estoque.tsx             # Usar API local + sync
src/pages/Clientes.tsx            # Usar API local + sync
src/pages/Financeiro.tsx          # Usar API local + sync
src/pages/Producao.tsx            # Usar API local + sync
```

---

## Dependencias a Adicionar

```text
idb-keyval                        # Wrapper simples para IndexedDB
```

---

## Fluxo de Operacao Offline

```text
1. Usuario abre o PDV
2. Sistema carrega dados do cache local (IndexedDB)
3. Se API local disponivel, busca dados frescos
4. Usuario realiza venda
5. Operacao salva localmente + adicionada a fila de sync
6. Sistema tenta enviar para API local
7. Se falhar, mantem na fila
8. Quando conexao restabelecer, processa fila
9. API local sincroniza com Supabase (nuvem)
```

---

## Configuracao do Servidor Node.js (Referencia)

O servidor Node.js local (fora do escopo deste projeto) devera:

```text
Endpoints esperados:
- GET/POST/PUT/DELETE /api/produtos
- GET/POST/PUT/DELETE /api/clientes
- GET/POST/PUT/DELETE /api/comandas
- GET/POST/PUT/DELETE /api/vendas
- POST /api/sync (receber fila de sync)
- GET /api/health (verificar disponibilidade)

Responsabilidades:
- Manter SQLite local como fonte de verdade
- Sincronizar com Supabase periodicamente
- Resolver conflitos por timestamp
- Servir dados mesmo sem internet
```

---

## Ordem de Implementacao

### Fase 1 - PWA Base
1. Atualizar vite.config.ts com novo manifest
2. Configurar workbox para cache offline-first
3. Criar offline.html

### Fase 2 - Infraestrutura de API
4. Criar src/services/config.ts
5. Criar src/services/api.ts
6. Criar src/services/indexedDB.ts

### Fase 3 - Sistema de Sync
7. Criar src/services/syncQueue.ts
8. Criar src/hooks/useConnection.ts
9. Criar src/contexts/SyncContext.tsx
10. Criar src/contexts/ConnectionContext.tsx

### Fase 4 - Componentes UI
11. Criar src/components/ConnectionStatus.tsx
12. Criar src/components/SyncPanel.tsx
13. Criar src/components/OfflineBanner.tsx

### Fase 5 - Integracao
14. Modificar src/App.tsx (adicionar providers)
15. Modificar Header.tsx (adicionar indicador)
16. Refatorar EmpresaContext.tsx
17. Refatorar PDV.tsx para usar API local

### Fase 6 - Demais Modulos
18. Refatorar Estoque.tsx
19. Refatorar Clientes.tsx
20. Refatorar Financeiro.tsx
21. Refatorar Producao.tsx

---

## Resultado Final

- PWA instalavel em Windows, Android e iOS
- Funciona 100% offline apos primeira carga
- Sincronizacao automatica quando online
- Indicadores visuais claros de status
- Sem dependencia de internet para vendas
- Arquitetura robusta de PDV tradicional

