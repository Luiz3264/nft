# Kurio NFT Marketplace

Aplicação de demonstração de um marketplace de NFTs (Kurio), construída com **React 19 + TypeScript + Vite 8 + Tailwind CSS 4**, **TanStack Router**, **TanStack Query**, **Axios** e **Socket.IO client**.

Toda a camada de rede é interceptada no navegador por **MSW 2** (REST + WebSocket/Socket.IO), o que permite reproduzir de forma determinística falhas, erros HTTP, latência, expiração de sessão, alteração de preço e esgotamento de edição **sem nenhum backend real**. Nenhuma blockchain, carteira de navegador ou gateway de pagamento é contatado.

Documentação relacionada:

| Documento | Conteúdo |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Contratos REST e eventos, política de sessão, estado do carrinho, estratégia de cache, reconciliação REST × Socket.IO, limitações, decisões de UX e desvios de design. |
| [MOCKING.md](MOCKING.md) | Detalhe da arquitetura de mocks (handlers, store, transporte Socket.IO e limitações do binding). |

---

## 1. Requisitos

| Item | Versão |
| --- | --- |
| Node.js | `^20.19.0` ou `>=22.12.0` (exigência do Vite 8) |
| npm | 10+ (testado com 11.11) |
| Navegador | Qualquer navegador moderno com Service Workers (a demo do MSW roda no cliente) |

> Não é necessário Docker, banco de dados nem servidor de API. O único "servidor" é o dev server do Vite.

## 2. Setup

```sh
npm install          # instala dependências
npm run dev          # sobe em http://localhost:5173 com mocks ativos (modo demo)
```

Para validar que o mock está no ar, abra o DevTools:

- aba **Application → Service Workers**: `mockServiceWorker.js` deve estar *activated*;
- aba **Console**: não deve haver requisição para `/api` realizada de verdade.

## 3. Variáveis de ambiente

| Variável | Valores | Efeito |
| --- | --- | --- |
| `VITE_API_MOCKS` | `true` / `false` / ausente | `true` inicia o MSW antes do primeiro render (`src/main.tsx:15`). Ausente ou `false` faz a UI falar com uma API real em `/api` e um servidor Socket.IO em `/socket.io/`. |

Arquivos involved:

- **`.env.demo`** (versionado) contém `VITE_API_MOCKS=true` e é carregado pelo Vite no modo `demo` — é ele que faz `npm run dev`, `npm run dev:demo`, `npm run build:demo` e o servidor usado pelo Playwright nascerem com mocks.
- Não existe `.env.production`: `npm run build` gera uma build **sem mocks**, que espera uma API real. Para gerar a build de demonstração use `npm run build:demo`.
- Para desligar os mocks em desenvolvimento, crie um `.env.local` com `VITE_API_MOCKS=false` (o `.env.local` tem precedência sobre o `.env.demo`).
- O service worker é servido a partir de `public/mockServiceWorker.js` (configurado em `package.json → msw.workerDirectory`). Publicar a build em um subcaminho (ex.: `https://host/kurio/`) quebra a demo, porque o worker e o `path` do Socket.IO pressupõem a raiz do domínio.

## 4. Credenciais fictícias

Todos os dados abaixo são **fixtures locais de demonstração**. Não existem servidores de e-mail, e-mails reais ou qualquer credencial de serviço externo.

| E-mail | Senha | Conta |
| --- | --- | --- |
| `ada@example.test` | `demo-pass-123` | Ada Collector (`collector-ada`) |
| `lin@example.test` | `demo-pass-123` | Lin Curator (`collector-lin`) |

Outros dados fictícios úteis:

| Item | Valor |
| --- | --- |
| Cupom válido | `KURIO10` (10% de desconto) |
| Carteira principal de Ada | `0xAda0000000000000000000000000000000000001` (Ethereum) |
| Carteira principal de Lin | `0xLin00000000000000000000000000000000000002` (Polygon) |
| Catálogo | 16 NFTs fictícios, de `Golden Signal #160` (0.39 ETH) a `Orbit Runner #031` (2.15 ETH) |

Observações importantes:

- A senha existe apenas na fixture (`src/mocks/fixtures.ts:7`). Ela **não** é gravada em perfil, sessão ou storage; `POST /auth/change-password` altera apenas a senha do mock em memória/localStorage da demo.
- Cadastrar uma conta nova cria um perfil mock **sem carteiras** e **sem favoritos**. O checkout então responde `422 WALLET_REQUIRED` até você criar uma carteira em `/carteiras` (ou o app exibe "Cadastre uma carteira antes de finalizar o pedido.").
- O e-mail aceito no formulário de recuperação é apenas validado por formato; a resposta é sempre a mesma mensagem neutra.

