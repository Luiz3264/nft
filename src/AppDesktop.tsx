import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Heart,
  Search,
  ShoppingCart,
  Star,
  ZoomIn,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCart } from "@/lib/cart";
import { useAuth, useCatalog, useFavorites, useSession } from "@/api/hooks";
import { useAuthLayer } from "@/components/auth/authLayerContext";
import type { Nft, User } from "@/api/contracts";

import Logo from "./assets/Logo.svg";
import Image from "./assets/Image.png";
import Image2 from "./assets/Image2.png";
import Image3 from "./assets/Image3.png";
import Image4 from "./assets/Image4.png";
import Cart from "./assets/Cart.svg";

type nft = Nft;

const categoryLabels = [
  "Arte digital",
  "Fotografia",
  "Música",
  "Arte 3D",
  "Colecionáveis",
  "Generativa",
  "Jogos",
  "Assinaturas",
  "Utilidade",
];

type CollectionTab = "Todos os NFTs" | "Novos lançamentos" | "Em alta";
type SortOption = "recent" | "price-ascending" | "price-descending";

function DesktopNftDetail({
  nft,
  relatedNfts,
  isFavorite,
  user,
  onBack,
  onOpenLogin,
  onOpenSearch,
  onSelectNft,
  onSignOut,
  onToggleFavorite,
}: {
  nft: nft;
  relatedNfts: nft[];
  isFavorite: boolean;
  user: User | null;
  onBack: () => void;
  onOpenLogin: () => void;
  onOpenSearch: () => void;
  onSelectNft: (selected: nft) => void;
  onSignOut: () => void;
  onToggleFavorite: () => void;
}) {
  const { items, addItem } = useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");
  const [zoomed, setZoomed] = useState(false);
  const gallery = [nft.img, nft.img, nft.img, nft.img];
  const tokenId =
    nft.name.match(/#(\d+)/)?.[1] ?? String(nft.id).padStart(4, "0");
  const collection =
    nft.category === "Colecionáveis" ? "Kurio Apes" : "Kurio Editions";

  const addToCart = (count: number) => {
    addItem({ id: nft.id, name: nft.name, price: nft.price }, count);
  };

  const buyNft = () => {
    addToCart(quantity);
    void navigate({ to: "/cart" });
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#140d0a] text-[#f5f1eb]">
      <div className="mx-auto max-w-7xl px-6">
        <header className="flex h-17 items-center justify-between border-b border-[#4b2d22]">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar ao mercado"
            className="font-mono text-[11px] tracking-[0.15em]"
          >
            KURIO
          </button>
          <nav className="hidden items-center gap-8 font-mono text-xs text-[#d9c4ae] md:flex">
            <button
              type="button"
              onClick={onBack}
              className="hover:text-[#e99b53]"
            >
              Início
            </button>
            <button
              type="button"
              onClick={onBack}
              className="border-b-2 border-[#D28A4C] py-6 text-[#e99b53]"
            >
              Mercado
            </button>
            <a href="#collection-more" className="hover:text-[#e99b53]">
              Criadores
            </a>
            <a href="#nft-details" className="hover:text-[#e99b53]">
              Aprenda
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Buscar NFTs"
              onClick={onOpenSearch}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#d9c4ae] transition hover:bg-[#2b1b14] hover:text-[#e99b53]"
            >
              <Search size={18} />
            </button>
            <Link
              to="/cart"
              aria-label={`Carrinho, ${items.length} itens`}
              className="relative text-[#d9c4ae] hover:text-[#e99b53]"
            >
              <ShoppingCart size={19} />
              {items.length > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-[#D28A4C] px-1 text-[9px] font-bold text-[#140d0a]">
                  {items.length}
                </span>
              )}
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/perfil"
                  className="font-mono text-xs text-[#f5f1eb] hover:text-[#e99b53]"
                >
                  {user.displayName}
                </Link>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-md border border-[#69432c] px-3 py-2 font-mono text-xs text-[#d9c4ae] hover:border-[#d28a4c] hover:text-[#e99b53]"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="rounded-md bg-[#D28A4C] px-4 py-2 font-mono text-xs font-bold text-[#140d0a] hover:bg-[#e29a63]"
              >
                Entrar
              </button>
            )}
          </div>
        </header>

        <p className="py-5 font-mono text-[11px] text-[#c8aa80]">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-[#f5f1eb]"
          >
            Início
          </button>
          <span className="mx-2">/</span>
          <button
            type="button"
            onClick={onBack}
            className="hover:text-[#f5f1eb]"
          >
            Mercado
          </button>
          <span className="mx-2">/</span>
          <span className="text-[#f5f1eb]">{nft.name}</span>
        </p>

        <main>
          <section className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[52px_minmax(0,1.1fr)_minmax(360px,1fr)]">
            <div className="order-2 flex gap-3 overflow-x-auto lg:order-1 lg:flex-col">
              {gallery.map((image, index) => (
                <button
                  key={`${nft.id}-gallery-${index}`}
                  type="button"
                  aria-label={`Ver imagem ${index + 1} de ${nft.name}`}
                  aria-pressed={activeImage === index}
                  onClick={() => setActiveImage(index)}
                  className={`h-13.5 w-13.5 shrink-0 overflow-hidden rounded-md border ${activeImage === index ? "border-[#e89b55]" : "border-[#4b2d22]"}`}
                >
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>

            <div className="relative order-1 overflow-hidden rounded-[12px] bg-[#241612] p-3 lg:order-2">
              <img
                src={gallery[activeImage]}
                alt={nft.name}
                className="aspect-square max-h-130 w-full rounded-[8px] object-cover"
              />
              <button
                type="button"
                aria-label="Ampliar imagem"
                onClick={() => setZoomed(true)}
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#1c120e]/80 text-[#f5f1eb] hover:text-[#e99b53]"
              >
                <ZoomIn size={18} />
              </button>
            </div>

            <div className="order-3 font-mono lg:pt-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-[26px] font-bold leading-tight">
                  {nft.name}
                </h1>
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  aria-pressed={isFavorite}
                  className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs ${isFavorite ? "border-[#d28a4c] text-[#efa45f]" : "border-[#69432c] text-[#d9c4ae] hover:border-[#d28a4c]"}`}
                >
                  <Heart
                    size={14}
                    fill={isFavorite ? "currentColor" : "none"}
                  />
                  {isFavorite ? "Favoritado" : "Favoritar"}
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-b border-[#4b2d22] pb-4">
                <span className="text-[18px] font-bold text-[#e99b53]">
                  {nft.price.toFixed(2)} ETH
                </span>
                <div
                  className="flex items-center gap-1 text-[#e99b53]"
                  aria-label="Avaliação 4.8 de 5"
                >
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={13} fill="currentColor" />
                  ))}
                  <span className="ml-1 font-sans text-[11px] text-[#d9c4ae]">
                    4.8 · 19 avaliações
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-[12px] leading-5 text-[#c8aa80]">
                <div>
                  <h2 className="mb-1 font-bold text-[#f5f1eb]">
                    Sobre este NFT:
                  </h2>
                  <p>
                    Um colecionável digital finalizado à mão da coleção{" "}
                    {collection}, verificado na Ethereum, com arte desbloqueável
                    e acesso para colecionadores.
                  </p>
                </div>
                <div>
                  <h2 className="mb-1 font-bold text-[#f5f1eb]">Edição:</h2>
                  <div className="flex flex-wrap gap-2">
                    {["1/10", "1/10", "1/50", "ABERTA"].map(
                      (edition, index) => (
                        <span
                          key={`${edition}-${index}`}
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${index === 2 ? "border-[#e99b53] text-[#e99b53]" : "border-[#4b2d22]"}`}
                        >
                          {edition}
                        </span>
                      ),
                    )}
                  </div>
                </div>
                <p>ID do token: #{tokenId}</p>
                <p>Coleção: {collection}</p>
                <p>Atributos: Óculos, Esmeralda, Raro</p>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full bg-[#211610] px-2 py-1">
                  <button
                    type="button"
                    aria-label="Diminuir quantidade"
                    onClick={() =>
                      setQuantity((value) => Math.max(1, value - 1))
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d28a4c] text-[#140d0a]"
                  >
                    −
                  </button>
                  <span className="min-w-4 text-center text-sm text-[#f5f1eb]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Aumentar quantidade"
                    onClick={() => setQuantity((value) => value + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d28a4c] text-[#140d0a]"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={buyNft}
                  className="rounded-md bg-[#D28A4C] px-7 py-2.5 text-xs font-bold uppercase text-[#140d0a] hover:bg-[#e29a63]"
                >
                  Comprar · {(nft.price * quantity).toFixed(2)} ETH
                </button>
                <button
                  type="button"
                  onClick={() => addToCart(1)}
                  aria-label="Adicionar ao carrinho"
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-[#69432c] text-[#e99b53] hover:bg-[#2b1b14]"
                >
                  <ShoppingCart size={17} />
                </button>
              </div>

              <p className="mt-4 text-[11px] text-[#c8aa80]">
                Compartilhar este NFT:{" "}
                <button
                  type="button"
                  onClick={() =>
                    void navigator.clipboard?.writeText(window.location.href)
                  }
                  className="ml-1 text-[#f5f1eb] hover:text-[#e99b53]"
                >
                  Copiar link
                </button>
              </p>
            </div>
          </section>

          <section id="nft-details" className="mt-14 border-y border-[#4b2d22]">
            <div className="flex gap-8 font-mono text-sm">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`border-b-2 py-3 ${activeTab === "details" ? "border-[#D28A4C] text-[#e99b53]" : "border-transparent text-[#d9c4ae]"}`}
              >
                Detalhes do NFT
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("reviews")}
                className={`border-b-2 py-3 ${activeTab === "reviews" ? "border-[#D28A4C] text-[#e99b53]" : "border-transparent text-[#d9c4ae]"}`}
              >
                Avaliações de colecionadores (19)
              </button>
            </div>
            {activeTab === "details" ? (
              <div className="space-y-4 py-5 font-mono text-[11px] leading-5 text-[#c8aa80]">
                <p>
                  {nft.name} é uma obra digital 1/50 finalizada à mão da coleção{" "}
                  {collection}. Cada atributo fica armazenado nos metadados do
                  token e verificado na Ethereum. A obra explora identidade,
                  movimento e luz em um mundo digital sem fronteiras.
                </p>
                <p>
                  A propriedade inclui arte em alta resolução, lançamentos
                  exclusivos para colecionadores e um registro permanente de
                  procedência registrado na rede.
                </p>
                <p>
                  <strong className="text-[#f5f1eb]">Rede:</strong>
                  <br />
                  Cunhado na Ethereum com procedência imutável e metadados
                  armazenados no IPFS.
                </p>
                <p>
                  <strong className="text-[#f5f1eb]">Contrato:</strong>
                  <br />
                  Direitos autorais do criador: 5% nas vendas secundárias, pagos
                  automaticamente pelos mercados compatíveis.
                </p>
                <p>
                  <strong className="text-[#f5f1eb]">Direitos autorais:</strong>
                  <br />
                  0x7A42...19E8 · Contrato inteligente ERC-721 verificado.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 py-5 md:grid-cols-3">
                {[
                  "Arte incrível e acabamento impecável.",
                  "A coleção é muito bem curada. A peça chegou à minha carteira sem problemas.",
                  "Uma das minhas obras favoritas da Kurio.",
                ].map((review, index) => (
                  <article
                    key={review}
                    className="rounded-lg border border-[#4b2d22] bg-[#211610] p-4 font-mono text-xs text-[#d9c4ae]"
                  >
                    <div className="mb-2 flex items-center gap-1 text-[#e99b53]">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star key={starIndex} size={12} fill="currentColor" />
                      ))}
                    </div>
                    <p>{review}</p>
                    <p className="mt-3 text-[10px] text-[#a78965]">
                      Colecionador verificado · #{index + 1}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="collection-more" className="py-10">
            <h2 className="mb-5 font-mono text-sm font-bold text-[#e99b53]">
              Mais desta coleção
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {relatedNfts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectNft(item)}
                  className="min-w-0 rounded-lg bg-[#211610] p-2 text-left transition hover:-translate-y-1 hover:bg-[#2b1b14]"
                >
                  <img
                    src={item.img}
                    alt={item.name}
                    className="aspect-square w-full rounded-md object-cover"
                  />
                  <span className="mt-2 block truncate font-mono text-[11px] text-[#f5f1eb]">
                    {item.name}
                  </span>
                  <span className="font-mono text-[11px] text-[#e99b53]">
                    {item.price.toFixed(2)} ETH
                  </span>
                </button>
              ))}
            </div>
          </section>

          <footer className="mb-8 border-t border-[#4b2d22] pt-6">
            <div className="grid gap-6 text-xs text-[#c8aa80] sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <strong className="mb-2 block text-[#f5f1eb]">
                  Segurança da carteira
                </strong>
                Proteja sua carteira e colecione com confiança.
              </div>
              <div>
                <strong className="mb-2 block text-[#f5f1eb]">
                  Criadores em destaque
                </strong>
                Conheça artistas e coleções originais.
              </div>
              <div>
                <strong className="mb-2 block text-[#f5f1eb]">
                  Alertas de lançamentos
                </strong>
                Receba novidades das coleções.
              </div>
              <div>
                <strong className="mb-2 block text-[#f5f1eb]">
                  Antecipe-se ao próximo lançamento
                </strong>
                <div className="mt-2 flex">
                  <input
                    aria-label="E-mail para novidades"
                    placeholder="Digite seu e-mail"
                    className="min-w-0 flex-1 rounded-l bg-[#2b1b14] px-2 py-2"
                  />
                  <button
                    type="button"
                    className="rounded-r bg-[#D28A4C] px-3 font-bold text-[#140d0a]"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap justify-between gap-4 border-t border-[#4b2d22] pt-4 font-mono text-[10px] text-[#c8aa80]">
              <span>KURIO</span>
              <span>Meu perfil · Central de ajuda · Coleções</span>
              <span>© 2026 Kurio. Propriedade digital para todos.</span>
            </div>
          </footer>
        </main>
      </div>

      {zoomed && (
        <button
          type="button"
          aria-label="Fechar imagem ampliada"
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/90 p-8"
        >
          <img
            src={gallery[activeImage]}
            alt={nft.name}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </button>
      )}
    </div>
  );
}

export default function AppDesktop({
  initialNftId,
}: {
  initialNftId?: number;
} = {}) {
  const navigate = useNavigate();
  const { items, addItem } = useCart();
  const catalog = useCatalog();
  const nfts = catalog.data?.items ?? [];
  const featuredNfts = nfts.filter((item) => item.id > 6);
  const { favoriteIds: favoriteNftIds, toggleFavorite: updateFavorite } =
    useFavorites();
  const session = useSession();
  const { logout } = useAuth();
  const { open: openAuth } = useAuthLayer();
  const [selectedNft, setSelectedNft] = useState<nft | null>(null);
  const [searchOpen, setSearchOpen] = useState(
    () => window.sessionStorage.getItem("kurio-search-open") === "true",
  );
  const [searchQuery, setSearchQuery] = useState(
    () => window.sessionStorage.getItem("kurio-search-query") ?? "",
  );
  const searchInputRef = useRef<HTMLInputElement>(null);
  const maxPrice =
    Math.ceil(Math.max(0, ...nfts.map((item) => item.price))) || 3;
  const [draftPriceRange, setDraftPriceRange] = useState<number[]>([
    0,
    maxPrice,
  ]);
  const [appliedPriceRange, setAppliedPriceRange] = useState<number[]>([
    0,
    maxPrice,
  ]);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [activeCollectionTab, setActiveCollectionTab] =
    useState<CollectionTab>("Todos os NFTs");
  const [sortOption, setSortOption] = useState<SortOption>("recent");

  useEffect(() => {
    if (!selectedNft && initialNftId && catalog.data) {
      setSelectedNft(
        catalog.data.items.find((item) => item.id === initialNftId) ?? null,
      );
    }
  }, [catalog.data, initialNftId, selectedNft]);

  const filteredNfts = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    let results = nfts.filter(
      (nft) =>
        nft.price >= appliedPriceRange[0] &&
        nft.price <= appliedPriceRange[1] &&
        (selectedCategory === "Todas" || nft.category === selectedCategory) &&
        (!query ||
          nft.name.toLocaleLowerCase().includes(query) ||
          nft.category?.toLocaleLowerCase().includes(query)),
    );

    if (activeCollectionTab === "Novos lançamentos") {
      results = results.filter((nft) => nft.isNew);
    } else if (activeCollectionTab === "Em alta") {
      results = results.filter((nft) => nft.trending);
    }

    return [...results].sort((a, b) => {
      if (sortOption === "price-ascending") return a.price - b.price;
      if (sortOption === "price-descending") return b.price - a.price;
      return b.id - a.id;
    });
  }, [
    activeCollectionTab,
    appliedPriceRange,
    nfts,
    searchQuery,
    selectedCategory,
    sortOption,
  ]);

  const resetFilters = () => {
    setSelectedCategory("Todas");
    setActiveCollectionTab("Todos os NFTs");
    setSortOption("recent");
    setSearchQuery("");
    window.sessionStorage.removeItem("kurio-search-query");
    setDraftPriceRange([0, maxPrice]);
    setAppliedPriceRange([0, maxPrice]);
  };

  useEffect(() => {
    if (searchOpen && !selectedNft) searchInputRef.current?.focus();
  }, [searchOpen, selectedNft]);

  const openLogin = () => openAuth("dialog");

  const signOut = () => void logout.mutateAsync();

  const toggleFavorite = (id: number) => updateFavorite(id);

  const openNft = (item: nft) => {
    setSelectedNft(item);
    void navigate({
      to: "/nft/$nftId",
      params: { nftId: String(item.id) },
    });
  };

  const updateSearchQuery = (query: string) => {
    setSearchQuery(query);
    window.sessionStorage.setItem("kurio-search-query", query);
  };

  const updateSearchOpen = (open: boolean) => {
    setSearchOpen(open);
    window.sessionStorage.setItem("kurio-search-open", String(open));
  };

  const returnToMarketplace = () => {
    setSelectedNft(null);
    void navigate({ to: "/" });
  };

  const handlePriceRangeChange = (value: number | readonly number[]) => {
    if (Array.isArray(value)) {
      setDraftPriceRange([...value]);
      return;
    }

    const numericValue = Number(value);
    setDraftPriceRange([0, numericValue]);
  };

  if (selectedNft) {
    return (
      <DesktopNftDetail
        key={selectedNft.id}
        nft={selectedNft}
        relatedNfts={[...nfts, ...featuredNfts]
          .filter((item) => item.id !== selectedNft.id)
          .slice(0, 5)}
        isFavorite={favoriteNftIds.includes(selectedNft.id)}
        user={session.data?.user ?? null}
        onBack={returnToMarketplace}
        onOpenLogin={() => {
          setSelectedNft(null);
          void navigate({ to: "/" });
          openLogin();
        }}
        onOpenSearch={() => {
          setSelectedNft(null);
          updateSearchOpen(true);
          void navigate({ to: "/" });
        }}
        onSelectNft={openNft}
        onSignOut={signOut}
        onToggleFavorite={() => toggleFavorite(selectedNft.id)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#140d0a] text-[#f5f1eb]">
      <div className="mx-auto max-w-[1280px] px-6 py-5">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={Logo} alt="Kurio" className="h-7 w-auto" />
          </div>

          <nav className="flex items-center gap-8 text-sm text-[#d9c4ae]">
            <a className="border-b border-[#D28A4C] pb-1 text-[#f5f1eb]">
              Início
            </a>
            <a>Mercado</a>
            <a>Criadores</a>
            <a>Aprenda</a>
          </nav>

          <div className="flex items-center gap-4">
            {searchOpen && (
              <div className="flex h-10 w-56 items-center gap-2 rounded-full border border-[#4b2d22] bg-[#1c120e] px-3 focus-within:border-[#D28A4C]">
                <Search size={16} className="shrink-0 text-[#d9c4ae]" />
                <input
                  ref={searchInputRef}
                  aria-label="Buscar NFTs"
                  value={searchQuery}
                  onChange={(event) => updateSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      updateSearchQuery("");
                      updateSearchOpen(false);
                    }
                  }}
                  placeholder="Nome ou categoria"
                  className="min-w-0 flex-1 bg-transparent font-mono text-xs text-[#f5f1eb] outline-none placeholder:text-[#928174]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Limpar busca"
                    onClick={() => {
                      updateSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="text-[#d9c4ae] hover:text-[#e99b53]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              aria-label={searchOpen ? "Fechar busca" : "Abrir busca"}
              aria-expanded={searchOpen}
              onClick={() => updateSearchOpen(!searchOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#4b2d22] bg-[#1c120e] text-[#d9c4ae] transition hover:border-[#D28A4C] hover:text-[#e99b53]"
            >
              {searchOpen ? <X size={17} /> : <Search size={17} />}
            </button>
            <Link
              to="/cart"
              className="relative inline-flex items-center justify-center"
            >
              <img src={Cart} className="h-6 w-6" />
              <span className="absolute -right-2 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D28A4C] px-1 text-[10px] font-bold text-[#140D0A] leading-none">
                {items.length}
              </span>
            </Link>
            {session.data?.user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/perfil"
                  className="font-mono text-xs text-[#f5f1eb] hover:text-[#e99b53]"
                >
                  {session.data.user.displayName}
                </Link>
                <Button
                  onClick={signOut}
                  className="rounded-[8px] border border-[#69432c] bg-transparent font-mono text-xs text-[#d9c4ae] hover:bg-[#2b1b14] hover:text-[#e99b53]"
                >
                  Sair
                </Button>
              </div>
            ) : (
              <Button
                onClick={openLogin}
                className="rounded-[8px] bg-[#D28A4C] text-[#140D0A] hover:bg-[#e29a63]"
              >
                Entrar
              </Button>
            )}
          </div>
        </header>

        <main className="space-y-10 m-25">
          <section className="flex items-center justify-between gap-8 pt-2">
            <div className="max-w-[560px]">
              <p className="mb-3 text-sm uppercase tracking-[0.15em] text-[#F5F1EB]">
                Bem-vindo à Kurio
              </p>
              <h1 className="text-[62px] leading-[0.95] font-black uppercase tracking-[-0.04em] text-[#f5f1eb]">
                SEJA DONO DO FUTURO
                <br />
                DA ARTE DIGITAL
              </h1>
              <p className="mt-5 max-w-[520px] text-base leading-7 text-[#CFB28C]">
                Descubra NFTs selecionados de criadores emergentes e
                consagrados. Colecione arte digital rara, apoie artistas e tenha
                uma parte da cultura da internet.
              </p>
              <div className="mt-7 flex items-center gap-4">
                <Button className="rounded-[8px] bg-[#D28A4C] px-7 py-3 text-[#140D0A] hover:bg-[#e29a63]">
                  EXPLORAR
                </Button>
              </div>
              <div className="text-center left-[50%] absolute">
                <div className="mt-6 flex gap-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <span
                      key={index}
                      className={`h-2.5 w-2.5 rounded-full ${
                        index === 0 ? "bg-[#D28A4C]" : "bg-[#736157]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="w-[540px] overflow-hidden rounded-[30px]]">
              <img
                src={Image}
                alt="NFT cover"
                className="h-[420px] w-full rounded-[24px] object-cover"
              />
            </div>
          </section>
          <br />

          <section className="pt-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Coleções</h2>
              <div className="flex items-center gap-5 text-sm text-[#C8A77F]">
                {(
                  [
                    "Todos os NFTs",
                    "Novos lançamentos",
                    "Em alta",
                  ] as CollectionTab[]
                ).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveCollectionTab(tab)}
                    className={`border-b pb-1 transition ${
                      activeCollectionTab === tab
                        ? "border-[#D28A4C] text-[#f5f1eb]"
                        : "border-transparent hover:text-[#f5f1eb]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-[#C8A77F]">
                Ordenar por:
                <select
                  value={sortOption}
                  onChange={(event) =>
                    setSortOption(event.target.value as SortOption)
                  }
                  className="rounded-md border border-[#4b2d22] bg-[#1c120e] px-2 py-1 text-[#f5f1eb] outline-none focus:border-[#D28A4C]"
                >
                  <option value="recent">Mais recentes</option>
                  <option value="price-ascending">Menor preço</option>
                  <option value="price-descending">Maior preço</option>
                </select>
              </label>
            </div>

            <div className="flex items-start gap-8">
              <aside className="w-[260px] bg-[#21130f] p-4 text-[#f5f1eb]">
                <div className="mb-4 text-lg font-semibold">Categorias</div>
                <div className="space-y-2 text-sm text-[#d9c4ae]">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("Todas")}
                    aria-pressed={selectedCategory === "Todas"}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left ${
                      selectedCategory === "Todas"
                        ? "bg-[#34211a] text-[#f5f1eb]"
                        : "hover:bg-[#2b1c16]"
                    }`}
                  >
                    <span>Todas</span>
                    <span className="rounded-full bg-[#2e1d17] px-1.5 py-0.5 text-[10px] text-[#D28A4C]">
                      {nfts.length}
                    </span>
                  </button>
                  {categoryLabels.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSelectedCategory(label)}
                      aria-pressed={selectedCategory === label}
                      className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left transition ${
                        selectedCategory === label
                          ? "bg-[#34211a] text-[#f5f1eb]"
                          : "hover:bg-[#2b1c16]"
                      }`}
                    >
                      <span>{label}</span>
                      <span className="rounded-full bg-[#2e1d17] px-1.5 py-0.5 text-[10px] text-[#D28A4C]">
                        {nfts.filter((nft) => nft.category === label).length}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="mb-2 text-lg font-semibold">
                    Faixa de preço
                  </div>
                  <Slider
                    value={draftPriceRange}
                    onValueChange={handlePriceRangeChange}
                    min={0}
                    max={maxPrice}
                    step={0.01}
                    className="mx-auto w-full max-w-xs"
                  />
                  <div className="mt-3 text-sm text-[#CFB28C]">
                    Preço: {draftPriceRange[0].toFixed(2)} ETH -{" "}
                    {draftPriceRange[1].toFixed(2)} ETH
                  </div>
                  <Button
                    onClick={() => setAppliedPriceRange(draftPriceRange)}
                    className="mt-4 w-full rounded-[10px] bg-[#D28A4C] text-[#140d0a] hover:bg-[#e29a63]"
                  >
                    Aplicar
                  </Button>
                  {(selectedCategory !== "Todas" ||
                    activeCollectionTab !== "Todos os NFTs" ||
                    appliedPriceRange[0] !== 0 ||
                    appliedPriceRange[1] !== maxPrice ||
                    sortOption !== "recent") && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-3 w-full text-sm text-[#CFB28C] underline underline-offset-4 hover:text-[#f5f1eb]"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </aside>

              <div className="flex-1">
                <div className="grid grid-cols-3 gap-4">
                  {catalog.isError ? (
                    <div
                      role="alert"
                      className="col-span-3 rounded-[14px] bg-[#201611] p-6 text-[#f0a36a]"
                    >
                      Não foi possível carregar o catálogo.
                      <button
                        type="button"
                        onClick={() => void catalog.refetch()}
                        className="ml-2 underline underline-offset-4"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  ) : filteredNfts.length > 0 ? (
                    filteredNfts.map((nft) => (
                      <div
                        key={nft.id}
                        data-testid="marketplace-nft-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => openNft(nft)}
                        onKeyDown={(event) => {
                          if (event.target !== event.currentTarget) return;
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openNft(nft);
                          }
                        }}
                        className="cursor-pointer bg-[#241612] p-2 transition hover:border-[#d28a4c]/50"
                      >
                        <img
                          src={nft.img}
                          alt={nft.name}
                          className="h-[220px] w-full rounded-[14px] object-cover"
                        />
                        <div className="mt-3 px-1">
                          <div className="text-base font-medium text-[#f5f1eb]">
                            {nft.name}
                          </div>
                          <div className="mt-1 flex items-center justify-between text-sm">
                            <span className="text-[#E89B55]">
                              {nft.price} ETH
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 rounded-[14px] bg-[#201611] p-6 text-[#CFB28C]">
                      Nenhum NFT corresponde aos filtros selecionados.
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="ml-2 text-[#E89B55] underline underline-offset-4"
                      >
                        Limpar filtros
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="pt-4">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[32px] font-black uppercase tracking-[-0.04em] text-[#f5f1eb]">
                NFT EM DESTAQUE
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {featuredNfts.map((nft) => (
                <div
                  key={nft.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openNft(nft)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openNft(nft);
                    }
                  }}
                  className="cursor-pointer rounded-[18px] border border-[#d28a4c]/15 bg-[#201611] p-2 transition hover:border-[#d28a4c]/50"
                >
                  <img
                    src={nft.img}
                    alt={nft.name}
                    className="h-[220px] w-full rounded-[14px] object-cover"
                  />
                  <div className="mt-3 flex items-center justify-between px-1">
                    <div>
                      <div className="text-base font-medium text-[#f5f1eb]">
                        {nft.name}
                      </div>
                      <div className="text-[#E89B55]">{nft.price} ETH</div>
                    </div>
                    <Button
                      onClick={(event) => {
                        event.stopPropagation();
                        addItem({ ...nft });
                      }}
                      className="h-8 rounded-[8px] bg-[#D28A4C] px-3 text-[11px] text-[#140d0a] hover:bg-[#e29a63]"
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-center gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <button
                  key={index}
                  className={`flex h-8 w-8 items-center justify-center rounded-[6px] border text-sm ${
                    index === 0
                      ? "border-[#D28A4C] bg-[#D28A4C] text-[#140d0a]"
                      : "border-[#4b2d22] bg-[#201611] text-[#f5f1eb]"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-6 pt-4">
            <div className="flex items-center justify-between rounded-[18px] border border-[#d28a4c]/20 bg-[#201611] p-5">
              <div className="flex items-center gap-4">
                <img
                  src={Image2}
                  alt=""
                  className="h-32 w-32 rounded-[12px] object-cover"
                />
                <div>
                  <div className="text-[13px] uppercase tracking-[0.12em] text-[#CFB28C]">
                    Lançamentos genêsis
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[#f5f1eb]">
                    Coleções exclusivas
                  </div>
                </div>
              </div>
              <Button className="rounded-[8px] bg-[#D28A4C] px-5 text-[#140d0a] hover:bg-[#e29a63]">
                Explorar
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-[18px] border border-[#d28a4c]/20 bg-[#201611] p-5">
              <div className="flex items-center gap-4">
                <img
                  src={Image3}
                  alt=""
                  className="h-32 w-32 rounded-[12px] object-cover"
                />
                <div>
                  <div className="text-[13px] uppercase tracking-[0.12em] text-[#CFB28C]">
                    Arte digital selecionada
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[#f5f1eb]">
                    Explore novas coleções
                  </div>
                </div>
              </div>
              <Button className="rounded-[8px] bg-[#D28A4C] px-5 text-[#140d0a] hover:bg-[#e29a63]">
                Explorar
              </Button>
            </div>
          </section>

          <section className="pt-4">
            <div className="mb-5 text-[32px] font-black uppercase tracking-[-0.04em] text-[#f5f1eb]">
              Diário da Cunhagem
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                [
                  "17 de setembro",
                  "Leitura de 1",
                  "Como funciona a propriedade de NFTs, de acordo com a lei e como transferir ativos digitais.",
                ],
                [
                  "15 de setembro",
                  "Leitura de 2",
                  "Raridade, atribuição e procedência no ecossistema de colecionáveis digitais.",
                ],
                [
                  "15 de setembro",
                  "Leitura de 3",
                  "Como proteger sua carteira, ativos e identidade digital de forma segura.",
                ],
                [
                  "15 de setembro",
                  "Leitura de 4",
                  "A importância da autenticidade e da origem de um item digital raro.",
                ],
              ].map(([date, title, text]) => (
                <article
                  key={title}
                  className="rounded-[18px] border border-[#d28a4c]/20 bg-[#201611] p-4"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <img
                      src={Image4}
                      alt=""
                      className="h-16 w-16 rounded-[10px] object-cover"
                    />
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.1em] text-[#CFB28C]">
                        {date}
                      </div>
                      <div className="mt-1 text-base font-semibold text-[#f5f1eb]">
                        {title}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-[#d9c4ae]">{text}</p>
                  <button className="mt-4 text-sm font-medium text-[#E89B55]">
                    Ler mais
                  </button>
                </article>
              ))}
            </div>
          </section>
        </main>

        <footer className="mt-12 border-t border-[#d28a4c]/20 pt-6">
          <div className="grid grid-cols-[1.2fr_1fr_1fr_1.5fr] gap-6 text-[#d9c4ae]">
            <div>
              <div className="mb-4 text-2xl font-black text-[#f5f1eb]">
                KURIO
              </div>
              <div className="space-y-2 text-sm">
                <div>Fale com os criadores</div>
                <div>Feedback</div>
                <div>Suporte</div>
              </div>
            </div>

            <div>
              <div className="mb-4 text-lg font-semibold text-[#f5f1eb]">
                Meu perfil
              </div>
              <div className="space-y-2 text-sm">
                <Link to="/perfil" className="block w-fit hover:text-[#E89B55]">
                  Meu perfil
                </Link>
                <Link
                  to="/carteiras"
                  className="block w-fit hover:text-[#E89B55]"
                >
                  Carteiras
                </Link>
                <Link to="/cart" className="block w-fit hover:text-[#E89B55]">
                  Minha coleção
                </Link>
              </div>
            </div>

            <div>
              <div className="mb-4 text-lg font-semibold text-[#f5f1eb]">
                Coleções
              </div>
              <div className="space-y-2 text-sm">
                <div>Arte digital</div>
                <div>Fotografia</div>
                <div>Música</div>
              </div>
            </div>

            <div>
              <div className="mb-4 text-lg font-semibold text-[#f5f1eb]">
                Receba novidades
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Digite seu e-mail"
                  className="h-11 flex-1 rounded-[8px] border border-[#4b2d22] bg-[#1c120e] px-3 text-sm text-[#f5f1eb] placeholder:text-[#928174] outline-none"
                />
                <button className="rounded-[8px] bg-[#D28A4C] px-4 text-sm font-medium text-[#140d0a]">
                  Enviar
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-[#d28a4c]/20 pt-4 text-sm text-[#C8A77F]">
            <div>© 2026 Kurio. Propriedade digital para todos.</div>
            <div className="flex items-center gap-4">
              <span>Instagram</span>
              <span>Twitter</span>
              <span>Discord</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
