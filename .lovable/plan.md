
# Plano: Local-First Data Architecture e Mixed Content Fix

## Resumo do Problema

O sistema não está conseguindo carregar dados porque:
1. **Mixed Content Block**: O navegador bloqueia requisições HTTP (servidor local) em páginas HTTPS (Lovable)
2. **Módulos vazios**: Dashboard, Financeiro, Produção e Relatórios não consomem a API local corretamente
3. **Baixa de estoque ausente**: Vendas não atualizam o estoque automaticamente
4. **Produção sem dados**: Lista de produtos fabricados não vem da API

---

## Alterações Planejadas

### 1. Aviso Visual de Mixed Content (HTTPS/HTTP)

**Arquivo:** `src/components/OfflineBanner.tsx`

Adicionar um novo componente/lógica que detecta quando o erro é causado por bloqueio de conteúdo misto e exibe instruções claras para o usuário:

- Detectar erros de conexão específicos (status 0 sem estar offline)
- Mostrar instrução: "Clique no ícone de cadeado do navegador → Configurações do site → Permitir conteúdo inseguro"
- Botão com link para documentação visual

---

### 2. Módulo Financeiro com API Local

**Arquivo:** `src/pages/Financeiro.tsx`

Atualmente usa apenas estado local (`useState`). Será alterado para:

- Adicionar `useEffect` para buscar dados de vendas da API local (`GET /api/vendas`)
- Calcular receitas do mês a partir das vendas
- Buscar contas a pagar/receber de `GET /api/contas` (se endpoint existir)
- Calcular DRE (Receita Bruta, Taxas, Lucro) baseado nos dados reais
- Montar gráfico de Fluxo de Caixa com vendas por dia

---

### 3. Módulo Produção com API Local

**Arquivo:** `src/pages/Producao.tsx`

Atualmente usa estado vazio. Será alterado para:

- Buscar produtos fabricados de `GET /api/produtos?tipo=fabricado` 
- Buscar ordens de produção de `GET /api/ordens`
- Buscar fichas técnicas de `GET /api/fichas-tecnicas`
- Ao criar ordem, enviar para `POST /api/ordens`
- Ao concluir ordem, enviar `PUT /api/ordens/:id` e dar baixa no estoque dos insumos

---

### 4. Baixa de Estoque Automática nas Vendas

**Arquivos:** `src/pages/PDV.tsx` + Servidor Local

O PDV já envia o array `itens` para o servidor. A baixa de estoque deve ser feita no servidor local ao processar a venda.

**Opção 1 (Recomendada)**: Confiar que o servidor local já faz a baixa

**Opção 2**: Adicionar chamada extra após venda:
- Após `POST /api/vendas` com sucesso, chamar `PUT /api/produtos/:id` para cada item reduzindo o `estoque_atual`
- Ou enviar flag no payload para o servidor processar automaticamente

---

### 5. Dashboard com Dados Reais

**Arquivo:** `src/pages/Dashboard.tsx`

Verificar se já consome a API local. Garantir que:
- Vendas Hoje: `GET /api/vendas?data=hoje`
- Total Produtos: `GET /api/produtos`
- Total Clientes: `GET /api/clientes`
- Produtos baixo estoque calculados localmente

---

### 6. Relatórios e Financeiro com API Local

**Arquivo:** `src/pages/Relatorios.tsx`

Já implementado parcialmente. Garantir que:
- Relatório de Vendas: `GET /api/vendas?data_inicio=X&data_fim=Y`
- Relatório de Estoque: `GET /api/produtos`
- Relatório de Clientes: `GET /api/clientes`
- Relatório de Produção: `GET /api/ordens`
- Relatório Financeiro: Combinar vendas + contas

---

## Detalhes Técnicos

### Componente MixedContentWarning (Novo)

```text
┌──────────────────────────────────────────────────────────────────┐
│ ⚠️ Navegador bloqueando conexão com servidor local               │
│                                                                  │
│ Para permitir a conexão HTTPS → HTTP:                           │
│ 1. Clique no ícone de cadeado 🔒 ao lado da URL                │
│ 2. Vá em "Configurações do site"                                │
│ 3. Em "Conteúdo inseguro", selecione "Permitir"                 │
│ 4. Recarregue a página                                          │
│                                                                  │
│ [Ver instruções com imagens] [Tentar novamente]                 │
└──────────────────────────────────────────────────────────────────┘
```

### Financeiro - Estrutura de Dados

```text
┌─────────────────┐     GET /api/vendas
│    Financeiro   │ ◄───────────────────
│                 │     
│  - Receitas     │     GET /api/contas
│  - Despesas     │ ◄───────────────────
│  - DRE          │
│  - Fluxo Caixa  │
└─────────────────┘
```

### Produção - Estrutura de Dados

```text
┌─────────────────┐     GET /api/produtos?tipo=fabricado
│    Produção     │ ◄───────────────────────────────────
│                 │     
│  - Ordens       │ ◄── GET /api/ordens
│  - Fichas       │ ◄── GET /api/fichas-tecnicas
└─────────────────┘
         │
         │ POST /api/ordens (criar)
         │ PUT /api/ordens/:id (iniciar/concluir)
         ▼
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/OfflineBanner.tsx` | Adicionar detecção e aviso de Mixed Content |
| `src/components/MixedContentWarning.tsx` | Novo componente com instruções visuais |
| `src/pages/Financeiro.tsx` | Integrar com API local para dados reais |
| `src/pages/Producao.tsx` | Integrar com API local para produtos e ordens |
| `src/pages/Dashboard.tsx` | Verificar e garantir consumo de API local |
| `src/pages/Relatorios.tsx` | Adicionar relatório financeiro e produção |
| `src/contexts/ConnectionContext.tsx` | Adicionar flag de Mixed Content detectado |

---

## Resultado Esperado

1. **Usuário vê aviso claro** quando o navegador bloqueia a conexão, com instruções passo-a-passo
2. **Financeiro mostra dados reais**: receitas, despesas e DRE baseados nas vendas do servidor
3. **Produção funcional**: lista produtos fabricados, cria e gerencia ordens de produção
4. **Estoque atualizado**: após venda, estoque é reduzido automaticamente
5. **Todos os módulos** buscam dados exclusivamente da API local `http://192.168.3.100:3333`
