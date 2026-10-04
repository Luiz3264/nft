import type {
  Cart,
  MockScenario,
  Nft,
  Order,
  Profile,
  Session,
  Wallet,
} from "@/api/contracts";
import {
  fixtureNfts,
  fixtureUsers,
  createInitialCarts,
  createInitialProfiles,
  createInitialWallets,
} from "./fixtures";

const STORAGE_KEY = "kurio.mock.state.v1";
const DEFAULT_SCENARIO: MockScenario = "success";

type MockState = {
  scenario: MockScenario;
  nfts: Nft[];
  favorites: Record<string, number[]>;
  carts: Record<string, Cart>;
  profiles: Record<string, Profile>;
  wallets: Record<string, Wallet[]>;
  sessions: Record<string, Session>;
  passwords: Record<string, string>;
  orders: Order[];
  idempotency: Record<string, { fingerprint: string; orderId: string }>;
  eventSequence: number;
};

function createInitialPasswords(): Record<string, string> {
  return Object.fromEntries(
    fixtureUsers.map((user) => [user.id, user.password]),
  );
}

function freshState(scenario: MockScenario = DEFAULT_SCENARIO): MockState {
  return {
    scenario,
    nfts: structuredClone(fixtureNfts),
    favorites: { guest: [], "collector-ada": [], "collector-lin": [] },
    carts: createInitialCarts(),
    profiles: createInitialProfiles(),
    wallets: createInitialWallets(),
    sessions: {},
    passwords: createInitialPasswords(),
    orders: [],
    idempotency: {},
    eventSequence: 0,
  };
}

function readStoredState(): MockState {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...freshState(), ...JSON.parse(stored) } as MockState;
  } catch {
    // Invalid or unavailable browser storage intentionally falls back to seed data.
  }
  return freshState();
}

let state = typeof window === "undefined" ? freshState() : readStoredState();

function persist() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export const mockStore = {
  get scenario() {
    return state.scenario;
  },
  snapshot() {
    return structuredClone(state);
  },
  reset(scenario: MockScenario = DEFAULT_SCENARIO) {
    state = freshState(scenario);
    window.localStorage.removeItem("kurio.mock.token");
    persist();
    return this.snapshot();
  },
  setScenario(scenario: MockScenario) {
    state.scenario = scenario;
    persist();
  },
  nfts() {
    return state.nfts;
  },
  nft(id: number) {
    return state.nfts.find((nft) => nft.id === id);
  },
  updateNft(
    id: number,
    changes: Partial<Pick<Nft, "price" | "availableCopies">>,
  ) {
    const nft = state.nfts.find((item) => item.id === id);
    if (!nft) return undefined;
    Object.assign(nft, changes, { version: nft.version + 1 });
    for (const cart of Object.values(state.carts)) {
      const cartItem = cart.items.find((item) => item.nftId === id);
      if (cartItem) {
        cartItem.price = nft.price;
        cartItem.version = nft.version;
        cart.version += 1;
      }
    }
    state.eventSequence += 1;
    persist();
    return { ...nft, sequence: state.eventSequence };
  },
  cart(userId: string | null) {
    return state.carts[userId ?? "guest"] ?? state.carts.guest;
  },
  updateCart(userId: string | null, cart: Cart) {
    state.carts[userId ?? "guest"] = cart;
    persist();
    return cart;
  },
  favorites(userId: string) {
    return state.favorites[userId] ?? [];
  },
  setFavorites(userId: string, ids: number[]) {
    state.favorites[userId] = ids;
    persist();
    return ids;
  },
  userForEmail(email: string) {
    return fixtureUsers.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  },
  createSession(userId: string): Session {
    const user = state.profiles[userId];
    const token = `mock-${userId}-${crypto.randomUUID()}`;
    const session = {
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName },
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
    state.sessions[token] = session;
    persist();
    return session;
  },
  registerUser(email: string, displayName: string) {
    const userId = `collector-${crypto.randomUUID()}`;
    const user = { id: userId, email, displayName };
    state.profiles[userId] = {
      ...user,
      avatarUrl: null,
      bio: "Colecionador Kurio",
      username: displayName.toLocaleLowerCase().replace(/\s+/g, ""),
      ensName: "",
      walletLabel: "Carteira principal",
    };
    state.wallets[userId] = [];
    state.carts[userId] = {
      userId,
      items: [],
      couponCode: null,
      discount: 0,
      networkFee: 0,
      version: 1,
    };
    state.favorites[userId] = [];
    persist();
    return this.createSession(userId);
  },
  session(token: string | null) {
    return token ? state.sessions[token] : undefined;
  },
  password(userId: string) {
    return state.passwords[userId];
  },
  changePassword(userId: string, password: string) {
    state.passwords[userId] = password;
    persist();
  },
  profile(userId: string) {
    return state.profiles[userId];
  },
  updateProfile(userId: string, changes: Partial<Profile>) {
    state.profiles[userId] = { ...state.profiles[userId], ...changes };
    persist();
    return state.profiles[userId];
  },
  wallets(userId: string) {
    return state.wallets[userId] ?? [];
  },
  saveWallet(userId: string, wallet: Omit<Wallet, "id"> & { id?: string }) {
    const entries = state.wallets[userId] ?? [];
    const id = wallet.id ?? `wallet-${crypto.randomUUID()}`;
    const saved: Wallet = { ...wallet, id };
    const updated = entries.some((entry) => entry.id === id)
      ? entries.map((entry) =>
          entry.id === id
            ? saved
            : wallet.primary
              ? { ...entry, primary: false }
              : entry,
        )
      : [
          ...entries.map((entry) =>
            wallet.primary ? { ...entry, primary: false } : entry,
          ),
          saved,
        ];
    state.wallets[userId] = updated;
    persist();
    return updated;
  },
  order(id: string) {
    return state.orders.find((order) => order.id === id);
  },
  orders(userId: string) {
    return state.orders.filter((order) => order.userId === userId);
  },
  createOrder(
    input: Omit<Order, "id" | "createdAt" | "version">,
    fingerprint: string,
  ) {
    const previous = state.idempotency[input.idempotencyKey];
    if (previous)
      return {
        order: this.order(previous.orderId)!,
        reused: true,
        conflict: previous.fingerprint !== fingerprint,
      };
    const order: Order = {
      ...input,
      id: `ord-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      version: 1,
    };
    state.orders.push(order);
    state.idempotency[input.idempotencyKey] = {
      fingerprint,
      orderId: order.id,
    };
    persist();
    return { order, reused: false, conflict: false };
  },
  updateOrder(order: Order) {
    const index = state.orders.findIndex((item) => item.id === order.id);
    if (index < 0) return order;
    state.orders[index] = {
      ...order,
      version: state.orders[index].version + 1,
    };
    persist();
    return state.orders[index];
  },
};

export function selectInitialScenario(): MockScenario {
  const fromQuery = new URLSearchParams(window.location.search).get(
    "mockScenario",
  );
  const fromStorage = window.localStorage.getItem("kurio.mock.scenario");
  const selected = fromQuery ?? fromStorage;
  return selected &&
    [
      "success",
      "empty",
      "variable-latency",
      "out-of-order",
      "offline",
      "http-4xx",
      "http-5xx",
      "session-expired",
      "unauthorized",
      "registration-conflict",
      "form-validation",
      "coupon-invalid",
      "coupon-expired",
      "price-changed",
      "edition-sold-out",
      "order-timeout",
      "payment-confirmed",
      "payment-declined",
    ].includes(selected)
    ? (selected as MockScenario)
    : "success";
}