## 5. Seleção e reset dos cenários

Os cenários determinam o comportamento da rede mockada. São **18 nomes** definidos em `src/api/contracts.ts` (`MOCK_SCENARIOS`) e aceitos por `GET /api/mock/scenarios`.

### 5.1 Selecionar

Não existe um painel de cenários na UI: a seleção é feita por URL, storage ou endpoint de controle. As três formas são equivalentes do ponto de vista do mock.

**a) Pela URL (recomendado para demonstrações)** — aplica o cenário **no carregamento** e reinicia o estado para a baseline:

```
http://localhost:5173/?mockScenario=price-changed
http://localhost:5173/?mockScenario=empty
```

Esse parâmetro **não é persistido**: ele só vale para aquele carregamento. Sem ele, o mock volta ao cenário salvo em `localStorage`.

**b) Pelo storage do navegador** — valor aceito na chave `kurio.mock.scenario` (`localStorage`). Aplica no próximo F5:

```js
localStorage.setItem('kurio.mock.scenario', 'out-of-order');
location.reload();
```

**c) Pelo endpoint de controle (sem recarregar)** — útil para mostrar falhas ao vivo durante a demonstração:

```js
await fetch('/api/mock/scenario', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario: 'http-5xx' }),
});
```

Cenário desconhecido responde `422 INVALID_SCENARIO`.

Endpoints de introspecção:

```js
await fetch('/api/mock/scenarios').then(r => r.json());   // lista de nomes válidos
await fetch('/api/mock/scenario').then(r => r.json());    // { scenario: 'success' }
await fetch('/api/mock/socket-status').then(r => r.json()); // { subscribers: 1 }
```

### 5.2 Resetar

Trocar de cenário **sempre** reinicia o estado (é o comportamento de `POST /api/mock/scenario` e de `POST /api/mock/reset`).

```js
// reset preservando o cenário atual
await fetch('/api/mock/reset', { method: 'POST' });

// reset e trocando de cenário ao mesmo tempo
await fetch('/api/mock/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario: 'success' }),
});
```

O reset descarta: tokens de sessão, alterações de preço/disponibilidade do catálogo, favoritos, carrinhos, perfis, carteiras, pedidos, chaves de idempotência e a sequência de eventos — tudo volta às fixtures (`src/mocks/state.ts:82`).

Para um reset "duro", apague o storage no DevTools (**Application → Local Storage → Clear site data**) e recarregue. Chaves envolvidas:

| Chave | Conteúdo |
| --- | --- |
| `kurio.mock.state.v1` | Estado completo do mock (catálogo, carrinhos, sessões, pedidos, idempotência) |
| `kurio.mock.scenario` | Último cenário selecionado por endpoint |
| `kurio.mock.token` | Token da sessão mock corrente (`Bearer` enviado pelo Axios) |
| `kurio.pending-order-key` | Chave de idempotência de um checkout em andamento (ver §7.11) |
| `kurio-search-open`, `kurio-search-query` | `sessionStorage` da busca do desktop |

**Atenção:** o reset acontece no servidor mock, mas o cache do React Query em memória **não** é limpo automaticamente por uma chamada feita no console (`useMockReset`/`api.setScenario` existem em `src/api/hooks.ts:58` e `src/api/service.ts:96`, mas não estão ligados a nenhum controle na UI). Faça **F5 após o reset** para a tela refletir a baseline.

### 5.3 Tabela de cenários

