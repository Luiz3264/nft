# Arquitetura — Kurio NFT Marketplace

Documento de referência técnica da solução de demonstração. Cobre contratos REST e eventos, política de sessão, estado do carrinho, estratégia de cache, reconciliação entre REST e Socket.IO, limitações conhecidas, decisões de UX e desvios de design.

Para o passo a passo de execução, credenciais e reprodução de falhas, veja [README.md](README.md). Para o detalhe da implementação dos mocks, veja [MOCKING.md](MOCKING.md).

---

## 1. Visão geral

A aplicação é um SPA (React 19 + Vite 8) que **não possui backend**. Todo o tráfego REST (Axios, `baseURL: /api`) e todo o WebSocket (Socket.IO em `/socket.io/`) são interceptados no navegador por um worker MSW 2 (`src/mocks/browser.ts`). O store mock (`src/mocks/state.ts`) é a **única fonte de verdade** tanto para as respostas REST quanto para os eventos emitidos, o que garante que "o que o REST devolve" e "o que o Socket.IO emite" nunca divirjam.

```text
UI (AppDesktop / AppMobile / routes/*)
      │  (nunca chama o mock diretamente)
      ▼
api/hooks.ts  ──►  api/service.ts  ──►  api/http.ts (Axios + Bearer)
   (cache)          (DTOs REST)         │
                                          ▼
                            MSW worker (handlers.ts)  ──►  mockStore (state.ts) ──► localStorage
                                          │
                                          └────────► realtimeHub ──► socketHandlers (ws.link) ──► socket.io-client
```

Regras de fronteira respeitadas no código:

- Nenhum componente importa `src/mocks/*`. A UI conhece apenas `api/*`.
- `src/api/contracts.ts` é a fonte única dos DTOs e da união `MockScenario`, compartilhada entre app e mocks.
- `handlers.ts`, `socketHandlers.ts`, `fixtures.ts` e `state.ts` formam a fronteira de mock usada **igualmente** pelo dev server, pela build de demonstração e pelo Playwright.

| Camada | Arquivo | Responsabilidade |
| --- | --- | --- |
| Contratos | `src/api/contracts.ts` | DTOs REST, `Paginated<T>`, `ApiError`, `MockScenario`, rótulos de rede/tipo de carteira |
| Transporte | `src/api/http.ts` | Axios: `baseURL /api`, timeout global 5.000 ms, interceptor que injeta `Authorization: Bearer` |
| Serviço | `src/api/service.ts` | Métodos REST tipados (um por endpoint) |
| Cache | `src/api/hooks.ts` + `queryClient.ts` | Query keys, `useCatalog`, `useFavorites` (otimista), `useProfile`, `useWallets`, `useMockReset` |
| Tempo real | `src/api/realtime.ts` + `RealtimeBridge.tsx` | Ciclo de vida do Socket.IO e tradução de eventos em invalidações/patches de cache |
| Carrinho | `src/lib/cart.tsx` | `CartProvider`: itens + resumo + mensagens de erro, compartilhados por todas as telas |
| Mock REST | `src/mocks/handlers.ts` | Regras de negócio, validações, idempotência, side effects de evento |
| Mock estado | `src/mocks/state.ts` | Estado de domínio persistido, sessões, senhas, idempotência, seleção de cenário |
| Mock tempo real | `src/mocks/socketHandlers.ts`, `realtime.ts` | Transporte Socket.IO sobre `ws.link()` e hub de broadcast |

## 2. Contratos REST

Base: `/api`. Autenticação: `Authorization: Bearer <localStorage["kurio.mock.token"]>`, injetado em toda requisição (`src/api/http.ts:9`). Timeout padrão 5.000 ms; **1.000 ms** em `POST /orders`.

Envelope de erro único (`src/mocks/handlers.ts:23`), com `fields` presente apenas em erros de validação de campos:

```json
{ "code": "PRICE_CHANGED", "message": "O preço mudou durante a compra. Revise o novo total." }
{ "code": "VALIDATION_ERROR", "message": "Revise os campos informados.", "fields": { "displayName": "Nome de usuário já está em uso." } }
```

### 2.1 Catálogo

| Método | Rota | Entrada | Sucesso | Erros |
| --- | --- | --- | --- | --- |
| `GET` | `/nfts` | `page` (≥1, padrão 1), `pageSize` (1–50, padrão 50), `search`, `category` (`"Todas"` = sem filtro), `tab` (`all` \| `new`), `minPrice`, `maxPrice`, `sort` (`recent` \| `price-ascending` \| `price-descending`) | `200 Paginated<Nft>` (`items`, `page`, `pageSize`, `total`, `hasMore`) | guard de cenário |
| `GET` | `/nfts/:id` | — | `200 Nft` | `404 NFT_NOT_FOUND` |

`Nft` carrega `price`, `availableCopies`, `isNew`, `trending` e um **`version`** incrementado a cada alteração de preço/disponibilidade — é o campo que permite aplicar eventos fora de ordem com segurança.

