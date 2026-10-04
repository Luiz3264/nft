# Network mock architecture

## Run and configure

- `npm run dev` / `npm run dev:demo`: Vite's `demo` mode starts MSW in the browser.
- `npm run build:demo`: type-checks and builds the same mock-enabled app for static hosting/preview.
- `npm run build`: normal Vite build; mocks start only when `VITE_API_MOCKS=true` is set.
- `VITE_API_MOCKS=false` disables interception. The UI then expects a real API at `/api` and a Socket.IO endpoint at `/socket.io/`.
- Select a deterministic scenario with `?mockScenario=<name>` or persist it through `POST /api/mock/scenario`. Supported names are returned by `GET /api/mock/scenarios`.
- Reset all mock state to the fixture baseline (retaining the selected scenario) with `POST /api/mock/reset`; reset to an explicit scenario by sending `{ "scenario": "success" }`. Reset clears session tokens, catalog changes, favorites, carts, profiles, wallets, orders, and idempotency records.
- Browser state is stored under `kurio.mock.state.v1`; clear that key to discard persistence manually.

Demo accounts (password: `demo-pass-123`):

| Email              | Account       |
| ------------------ | ------------- |
| `ada@example.test` | Ada Collector |
| `lin@example.test` | Lin Curator   |

Passwords are fixture-only and are not copied into persisted profile/session records. New registrations are kept as mock profiles for the current persisted scenario; authentication credentials are not stored.

## Shared boundaries

`src/api/contracts.ts` defines the REST DTOs and `MockScenario` union. `src/api/http.ts` is the Axios transport; `src/api/service.ts` contains typed REST methods; `src/api/hooks.ts` owns query keys and optimistic favorite behavior. UI components call API methods/hooks and do not return mock payloads. `src/mocks/fixtures.ts`, `src/mocks/state.ts`, and `src/mocks/handlers.ts` define fixtures, persisted domain state, and MSW REST behavior. Development, demo builds, and Playwright use the same browser worker and handler set.

REST resources include catalog/detail, favorites, cart/summary/coupon, registration/login/session/logout, profile, wallets, orders, and scenario controls. Catalog list accepts `page`, `pageSize`, `search`, `category`, `tab`, `minPrice`, `maxPrice`, and `sort`. Order creation requires `Idempotency-Key`; the same key and same payload returns the original order, while a different payload is a `409 IDEMPOTENCY_CONFLICT`.

State is shared by resource identity: the catalog's price/availability is authoritative for cart line items and checkout validation; favorites, cart, profile, wallets, and orders are partitioned by user (guest cart/favorites are separate); order receipts retain a purchase-time item/price snapshot. Mutations persist in local storage to survive refresh. `POST /api/mock/reset` reinstates the fixtures as a single coherent baseline.

## Network scenarios

| Scenario                                   | Deterministic behavior                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `success`                                  | Normal REST results and confirmed payment                                                                                          |
| `empty`                                    | Empty catalog list                                                                                                                 |
| `variable-latency`                         | Repeating request delays (120–650 ms)                                                                                              |
| `out-of-order`                             | Repeating 700/70/350 ms delays to produce completion-order inversions                                                              |
| `offline`                                  | MSW network error                                                                                                                  |
| `http-4xx`, `http-5xx`                     | Deterministic 400 and 503 responses                                                                                                |
| `session-expired`, `unauthorized`          | 401 expired session and 403 permission failure on protected resources                                                              |
| `registration-conflict`, `form-validation` | 409 email conflict and 422 field validation                                                                                        |
| `coupon-invalid`, `coupon-expired`         | 422 invalid and 410 expired coupon responses                                                                                       |
| `price-changed`, `edition-sold-out`        | Changes catalog/cart state during order submission and emits `nft.updated`; checkout gets 409                                      |
| `order-timeout`                            | Commits the order and emits its event, then exceeds Axios's order timeout; retry with the same idempotency key recovers that order |
| `payment-confirmed`, `payment-declined`    | Terminal confirmed/declined order outcomes                                                                                         |

Use `POST /api/mock/events/price-change` with `{ "nftId": 1, "price": 1.55 }` or `availableCopies` to mutate the fixture through REST and broadcast the matching event.

## Socket.IO mock transport and limitations

The application uses the actual `socket.io-client` against `/socket.io/` with WebSocket transport. MSW's `ws.link()` intercepts that connection, and `@mswjs/socket.io-binding` adapts Engine.IO/Socket.IO text frames for handlers. The app subscribes with the mock session token and receives `nft.updated`, `order.updated`, and session events through Socket.IO listeners. REST mutations that change catalog prices/availability and orders broadcast matching events from the same mock store; `scenario.trigger` is also a Socket.IO client event for a mock NFT update.

This is an in-browser deterministic transport, not a real Socket.IO server. The binding is intentionally limited: default namespace and text events only; no binary attachments, rooms, acknowledgements, or production heartbeat/reconnection guarantees. The client uses WebSocket only and bounded reconnect attempts. After an actual reconnect, consumers should reconcile through REST; events are versioned/sequence-tagged so consumers can avoid applying older data. No blockchain, wallet extension, or payment gateway is contacted.
