import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Wallet,
} from "lucide-react";

import { useCart } from "@/lib/cart";
import { useCatalog } from "@/api/hooks";
import { api } from "@/api/service";
import Image from "../assets/Image.png";
import Image2 from "../assets/Image2.png";
import Image3 from "../assets/Image3.png";
import Image4 from "../assets/Image4.png";

const artworkById: Record<number, string> = {
  1: Image,
  2: Image2,
  3: Image3,
  4: Image4,
  5: Image3,
  6: Image4,
  7: Image2,
  8: Image3,
};

export default function CartPage() {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    total,
    discount,
    fee,
    errorMessage,
  } = useCart();
  const catalog = useCatalog();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const grandTotal = Math.max(0, total - discount) + fee;

  const applyCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const result = await api.applyCoupon(coupon);
      setCouponMessage(result.message);
      await queryClient.invalidateQueries({ queryKey: ["cart-summary"] });
    } catch (error) {
      setCouponMessage(
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Não foi possível validar o cupom. Tente novamente.",
      );
    }
  };

  const handleCheckout = async () => {
    try {
      const wallets = await api.wallets();
      const wallet = wallets.find((entry) => entry.primary) ?? wallets[0];
      if (!wallet) {
        setCheckoutMessage(
          "Cadastre uma carteira antes de finalizar o pedido.",
        );
        return;
      }
      const key =
        window.localStorage.getItem("kurio.pending-order-key") ??
        crypto.randomUUID();
      window.localStorage.setItem("kurio.pending-order-key", key);
      const order = await api.createOrder(
        {
          walletId: wallet.id,
          items: items.map(({ id, quantity }) => ({ nftId: id, quantity })),
        },
        key,
      );
      window.localStorage.removeItem("kurio.pending-order-key");
      setCheckoutMessage(
        order.status === "confirmed"
          ? `Pedido ${order.id} confirmado.`
          : `Pagamento do pedido ${order.id} recusado.`,
      );
      await navigate({ to: "/pedido/$orderId", params: { orderId: order.id } });
    } catch (error) {
      setCheckoutMessage(
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Não foi possível finalizar o pedido. Tente novamente.",
      );
    }
  };

  return (
    <>
      {errorMessage && (
        <p
          role="alert"
          className="fixed inset-x-4 top-3 z-50 mx-auto max-w-xl rounded-lg bg-red-950 px-4 py-3 text-center font-mono text-sm text-red-200"
        >
          {errorMessage}
        </p>
      )}
      <div className="md:hidden min-h-dvh bg-[#140d0a] text-[#f5f1eb]">
        <header className="relative flex h-19 items-center justify-center px-6">
          <Link
            to="/"
            aria-label="Voltar ao mercado"
            className="absolute left-7 flex h-9 w-9 items-center justify-center rounded-full border border-[#563523] bg-[#241610] text-[#d9ad76]"
          >
            <ArrowLeft size={19} />
          </Link>
          <h1 className="font-mono text-[20px] font-bold tracking-wide">
            Carrinho de NFTs
          </h1>
        </header>

        {items.length === 0 ? (
          <section className="mx-7 mt-5 rounded-[18px] bg-[#241610] px-5 py-12 text-center">
            <ShoppingCart className="mx-auto mb-4 text-[#d28a4c]" size={34} />
            <h2 className="font-mono text-lg font-bold">
              Seu carrinho está vazio
            </h2>
            <p className="mt-2 font-mono text-xs leading-5 text-[#c8aa80]">
              Explore as coleções e encontre sua próxima peça favorita.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#d28a4c] px-5 py-3 font-mono text-sm font-bold text-[#140d0a]"
            >
              Explorar NFTs <ArrowRight size={15} />
            </Link>
          </section>
        ) : (
          <>
            <main className="mx-auto flex max-w-115 flex-col gap-5 overflow-y-auto px-7 pb-90 pt-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex min-h-25 items-center gap-2.5 rounded-[17px] bg-[#291a14] p-0 pr-3"
                >
                  <Link
                    to="/nft/$nftId"
                    params={{ nftId: String(item.id) }}
                    aria-label={`Ver detalhes de ${item.name}`}
                    className="h-25 w-25 shrink-0 overflow-hidden rounded-[16px] bg-[#e8e1ca]"
                  >
                    <img
                      src={artworkById[item.id] ?? Image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  <div className="min-w-0 flex-1 self-stretch py-3">
                    <Link
                      to="/nft/$nftId"
                      params={{ nftId: String(item.id) }}
                      aria-label={`Ver detalhes de ${item.name}`}
                      className="block truncate font-mono text-[14px] font-bold text-[#f5f1eb]"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 font-mono text-[13px] text-[#c8aa80]">
                      Edição:{" "}
                      {item.id === 1
                        ? "1/50"
                        : item.id === 2
                          ? "1/1"
                          : item.id === 3
                            ? "1/10"
                            : "1/50"}
                    </p>
                    <p className="mt-3 font-mono text-[18px] font-bold tracking-wide text-[#e99b53]">
                      {(item.price * item.quantity).toFixed(2)} ETH
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label={`Diminuir quantidade de ${item.name}`}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-[#342219] text-[#a06a3d] disabled:opacity-35"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={12} />
                      </button>
                      <span
                        aria-label={`Quantidade ${item.quantity}`}
                        className="min-w-4 text-center font-mono text-[13px]"
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Aumentar quantidade de ${item.name}`}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f5f1eb] text-[#241610]"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remover ${item.name}`}
                      onClick={() => removeItem(item.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[#9b7652] hover:bg-[#3b251a] hover:text-[#f0a36a]"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </article>
              ))}
            </main>

            <aside
              data-testid="mobile-cart-summary"
              className="fixed inset-x-0 bottom-0 z-30 mx-auto max-h-[58dvh] w-full max-w-115 overflow-y-auto rounded-t-[28px] bg-[#241610] px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-5 shadow-[0_-12px_35px_rgba(0,0,0,0.45)]"
            >
              <form
                onSubmit={applyCoupon}
                className="mb-4 flex h-12.5 rounded-full border border-[#54341f] bg-[#211610] p-1"
              >
                <input
                  aria-label="Código promocional"
                  value={coupon}
                  onChange={(event) => setCoupon(event.target.value)}
                  placeholder="Digite o código promocional..."
                  className="min-w-0 flex-1 bg-transparent px-3 font-mono text-[12px] text-[#f5f1eb] outline-none placeholder:text-[#a78965]"
                />
                <button
                  type="submit"
                  className="rounded-full bg-linear-to-r from-[#d99452] to-[#bd7137] px-5 font-mono text-[13px] font-bold text-[#fff4e8]"
                >
                  Aplicar
                </button>
              </form>
              {couponMessage && (
                <p
                  role="status"
                  className={`mb-3 font-mono text-[11px] ${discount > 0 ? "text-[#b8ce91]" : "text-[#ef9b77]"}`}
                >
                  {couponMessage}
                </p>
              )}

              <div className="space-y-3 font-mono text-[14px] text-[#f1e9e2]">
                <div className="flex justify-between gap-3">
                  <span>Subtotal</span>
                  <span>{total.toFixed(2)} ETH</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Desconto de lançamento</span>
                  <span>(−) {discount.toFixed(2)} ETH</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Taxa de rede</span>
                  <span>{fee.toFixed(3)} ETH</span>
                </div>
                <p className="-mt-2 text-right text-[10px] text-[#bd9161]">
                  Taxa estimada
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#4b2d22] pt-3 font-mono text-[15px] font-bold">
                <span>Total</span>
                <span className="text-[18px] text-[#e99b53]">
                  {grandTotal.toFixed(3)} ETH
                </span>
              </div>
              <button
                type="button"
                onClick={() => void handleCheckout()}
                className="mt-6 flex h-15 w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-[#e0a05e] to-[#bd7137] font-mono text-[15px] font-bold text-[#1e120c]"
              >
                <Wallet size={17} /> Conectar e finalizar
              </button>
              {checkoutMessage && (
                <p
                  role="status"
                  className="mt-2 text-center font-mono text-[11px] text-[#c8aa80]"
                >
                  {checkoutMessage}
                </p>
              )}
            </aside>
          </>
        )}
      </div>

      <div className="hidden md:block min-h-screen bg-[#140d0a] text-[#f5f1eb]">
        <div className="mx-auto max-w-7xl px-6">
          <header className="flex h-17 items-center justify-between border-b border-[#4b2d22]">
            <Link
              to="/"
              className="font-mono text-[11px] tracking-[0.15em] text-[#f5f1eb]"
            >
              KURIO
            </Link>
            <nav className="hidden items-center gap-8 font-mono text-xs text-[#d9c4ae] md:flex">
              <Link to="/" className="hover:text-[#e99b53]">
                Início
              </Link>
              <Link
                to="/"
                className="border-b-2 border-[#D28A4C] py-6 text-[#e99b53]"
              >
                Mercado
              </Link>
              <Link to="/" className="hover:text-[#e99b53]">
                Criadores
              </Link>
              <Link to="/" className="hover:text-[#e99b53]">
                Aprenda
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                aria-label="Voltar ao mercado"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#d9c4ae] hover:bg-[#2b1b14] hover:text-[#e99b53]"
              >
                <Search size={17} />
              </Link>
              <Link
                to="/cart"
                aria-label={`Carrinho, ${items.length} itens`}
                className="relative text-[#e99b53]"
              >
                <ShoppingCart size={19} />
                <span className="absolute -right-2 -top-2 rounded-full bg-[#D28A4C] px-1 text-[9px] font-bold text-[#140d0a]">
                  {items.length}
                </span>
              </Link>
              <Link
                to="/"
                className="rounded-md bg-[#D28A4C] px-4 py-2 font-mono text-xs font-bold text-[#140d0a] hover:bg-[#e29a63]"
              >
                Entrar
              </Link>
            </div>
          </header>

          <main>
            <h1 className="sr-only">Carrinho</h1>
            <nav
              aria-label="Trilha de navegação"
              className="py-5 font-mono text-[11px] text-[#c8aa80]"
            >
              <Link to="/" className="hover:text-[#f5f1eb]">
                Início
              </Link>
              <span className="mx-2">/</span>
              <Link to="/" className="hover:text-[#f5f1eb]">
                Mercado
              </Link>
              <span className="mx-2">/</span>
              <span className="text-[#f5f1eb]">Carrinho</span>
            </nav>

            {items.length === 0 ? (
              <section className="mb-16 rounded-xl border border-[#4b2d22] bg-[#211610] px-6 py-16 text-center">
                <ShoppingCart
                  className="mx-auto mb-4 text-[#d28a4c]"
                  size={36}
                />
                <h1 className="font-mono text-2xl font-bold">
                  Seu carrinho está vazio
                </h1>
                <p className="mt-3 font-mono text-sm text-[#c8aa80]">
                  Explore as coleções e encontre sua próxima peça favorita.
                </p>
                <Link
                  to="/"
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#D28A4C] px-5 py-3 font-mono text-sm font-bold text-[#140d0a]"
                >
                  Explorar NFTs <ArrowRight size={16} />
                </Link>
              </section>
            ) : (
              <section className="mb-16 grid items-start gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(275px,0.9fr)]">
                <div className="min-w-0">
                  <div className="hidden grid-cols-[minmax(0,1fr)_90px_105px_95px_28px] gap-4 border-b border-[#4b2d22] pb-2 font-mono text-[11px] text-[#f5f1eb] sm:grid">
                    <span>NFTs</span>
                    <span>Preço</span>
                    <span>Edições</span>
                    <span>Total</span>
                    <span />
                  </div>
                  <div className="space-y-2 pt-2">
                    {items.map((item) => (
                      <article
                        key={item.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 border border-[#352118] bg-[#211610] p-3 sm:grid-cols-[minmax(0,1fr)_90px_105px_95px_28px] sm:gap-4 sm:border-0 sm:px-2 sm:py-2"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Link
                            to="/nft/$nftId"
                            params={{ nftId: String(item.id) }}
                            aria-label={`Ver detalhes de ${item.name}`}
                            className="shrink-0 overflow-hidden rounded-md"
                          >
                            <img
                              src={artworkById[item.id] ?? Image}
                              alt={item.name}
                              className="h-14 w-14 object-cover transition hover:scale-105"
                            />
                          </Link>
                          <div className="min-w-0">
                            <h2 className="truncate font-mono text-[12px] font-bold text-[#f5f1eb] hover:text-[#e99b53]">
                              <Link
                                to="/nft/$nftId"
                                params={{ nftId: String(item.id) }}
                                aria-label={`Ver detalhes de ${item.name}`}
                              >
                                {item.name}
                              </Link>
                            </h2>
                            <p className="font-mono text-[10px] text-[#a78965]">
                              ID do token: #
                              {String(item.id * 42).padStart(4, "0")}
                            </p>
                          </div>
                        </div>
                        <div className="font-mono text-xs text-[#c8aa80] sm:block">
                          <span className="mr-2 text-[10px] text-[#a78965] sm:hidden">
                            Preço
                          </span>
                          {item.price.toFixed(2)} ETH
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="mr-1 text-[10px] text-[#a78965] sm:hidden">
                            Qtd.
                          </span>
                          <button
                            type="button"
                            aria-label={`Diminuir quantidade de ${item.name}`}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d28a4c] text-[#140d0a] hover:bg-[#e29a63]"
                          >
                            <Minus size={12} />
                          </button>
                          <span
                            aria-label={`Quantidade ${item.quantity}`}
                            className="min-w-4 text-center font-mono text-xs"
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Aumentar quantidade de ${item.name}`}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d28a4c] text-[#140d0a] hover:bg-[#e29a63]"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <div className="font-mono text-xs font-medium text-[#e99b53]">
                          <span className="mr-2 text-[10px] text-[#a78965] sm:hidden">
                            Total
                          </span>
                          {(item.price * item.quantity).toFixed(2)} ETH
                        </div>
                        <button
                          type="button"
                          aria-label={`Remover ${item.name}`}
                          onClick={() => removeItem(item.id)}
                          className="flex h-7 w-7 items-center justify-center text-[#a78965] transition hover:text-[#ef8c69]"
                        >
                          <Trash2 size={15} />
                        </button>
                      </article>
                    ))}
                  </div>
                </div>

                <aside
                  data-testid="desktop-cart-summary"
                  className="border-t border-[#4b2d22] pt-4 lg:border-0 lg:pt-0"
                >
                  <h1 className="mb-5 font-mono text-sm font-bold">
                    Resumo da carteira
                  </h1>
                  <form onSubmit={applyCoupon} className="mb-5">
                    <label
                      htmlFor="cart-coupon"
                      className="mb-1.5 block font-mono text-[11px]"
                    >
                      Código promocional
                    </label>
                    <div className="flex h-9">
                      <input
                        id="cart-coupon"
                        value={coupon}
                        onChange={(event) => setCoupon(event.target.value)}
                        placeholder="Digite o código promocional..."
                        className="min-w-0 flex-1 rounded-l border border-[#754a2e] bg-[#211610] px-2 font-mono text-[10px] text-[#f5f1eb] outline-none placeholder:text-[#997956] focus:border-[#d28a4c]"
                      />
                      <button
                        type="submit"
                        className="rounded-r bg-[#D28A4C] px-3 font-mono text-[11px] font-bold text-[#140d0a] hover:bg-[#e29a63]"
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponMessage && (
                      <p
                        role="status"
                        className={`mt-2 font-mono text-[10px] ${discount > 0 ? "text-[#b8ce91]" : "text-[#ef9b77]"}`}
                      >
                        {couponMessage}
                      </p>
                    )}
                  </form>

                  <div className="space-y-3 font-mono text-[11px] text-[#c8aa80]">
                    <div className="flex justify-between gap-3">
                      <span>Subtotal</span>
                      <span className="text-[#f5f1eb]">
                        {total.toFixed(2)} ETH
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Desconto de lançamento</span>
                      <span className="text-[#f5f1eb]">
                        − {discount.toFixed(2)} ETH
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Taxa de rede</span>
                      <span className="text-[#f5f1eb]">
                        {fee.toFixed(3)} ETH
                      </span>
                    </div>
                    <p className="-mt-2 text-right text-[9px] text-[#a78965]">
                      Taxa estimada
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#4b2d22] pt-4 font-mono text-xs font-bold">
                    <span>Total</span>
                    <span className="text-[#e99b53]">
                      {grandTotal.toFixed(3)} ETH
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCheckout()}
                    className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#D28A4C] px-4 font-mono text-[11px] font-bold text-[#140d0a] transition hover:bg-[#e29a63]"
                  >
                    <Wallet size={14} /> Conectar e finalizar
                  </button>
                  {checkoutMessage && (
                    <p
                      role="status"
                      className="mt-2 font-mono text-[10px] leading-4 text-[#c8aa80]"
                    >
                      {checkoutMessage}
                    </p>
                  )}
                  <Link
                    to="/"
                    className="mt-3 flex items-center justify-center gap-1 font-mono text-[10px] text-[#e99b53] hover:text-[#f5f1eb]"
                  >
                    Continuar explorando <ArrowRight size={12} />
                  </Link>
                </aside>
              </section>
            )}

            <section className="mb-16">
              <h2 className="mb-4 border-b border-[#4b2d22] pb-3 font-mono text-[12px] font-bold text-[#e99b53]">
                Colecionadores também viram
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {(catalog.data?.items ?? [])
                  .filter(
                    (artwork) => !items.some((item) => item.id === artwork.id),
                  )
                  .slice(0, 5)
                  .map((artwork) => (
                    <article
                      key={artwork.id}
                      className="min-w-0 bg-[#211610] p-2"
                    >
                      <img
                        src={artwork.img}
                        alt={artwork.name}
                        className="aspect-square w-full rounded-md object-cover"
                      />
                      <div className="mt-2 flex items-center justify-between gap-1">
                        <div className="min-w-0">
                          <h3 className="truncate font-mono text-[10px] text-[#d9c4ae]">
                            {artwork.name}
                          </h3>
                          <p className="font-mono text-[10px] font-bold text-[#e99b53]">
                            {artwork.price.toFixed(2)} ETH
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Adicionar ${artwork.name} ao carrinho`}
                          onClick={() =>
                            addItem({
                              id: artwork.id,
                              name: artwork.name,
                              price: artwork.price,
                            })
                          }
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#d9c4ae] hover:bg-[#382419] hover:text-[#e99b53]"
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
              <div
                className="mt-4 flex justify-center gap-2"
                aria-hidden="true"
              >
                <span className="h-1.5 w-1.5 rounded-full border border-[#e99b53]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#e99b53]" />
                <span className="h-1.5 w-1.5 rounded-full border border-[#e99b53]" />
              </div>
            </section>

            <section className="-mx-6 grid gap-px bg-[#5a3521] px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "W",
                  "Segurança da carteira",
                  "Proteja sua carteira e colecione arte digital verificada com confiança.",
                ],
                [
                  "C",
                  "Criadores em destaque",
                  "Conheça artistas, estúdios e comunidades que moldam a cultura digital.",
                ],
                [
                  "D",
                  "Alertas de lançamentos",
                  "Receba calendários de cunhagem, novidades e listas de acesso antecipado.",
                ],
              ].map(([initial, title, copy]) => (
                <div key={title} className="bg-[#241610] px-5 py-3">
                  <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#d28a4c] font-mono text-xs font-bold text-[#140d0a]">
                    {initial}
                  </span>
                  <h3 className="mb-1 font-mono text-[11px] font-bold">
                    {title}
                  </h3>
                  <p className="max-w-52 font-mono text-[9px] leading-4 text-[#c8aa80]">
                    {copy}
                  </p>
                </div>
              ))}
              <div className="bg-[#241610] px-5 py-3">
                <h3 className="mb-2 font-mono text-[11px] font-bold">
                  Antecipe-se ao próximo lançamento
                </h3>
                <form
                  onSubmit={(event) => event.preventDefault()}
                  className="flex h-8"
                >
                  <input
                    type="email"
                    required
                    aria-label="E-mail para novidades"
                    placeholder="Digite seu e-mail..."
                    className="min-w-0 flex-1 rounded-l bg-[#342219] px-2 font-mono text-[9px] text-[#f5f1eb] outline-none placeholder:text-[#a78965]"
                  />
                  <button
                    type="submit"
                    className="rounded-r bg-[#D28A4C] px-3 font-mono text-[10px] font-bold text-[#140d0a]"
                  >
                    Enviar
                  </button>
                </form>
                <p className="mt-2 font-mono text-[9px] leading-4 text-[#c8aa80]">
                  Receba lançamentos selecionados, histórias de criadores e
                  novidades do mercado.
                </p>
              </div>
            </section>
          </main>

          <footer className="-mx-6 bg-[#241610] px-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#4b2d22] bg-[#3b2414] px-4 py-4 font-mono text-[9px] text-[#d9c4ae]">
              <strong className="tracking-[0.15em] text-[#f5f1eb]">
                KURIO
              </strong>
              <span>Feito para colecionadores, criadores e cultura.</span>
              <span>contato@email.com</span>
              <span>+55 11 4002 8922</span>
            </div>
            <div className="grid gap-8 py-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <h3 className="mb-2 font-mono text-[11px] font-bold">
                  Meu perfil
                </h3>
                <ul className="space-y-1 font-mono text-[9px] text-[#c8aa80]">
                  <li>Meu perfil</li>
                  <li>Minha coleção</li>
                  <li>Atividade</li>
                  <li>Estúdio de criador</li>
                  <li>Lista de interesse</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-mono text-[11px] font-bold">
                  Central de ajuda
                </h3>
                <ul className="space-y-1 font-mono text-[9px] text-[#c8aa80]">
                  <li>Centro de ajuda</li>
                  <li>Como comprar NFTs</li>
                  <li>Carteira e segurança</li>
                  <li>Política do mercado</li>
                  <li>Denunciar item</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-mono text-[11px] font-bold">
                  Coleções
                </h3>
                <ul className="space-y-1 font-mono text-[9px] text-[#c8aa80]">
                  <li>Arte digital</li>
                  <li>Fotografia</li>
                  <li>Música</li>
                  <li>Arte 3D</li>
                  <li>Utilidade</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-mono text-[11px] font-bold">
                  Redes sociais
                </h3>
                <div className="flex gap-2 text-[#e99b53]">
                  <span aria-label="Instagram" className="font-mono text-sm">
                    ◎
                  </span>
                  <Heart size={16} />
                  <span className="font-mono text-[11px]">𝕏</span>
                  <span className="font-mono text-[11px]">◉</span>
                </div>
                <h3 className="mb-2 mt-4 font-mono text-[11px] font-bold">
                  Carteiras compatíveis
                </h3>
                <p className="font-mono text-[8px] text-[#e99b53]">
                  METAMASK · WALLETCONNECT · COINBASE
                </p>
              </div>
            </div>
            <p className="border-t border-[#4b2d22] py-3 text-center font-mono text-[9px] text-[#c8aa80]">
              © 2026 Kurio. Propriedade digital para todos.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
