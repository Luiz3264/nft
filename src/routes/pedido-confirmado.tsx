import { useState, type ReactNode } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Copy,
  Loader2,
  ShoppingCart,
  X,
} from "lucide-react";

import { useOrder, useSession, useWallets } from "@/api/hooks";
import { useAuthLayer } from "@/components/auth/authLayerContext";
import type { Order, OrderStatus, Wallet } from "@/api/contracts";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const STATUS_PRESENTATION: Record<
  OrderStatus,
  {
    icon: typeof Check;
    title: string;
    description: string;
    ring: string;
    iconColor: string;
    action: { to: string; label: string };
  }
> = {
  confirmed: {
    icon: Check,
    title: "Pedido confirmado",
    description:
      "A transação foi liquidada. As peças já estão disponíveis na sua carteira.",
    ring: "border-[#D28A4C]/45 bg-[#D28A4C]/12",
    iconColor: "text-[#E89B55]",
    action: { to: "/", label: "Continuar explorando" },
  },
  pending: {
    icon: Clock,
    title: "Pagamento em andamento",
    description:
      "A rede ainda não confirmou a liquidação. Esta tela atualiza sozinha assim que o aviso chegar.",
    ring: "border-[#C8A77F]/40 bg-[#C8A77F]/10",
    iconColor: "text-[#C8A77F]",
    action: { to: "/", label: "Voltar ao mercado" },
  },
  declined: {
    icon: X,
    title: "Pagamento recusado",
    description:
      "A carteira não autorizou a transação. Nenhum valor foi descontado e o carrinho segue intacto.",
    ring: "border-[#e0574a]/45 bg-[#e0574a]/12",
    iconColor: "text-[#e0574a]",
    action: { to: "/cart", label: "Tentar novamente" },
  },
};

function formatEth(value: number) {
  return `${value.toFixed(3)} ETH`;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
}

function readMessage(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message ?? fallback
  );
}

function readWalletLabel(wallet: Wallet | undefined, order: Order) {
  if (!wallet) return order.walletId;
  if (wallet.ensName) return wallet.ensName;
  if (wallet.displayName) return wallet.displayName;
  return `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`;
}

function SummaryRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={emphasis ? "text-[12px] font-bold" : "text-[11px]"}>
        {label}
      </span>
      <span
        className={
          emphasis
            ? "text-[18px] font-bold text-[#E89B55]"
            : "font-mono text-[11px] text-[#F5F1EB]"
        }
      >
        {value}
      </span>
    </div>
  );
}

function ConfirmationCard({
  order,
  wallet,
  compact,
}: {
  order: Order;
  wallet: Wallet | undefined;
  compact: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const presentation = STATUS_PRESENTATION[order.status];
  const Icon = presentation.icon;
  const transaction = order.transactionReference;

  const copyTransaction = async () => {
    if (!transaction || !navigator.clipboard) return;
    await navigator.clipboard.writeText(transaction);
    setCopied(true);
  };

  return (
    <article
      data-testid={compact ? "mobile-order-confirmation" : "desktop-order-confirmation"}
      data-status={order.status}
      className="w-full rounded-[14px] border border-[#3b2418] bg-[#241610] px-6 py-9 text-center sm:px-10 sm:py-12"
    >
      <span
        aria-hidden="true"
        className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border ${presentation.ring}`}
      >
        <Icon className={presentation.iconColor} size={18} strokeWidth={2.5} />
      </span>

      <h1 className="mt-5 font-mono text-[22px] font-bold tracking-tight sm:text-[26px]">
        {presentation.title}
      </h1>
      <p className="mx-auto mt-2 max-w-[42ch] font-mono text-[11px] leading-5 text-[#C8A77F]">
        {presentation.description}
      </p>

      <dl className="mt-7 space-y-2.5 text-left font-mono text-[11px]">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-[#a78965]">Número do pedido</dt>
          <dd className="truncate text-[#F5F1EB]">{order.id}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-[#a78965]">Carteira</dt>
          <dd className="truncate text-[#F5F1EB]">
            {readWalletLabel(wallet, order)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-[#a78965]">Data e hora</dt>
          <dd className="text-[#F5F1EB]">{formatDate(order.createdAt)}</dd>
        </div>
      </dl>

      <ul className="mt-6 space-y-2 border-t border-[#3b2418] pt-6 text-left">
        {order.items.map((item) => (
          <li
            key={item.nftId}
            className="flex items-baseline justify-between gap-4 font-mono text-[11px]"
          >
            <span className="min-w-0 truncate text-[#F5F1EB]">
              {item.name}
              {item.quantity > 1 && (
                <span className="text-[#a78965]"> ×{item.quantity}</span>
              )}
            </span>
            <span className="shrink-0 text-[#C8A77F]">
              {formatEth(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-2.5 border-t border-[#3b2418] pt-6 font-mono">
        <SummaryRow label="Subtotal" value={formatEth(order.subtotal)} />
        {order.discount > 0 && (
          <SummaryRow
            label="Desconto"
            value={`− ${formatEth(order.discount)}`}
          />
        )}
        <SummaryRow
          label="Taxa de rede"
          value={formatEth(order.networkFee)}
        />
        <div className="border-t border-[#3b2418] pt-4">
          <SummaryRow label="Total pago" value={formatEth(order.total)} emphasis />
        </div>
      </div>

      {transaction && (
        <div className="mt-6 border-t border-[#3b2418] pt-6">
          <p className="font-mono text-[9px] tracking-[0.15em] text-[#a78965]">
            HASH DA TRANSAÇÃO
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <code className="min-w-0 truncate font-mono text-[10px] text-[#C8A77F]">
              {transaction}
            </code>
            <button
              type="button"
              onClick={() => void copyTransaction()}
              aria-label="Copiar hash da transação"
              className="shrink-0 rounded-[4px] border border-[#4b2d22] p-1.5 text-[#C8A77F] transition-colors hover:border-[#D28A4C] hover:text-[#E89B55]"
            >
              <Copy size={12} />
            </button>
          </div>
          <p role="status" className="mt-1 h-3 font-mono text-[9px] text-[#a78965]">
            {copied ? "Hash copiado." : ""}
          </p>
        </div>
      )}

      <Link
        to={presentation.action.to}
        className={`mt-8 inline-flex h-10 items-center justify-center gap-2 rounded-[6px] bg-[#D28A4C] px-6 font-mono text-[11px] font-bold text-[#140d0a] transition-colors hover:bg-[#e29a63] ${compact ? "w-full" : ""}`}
      >
        {presentation.action.to === "/cart" ? (
          <ShoppingCart size={14} />
        ) : (
          <ArrowRight size={14} />
        )}
        {presentation.action.label}
      </Link>
    </article>
  );
}

function GuardCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <article className="w-full rounded-[14px] border border-[#3b2418] bg-[#241610] px-6 py-12 text-center sm:px-10">
      <h1 className="font-mono text-[22px] font-bold tracking-tight sm:text-[26px]">
        {title}
      </h1>
      <p className="mx-auto mt-2 max-w-[42ch] font-mono text-[11px] leading-5 text-[#C8A77F]">
        {description}
      </p>
      {children && <div className="mt-7">{children}</div>}
    </article>
  );
}

