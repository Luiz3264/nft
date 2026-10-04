import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Archive,
  ClipboardList,
  Headset,
  Heart,
  LogOut,
  Search,
  ShoppingCart,
  Tag,
  User,
  Wallet,
} from "lucide-react";

import { useCart } from "@/lib/cart";
import { useAuth, useSession } from "@/api/hooks";
import { useAuthLayer } from "@/components/auth/authLayerContext";
import Logo from "@/assets/Logo.svg";
import {
  accountPage,
  accountShell,
  accountSidebarLink,
  accountSidebarLinkActive,
  accountSidebarLinkDisabled,
  accountSidebarPanel,
} from "./styles";

type AccountSection = "perfil" | "carteiras" | "atividade" | "interesse" | "ofertas" | "baixados" | "suporte";

const sections: Array<{
  id: AccountSection;
  label: string;
  icon: typeof User;
  to?: string;
}> = [
  { id: "perfil", label: "Dados do perfil", icon: User, to: "/perfil" },
  { id: "carteiras", label: "Carteiras", icon: Wallet, to: "/carteiras" },
  { id: "atividade", label: "Atividade", icon: ClipboardList },
  { id: "interesse", label: "Lista de interesse", icon: Heart },
  { id: "ofertas", label: "Ofertas", icon: Tag },
  { id: "baixados", label: "Arquivos baixados", icon: Archive },
  { id: "suporte", label: "Suporte", icon: Headset },
];

function AccountHeader() {
  const { items } = useCart();
  const session = useSession();
  const { logout } = useAuth();
  const { open } = useAuthLayer();
  const user = session.data?.user;

  return (
    <header className="flex items-center justify-between pt-6">
      <Link to="/" aria-label="Kurio, início">
        <img src={Logo} alt="Kurio" className="h-7 w-auto" />
      </Link>

      <nav className="hidden items-center gap-8 font-mono text-sm text-[#d9c4ae] md:flex">
        <Link to="/" className="hover:text-[#E89B55]">
          Início
        </Link>
        <Link to="/" className="hover:text-[#E89B55]">
          Mercado
        </Link>
        <Link to="/" className="hover:text-[#E89B55]">
          Criadores
        </Link>
        <Link to="/" className="hover:text-[#E89B55]">
          Aprenda
        </Link>
      </nav>

      <div className="flex shrink-0 items-center gap-4">
        <Link
          to="/"
          aria-label="Buscar NFTs"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#d9c4ae] transition hover:bg-[#2b1b14] hover:text-[#E89B55]"
        >
          <Search size={18} />
        </Link>
        <Link
          to="/cart"
          aria-label={`Carrinho, ${items.length} itens`}
          className="relative inline-flex items-center justify-center text-[#d9c4ae] hover:text-[#E89B55]"
        >
          <ShoppingCart size={19} />
          {items.length > 0 && (
            <span className="absolute -right-2.5 -top-2 rounded-full bg-[#D28A4C] px-1 font-mono text-[9px] font-bold text-[#140d0a] leading-4">
              {items.length}
            </span>
          )}
        </Link>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#f5f1eb]">
              {user.displayName}
            </span>
            <button
              type="button"
              onClick={() => void logout.mutateAsync()}
              className="flex h-9 items-center rounded-md border border-[#4b2d22] px-4 font-mono text-xs text-[#d9c4ae] transition hover:border-[#D28A4C] hover:text-[#E89B55]"
            >
              Sair
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => open("dialog")}
            className="flex h-9 items-center rounded-md bg-[#D28A4C] px-4 font-mono text-xs font-bold text-[#140d0a] transition hover:bg-[#e29a63]"
          >
            Entrar
          </button>
        )}
      </div>
    </header>
  );
}

function AccountSidebar({ active }: { active: AccountSection }) {
  const session = useSession();
  const { logout } = useAuth();

  return (
    <aside className={accountSidebarPanel}>
      <h2 className="px-4 pb-4 pt-5 text-lg font-bold text-[#f5f1eb]">
        {session.data?.user ? "Minha conta" : "Meu perfil"}
      </h2>
      <nav aria-label="Seções do perfil">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === active;

          if (!section.to) {
            return (
              <span
                key={section.id}
                aria-disabled
                title="Em breve"
                className={accountSidebarLinkDisabled}
              >
                <Icon size={16} aria-hidden />
                {section.label}
              </span>
            );
          }

          return (
            <Link
              key={section.id}
              to={section.to}
              aria-current={isActive ? "page" : undefined}
              className={isActive ? accountSidebarLinkActive : accountSidebarLink}
            >
              <Icon size={16} aria-hidden />
              {section.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 border-t border-[#4b2d22]">
        {session.data?.user ? (
          <button
            type="button"
            onClick={() => void logout.mutateAsync()}
            className={`${accountSidebarLink} w-full`}
          >
            <LogOut size={16} aria-hidden />
            Sair
          </button>
        ) : (
          <span
            aria-disabled
            title="Entre na sua conta para encerrar a sessão"
            className={accountSidebarLinkDisabled}
          >
            <LogOut size={16} aria-hidden />
            Sair
          </span>
        )}
      </div>
    </aside>
  );
}

function AccountShell({
  active,
  children,
}: {
  active: AccountSection;
  children: ReactNode;
}) {
  return (
    <div className={accountPage}>
      <div className={accountShell}>
        <AccountHeader />
        <div className="mt-11 grid grid-cols-1 items-start gap-7 lg:grid-cols-[310px_minmax(0,1fr)]">
          <AccountSidebar active={active} />
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

export { AccountShell };
export type { AccountSection };