| Cenário | Comportamento determinístico |
| --- | --- |
| `success` | Fluxo feliz: REST normal e pagamento confirmado. |
| `empty` | Catálogo responde lista vazia. |
| `variable-latency` | Atrasos cíclicos de 120/650/240/480 ms. |
| `out-of-order` | Atrasos cíclicos de 700/70/350 ms, invertendo a ordem de conclusão das requisições. |
| `offline` | `HttpResponse.error()` — erro de rede do MSW (sem resposta HTTP). |
| `http-4xx` | `400 MOCK_BAD_REQUEST` em toda requisição protegida pelo guard. |
| `http-5xx` | `503 MOCK_UNAVAILABLE` em toda requisição protegida pelo guard. |
| `session-expired` | `401 SESSION_EXPIRED` nos recursos protegidos e evento `session.expired` no Socket.IO. |
| `unauthorized` | `403 FORBIDDEN` nos recursos protegidos. |
| `registration-conflict` | `409 EMAIL_TAKEN` no cadastro. |
| `form-validation` | `422 VALIDATION_ERROR` com `fields.displayName` no cadastro. |
| `coupon-invalid` | `422 COUPON_INVALID` para qualquer cupom. |
| `coupon-expired` | `410 COUPON_EXPIRED` no cupom. |
| `price-changed` | Altera o preço do primeiro item em +0.20 ETH, emite `nft.updated` e devolve `409 PRICE_CHANGED` no checkout. |
| `edition-sold-out` | Zera a disponibilidade do primeiro item, emite `nft.updated` e devolve `409 EDITION_SOLD_OUT`. |
| `order-timeout` | Commita o pedido e emite `order.updated`, mas atrasa 1.500 ms — excede o timeout de 1.000 ms do checkout. |
| `payment-confirmed` | Pedido confirmado (mesmo caminho do `success`, explícito para demonstração). |
| `payment-declined` | Pedido criado com status `declined`; carrinho e disponibilidade não são alterados. |

Eventos manuais (independentes do cenário):

```js
// muda preço e/ou disponibilidade e emite nft.updated
await fetch('/api/mock/events/price-change', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nftId: 1, price: 1.55 }),
});
await fetch('/api/mock/events/price-change', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nftId: 3, availableCopies: 0 }),
});
```

## 6. Comandos de execução

| Comando | O que faz |
| --- | --- |
| `npm install` | Instala dependências. |
| `npm run dev` | Dev server (mocks ativos, modo `demo`). |
| `npm run dev:demo` | Idêntico ao `dev`; alias explícito de demonstração. |
| `npm run build` | `tsc -b` + build Vite em modo produção (**sem mocks**). |
| `npm run build:demo` | `tsc -b` + build Vite em modo `demo` (**com mocks**, serve para `preview`/hosting estático). |
| `npm run preview` | Serve `dist/`. Rode `npm run build:demo` antes para ter os mocks. |
| `npm run lint` | ESLint (`eslint .`). |
| `npm run test:e2e` | Playwright (Chromium) com os mesmos handlers MSW; sobe `dev:demo` em `http://127.0.0.1:4175`. |
| `npm run lighthouse` | `build` + matriz Lighthouse (desktop/mobile, home e detalhe). |

Extras:

```sh
npx playwright install chromium    # primeira execução dos testes e2e
npm run dev -- --port 3000         # porta alternativa
npm run dev -- --host 0.0.0.0      # expor na rede local (celular na mesma rede)
```

## 7. Reprodução dos fluxos de falha

Pré-requisito comum: deixe a aba em `http://localhost:5173/?mockScenario=<cenário>` (ou aplique o cenário pelo console, §5.1c). Os passos abaixo assumem viewport desktop (≥ 768 px).

### 7.1 `offline` — erro de rede

1. Abra `/?mockScenario=offline`.
2. A grade de NFTs é substituída pelo alerta **"Não foi possível carregar o catálogo."** com o botão **"Tentar novamente"**.
3. No carrinho, a faixa vermelha (`role="alert"`) mostra **"Não foi possível carregar o resumo do carrinho."** ou **"Não foi possível atualizar o carrinho. Tente novamente."**.
4. DevTools → Network: as requisições aparecem como **`(failed)` / net::ERR_FAILED**, sem status HTTP. Isso é o que diferencia `offline` de `http-4xx`/`http-5xx`.

### 7.2 `http-4xx` e `http-5xx` — falhas de servidor

1. Em `/?mockScenario=http-4xx`, qualquer requisição de catálogo/carrinho responde **400** com `{ code: 'MOCK_BAD_REQUEST' }`.
2. Em `/?mockScenario=http-5xx`, responde **503** com `{ code: 'MOCK_UNAVAILABLE' }`.
3. A UI exibe a mesma mensagem de fallback (o corpo do mock não é usado nas telas de catálogo/carrinho): **"Não foi possível carregar o catálogo."**.
4. Confirme os status codes no DevTools ou com `await fetch('/api/nfts').then(r => r.status)` → `400` / `503`.

