import { delay, http, HttpResponse } from "msw";
import {
  MOCK_SCENARIOS,
  type Cart,
  type CartItem,
  type MockScenario,
  type Nft,
  type Order,
  type Profile,
  type Wallet,
} from "@/api/contracts";
import { fixtureUsers } from "./fixtures";
import { mockStore } from "./state";
import {
  applyScenarioLatency,
  isMockScenario,
  resetScenarioTiming,
  scenarioFailure,
} from "./scenarios";
import { realtimeHub } from "./realtime";

const base = new URL("/api", window.location.origin).toString();
const jsonError = (
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
) =>
  HttpResponse.json(
    { code, message, ...(fields ? { fields } : {}) },
    { status },
  );

function bearer(request: Request) {
  return (
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null
  );
}

function currentUser(request: Request) {
  const session = mockStore.session(bearer(request));
  if (mockStore.scenario === "session-expired")
    return {
      error: jsonError(
        401,
        "SESSION_EXPIRED",
        "Sua sessão expirou. Entre novamente.",
      ),
    };
  if (mockStore.scenario === "unauthorized")
    return {
      error: jsonError(
        403,
        "FORBIDDEN",
        "Esta operação exige uma permissão adicional.",
      ),
    };
  if (!session)
    return {
      error: jsonError(401, "UNAUTHENTICATED", "Autenticação necessária."),
    };
  return { user: session.user };
}

async function guard(request: Request) {
  const failure = scenarioFailure();
  if (failure) return failure;
  await applyScenarioLatency();
  if (request.signal.aborted) return HttpResponse.error();
  return undefined;
}

function calculate(cart: Cart): Cart {
  cart.networkFee = cart.items.length ? 0.016 : 0;
  cart.discount = cart.couponCode
    ? Number(
        (
          cart.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          ) * 0.1
        ).toFixed(3),
      )
    : 0;
  return cart;
}

function filteredCatalog(url: URL): {
  items: Nft[];
  total: number;
  page: number;
  pageSize: number;
} {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? 50)),
  );
  const search = (url.searchParams.get("search") ?? "").toLocaleLowerCase();
  const category = url.searchParams.get("category");
  const tab = url.searchParams.get("tab");
  const minPrice = Number(url.searchParams.get("minPrice") ?? 0);
  const maxPrice = Number(
    url.searchParams.get("maxPrice") ?? Number.POSITIVE_INFINITY,
  );
  const sort = url.searchParams.get("sort") ?? "recent";
  const items =
    mockStore.scenario === "empty"
      ? []
      : [...mockStore.nfts()].filter(
          (nft) =>
            nft.price >= minPrice &&
            nft.price <= maxPrice &&
            (!category || category === "Todas" || nft.category === category) &&
            (!tab ||
              tab === "all" ||
              (tab === "new" ? nft.isNew : nft.trending)) &&
            (!search ||
              `${nft.name} ${nft.category} ${nft.collection}`
                .toLocaleLowerCase()
                .includes(search)),
        );
  if (sort === "price-ascending") items.sort((a, b) => a.price - b.price);
  else if (sort === "price-descending") items.sort((a, b) => b.price - a.price);
  else items.sort((a, b) => b.id - a.id);
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

