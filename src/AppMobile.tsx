import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Heart,
  Home,
  Minus,
  Plus,
  Search,
  ScanLine,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  UserRound,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useCatalog, useFavorites, useSession } from "@/api/hooks";
import { useAuthLayer } from "@/components/auth/authLayerContext";
import type { Nft } from "@/api/contracts";

function MobileNftDetail({
  nft,
  isFavorite,
  onBack,
  onToggleFavorite,
}: {
  nft: Nft;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
}) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  const addQuantityToCart = () => {
    addItem({ id: nft.id, name: nft.name, price: nft.price }, quantity);
  };

  const buyNft = () => {
    addQuantityToCart();
    void navigate({ to: "/cart" });
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-107.5 overflow-hidden bg-[#241610] text-[#f5f1eb]">
      <div className="relative h-107.5 bg-[radial-gradient(ellipse_at_50%_30%,#432b1e_0%,#241610_75%)] pt-16.5">
        <div className="absolute inset-x-7 top-16.5 h-90 overflow-hidden rounded-[24px] bg-[#e8e1ca]">
          <img
            src={nft.img}
            alt={nft.name}
            className="h-full w-full object-cover"
          />
        </div>
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar para as coleções"
          className="absolute left-7 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#70472f]/60 bg-[#321f17]/80 text-[#e8a35f]"
        >
          <ArrowLeft size={19} />
        </button>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={
            isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
          }
          aria-pressed={isFavorite}
          className="absolute right-7 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#70472f]/60 bg-[#321f17]/80 text-[#e8a35f]"
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <section className="relative z-10 -mt-9.5 min-h-96.25 rounded-t-[28px] bg-[#241610] px-6 pb-47.5 pt-7 shadow-[0_-12px_28px_rgba(0,0,0,0.2)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h1 className="font-mono text-[20px] font-bold tracking-[-0.03em]">
            {nft.name}
          </h1>
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-[#ad7543] px-2 py-1 font-mono text-[12px] text-[#f1d8b8]">
            <Star size={13} fill="#e7a14f" className="text-[#e7a14f]" />
            <span>4.8</span>
            <span className="text-[#bd9161]">(19)</span>
          </div>
        </div>

        <p className="mb-3 font-mono text-[13px] leading-6 text-[#c8aa80]">
          Um colecionável digital {nft.edition.split("/")[1]} finalizado à mão
          da coleção Kurio Editions, verificado na Ethereum.
        </p>

        <div className="mb-3">
          <h2 className="mb-1 font-mono text-[14px] font-bold">Edição:</h2>
          <div className="flex flex-wrap gap-2 font-mono text-[12px] text-[#c6a77d]">
            {["1/10", "1/10", nft.edition, "ABERTA"].map((edition, index) => (
              <span
                key={`${edition}-${index}`}
                className={`rounded-full border px-2 py-1 ${
                  edition === nft.edition
                    ? "border-[#e79b4e] text-[#f0a252]"
                    : "border-[#5a3625]"
                }`}
              >
                {edition}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2 font-mono text-[13px] leading-5 text-[#bd9864]">
          <p>ID do token: #{String(nft.id * 42).padStart(4, "0")}</p>
          <p>Coleção: {nft.collection}</p>
          <p>Atributos: {nft.attributes}</p>
        </div>
      </section>

      <section className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-107.5 rounded-t-[28px] bg-[#211610] px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-5 shadow-[0_-8px_28px_rgba(0,0,0,0.25)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[14px] text-[#c8aa80]">
            <span>Qtd.</span>
            <button
              type="button"
              aria-label="Diminuir quantidade"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="flex h-7 w-5 items-center justify-center rounded-full bg-[#d88d48] text-[#28170f]"
            >
              <Minus size={13} />
            </button>
            <span className="min-w-4 text-center text-[#f5f1eb]">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              onClick={() => setQuantity((value) => value + 1)}
              className="flex h-7 w-5 items-center justify-center rounded-full bg-[#d88d48] text-[#28170f]"
            >
              <Plus size={13} />
            </button>
          </div>
          <p className="font-mono text-[20px] font-bold text-[#ee984b]">
            {(nft.price * quantity).toFixed(2)} ETH
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={buyNft}
            className="h-14.5 flex-1 rounded-full bg-linear-to-r from-[#e2a05b] to-[#bd7137] font-mono text-[15px] font-bold text-[#1e120c] transition hover:brightness-110"
          >
            Comprar NFT
          </button>
          <button
            type="button"
            onClick={addQuantityToCart}
            aria-label="Adicionar ao carrinho"
            className="flex h-14.5 w-14.5 items-center justify-center rounded-full border border-[#4d2e1e] bg-[#2a1b14] text-[#c89a5f] transition hover:bg-[#392319]"
          >
            <ShoppingCart size={19} fill="currentColor" />
          </button>
        </div>
      </section>
    </div>
  );
}

const tabs = ["Todos os NFTs", "Novos lançamentos", "Em alta"] as const;
type Tab = (typeof tabs)[number];

export default function AppMobile() {
  const { items, addItem } = useCart();
  const catalog = useCatalog();
  const nfts = catalog.data?.items ?? [];
  const { favoriteIds: favorites, toggleFavorite: updateFavorite } =
    useFavorites();
  const session = useSession();
  const { open: openAuth } = useAuthLayer();
  const navigate = useNavigate();
  const [selectedNft, setSelectedNft] = useState<Nft | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>(tabs[0]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const visibleNfts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = nfts.filter(
      (nft) =>
        nft.name.toLowerCase().includes(query) &&
        (!favoritesOnly || favorites.includes(nft.id)),
    );

    if (activeTab === "Novos lançamentos") return [...filtered].reverse();
    if (activeTab === "Em alta")
      return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [activeTab, favorites, favoritesOnly, nfts, search]);

  const toggleFavorite = (id: number) => updateFavorite(id);

  const columns = [
    visibleNfts.filter((_, index) => index % 2 === 0),
    visibleNfts.filter((_, index) => index % 2 === 1),
  ];

  const goHome = () => {
    setFavoritesOnly(false);
    setSearch("");
    setActiveTab(tabs[0]);
    setFiltersOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openFavorites = () => {
    setFavoritesOnly((current) => !current);
    setActiveTab(tabs[0]);
    document
      .getElementById("nft-collections")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (selectedNft) {
    return (
      <MobileNftDetail
        nft={selectedNft}
        isFavorite={favorites.includes(selectedNft.id)}
        onBack={() => setSelectedNft(null)}
        onToggleFavorite={() => toggleFavorite(selectedNft.id)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#140d0a] text-[#f5f1eb]">
      <div className="mx-auto min-h-screen w-full max-w-107.5 px-6 pb-28 pt-8">
        <header className="mb-4 flex items-center gap-2">
          <label className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-[12px] bg-[#291a14] px-3.5 text-[#c7a77f]">
            <Search size={19} strokeWidth={1.7} aria-hidden="true" />
            <input
              ref={searchInputRef}
              aria-label="Explorar coleções"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Explorar coleções"
              className="w-full min-w-0 bg-transparent font-mono text-[14px] font-semibold tracking-wide text-[#f5f1eb] outline-none placeholder:text-[#c7a77f]"
            />
          </label>
          <button
            type="button"
            aria-label="Abrir filtros"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] bg-linear-to-br from-[#e3a15e] to-[#bd7136] text-[#24150f] transition hover:brightness-110"
          >
            <SlidersHorizontal size={21} strokeWidth={1.8} />
          </button>
        </header>

        {filtersOpen && (
          <div className="mb-3 flex items-center justify-between rounded-[12px] border border-[#70472f] bg-[#291a14] px-4 py-3 text-xs text-[#d9c4ae]">
            <span>Ordenar coleções</span>
            <button
              type="button"
              onClick={() => {
                setActiveTab("Em alta");
                setFiltersOpen(false);
              }}
              className="font-semibold text-[#efa45f]"
            >
              Maior preço primeiro
            </button>
          </div>
        )}

        <main>
          <section className="relative mb-4 min-h-47.5 overflow-hidden rounded-[25px] bg-[radial-gradient(ellipse_at_30%_50%,#775133_0%,#513522_44%,#281a13_100%)] px-4 py-3">
            <div className="pointer-events-none absolute -left-9 top-2 h-48 w-48 rounded-full border border-[#c28b55]/15 bg-[#d59a5c]/10" />
            <div className="pointer-events-none absolute left-9 top-2 h-48 w-48 rounded-full border border-[#c28b55]/15 bg-[#d59a5c]/10" />

            <div className="relative z-10 flex min-h-37.5 items-center">
              <div className="w-[60%] pr-1">
                <p className="mb-2 font-mono text-[11px] text-[#f0dfca]">
                  Bem-vindo à Kurio
                </p>
                <h1 className="font-mono text-[18px] font-bold uppercase leading-normal tracking-[-0.04em] text-[#fff8ee]">
                  Seja dono da
                  <br />
                  cultura digital
                </h1>
                <p className="mt-1.5 max-w-45 font-mono text-[11px] leading-[1.45] text-[#d7bc9b]">
                  Descubra NFTs selecionados de criadores do mundo todo.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("nft-collections")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="mt-1 font-mono text-[11px] font-bold uppercase text-[#efa45f]"
                >
                  Explorar <span aria-hidden="true">→</span>
                </button>
              </div>

              {nfts[0] && (
                <div className="absolute right-0 top-1/2 h-34.5 w-34.5 -translate-y-1/2">
                  <img
                    src={nfts[0].img}
                    alt={`${nfts[0].name} em destaque`}
                    className="absolute right-0 top-0 h-34.5 w-34.5 rounded-[18px] object-cover"
                  />
                  {nfts[1] && (
                    <img
                      src={nfts[1].img}
                      alt={nfts[1].name}
                      className="absolute -bottom-1 left-0 h-15.5 w-15.5 rounded-[17px] border-2 border-[#f1e4d4] object-cover"
                    />
                  )}
                </div>
              )}
            </div>
            <div
              className="relative z-10 mt-1 flex justify-center gap-1.5"
              aria-label="Slide 1 de 3"
            >
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className={`h-1.75 w-1.75 rounded-full ${index === 0 ? "bg-[#e19a58]" : "bg-[#9b7354]"}`}
                />
              ))}
            </div>
          </section>

          <section id="nft-collections" aria-label="Coleções NFT">
            <div className="mb-4 flex items-center justify-between gap-3 overflow-x-auto whitespace-nowrap font-mono text-[12px]">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`shrink-0 border-b pb-1 transition ${
                    activeTab === tab
                      ? "border-[#e59a52] font-bold text-[#eea258]"
                      : "border-transparent text-[#e5d9ce]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {catalog.isError ? (
              <p
                role="alert"
                className="rounded-xl bg-[#291a14] p-5 text-center font-mono text-sm text-[#ef9b77]"
              >
                Não foi possível carregar o catálogo.{" "}
                <button
                  type="button"
                  onClick={() => void catalog.refetch()}
                  className="underline underline-offset-4"
                >
                  Tentar novamente
                </button>
              </p>
            ) : visibleNfts.length ? (
              <div className="grid grid-cols-2 items-start gap-4">
                {columns.map((column, columnIndex) => (
                  <div
                    key={columnIndex}
                    className={`flex min-w-0 flex-col gap-5 ${columnIndex === 1 ? "pt-8" : ""}`}
                  >
                    {column.map((nft) => (
                      <article key={nft.id} className="min-w-0">
                        <div className="relative rounded-[20px] bg-[#291a14] p-1">
                          {nft.availableCopies <= 15 && (
                            <span className="absolute left-0 top-4 z-10 bg-[#dc9450] px-2 py-1 font-mono text-[10px] font-bold uppercase text-[#1b100b]">
                              Raro
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleFavorite(nft.id)}
                            aria-label={
                              favorites.includes(nft.id)
                                ? `Remover ${nft.name} dos favoritos`
                                : `Adicionar ${nft.name} aos favoritos`
                            }
                            aria-pressed={favorites.includes(nft.id)}
                            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[#d28a4c]/50 bg-[#281913]/90 text-[#e8a35f]"
                          >
                            <Heart
                              size={16}
                              fill={
                                favorites.includes(nft.id)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedNft(nft)}
                            aria-label={`Ver detalhes de ${nft.name}`}
                            className="block w-full"
                          >
                            <img
                              src={nft.img}
                              alt={nft.name}
                              className="aspect-square w-full rounded-[16px] object-cover"
                            />
                          </button>
                        </div>
                        <div className="px-2 pt-2.5">
                          <button
                            type="button"
                            onClick={() => setSelectedNft(nft)}
                            className="block max-w-full truncate text-left font-mono text-[13px] text-[#f5f1eb]"
                          >
                            {nft.name}
                          </button>
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-mono text-[15px] font-bold tracking-[0.04em] text-[#e99b53]">
                              {nft.price.toFixed(2)} ETH
                            </p>
                            <button
                              type="button"
                              onClick={() => addItem({ ...nft })}
                              aria-label={`Adicionar ${nft.name} ao carrinho`}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#d9c4ae] transition hover:bg-[#3a271d] hover:text-[#efa45f]"
                            >
                              <ShoppingCart size={15} />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-[#291a14] p-5 text-center font-mono text-sm text-[#d9c4ae]">
                {favoritesOnly
                  ? "Você ainda não tem NFTs favoritos. Toque no coração de uma peça para salvá-la."
                  : "Nenhum NFT encontrado."}
              </p>
            )}
          </section>
        </main>
      </div>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-19 max-w-107.5 items-center justify-around rounded-t-[28px] bg-[#211610] px-5 pb-[max(env(safe-area-inset-bottom),8px)] shadow-[0_-8px_30px_rgba(0,0,0,0.3)]"
      >
        <button
          type="button"
          aria-label="Início"
          onClick={goHome}
          className={!favoritesOnly ? "text-[#e99b53]" : "text-[#d9c4ae]"}
        >
          <Home size={21} fill="currentColor" strokeWidth={1.7} />
        </button>
        <button
          type="button"
          aria-label="Favoritos"
          aria-pressed={favoritesOnly}
          onClick={openFavorites}
          className={favoritesOnly ? "text-[#e99b53]" : "text-[#d9c4ae]"}
        >
          <Heart size={22} fill="currentColor" strokeWidth={1.7} />
        </button>
        <button
          type="button"
          aria-label="Buscar NFTs"
          onClick={() => {
            searchInputRef.current?.focus();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="-mt-7 flex h-15 w-15 items-center justify-center rounded-full border-[5px] border-[#140d0a] bg-linear-to-br from-[#e4a15e] to-[#bd7136] text-white shadow-lg"
        >
          <ScanLine size={27} strokeWidth={1.5} />
        </button>
        <Link
          to="/cart"
          aria-label={`Carrinho, ${items.length} itens`}
          className="relative text-[#d9c4ae]"
        >
          <ShoppingCart size={21} fill="currentColor" strokeWidth={1.7} />
          {items.length > 0 && (
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d28a4c] px-1 text-[9px] font-bold text-[#140d0a]">
              {items.length}
            </span>
          )}
        </Link>
        <button
          type="button"
          aria-label="Conta"
          onClick={() => {
            if (session.data?.user) {
              void navigate({ to: "/perfil" });
              return;
            }
            openAuth("page");
          }}
          className={session.data?.user ? "text-[#e99b53]" : "text-[#d9c4ae]"}
        >
          <UserRound size={21} fill="currentColor" strokeWidth={1.7} />
        </button>
      </nav>
    </div>
  );
}