> Observação: o guard de falha (`src/mocks/scenarios.ts:21`) é aplicado ao catálogo, favoritos e carrinho. Recursos autenticados (`/profile`, `/wallets`, `/orders`) respondem com 401/403 do próprio cenário de sessão antes do guard — veja §7.4.

### 7.3 `variable-latency` e `out-of-order` — latência e corrida

1. `/?mockScenario=out-of-order` e abra/feche a busca várias vezes: as respostas chegam fora de ordem (700 → 70 → 350 ms).
2. No carrinho, dispare vários `+` em itens diferentes rapidamente: cada mutação só lê e grava no servidor **depois** do atraso do cenário, então o estado final corresponde à ordem em que as requisições realmente executaram — que não é necessariamente a ordem dos cliques. O cliente do carrinho não compara versões, ao contrário do catálogo (§8 de ARCHITECTURE.md).
3. `/?mockScenario=variable-latency` mostra o mesmo efeito com atrasos menos extremos (120/650/240/480 ms), sem inversão garantida.

### 7.4 `session-expired` e `unauthorized` — sessão e permissão

1. Faça login com `ada@example.test` / `demo-pass-123`.
2. Troque o cenário sem recarregar:
   ```js
   await fetch('/api/mock/scenario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario: 'session-expired' }) });
   ```
3. Navegue até `/perfil`: o alerta mostra **"Sua sessão expirou. Entre novamente."** (o botão "Entrar" do topo continua visível e não reflete o estado da sessão — ver §7.15).
4. Com `unauthorized`, o mesmo caminho mostra **"Esta operação exige uma permissão adicional."** (403).
5. Volte para `success` para recuperar.

### 7.5 `registration-conflict` — e-mail já cadastrado

1. `/?mockScenario=registration-conflict`, clique em **Entrar → Criar conta**.
2. Preencha nome, `ada@example.test` e senhas idênticas → **"Já existe uma conta com este e-mail."** (409).

### 7.6 `form-validation` — erro de validação de campo

1. `/?mockScenario=form-validation`, abra **Criar conta** e envie com senhas coincidentes.
2. O formulário exibe **"Revise os campos informados."** (422 `VALIDATION_ERROR`).

### 7.7 `coupon-invalid` e `coupon-expired` — cupom

1. Adicione um NFT ao carrinho e abra `/cart`.
2. Em `/?mockScenario=coupon-invalid`, qualquer código (inclusive `KURIO10`) devolve **"Código inválido. Confira o cupom e tente novamente."** (422) e o desconto permanece 0.
3. Em `/?mockScenario=coupon-expired`, o mesmo caminho devolve **"Este cupom expirou e não pode mais ser aplicado."** (410).
4. Em `success`, `KURIO10` devolve **"Cupom KURIO10 aplicado: 10% de desconto."** e o total passa de `2.38` para `2.158 ETH`.

### 7.8 `price-changed` — preço muda durante o checkout

Pré-requisito: **logado** (o checkout exige `GET /wallets` autenticado).

1. Adicione itens ao carrinho, aplique `KURIO10` e abra `/cart`.
2. `/?mockScenario=price-changed` → **Conectar e finalizar**.
3. O mock aumenta 0.20 ETH no preço do primeiro item, emite `nft.updated` e responde `409 PRICE_CHANGED`; a UI mostra **"O preço mudou durante a compra. Revise o novo total."**
4. Repare que o **resumo** (subtotal/total) muda sozinho, sem F5: o evento `nft.updated` versionado foi aplicado no cache do catálogo e o `cart-summary` foi invalidado. O preço unitário da linha do carrinho, esse sim, só é atualizado após uma nova leitura do carrinho (outra mutação ou F5), porque as linhas vêm do `GET /cart` feito pelo `CartProvider`.

### 7.9 `edition-sold-out` — edição esgota durante o checkout

1. Mesmo pré-requisito; `/?mockScenario=edition-sold-out` → **Conectar e finalizar**.
2. O mock zera a disponibilidade do primeiro item, emite `nft.updated` e responde `409 EDITION_SOLD_OUT`: **"A edição esgotou durante a compra."**
3. O catálogo é atualizado ao vivo pelo evento. No desktop o card não exibe disponibilidade (só nome e preço), então o efeito é visível no checkout seguinte; no mobile o item passa a receber o selo **"Raro"**, cuja regra é `availableCopies <= 15`.

### 7.10 `payment-declined` — pagamento recusado