### 2.2 Favoritos

| Método | Rota | Entrada | Sucesso | Erros |
| --- | --- | --- | --- | --- |
| `GET` | `/favorites` | — | `200 number[]` (ids) | guard de cenário |
| `PUT` | `/favorites/:id` | `{ "favorite": boolean }` | `200 number[]` (lista atualizada) | `404 NFT_NOT_FOUND` |

Particionados por identidade: `guest` quando não há token, `collector-<id>` quando há.

### 2.3 Carrinho

| Método | Rota | Entrada | Sucesso | Erros |
| --- | --- | --- | --- | --- |
| `GET` | `/cart` | — | `200 Cart` | guard de cenário |
| `GET` | `/cart/summary` | — | `200 CartSummary` (`subtotal`, `discount`, `networkFee`, `total`, `couponCode`) | guard de cenário |
| `POST` | `/cart/items` | `{ nftId, quantity? }` | `201 Cart` | `404 NFT_NOT_FOUND`, `422 INVALID_QUANTITY` (não inteiro ou < 1), `409 EDITION_SOLD_OUT` |
| `PATCH` | `/cart/items/:id` | `{ quantity }` | `200 Cart` | `422 INVALID_QUANTITY` (não inteiro ou < 0), `409 EDITION_SOLD_OUT` |
| `DELETE` | `/cart/items/:id` | — | `200 Cart` | guard de cenário |
| `POST` | `/cart/coupon` | `{ code }` | `200 CouponResult` | `422 COUPON_INVALID`, `410 COUPON_EXPIRED` |

Regras de cálculo (`calculate()`, `src/mocks/handlers.ts:73`):

```text
subtotal   = Σ preço × quantidade
discount   = 10% do subtotal quando há cupom (arredondado a 3 casas), senão 0
networkFee = 0.016 ETH quando o carrinho tem itens, senão 0
total      = round3(subtotal - discount + networkFee)
```

Cupom válido: `KURIO10` (comparação normalizada: `trim()` + `UPPERCASE`).

### 2.4 Autenticação e conta

