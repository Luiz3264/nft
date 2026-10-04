export type MockScenario =
  | "success"
  | "empty"
  | "variable-latency"
  | "out-of-order"
  | "offline"
  | "http-4xx"
  | "http-5xx"
  | "session-expired"
  | "unauthorized"
  | "registration-conflict"
  | "form-validation"
  | "coupon-invalid"
  | "coupon-expired"
  | "price-changed"
  | "edition-sold-out"
  | "order-timeout"
  | "payment-confirmed"
  | "payment-declined";

export type Nft = {
  id: number;
  img: string;
  name: string;
  price: number;
  category: string;
  collection: string;
  attributes: string;
  edition: string;
  isNew: boolean;
  trending: boolean;
  availableCopies: number;
  version: number;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type User = {
  id: string;
  email: string;
  displayName: string;
};

export type Session = {
  token: string;
  user: User;
  expiresAt: string;
};

export type CartItem = {
  nftId: number;
  name: string;
  price: number;
  quantity: number;
  version: number;
};

export type Cart = {
  userId: string | null;
  items: CartItem[];
  couponCode: string | null;
  discount: number;
  networkFee: number;
  version: number;
};

export type Profile = User & {
  avatarUrl: string | null;
  bio: string;
  username: string;
  ensName: string;
  walletLabel: string;
};

export type WalletNetwork = "ethereum" | "polygon";

export type WalletType =
  | "hot"
  | "cold"
  | "metamask"
  | "ledger"
  | "trezor"
  | "paper";

export const WALLET_NETWORK_LABELS: Record<WalletNetwork, string> = {
  ethereum: "Ethereum",
  polygon: "Polygon",
};

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  hot: "Carteira quente",
  cold: "Carteira fria",
  metamask: "MetaMask",
  ledger: "Ledger",
  trezor: "Trezor",
  paper: "Carteira de papel",
};

export const WALLET_TYPES = Object.keys(WALLET_TYPE_LABELS) as WalletType[];

export type Wallet = {
  id: string;
  address: string;
  network: WalletNetwork;
  label: string;
  primary: boolean;
  displayName?: string;
  profileName?: string;
  ensName?: string;
  secondaryAddress?: string;
  walletType?: WalletType;
  referralCode?: string;
  email?: string;
};

export type OrderStatus = "pending" | "confirmed" | "declined";

export type Order = {
  id: string;
  userId: string;
  idempotencyKey: string;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  discount: number;
  networkFee: number;
  total: number;
  walletId: string;
  transactionReference: string | null;
  version: number;
  createdAt: string;
};

export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string>;
};

export type CouponResult = {
  code: string;
  discount: number;
  message: string;
};

export type CartSummary = {
  subtotal: number;
  discount: number;
  networkFee: number;
  total: number;
  couponCode: string | null;
};

export const MOCK_SCENARIOS: MockScenario[] = [
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
];