1. Logado, com itens no carrinho, `/?mockScenario=payment-declined` → **Conectar e finalizar**.
2. A UI exibe **"Pagamento do pedido ord-… recusado."** e navega para `/pedido/ord-…`, que renderiza a variante **recusado** (ver §7.16). O pedido existe com status `declined` (`GET /orders`) e o carrinho **não** é esvaziado.

### 7.11 `order-timeout` — timeout com recuperação por chave de idempotência

Este é o fluxo mais completo; mostra que a escrita foi aceita mesmo quando o cliente desistiu.

1. Logado, com itens no carrinho, `/?mockScenario=order-timeout` → **Conectar e finalizar**.
2. O pedido é **gravado e confirmado** no mock e o evento `order.updated` é emitido, mas a resposta HTTP só chega 1.500 ms depois — o `timeout: 1000` do checkout (`src/api/service.ts:86`) estoura antes. A UI mostra **"Não foi possível finalizar o pedido. Tente novamente."**
3. A chave de idempotência fica salva em `localStorage` (`kurio.pending-order-key`) porque só é removida em caso de sucesso.
4. Clique **Conectar e finalizar** de novo: a mesma chave é reenviada, o mock reconhece a impressão digital idêntica e devolve **o mesmo pedido** (sem novo atraso) → **"Pedido ord-… confirmado."**, a chave é removida e a app navega para `/pedido/ord-…` (§7.16).
5. Se você alterar os itens entre as duas tentativas, a impressão digital muda e a resposta é `409 IDEMPOTENCY_CONFLICT`.
6. Detalhe do comportamento: como o cliente expirou, a tela ainda mostra os itens do carrinho (estado local) enquanto o servidor já os removeu — um F5 reconcilia. É o caso de uso canônico de idempotência de checkout.

### 7.12 `empty` — catálogo vazio

1. `/?mockScenario=empty` → a grade exibe **"Nenhum NFT corresponde aos filtros selecionados."** com **"Limpar filtros"**.
2. No mobile a mensagem é **"Nenhum NFT encontrado."**

### 7.13 Mutação de catálogo via REST (evento em tempo real, fora de cenário)

1. Em `/?mockScenario=success`, localize o card **Emerald Ape #042** (`1.19 ETH`).
2. Rode no console:
   ```js
   await fetch('/api/mock/events/price-change', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ nftId: 1, price: 1.55 }),
   });
   ```
3. O card passa a exibir **1.55 ETH sem recarregar**: a resposta REST mutou o mesmo store que alimenta o Socket.IO, e o `nft.updated` versionado chegou pelo WebSocket.
4. Confirme a conexão com `await fetch('/api/mock/socket-status').then(r => r.json())` → `{ subscribers: 1 }`.

Esse teste existe automatizado em `tests/network-mocks.spec.ts` ("real Socket.IO client receives catalog changes from the same MSW store").

### 7.14 Conectividade em tempo real ausente

Ao trocar de cenário para `offline` ou derrubar a rede do DevTools (aba **Network → Offline**), a ponte de tempo real tenta reconectar até 5 vezes, com o backoff padrão do Socket.IO. Enquanto isso, a UI continua dependendo do REST (que também falha, se offline) — nenhum indicador de "reconectando" é exibido. Ver ARCHITECTURE.md §7.

### 7.15 Falhas de UX que **não** são de rede (para não confundir na demonstração)

- Botões **"Continuar com Google" / "Continuar com Facebook"** apenas exibem uma mensagem informativa (OAuth não configurado).
- **"Sair"** na barra lateral da área de conta é `aria-disabled` com `title="Em breve"`: não há logout na UI.
- A busca do desktop é filtrada no cliente; o campo `search` da API existe mas não é usado pelas telas.
- Sem login, o checkout responde `401 UNAUTHENTICATED` → **"Autenticação necessária."** (é o comportamento esperado do guard de rota, e é o que o e2e mobile valida).

### 7.16 Confirmação de pedido — `/pedido/$orderId`

Destino do checkout em `/cart`. É uma tela de leitura: o identificador do pedido fica na URL, então a confirmação sobrevive a F5 e ao compartilhamento do link.