export default function PedidoConfirmadoPage() {
  const params = useParams({ strict: false });
  const orderId = String(params.orderId ?? "");
  const orderQuery = useOrder(orderId);
  const session = useSession();
  const wallets = useWallets();
  const { open: openAuth } = useAuthLayer();

  const order = orderQuery.data;
  const wallet = wallets.data?.find((entry) => entry.id === order?.walletId);

  if (!session.data?.user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#140d0a] px-6 py-16 text-[#f5f1eb] md:min-h-screen">
        <GuardCard
          title="Pedido protegido"
          description="Entre na sua conta para abrir a confirmação deste pedido."
        >
          <button
            type="button"
            onClick={() => openAuth("dialog")}
            className="h-10 rounded-[6px] bg-[#D28A4C] px-6 font-mono text-[11px] font-bold text-[#140d0a] transition-colors hover:bg-[#e29a63]"
          >
            Entrar
          </button>
        </GuardCard>
      </div>
    );
  }

  if (orderQuery.isError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#140d0a] px-6 py-16 text-[#f5f1eb] md:min-h-screen">
        <GuardCard
          title="Pedido não encontrado"
          description={readMessage(
            orderQuery.error,
            "Não localizamos este pedido na sua conta.",
          )}
        >
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => void orderQuery.refetch()}
              className="h-10 rounded-[6px] bg-[#D28A4C] px-5 font-mono text-[11px] font-bold text-[#140d0a] transition-colors hover:bg-[#e29a63]"
            >
              Tentar novamente
            </button>
            <Link
              to="/"
              className="font-mono text-[11px] text-[#E89B55] transition-colors hover:text-[#efa45f]"
            >
              Voltar ao mercado
            </Link>
          </div>
        </GuardCard>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#140d0a] px-6 py-16 text-[#f5f1eb] md:min-h-screen">
        <p
          role="status"
          className="flex items-center gap-2 font-mono text-[11px] text-[#C8A77F]"
        >
          <Loader2 className="animate-spin" size={14} /> Carregando pedido…
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden min-h-dvh bg-[#140d0a] px-6 py-10 text-[#f5f1eb]">
        <Link
          to="/cart"
          aria-label="Voltar ao carrinho"
          className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#563523] bg-[#241610] text-[#d9ad76]"
        >
          <ArrowLeft size={18} />
        </Link>
        <ConfirmationCard order={order} wallet={wallet} compact />
      </div>

      <div className="hidden min-h-screen bg-[#140d0a] px-6 py-16 text-[#f5f1eb] md:flex md:justify-center">
        <div className="w-full max-w-[640px]">
          <nav
            aria-label="Trilha de navegação"
            className="mb-6 font-mono text-[11px] text-[#a78965]"
          >
            <Link to="/" className="hover:text-[#F5F1EB]">
              Início
            </Link>
            <span className="mx-2">/</span>
            <Link to="/cart" className="hover:text-[#F5F1EB]">
              Carrinho
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[#F5F1EB]">Confirmação</span>
          </nav>
          <ConfirmationCard order={order} wallet={wallet} compact={false} />
        </div>
      </div>
    </>
  );
}