| Método | Rota | Entrada | Sucesso | Erros |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/register` | `{ email, password, displayName }` | `201 Session` | `409 EMAIL_TAKEN` (conta de fixture ou cenário), `422 VALIDATION_ERROR` (nome vazio, senha < 8, e-mail inválido) |
| `POST` | `/auth/login` | `{ email, password }` | `200 Session` (+ grava o token em `localStorage`) | `401 INVALID_CREDENTIALS` |
| `POST` | `/auth/password-reset` | `{ email }` | `202 { message }` (resposta neutra) | `422 VALIDATION_ERROR` (formato) |
| `GET` | `/auth/session` | — | `200 Session` | `401 SESSION_EXPIRED` (cenário), `401 UNAUTHENTICATED` |
| `POST` | `/auth/logout` | — | `200 { loggedOut: true }` (remove o token do storage) | — |
| `POST` | `/auth/change-password` | `{ currentPassword, newPassword }` | `200 { message }` | `401/403` do guard de usuário, `422 VALIDATION_ERROR` com `fields.currentPassword` / `fields.newPassword` |
| `GET` | `/profile` | — | `200 Profile` | `401 SESSION_EXPIRED`, `403 FORBIDDEN`, `401 UNAUTHENTICATED` |
| `PATCH` | `/profile` | parcial de `displayName`, `bio`, `avatarUrl`, `username`, `ensName`, `walletLabel`, `email` | `200 Profile` | `422 VALIDATION_ERROR` com `fields` por campo, `401/403` |

Validações de `PATCH /profile`: `displayName` ≥ 2 caracteres, `username` `^[a-z0-9_.-]{3,30}$`, `email` com formato, `ensName` `^[a-z0-9-]+$` (quando informado).

### 2.5 Carteiras

| Método | Rota | Entrada | Sucesso | Erros |
| --- | --- | --- | --- | --- |
| `GET` | `/wallets` | — | `200 Wallet[]` | `401/403` |
| `PUT` | `/wallets` | `Omit<Wallet,"id"> & { id? }` (upsert) | `200 Wallet[]` (lista completa) | `422 VALIDATION_ERROR` com `fields` (`address` `^0x[a-f\d]{40}$`, `label`, `profileName`, `email`, `secondaryAddress`), `401/403` |

Não existe `DELETE /wallets/:id` — ver limitação L14.

### 2.6 Pedidos

| Método | Rota | Entrada | Sucesso | Erros |
| --- | --- | --- | --- | --- |
| `GET` | `/orders` | — | `200 Order[]` (do usuário autenticado) | `401/403` |
| `GET` | `/orders/:id` | — | `200 Order` | `404 ORDER_NOT_FOUND` (inexistente **ou** de outro usuário), `401/403` |
| `POST` | `/orders` | header `Idempotency-Key` **obrigatório**; `{ walletId, items: [{ nftId, quantity }] }` | `201 Order` (novo) ou `200 Order` (idempotente) | `400 IDEMPOTENCY_KEY_REQUIRED`, `409 IDEMPOTENCY_CONFLICT`, `422 WALLET_REQUIRED`, `409 PRICE_CHANGED`, `409 EDITION_SOLD_OUT`, `401/403` |

`OrderStatus = "pending" | "confirmed" | "declined"`. O pedido guarda um **snapshot de compra** (`items` com nome/preço/`version` do momento da compra), `transactionReference` (`0x` + UUID quando confirmado) e `version`.

### 2.7 Controle de mocks

| Método | Rota | Efeito |
| --- | --- | --- |
| `GET` | `/mock/scenarios` | Lista `MOCK_SCENARIOS` |
| `GET` | `/mock/scenario` | `{ scenario }` atual |
| `GET` | `/mock/socket-status` | `{ subscribers }` — nº de sockets anexados ao hub |
| `POST` | `/mock/scenario` | `{ scenario }` → valida (`422 INVALID_SCENARIO`), zera contador de latência, **reinicia o estado**, persiste a seleção |
| `POST` | `/mock/reset` | corpo opcional `{ scenario }` → reinicia o estado mantendo ou trocando o cenário |
| `POST` | `/mock/events/price-change` | `{ nftId, price?, availableCopies? }` → altera o catálogo e emite `nft.updated`; `404` se o NFT não existir |

## 3. Eventos (Socket.IO)

Cliente real (`socket.io-client` 4.8) em `window.location.origin`, `path: /socket.io/`, **`transports: ["websocket"]` apenas**, `autoConnect: false`, `reconnection: true` com **5 tentativas** e `timeout: 2000` (`src/api/realtime.ts:9`). A conexão só é criada **depois** que o worker MSW registra o interceptor de WebSocket (import dinâmico + `setTimeout(0)` em `RealtimeBridge.tsx:12`).

### 3.1 Cliente → servidor

| Evento | Payload | Efeito no mock |
| --- | --- | --- |
| `subscribe` | `sessionToken: string \| null` | Anexa o socket ao `realtimeHub` e responde `mock.connected`. No cenário `session-expired`, responde `session.expired` e **não** anexa. |
| `scenario.trigger` | `{ type: "nft.updated", nftId, price?, availableCopies? }` | Aplica a mudança no `mockStore` e retransmite `nft.updated` para todos os assinantes. |

### 3.2 Servidor → cliente

| Evento | Payload | Consumido pela app? |
| --- | --- | --- |
| `mock.connected` | `{ userId: string \| null, scenario }` | Não |
| `nft.updated` | `Nft & { sequence: number }` | Sim — patch no catálogo |
| `order.updated` | `Order` | Sim — invalida pedidos e resumo |
| `session.expired` | `{ code: "SESSION_EXPIRED" }` | Não |

Pontos importantes:

- `Nft.version` é **por recurso** (incrementa a cada alteração daquele NFT) e é o que o cliente usa para descartar eventos antigos. `sequence` é um contador **global** do store, presente no payload mas não sendo usado pelo cliente hoje (sinal de ordenação disponível caso a escalabilidade peça).
- O `broadcast` do hub é **global**: todos os sockets anexados recebem todos os eventos, sem roteamento por usuário (`src/mocks/realtime.ts:19`). Com uma única aba isso é indistinguível de um servidor real; com duas contas em abas diferentes, seria incorreto.
- Eventos emitidos antes do `subscribe` são perdidos (o socket ainda não está no hub). A invalidação feita no `connect` (§7) é o que fecha essa janela.

## 4. Política de sessão

| Aspecto | Comportamento |
| --- | --- |
| Emissão | Login e registro criam `token = mock-{userId}-{uuid}` e `expiresAt = agora + 1h` (`src/mocks/state.ts:138`) |
| Persistência do token | `localStorage["kurio.mock.token"]` — gravado **apenas** por `POST /auth/login` (`src/mocks/handlers.ts:413`) |
| Envio | Interceptor do Axios lê a chave a cada requisição e envia `Authorization: Bearer <token>` |
| Validação | `mockStore.session(token)` só verifica existência na tabela de sessões. **`expiresAt` não é aplicado** — a expiração é simulada pelo cenário `session-expired` |
| Logout | `POST /auth/logout` remove a chave do storage e responde `{ loggedOut: true }`; **nenhum componente chama esse método** |
| Sessão de convidado | Sem token: carrinho e favoritos usam a partição `guest`; pedidos, perfil e carteiras exigem autenticação |
| Sobreposições de cenário | `session-expired` → `401 SESSION_EXPIRED`; `unauthorized` → `403 FORBIDDEN`, ambos antes de qualquer checagem de token (`currentUser()`) |
| Recuperação | Trocar de cenário para `success` (ou resetar) restaura o acesso |

Consequências práticas (importantes para a demo):

- **Cadastro não autentica o cliente.** `POST /auth/register` responde `201 Session`, mas não grava o token no `localStorage`; as próximas chamadas autenticadas do recém-criado saem sem `Bearer` e recebem `401 UNAUTHENTICATED`. O caminho suportado no teste e2e é: cadastrar para ver a mensagem de sucesso e depois **entrar** com uma conta de fixture.
- A UI **não tem estado de sessão**: não existe `useSession`, contexto de usuário nem botão de sair. `api.session()` e `api.logout()` existem (`src/api/service.ts:49`) e não são usados; o cabeçalho mostra sempre "Entrar" e o botão "Conta" do mobile sempre abre o formulário de login. O único sinal de sessão visível é o texto transitório `Bem-vindo, {nome}.`.
- O token em `localStorage` é legível por JavaScript: aceitável para demo, impróprio para produção (preferir cookie `HttpOnly`).

## 5. Estado do carrinho

**O servidor é a autoridade.** O cliente nunca calcula o total final.

```text
CartProvider (lib/cart.tsx)
  ├─ items[]            ← GET /cart no mount e após cada mutação (o Cart retornado substitui o estado local)
  ├─ total/discount/fee ← GET /cart/summary (query key ["cart-summary"])
  └─ errorMessage       ← erro da última mutação ou falha do resumo