export const handlers = [
  http.get(`${base}/mock/scenarios`, () => HttpResponse.json(MOCK_SCENARIOS)),
  http.get(`${base}/mock/scenario`, () =>
    HttpResponse.json({ scenario: mockStore.scenario }),
  ),
  http.get(`${base}/mock/socket-status`, () =>
    HttpResponse.json({ subscribers: realtimeHub.subscriberCount }),
  ),
  http.post(`${base}/mock/scenario`, async ({ request }) => {
    const { scenario } = (await request.json()) as { scenario: MockScenario };
    if (!isMockScenario(scenario))
      return jsonError(422, "INVALID_SCENARIO", "Cenário desconhecido.");
    resetScenarioTiming();
    mockStore.reset(scenario);
    window.localStorage.setItem("kurio.mock.scenario", scenario);
    return HttpResponse.json({ scenario, reset: true });
  }),
  http.post(`${base}/mock/reset`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      scenario?: MockScenario;
    };
    const scenario =
      body.scenario && isMockScenario(body.scenario)
        ? body.scenario
        : mockStore.scenario;
    resetScenarioTiming();
    mockStore.reset(scenario);
    window.localStorage.setItem("kurio.mock.scenario", scenario);
    return HttpResponse.json({ scenario, reset: true });
  }),
  http.get(`${base}/nfts`, async ({ request }) => {
    const failed = await guard(request);
    if (failed) return failed;
    const result = filteredCatalog(new URL(request.url));
    return HttpResponse.json({
      ...result,
      hasMore: result.page * result.pageSize < result.total,
    });
  }),
  http.get(`${base}/nfts/:id`, async ({ request, params }) => {
    const failed = await guard(request);
    if (failed) return failed;
    const nft = mockStore.nft(Number(params.id));
    return nft
      ? HttpResponse.json(nft)
      : jsonError(404, "NFT_NOT_FOUND", "NFT não encontrado.");
  }),
  http.get(`${base}/favorites`, async ({ request }) => {
    const failed = await guard(request);
    if (failed) return failed;
    const userId = mockStore.session(bearer(request))?.user.id ?? "guest";
    return HttpResponse.json(mockStore.favorites(userId));
  }),
  http.put(`${base}/favorites/:id`, async ({ request, params }) => {
    const failed = await guard(request);
    if (failed) return failed;
    const userId = mockStore.session(bearer(request))?.user.id ?? "guest";
    const id = Number(params.id);
    if (!mockStore.nft(id))
      return jsonError(404, "NFT_NOT_FOUND", "NFT não encontrado.");
    const { favorite } = (await request.json()) as { favorite: boolean };
    const current = mockStore.favorites(userId);
    const ids = favorite
      ? [...new Set([...current, id])]
      : current.filter((value) => value !== id);
    return HttpResponse.json(mockStore.setFavorites(userId, ids));
  }),
  http.get(`${base}/cart`, async ({ request }) => {
    const failed = await guard(request);
    return (
      failed ??
      HttpResponse.json(
        calculate(
          mockStore.cart(mockStore.session(bearer(request))?.user.id ?? null),
        ),
      )
    );
  }),
  http.get(`${base}/cart/summary`, async ({ request }) => {
    const failed = await guard(request);
    if (failed) return failed;
    const cart = calculate(
      mockStore.cart(mockStore.session(bearer(request))?.user.id ?? null),
    );
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    return HttpResponse.json({
      subtotal,
      discount: cart.discount,
      networkFee: cart.networkFee,
      total: Number((subtotal - cart.discount + cart.networkFee).toFixed(3)),
      couponCode: cart.couponCode,
    });
  }),
  http.post(`${base}/cart/items`, async ({ request }) => {
    const failed = await guard(request);
    if (failed) return failed;
    const { nftId, quantity = 1 } = (await request.json()) as {
      nftId: number;
      quantity?: number;
    };
    const nft = mockStore.nft(nftId);
    if (!nft) return jsonError(404, "NFT_NOT_FOUND", "NFT não encontrado.");
    if (!Number.isInteger(quantity) || quantity < 1)
      return jsonError(
        422,
        "INVALID_QUANTITY",
        "A quantidade precisa ser um inteiro positivo.",
      );
    if (nft.availableCopies < quantity)
      return jsonError(
        409,
        "EDITION_SOLD_OUT",
        "Não há exemplares suficientes disponíveis.",
      );
    const userId = mockStore.session(bearer(request))?.user.id ?? null;
    const cart = mockStore.cart(userId);
    const existing = cart.items.find((item) => item.nftId === nftId);
    const items = existing
      ? cart.items.map((item) =>
          item.nftId === nftId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      : [
          ...cart.items,
          {
            nftId,
            name: nft.name,
            price: nft.price,
            quantity,
            version: nft.version,
          },
        ];
    return HttpResponse.json(
      mockStore.updateCart(
        userId,
        calculate({ ...cart, items, version: cart.version + 1 }),
      ),
      { status: 201 },
    );
  }),
  http.patch(`${base}/cart/items/:id`, async ({ request, params }) => {
    const failed = await guard(request);
    if (failed) return failed;
    const userId = mockStore.session(bearer(request))?.user.id ?? null;
    const cart = mockStore.cart(userId);
    const nftId = Number(params.id);
    const { quantity } = (await request.json()) as { quantity: number };
    const nft = mockStore.nft(nftId);
    if (!Number.isInteger(quantity) || quantity < 0)
      return jsonError(
        422,
        "INVALID_QUANTITY",
        "A quantidade informada é inválida.",
      );
    if (nft && quantity > nft.availableCopies)
      return jsonError(
        409,
        "EDITION_SOLD_OUT",
        "A edição não possui essa quantidade disponível.",
      );
    const items =
      quantity === 0
        ? cart.items.filter((item) => item.nftId !== nftId)
        : cart.items.map((item) =>
            item.nftId === nftId ? { ...item, quantity } : item,
          );
    return HttpResponse.json(
      mockStore.updateCart(
        userId,
        calculate({ ...cart, items, version: cart.version + 1 }),
      ),
    );
  }),
  http.delete(`${base}/cart/items/:id`, async ({ request, params }) => {
    const failed = await guard(request);
    if (failed) return failed;
    const userId = mockStore.session(bearer(request))?.user.id ?? null;
    const cart = mockStore.cart(userId);
    const items = cart.items.filter((item) => item.nftId !== Number(params.id));
    return HttpResponse.json(
      mockStore.updateCart(
        userId,
        calculate({ ...cart, items, version: cart.version + 1 }),
      ),
    );
  }),
  http.post(`${base}/cart/coupon`, async ({ request }) => {
    const failed = await guard(request);
    if (failed) return failed;
    const { code } = (await request.json()) as { code: string };
    const normalized = code.trim().toUpperCase();
    if (mockStore.scenario === "coupon-invalid" || normalized !== "KURIO10")
      return jsonError(
        422,
        "COUPON_INVALID",
        "Código inválido. Confira o cupom e tente novamente.",
      );
    if (mockStore.scenario === "coupon-expired")
      return jsonError(
        410,
        "COUPON_EXPIRED",
        "Este cupom expirou e não pode mais ser aplicado.",
      );
    const userId = mockStore.session(bearer(request))?.user.id ?? null;
    const cart = mockStore.cart(userId);
    cart.couponCode = normalized;
    cart.version += 1;
    calculate(cart);
    mockStore.updateCart(userId, cart);
    return HttpResponse.json({
      code: normalized,
      discount: cart.discount,
      message: `Cupom ${normalized} aplicado: 10% de desconto.`,
    });
  }),
  http.post(`${base}/auth/register`, async ({ request }) => {
    const failed = await guard(request);
    if (failed) return failed;
    if (mockStore.scenario === "registration-conflict")
      return jsonError(
        409,
        "EMAIL_TAKEN",
        "Já existe uma conta com este e-mail.",
      );
    if (mockStore.scenario === "form-validation")
      return jsonError(
        422,
        "VALIDATION_ERROR",
        "Revise os campos informados.",
        { displayName: "Nome de usuário já está em uso." },
      );
    const { email, password, displayName } = (await request.json()) as {
      email: string;
      password: string;
      displayName: string;
    };
    if (
      !displayName.trim() ||
      password.length < 8 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      return jsonError(422, "VALIDATION_ERROR", "Revise os campos informados.");
    if (
      fixtureUsers.some(
        (user) => user.email.toLowerCase() === email.toLowerCase(),
      )
    )
      return jsonError(
        409,
        "EMAIL_TAKEN",
        "Já existe uma conta com este e-mail.",
      );
    const session = mockStore.registerUser(email, displayName);
    window.localStorage.setItem("kurio.mock.token", session.token);
    return HttpResponse.json(session, { status: 201 });
  }),
  http.post(`${base}/auth/login`, async ({ request }) => {
    const failed = await guard(request);
    if (failed) return failed;
    const { email, password } = (await request.json()) as {
      email: string;
      password: string;
    };
    const user = fixtureUsers.find(
      (entry) =>
        entry.email.toLowerCase() === email.toLowerCase() &&
        mockStore.password(entry.id) === password,
    );
    if (!user)
      return jsonError(
        401,
        "INVALID_CREDENTIALS",
        "E-mail ou senha inválidos.",
      );
    const session = mockStore.createSession(user.id);
    window.localStorage.setItem("kurio.mock.token", session.token);
    return HttpResponse.json(session);
  }),
  http.post(`${base}/auth/password-reset`, async ({ request }) => {
    const { email } = (await request.json()) as { email: string };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return jsonError(
        422,
        "VALIDATION_ERROR",
        "Digite um endereço de e-mail válido.",
      );
    return HttpResponse.json(
      {
        message:
          "Se o e-mail estiver cadastrado, enviaremos instruções de recuperação.",
      },
      { status: 202 },
    );
  }),
  http.get(`${base}/auth/session`, ({ request }) => {
    if (mockStore.scenario === "session-expired")
      return jsonError(401, "SESSION_EXPIRED", "Sua sessão expirou.");
    const session = mockStore.session(bearer(request));
    return session
      ? HttpResponse.json(session)
      : jsonError(401, "UNAUTHENTICATED", "Autenticação necessária.");
  }),
  http.post(`${base}/auth/logout`, ({ request }) => {
    const session = mockStore.session(bearer(request));
    if (session) window.localStorage.removeItem("kurio.mock.token");
    return HttpResponse.json({ loggedOut: true });
  }),
  http.post(`${base}/auth/change-password`, async ({ request }) => {
    const auth = currentUser(request);
    if (auth.error) return auth.error;
    const { currentPassword, newPassword } = (await request.json()) as {
      currentPassword: string;
      newPassword: string;
    };
    const user = fixtureUsers.find((entry) => entry.id === auth.user.id);
    if (!user || mockStore.password(user.id) !== currentPassword)
      return jsonError(
        422,
        "VALIDATION_ERROR",
        "Revise os campos informados.",
        { currentPassword: "A senha atual está incorreta." },
      );
    if (newPassword.length < 8)
      return jsonError(
        422,
        "VALIDATION_ERROR",
        "Revise os campos informados.",
        { newPassword: "Use ao menos oito caracteres." },
      );
    mockStore.changePassword(user.id, newPassword);
    return HttpResponse.json({ message: "Senha atualizada com sucesso." });
  }),
  http.get(`${base}/profile`, ({ request }) => {
    const auth = currentUser(request);
    if (auth.error) return auth.error;
    return HttpResponse.json(mockStore.profile(auth.user.id));
  }),
  http.patch(`${base}/profile`, async ({ request }) => {
    const auth = currentUser(request);
    if (auth.error) return auth.error;
    const changes = (await request.json()) as Partial<
      Pick<
        Profile,
        | "displayName"
        | "bio"
        | "avatarUrl"
        | "username"
        | "ensName"
        | "walletLabel"
        | "email"
      >
    >;
    const fields: Record<string, string> = {};
    if (
      changes.displayName !== undefined &&
      changes.displayName.trim().length < 2
    )
      fields.displayName = "Use ao menos dois caracteres.";
    if (changes.username !== undefined && changes.username.trim()) {
      if (!/^[a-z0-9_.-]{3,30}$/i.test(changes.username.trim()))
        fields.username =
          "Use de três a trinta caracteres: letras, números, ponto, hífen ou sublinhado.";
    }
    if (changes.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(changes.email))
      fields.email = "Digite um endereço de e-mail válido.";
    if (changes.ensName !== undefined && changes.ensName.trim()) {
      if (!/^[a-z0-9-]+$/i.test(changes.ensName.trim()))
        fields.ensName = "Informe um nome ENS válido.";
    }
    if (Object.keys(fields).length > 0)
      return jsonError(
        422,
        "VALIDATION_ERROR",
        "Revise os campos informados.",
        fields,
      );
    return HttpResponse.json(mockStore.updateProfile(auth.user.id, changes));
  }),
  http.get(`${base}/wallets`, ({ request }) => {
    const auth = currentUser(request);
    if (auth.error) return auth.error;
    return HttpResponse.json(mockStore.wallets(auth.user.id));
  }),
  http.put(`${base}/wallets`, async ({ request }) => {
    const auth = currentUser(request);
    if (auth.error) return auth.error;
    const wallet = (await request.json()) as Wallet;
    const fields: Record<string, string> = {};
    if (!/^0x[a-f\d]{40}$/i.test(wallet.address))
      fields.address = "Informe um endereço hexadecimal válido.";
    if (wallet.label.trim().length < 2)
      fields.label = "Use ao menos dois caracteres.";
    if (wallet.profileName !== undefined && wallet.profileName.trim() === "")
      fields.profileName = "Informe o nome do perfil.";
    if (wallet.email !== undefined && wallet.email.trim() !== "")
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wallet.email))
        fields.email = "Digite um endereço de e-mail válido.";
    if (
      wallet.secondaryAddress !== undefined &&
      wallet.secondaryAddress.trim() &&
      !/^0x[a-f\d]{40}$/i.test(wallet.secondaryAddress.trim()) &&
      !/^[a-z0-9-]+$/i.test(wallet.secondaryAddress.trim())
    )
      fields.secondaryAddress = "Informe um endereço 0x ou um nome ENS.";
    if (Object.keys(fields).length > 0)
      return jsonError(422, "VALIDATION_ERROR", "Revise os campos informados.", fields);
    return HttpResponse.json(mockStore.saveWallet(auth.user.id, wallet));
  }),
  http.get(`${base}/orders`, ({ request }) => {
    const auth = currentUser(request);
    if (auth.error) return auth.error;
    return HttpResponse.json(mockStore.orders(auth.user.id));
  }),
  http.get(`${base}/orders/:id`, ({ request, params }) => {
    const auth = currentUser(request);
    if (auth.error) return auth.error;
    const order = mockStore.order(String(params.id));
    if (!order || order.userId !== auth.user.id)
      return jsonError(404, "ORDER_NOT_FOUND", "Pedido não encontrado.");
    return HttpResponse.json(order);
  }),
  http.post(`${base}/orders`, async ({ request }) => {
    const failed = await guard(request);
    if (failed) return failed;
    const auth = currentUser(request);
    if (auth.error) return auth.error;
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey)
      return jsonError(
        400,
        "IDEMPOTENCY_KEY_REQUIRED",
        "A chave de idempotência é obrigatória.",
      );
    const body = (await request.json()) as {
      walletId: string;
      items: Array<{ nftId: number; quantity: number }>;
    };
    const cart = mockStore.cart(auth.user.id);
    const requested = body.items.map(({ nftId, quantity }) => ({
      nftId,
      quantity,
    }));
    const fingerprint = JSON.stringify({
      userId: auth.user.id,
      walletId: body.walletId,
      items: requested,
    });
    const existingKey = mockStore.snapshot().idempotency[idempotencyKey];
    if (existingKey) {
      const result = mockStore.createOrder(
        {} as Omit<Order, "id" | "createdAt" | "version">,
        fingerprint,
      );
      if (result.conflict)
        return jsonError(
          409,
          "IDEMPOTENCY_CONFLICT",
          "A chave já foi usada com conteúdo diferente.",
        );
      return HttpResponse.json(result.order);
    }
    const wallet = mockStore
      .wallets(auth.user.id)
      .find((entry) => entry.id === body.walletId);
    if (!wallet)
      return jsonError(
        422,
        "WALLET_REQUIRED",
        "Selecione uma carteira cadastrada.",
      );
    if (mockStore.scenario === "price-changed") {
      const first = requested[0];
      const nft = first && mockStore.nft(first.nftId);
      if (nft) {
        const updated = mockStore.updateNft(nft.id, {
          price: Number((nft.price + 0.2).toFixed(2)),
        });
        if (updated) realtimeHub.nftUpdated(updated);
      }
      return jsonError(
        409,
        "PRICE_CHANGED",
        "O preço mudou durante a compra. Revise o novo total.",
      );
    }
    if (mockStore.scenario === "edition-sold-out") {
      const first = requested[0];
      const nft = first && mockStore.nft(first.nftId);
      if (nft) {
        const updated = mockStore.updateNft(nft.id, { availableCopies: 0 });
        if (updated) realtimeHub.nftUpdated(updated);
      }
      return jsonError(
        409,
        "EDITION_SOLD_OUT",
        "A edição esgotou durante a compra.",
      );
    }
    for (const entry of requested) {
      const nft = mockStore.nft(entry.nftId);
      if (!nft || entry.quantity < 1 || entry.quantity > nft.availableCopies)
        return jsonError(
          409,
          "EDITION_SOLD_OUT",
          "A disponibilidade mudou. Revise seu carrinho.",
        );
    }
    const items: CartItem[] = requested.map(({ nftId, quantity }) => {
      const nft = mockStore.nft(nftId)!;
      return {
        nftId,
        name: nft.name,
        price: nft.price,
        quantity,
        version: nft.version,
      };
    });
    const subtotal = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    const input = {
      userId: auth.user.id,
      idempotencyKey,
      status: "pending" as const,
      items,
      subtotal,
      discount: cart.discount,
      networkFee: cart.networkFee,
      total: Number((subtotal - cart.discount + cart.networkFee).toFixed(3)),
      walletId: wallet.id,
      transactionReference: null,
    };
    const created = mockStore.createOrder(input, fingerprint);
    const status =
      mockStore.scenario === "payment-declined" ? "declined" : "confirmed";
    const order = mockStore.updateOrder({
      ...created.order,
      status,
      transactionReference:
        status === "confirmed"
          ? `0x${crypto.randomUUID().replaceAll("-", "")}`
          : null,
    });
    if (status === "confirmed") {
      for (const entry of requested) {
        const nft = mockStore.nft(entry.nftId);
        if (nft) {
          const updated = mockStore.updateNft(entry.nftId, {
            availableCopies: Math.max(0, nft.availableCopies - entry.quantity),
          });
          if (updated) realtimeHub.nftUpdated(updated);
        }
      }
      const after = mockStore.cart(auth.user.id);
      const remaining = after.items
        .map((item) => {
          const purchased = requested.find(
            (entry) => entry.nftId === item.nftId,
          );
          return purchased
            ? { ...item, quantity: item.quantity - purchased.quantity }
            : item;
        })
        .filter((item) => item.quantity > 0);
      mockStore.updateCart(auth.user.id, {
        ...after,
        items: remaining,
        couponCode: null,
        discount: 0,
        version: after.version + 1,
      });
    }
    realtimeHub.orderUpdated(order);
    if (mockStore.scenario === "order-timeout" && !created.reused)
      await delay(1_500);
    return HttpResponse.json(order, { status: 201 });
  }),
  http.post(`${base}/mock/events/price-change`, async ({ request }) => {
    const { nftId, price, availableCopies } = (await request.json()) as {
      nftId: number;
      price?: number;
      availableCopies?: number;
    };
    const changes: Partial<Pick<Nft, "price" | "availableCopies">> = {};
    if (price !== undefined) changes.price = price;
    if (availableCopies !== undefined)
      changes.availableCopies = availableCopies;
    const updated = mockStore.updateNft(nftId, changes);
    if (!updated) return jsonError(404, "NFT_NOT_FOUND", "NFT não encontrado.");
    realtimeHub.nftUpdated(updated);
    return HttpResponse.json(updated);
  }),
];
