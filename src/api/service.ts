import { http } from "./http";
import type {
  Cart,
  CartSummary,
  CouponResult,
  Nft,
  Order,
  Paginated,
  Profile,
  Session,
  User,
  Wallet,
} from "./contracts";

export const api = {
  catalog: async (
    params: {
      page?: number;
      pageSize?: number;
      search?: string;
      category?: string;
      sort?: string;
    } = {},
  ) => (await http.get<Paginated<Nft>>("/nfts", { params })).data,
  nft: async (id: number) => (await http.get<Nft>(`/nfts/${id}`)).data,
  favorites: async () => (await http.get<number[]>("/favorites")).data,
  toggleFavorite: async (nftId: number, favorite: boolean) =>
    (await http.put<number[]>(`/favorites/${nftId}`, { favorite })).data,
  cart: async () => (await http.get<Cart>("/cart")).data,
  cartSummary: async () => (await http.get<CartSummary>("/cart/summary")).data,
  addCartItem: async (nftId: number, quantity = 1) =>
    (await http.post<Cart>("/cart/items", { nftId, quantity })).data,
  updateCartItem: async (nftId: number, quantity: number) =>
    (await http.patch<Cart>(`/cart/items/${nftId}`, { quantity })).data,
  removeCartItem: async (nftId: number) =>
    (await http.delete<Cart>(`/cart/items/${nftId}`)).data,
  applyCoupon: async (code: string) =>
    (await http.post<CouponResult>("/cart/coupon", { code })).data,
  register: async (input: {
    email: string;
    password: string;
    displayName: string;
  }) => (await http.post<Session>("/auth/register", input)).data,
  login: async (input: { email: string; password: string }) =>
    (await http.post<Session>("/auth/login", input)).data,
  requestPasswordReset: async (email: string) =>
    (await http.post<{ message: string }>("/auth/password-reset", { email }))
      .data,
  session: async () => (await http.get<Session>("/auth/session")).data,
  logout: async () => http.post("/auth/logout"),
  changePassword: async (input: {
    currentPassword: string;
    newPassword: string;
  }) =>
    (
      await http.post<{ message: string }>("/auth/change-password", input)
    ).data,
  profile: async () => (await http.get<Profile>("/profile")).data,
  updateProfile: async (
    input: Partial<
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
    >,
  ) => (await http.patch<Profile>("/profile", input)).data,
  wallets: async () => (await http.get<Wallet[]>("/wallets")).data,
  saveWallet: async (wallet: Omit<Wallet, "id"> & { id?: string }) =>
    (await http.put<Wallet[]>("/wallets", wallet)).data,
  createOrder: async (
    input: {
      walletId: string;
      items: Array<{ nftId: number; quantity: number }>;
    },
    idempotencyKey: string,
  ) =>
    (
      await http.post<Order>("/orders", input, {
        headers: { "Idempotency-Key": idempotencyKey },
        timeout: 1_000,
      })
    ).data,
  order: async (id: string) => (await http.get<Order>(`/orders/${id}`)).data,
  resetMocks: async (scenario?: string) =>
    (
      await http.post<{ scenario: string; reset: boolean }>("/mock/reset", {
        scenario,
      })
    ).data,
  setScenario: async (scenario: string) =>
    (await http.post<{ scenario: string }>("/mock/scenario", { scenario }))
      .data,
};

export type { User };