```

- Não há atualização otimista no carrinho: cada `+`, `−`, remoção ou cupom é um round-trip. A justificativa está em §10, decisão 2.
- A identidade do carrinho vem do `Bearer` token (`null` → `guest`), de forma que o carrinho de convidado e o de cada usuário logado são independentes.
- `Cart.version` incrementa a cada mutação e serve como sinal grosseiro de conflito; o cliente hoje **não** compara versões.
- **Propagação catálogo → carrinho**: ao alterar preço/disponibilidade de um NFT, `mockStore.updateNft` reescreve `price` e `version` da linha em **todos** os carrinhos que contêm aquele NFT e incrementa o `version` do carrinho (`src/mocks/state.ts:98`). É por isso que o cenário `price-changed` altera o total do carrinho em tempo real.
- **Checkout** (`POST /orders`): re-valida disponibilidade de cada item, **reprecifica a partir do catálogo** (ignora o preço enviado pelo cliente), tira o snapshot dos itens, cria o pedido e, **somente quando confirmado**, decrementa `availableCopies`, remove os itens comprados do carrinho, zera cupom/desconto e emite `nft.updated` por item + `order.updated`. Em `declined` nada disso acontece.
- **Idempotência**: fingerprint = `JSON.stringify({ userId, walletId, items: [{ nftId, quantity }] })`. Mesma chave + mesma impressão digital → devolve o pedido original (200, sem recriar); mesma chave + impressão digital diferente → `409 IDEMPOTENCY_CONFLICT`. O cliente persiste a chave em `localStorage["kurio.pending-order-key"]` e só a remove no sucesso, o que torna o botão "Conectar e finalizar" seguro para repetir após timeout.
- **Expiração do carrinho**: não existe. Itens permanecem até remoção explícita ou até um pedido confirmado.

## 6. Estratégia de cache

`src/api/queryClient.ts`:

```ts
queries:   { staleTime: 0, retry: 0, refetchOnWindowFocus: false }
mutations: { retry: 0 }
```

| Query key | Origem | Estratégia de escrita |
| --- | --- | --- |
| `["catalog"]` | `useCatalog()` → `GET /nfts?page=1&pageSize=50` | Patch por `nft.updated` (versionado) + invalidação no `connect` |
| `["favorites"]` | `useFavorites()` | **Otimista**: `onMutate` aplica localmente, `onError` rollback, `onSettled` invalida |
| `["cart-summary"]` | `CartProvider` e página de carrinho | Sempre **invalida** (nunca faz patch): após cada mutação de carrinho, cupom, `connect`, `nft.updated` e `order.updated` |
| `["profile"]` | `useProfile()` (`retry: false`) | `setQueryData` no `onSuccess` do `PATCH` |
| `["wallets"]` | `useWallets()` (`retry: false`) | `setQueryData` no `onSuccess` do `PUT` (a resposta traz a lista completa) |
| `["orders", orderId]` | `useOrder(orderId)` → `GET /orders/:id`, na tela de confirmação | Só é invalidada pela ponte de tempo real (`order.updated`), que casa por prefixo |

Princípios:

- **`staleTime: 0` + `retry: 0`**: em uma demo dirigida por cenários, repetir requisições mascara falhas determinísticas (retry storms em `http-5xx`) e torna o comportamento observável mais confuso do que representsivo de produção.
- **Patch vs. invalidate**: dados transacionais (carrinho, resumo, pedidos) são sempre revalidados por REST; dados de exibição com versão (catálogo) podem ser atualizados localmente.
- **Sem persistência de cache** (não há `persistQueryClient`): um F5 recarrega tudo do mock.
- **Filtros são do cliente**: o `useCatalog()` busca uma única página de 50 itens e categoria/aba/preço/ordem/busca são aplicados em memória. Os parâmetros REST equivalentes existem e estão testados, mas não estão ligados à UI (§11 D6).
- Reset de cenário via console **não** limpa o cache: `useMockReset()` faz `queryClient.clear()` mas não está ligado a nenhum controle na UI. Solução prática: F5 após reset.

## 7. Reconciliação entre REST e Socket.IO

`RealtimeBridge` é montado uma única vez, dentro de `QueryClientProvider`/`CartProvider` (`src/main.tsx:25`), e vale para desktop e mobile.

```text
mount → setTimeout(0) → import dinâmico de socket.io-client → io(...)  (ainda sem conectar)
  connect
    ├─ emit "subscribe" com localStorage["kurio.mock.token"]
    └─ invalida ["catalog"], ["cart-summary"], ["orders"]        ← reconciliação completa
  nft.updated (nft)
    ├─ setQueryData(["catalog"]): substitui o item somente se nft.version > item.version
    └─ invalida ["cart-summary"]
  order.updated (_)
    ├─ invalida ["orders"]
    └─ invalida ["cart-summary"]
  unmount → disconnect()