1. Logado, com itens no carrinho, em `/?mockScenario=success` → **Conectar e finalizar**.
2. A app navega para `/pedido/ord-…` e exibe um cartão centralizado com: selo do status, título, itens do pedido, subtotal, desconto (quando houver), taxa de rede, **Total pago**, hash da transação com botão de cópia e a ação principal.
3. Três variantes, conforme `Order.status`:

   | Status | Título | Ação principal |
   | --- | --- | --- |
   | `confirmed` | Pedido confirmado | Continuar explorando → `/` |
   | `pending` | Pagamento em andamento | Voltar ao mercado → `/` |
   | `declined` | Pagamento recusado | Tentar novamente → `/cart` |

4. Sem sessão, a tela mostra **"Pedido protegido"** com o botão **Entrar** (abre o `AuthLayer`), em vez de tentar ler o pedido.
5. Com um id inexistente ou de outra conta, o mock responde `404 ORDER_NOT_FOUND` e a tela mostra **"Pedido não encontrado"** com **Tentar novamente**.
6. A leitura usa `GET /orders/:id` com a chave `["orders", orderId]` (`useOrder` em `src/api/hooks.ts`). Como o `order.updated` invalida `["orders"]` (`src/api/RealtimeBridge.tsx:51`), um pedido que muda de `pending` para `confirmed` durante a tela se atualiza sozinho.

Cobertura automatizada em `tests/pedido-confirmado.spec.ts` (desktop, mobile e guard de sessão).

## 8. Verificações

```sh
npm run lint         # ESLint
npm run build:demo   # type-check + build com mocks
npm run test:e2e     # Playwright (desktop 1440x1000 e mobile 390x844)
```

Estado atual (verificado localmente com Node 24.14 / npm 11.11):

| Verificação | Resultado |
| --- | --- |
| `npm run build:demo` | ✅ passa (`tsc -b` + build Vite; aviso de chunk > 500 kB) |
| `npm run lint` | ⚠️ **6 erros e 3 avisos pré-existentes**, nenhum em `README.md`/`ARCHITECTURE.md` |
| `npm run test:e2e` | 3 specs / 10 testes sobre os mesmos handlers MSW |

Os erros de lint são pré-existentes e não bloqueiam a demo: `react-refresh/only-export-components` (`lib/cart.tsx`, `router.tsx`, `components/ui/button.tsx`, `components/ui/sidebar.tsx`) e `react-hooks/set-state-in-effect` (`AppDesktop.tsx:557`, `hooks/use-mobile.ts:14`), mais 3 avisos (`react-hooks/exhaustive-deps` em `AppDesktop.tsx:525` e `AppMobile.tsx:176`, diretiva de disable não usada em `public/mockServiceWorker.js`). Tratar isso é recomendação da §12 de [ARCHITECTURE.md](ARCHITECTURE.md).

Cobertura e2e atual (`tests/`):

- `marketplace.spec.ts` — filtros por categoria/aba/preço, busca (incluindo o retorno da busca ao abrir o detalhe), compra com quantidade, cupom, favoritos, cadastro com senhas divergentes, layout mobile de carrinho e autenticação mobile.
- `network-mocks.spec.ts` — contrato REST do catálogo (paginação, filtro, vazio, 400 e 503) e propagação de mudança de preço via Socket.IO real.
- `pedido-confirmado.spec.ts` — confirmação de pedido em desktop e mobile, com guard de sessão.

O Playwright sobe `npm run dev:demo` em `127.0.0.1:4175` com `strictPort` e `reuseExistingServer: false`: se a porta estiver ocupada, a execução falha. Rode `npx playwright install chromium` uma vez.

## 9. Estrutura de pastas

```text
src/
  api/            # contratos, cliente HTTP (Axios), serviço REST tipado, hooks (React Query), Socket.IO
  mocks/          # fixtures, estado persistido, handlers MSW REST, handlers Socket.IO, hub de eventos
  components/     # ui/ (shadcn/Base UI) e account/ (design system das telas de conta)
  routes/         # /cart, /perfil, /carteiras, /pedido/$orderId (TanStack Router)
  lib/cart.tsx    # CartProvider (estado do carrinho compartilhado)
  App.tsx         # alternância desktop (<768px) / mobile
  AppDesktop.tsx  # home + detalhe do NFT em desktop
  AppMobile.tsx   # home + detalhe do NFT em mobile
  router.tsx      # /, /cart, /nft/$nftId, /perfil, /carteiras, /pedido/$orderId
tests/            # Playwright
scripts/          # matriz Lighthouse
```

## 10. Reset completo em 30 segundos

```js
localStorage.clear(); sessionStorage.clear(); location.href = '/?mockScenario=success';
```