```

Regras que sustentam a consistência:

1. **REST é a fonte de verdade; eventos são dicas.** Nenhuma transação é aplicada a partir do WebSocket. Carrinho, cupom, pedidos e perfil só mudam por resposta REST.
2. **Reconectar ⇒ reconciliar.** Cada evento `connect` (incluindo reconexões) reemite `subscribe` e invalida as três queries, então nada é perdido enquanto o socket estava fora.
3. **Eventos são versionados por recurso.** `nft.updated` só é aplicado quando `nft.version` é estritamente maior que a versão em cache; duplicatas e inversões de ordem são ignoradas sem custo de round-trip. Não há "gap detection" por `sequence`.
4. **Eventos perdido antes do `subscribe` são cobertos** pela invalidação do `connect`.
5. **Falha do WebSocket degrada para REST.** Se o socket não conectar (5 tentativas esgotadas), a UI continua funcionando com REST; não há indicador de "reconectando".
6. **Evento de sessão existe mas não é tratado.** `session.expired` é emitido no cenário homônimo e ignorado pelo cliente; o usuário só percebe o `401` na próxima chamada REST.
7. **Invalida-se exatamente o que pode ter mudado.** `nft.updated` invalida `["cart-summary"]` e não o carrinho: o resumo é rederivado do servidor, enquanto as linhas vêm do `GET /cart` feito pelo `CartProvider` e só são reescritas na próxima mutação ou recarga. Efeito prático no cenário `price-changed`: o total da página de carrinho muda ao vivo, mas o preço unitário da linha continua o antigo até um F5.

Limitação estrutural: como o mock é in-browser, "REST e evento" são sempre o **mesmo** store. Isso valida a forma da reconciliação (versionamento + invalidação), mas não exercita latência de rede real entre dois processos, nem ordem de entrega entre servidores distintos.

## 8. Idempotência, timeouts e reprocessamento

| Cenário | Comportamento do mock | Comportamento do cliente |
| --- | --- | --- |
| `order-timeout` | Grava e confirma o pedido, emite `order.updated`, só então espera 1.500 ms | `timeout: 1000` estoura → mensagem de erro; chave fica no `localStorage`; a segunda tentativa reenvia a mesma chave e recupera o pedido |
| `price-changed` / `edition-sold-out` | Muta o catálogo, emite `nft.updated`, responde 409 | Mensagem de erro do servidor + resumo e cartão do catálogo atualizados pelo evento |
| `out-of-order` | Atrasos cíclicos 700/70/350 ms | Respostas fora de ordem; o cache do catálogo é protegido por `version`, o carrinho não tem proteção no cliente (§5) |
| `offline` | `HttpResponse.error()` | Axios sem resposta; sem retry |

## 9. Persistência

| Chave (`localStorage`) | Escrita por | Conteúdo |
| --- | --- | --- |
| `kurio.mock.state.v1` | `mockStore.persist()` | Estado completo do domínio mock |
| `kurio.mock.token` | `POST /auth/login` | Token da sessão corrente |
| `kurio.mock.scenario` | `POST /api/mock/scenario` \| `/mock/reset` | Último cenário selecionado |
| `kurio.pending-order-key` | Página de carrinho | Chave de idempotência de checkout em andamento |

| Chave (`sessionStorage`) | Uso |
| --- | --- |
| `kurio-search-open` / `kurio-search-query` | Preserva a busca do desktop ao navegar para o detalhe e voltar |

## 10. Decisões de UX (com justificativa)

1. **Duas árvores de UI em vez de uma responsiva** — `App.tsx` alterna `AppMobile`/`AppDesktop` no breakpoint 768 px. Os frames de desktop e mobile do design diferem estruturalmente (grade 3 colunas + sidebar de filtros × grade masonry + bottom nav; dialog × página); duplicar mantém cada ramal fiel ao layout e evita media queries frágeis. Custo aceito: handlers e mensagens de autenticação duplicados.
2. **Favoritos otimistas, carrinho pessimista** — favoritar é reversível e de alta frequência; alterar quantidade de um item tem efeito financeiro. Por isso `useFavorites` faz patch+rollback e o carrinho sempre espera o servidor.
3. **Faixa de preço com "Aplicar" explícito** — o slider mantém estado de rascunho e só filtra ao clicar, evitando refiltrar a grade a cada pixel arrastado. "Limpar filtros" só aparece quando há filtro ativo.
4. **Checkout sem seletor de carteira** — o botão "Conectar e finalizar" usa a carteira principal (ou a primeira) automaticamente. É uma simplificação deliberada da demo: o usuário não escolhe a carteira de pagamento e a ausência de carteira vira mensagem ("Cadastre uma carteira antes de finalizar o pedido.") em vez de um seletor.
5. **Uma faixa de erro para o carrinho, erros por campo nas contas** — o carrinho tem uma única mensagem (`role="alert"`) porque os erros são de recurso; perfil e carteiras mostram erro por campo (`role="alert"` dentro do campo) e um resumo (`role="status"`).
6. **Estados de erro e vazio sempre oferecem recuperação** — "Tentar novamente", "Limpar filtros", "Explorar NFTs". Nenhuma tela dead-ends.
7. **Busca do desktop é overlay recolhível com persistência em `sessionStorage`** — sobrevive à navegação até o detalhe e volta com o mesmo texto; `Escape` limpa/fecha e o foco vai para o input ao abrir. No mobile a busca é sempre visível.
8. **Favoritos no mobile são um filtro, não uma tela** — evita uma rota extra; o botão "Favoritos" da bottom nav alterna `favoritesOnly` e rola até a grade.
9. **Detalhe endereçável no desktop, estado local no mobile** — ver desvio D1.
10. **Precisão de exibição**: preços com 2 casas e totais com 3 casas (`(subtotal - discount + networkFee).toFixed(3)`), refletindo a convenção de ETH do design.
11. **Rótulos de design preservados sobre a regra do mock** — "Desconto de lançamento" (que é o cupom de 10%) e "Taxa estimada" (0.016 ETH fixo) são textos do Figma aplicados a regras simplificadas.

## 11. Desvios de design e funcionalidades ausentes

> O arquivo/frames do Figma não estão versionados no repositório. A lista abaixo foi levantada a partir do código e cobre o que está **hardcoded, inerte ou simplesmente ausente** em relação a um escopo de design completo. Cada item tem âncora no código.

| # | Desvio | Evidência |
| --- | --- | --- |
| D1 | **Detalhe do NFT não é rota no mobile.** O estado é local (`selectedNft`), sem URL, sem histórico e sem deep link. A rota `/nft/$nftId` renderiza `AppDesktop` incondicionalmente, então um link compartilhado em viewport mobile mostra o layout desktop. | `AppMobile.tsx:181,299`; `router.tsx:15-20` |
| D2 | **Abas do mobile ignoram os flags do domínio.** "Novos lançamentos" apenas inverte o array e "Em alta" ordena por preço, embora `Nft.isNew`/`Nft.trending` existam e o REST aceite `tab=new`. O desktop usa os flags corretamente. | `AppMobile.tsx:205-207`; `AppDesktop.tsx:564-568`; `handlers.ts:113-117` |
| D3 | **Painel de filtros do mobile tem uma única opção** ("Maior preço primeiro") que apenas troca para a aba "Em alta". | `AppMobile.tsx:520-534` |
| D4 | **Carrossel do hero é estático**: dots com `aria-label="Slide 1 de 3"`, sempre no índice 0, sem lógica de slide. | `AppMobile.tsx:582-592` |
| D5 | **Conteúdo hardcoded nas telas de detalhe**: nota 4.8 (19 avaliações), três avaliações de exemplo, chips de edição `["1/10","1/10",…,"ABERTA"]`, `ID do token = id × 42`, texto de descrição, "Rede: Ethereum", royalties e contrato `0x7A42...19E8`. | `AppDesktop.tsx:232-271,330-400`; `AppMobile.tsx:84-115` |
| D6 | **Filtros e busca rodam no cliente.** O REST suporta `search`, `category`, `tab`, `minPrice`, `maxPrice` e `sort`, mas a UI busca uma única página de 50 e filtra em memória (o e2e do marketplace exercita a UI; o contrato REST é testado diretamente no `network-mocks.spec.ts`). | `hooks.ts:12-17`; `AppDesktop.tsx:552-582`; `AppMobile.tsx:198-203` |
| D7 | **Sem estado de sessão nem logout.** "Sair" é `aria-disabled` com `title="Em breve"`; o cabeçalho sempre mostra "Entrar"; `api.session`/`api.logout` não são chamados; e o cadastro não persiste token, então a UI nunca sabe quem está logado. | `components/account/shell.tsx:137-142`; `AppDesktop.tsx:810-815`; `service.ts:49-50`; `handlers.ts:390-392` |
| D8 | **OAuth é stub**: "Continuar com Google"/"Facebook" apenas exibem "…ficará disponível após configurar a autenticação OAuth." | `AppDesktop.tsx:1470-1501`; `AppMobile.tsx:441-474` |
| D9 | **Carteiras**: não existe exclusão (nem endpoint); o "Adicionar" ao lado do título **Carteira principal** revela o formulário da **secundária**; no máximo duas carteiras pela UI; não há link de `/carteiras` para o checkout nem do carrinho para `/carteiras`. | `carteiras.tsx:411-415`; `service.ts:73-75` |
| D10 | **Campos coletados e não enviados**: o seletor de sufixo ENS (`.eth`/`.lens`) nunca vai para a API; `Profile.bio` existe no contrato e não tem campo na UI; `AccountPasswordInput`/`AccountEnsField` recebem `invalid` que nunca é passado, logo `aria-invalid` nunca é emitido. | `perfil.tsx:29,132-139`; `carteiras.tsx:367-380`; `controls.tsx`; `styles.ts:14` |
| D11 | **Seções estáticas**: "Colecionadores também viram", "Diário da Cunhagem", banners de lançamento e a paginação `1…5` do hero (botões que não paginam). | `cart.tsx:587-642`; `AppDesktop.tsx:1098-1211` |
| D12 | **Formulários de newsletter inertes** (só `preventDefault`). | `AppDesktop.tsx:1265-1273`; `cart.tsx:678-695` |
| D13 | **Tipografia e tokens divergentes**: a fonte Geist é importada, mas `body { font-family: monospace }` sobrepõe `html { font-sans }` — a interface renderiza em monoespaçada do navegador. A área de conta usa outra linguagem (raio 4 px, altura 40 px) versus o marketplace (raio 28 px, 50 px). | `index.css:7,110`; `components/account/styles.ts` |
| D14 | **Metadados placeholder**: `<html lang="en">` e `<title>nft</title>`. | `index.html:3,8` |
| D15 | **Não existe histórico de pedidos**: `["orders"]` é invalidada, mas nenhuma tela faz a query; `api.orders()`/`api.order()` não são usados. | `hooks.ts`; `RealtimeBridge.tsx:25,51`; `service.ts:89` |
| D16 | **Seletor de quantidade não respeita `availableCopies`**: o `+` da tela de detalhe é ilimitado e o estouro só aparece como `409` no carrinho. | `AppDesktop.tsx:274-296`; `AppMobile.tsx:121-148` |
| D17 | **Thumbnails do carrinho vêm de mapa hardcoded** (`artworkById`) em vez de `nft.img`. | `routes/cart.tsx:24-33` |
| D18 | **Plural do badge**: `Carrinho, 1 itens`. Preservado porque o teste e2e afirma a string exata. | `AppMobile.tsx:747`; `tests/marketplace.spec.ts:291` |
| D19 | **Navegação morta**: no shell de conta, "Mercado", "Criadores", "Aprenda", o ícone de busca e o botão "Entrar" apontam todos para `/`. | `components/account/shell.tsx:54-92` |
| D20 | **Código morto**: `components/ui/sidebar.tsx` (≈720 linhas) e `hooks/use-mobile.ts` não são importados por ninguém (o `App.tsx` reimplementa o breakpoint); `useMockReset`, `api.setScenario`, `api.session` e `api.logout` também. | `components/ui/sidebar.tsx`; `hooks/use-mobile.ts`; `App.tsx:7-19` |

## 12. Limitações técnicas

**Transporte**

- L1 — O MSW roda **no navegador**: exige service worker, não funciona em SSR e quebra se a build for publicada em subcaminho (worker e `path` do Socket.IO assumem a raiz).
- L2 — `@mswjs/socket.io-binding` é limitado por desenho: namespace padrão, apenas eventos de texto, **sem** anexos binários, **sem** rooms, **sem** acknowledgements, **sem** heartbeat/reconexão de produção. Não é um servidor Socket.IO.
- L3 — O cliente usa **somente WebSocket** (sem polling) e no máximo **5 tentativas** de reconexão; sem backoff configurado explicitamente.
- L4 — Broadcast global, sem roteamento por usuário (ver §3.2).
- L5 — A latência dos cenários usa um contador **de módulo**: os atrasos dependem da ordem global de requisições do app, e não por endpoint.
- L6 — O guard `offline`/`4xx`/`5xx` não cobre os endpoints de controle (`/mock/*`) nem todo `/auth/*` (ex.: `/auth/session`, `/auth/logout` e `/auth/change-password` respondem pelo guard de usuário). Isso é intencional: sempre existe um caminho de recuperação.
- L7 — Cenários de rede afetam **toda** a aplicação de uma vez; não há falhas por endpoint.

**Domínio**

- L8 — Nenhuma integração real: sem blockchain, sem extensão de carteira, sem gateway de pagamento. A confirmação do pagamento é instantânea e o `transactionReference` é um UUID.
- L9 — Autenticação fictícia: senhas em texto no estado do mock, token sem expiração real, sem refresh token, sem rate limit, sem cookie `HttpOnly`.
- L10 — Carrinho sem expiração, sem endereço de entrega e sem subdivisão por moeda; valores em ETH sem conversão.
- L11 — Idempotência é apenas em memória/`localStorage` e por impressão digital do corpo — não há TTL nem limpeza das chaves.
- L12 — Sem testes unitários/integrados: a verificação automatizada é Playwright (2 specs, 7 testes) sobre os mesmos handlers MSW. O `npm run lint` também não está limpo: 9 erros e 3 avisos pré-existentes (`react-refresh/only-export-components` em `lib/cart.tsx`, `router.tsx`, `components/ui/button.tsx`, `components/ui/sidebar.tsx`; `react-hooks/set-state-in-effect` em `AppDesktop.tsx:546`; `@typescript-eslint/no-unused-vars` em `RealtimeBridge.tsx:50` e `mocks/fixtures.ts:251`; `prefer-const` em `mocks/handlers.ts:107`).
- L13 — `Profile.bio`, `ensSuffix`, `Wallet.displayName` e `Wallet.profileName` existem no contrato mas não têm efeito de domínio.

**Estrutura**

- L14 — Sem `DELETE /wallets/:id` (exclusão de carteira é impossível pela API).
- L15 — Sem endpoint de pedidos paginado nem recibo: `GET /orders/:id` devolve `404` para pedido de outro usuário, sem distinguir "inexistente" de "sem permissão".
- L16 — Build sem code splitting: chunk principal ≈ 1,03 MB (347 kB gzip) e quatro PNGs de ≈ 2 MB cada. O script Lighthouse existe para acompanhar isso.

## 13. Decisões técnicas e trade-offs

| Decisão | Alternativa descartada | Motivo |
| --- | --- | --- |
| MSW no navegador para REST **e** WebSocket | json-server / mock backend em Node | Um único conjunto de handlers serve dev, build de demonstração e Playwright; sem segundo processo; e o mesmo store alimenta REST e eventos, o que torna a reconciliação observável |
| Axios com interceptor de `Bearer` | wrapper de `fetch` | Injeção global de token em um lugar; timeout por requisição simples (`createOrder` com 1.000 ms) |
| TanStack Query com `retry: 0`, `staleTime: 0` | cache com `staleTime` alto | Falhas de cenário precisam aparecer imediatamente, sem retry storms que escondem o comportamento testado |
| Carrinho autoritativo no servidor | estado de carrinho no cliente | Evita divergência de preço/quantidade e centraliza cupom, taxa e validação de estoque |
| `version` por recurso em `Nft`/`Order`/`Cart` | ETag / `If-Match` | Sinples de serializar no mock e suficiente para descartar eventos fora de ordem no cliente |
| Invalidação total no `connect` | diff de eventos desde o último `sequence` | Mais simples e correto sem estado de histórico; o custo é um refetch por reconexão |
| Duas árvores de UI (`AppMobile`/`AppDesktop`) | layout único responsivo | Fidelidade aos frames; custo aceito: duplicação de markup e mensagens |

## 14. Mapa de responsabilidades (referência rápida)

| Arquivo | Papel |
| --- | --- |
| `src/api/contracts.ts` | DTOs, `MockScenario`, `MOCK_SCENARIOS`, rótulos |
| `src/api/http.ts` | Axios, timeout, interceptor `Bearer` |
| `src/api/service.ts` | Métodos REST tipados (um por endpoint) |
| `src/api/hooks.ts` | Query keys, favoritos otimistas, profile/wallets |
| `src/api/queryClient.ts` | Defaults sem retry |
| `src/api/realtime.ts` | Criação do socket (import dinâmico pós-MSW) |
| `src/api/RealtimeBridge.tsx` | `subscribe`, patch versionado, invalidações |
| `src/lib/cart.tsx` | `CartProvider`: itens, resumo, erro |
| `src/mocks/handlers.ts` | Contratos REST, validações, idempotência, side effects |
| `src/mocks/state.ts` | Estado persistido, sessões, senhas, seleção de cenário |
| `src/mocks/socketHandlers.ts` | `ws.link()` + binding Socket.IO |
| `src/mocks/realtime.ts` | Hub de broadcast |
| `src/mocks/scenarios.ts` | Latência, falhas, validação de nome de cenário |
| `src/mocks/fixtures.ts` | 16 NFTs, 2 usuários, perfis, carteiras, carrinhos |
| `src/router.tsx` | `/`, `/cart`, `/nft/$nftId`, `/perfil`, `/carteiras`, `/pedido/$orderId` |
| `src/App.tsx` / `AppDesktop.tsx` / `AppMobile.tsx` | Alternância de layout e telas de mercado |
| `src/routes/cart.tsx` / `perfil.tsx` / `carteiras.tsx` / `pedido-confirmado.tsx` | Carrinho, perfil do colecionador, carteiras, confirmação de pedido |
| `src/components/account/*` | Design system exclusivo da área de conta |
