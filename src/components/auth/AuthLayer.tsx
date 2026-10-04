import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import { Eye, EyeOff, X } from "lucide-react";

import { useAuth, useSession } from "@/api/hooks";
import { api } from "@/api/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AuthLayerContext,
  useAuthLayer,
  type AuthLayerValue,
  type AuthMode,
  type AuthVariant,
} from "./authLayerContext";
import type { User } from "@/api/contracts";

type Feedback = { type: "error" | "info"; message: string } | null;

function readErrorMessage(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message ?? fallback
  );
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Estado e regras compartilhados pelas duas superfícies de autenticação
 * (janela no desktop, página cheia no mobile).
 */
function useAuthForm(mode: AuthMode, changeMode: (mode: AuthMode) => void) {
  const { login, register, logout } = useAuth();
  const session = useSession();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const user = session.data?.user ?? null;
  const isPending = login.isPending || register.isPending || logout.isPending;

  const switchMode = (next: AuthMode) => {
    changeMode(next);
    setFeedback(null);
    setShowPassword(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === "register" && password !== confirmPassword) {
      setFeedback({ type: "error", message: "As senhas não coincidem." });
      return;
    }

    try {
      if (mode === "register") {
        await register.mutateAsync({ email, password, displayName });
        setFeedback({ type: "info", message: "Conta criada com sucesso." });
      } else {
        const created = await login.mutateAsync({ email, password });
        setFeedback({
          type: "info",
          message: `Bem-vindo, ${created.user.displayName}.`,
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: readErrorMessage(
          error,
          "Não foi possível concluir a solicitação.",
        ),
      });
    }
  };

  const requestPasswordReset = async () => {
    if (!email.trim()) {
      setFeedback({
        type: "error",
        message: "Informe seu e-mail para solicitar a recuperação da senha.",
      });
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setFeedback({
        type: "error",
        message: "Digite um endereço de e-mail válido.",
      });
      return;
    }

    try {
      const result = await api.requestPasswordReset(email);
      setFeedback({ type: "info", message: result.message });
    } catch (error) {
      setFeedback({
        type: "error",
        message: readErrorMessage(
          error,
          "Não foi possível solicitar a recuperação.",
        ),
      });
    }
  };

  const signOut = async () => {
    await logout.mutateAsync();
    setFeedback({ type: "info", message: "Sessão encerrada." });
  };

  const notice = (message: string) =>
    setFeedback({ type: "info", message });

  return {
    user,
    isPending,
    feedback,
    displayName,
    email,
    password,
    confirmPassword,
    showPassword,
    setDisplayName,
    setEmail,
    setPassword,
    setConfirmPassword,
    toggleShowPassword: () => setShowPassword((shown) => !shown),
    switchMode,
    submit,
    requestPasswordReset,
    signOut,
    notice,
  };
}

function AuthenticatedPanel({
  user,
  pending,
  onSignOut,
  className,
}: {
  user: User;
  pending: boolean;
  onSignOut: () => void;
  className?: string;
}) {
  return (
    <div
      data-testid="auth-session"
      className={
        className ??
        "rounded-lg border border-[#4b2d22] bg-[#211610] px-4 py-3 text-left"
      }
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#c8aa80]">
        Sessão ativa
      </p>
      <p className="mt-1 font-mono text-sm font-bold text-[#f5f1eb]">
        {user.displayName}
      </p>
      <p className="font-mono text-[11px] text-[#c8aa80]">{user.email}</p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <Link
          to="/perfil"
          className="font-mono text-[12px] text-[#E89B55] hover:text-[#efa45f]"
        >
          Meu perfil
        </Link>
        <Link
          to="/carteiras"
          className="font-mono text-[12px] text-[#E89B55] hover:text-[#efa45f]"
        >
          Carteiras
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          disabled={pending}
          className="font-mono text-[12px] text-[#c8aa80] underline underline-offset-4 hover:text-[#f5f1eb] disabled:opacity-60"
        >
          Sair
        </button>
      </div>
    </div>
  );
}

function OAuthButtons({
  onUnavailable,
  className,
}: {
  onUnavailable: (provider: "Google" | "Facebook") => void;
  className?: string;
}) {
  const base =
    className ??
    "flex h-10 w-full items-center justify-center gap-3 rounded-[6px] border border-[#4b2d22] font-mono text-[13px] text-[#d2b78f] transition hover:border-[#D28A4C] hover:bg-[#2b1b14]";

  return (
    <>
      <button
        type="button"
        onClick={() => onUnavailable("Google")}
        className={base}
      >
        <span aria-hidden="true" className="font-sans text-[18px] font-bold text-[#4285f4]">
          G
        </span>
        Continuar com Google
      </button>
      <button
        type="button"
        onClick={() => onUnavailable("Facebook")}
        className={base}
      >
        <span aria-hidden="true" className="font-sans text-[18px] font-bold text-[#4267B2]">
          f
        </span>
        Continuar com Facebook
      </button>
    </>
  );
}

function AuthDialog({
  mode,
  changeMode,
  onClose,
}: {
  mode: AuthMode;
  changeMode: (mode: AuthMode) => void;
  onClose: () => void;
}) {
  const form = useAuthForm(mode, changeMode);
  const registering = mode === "register";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        className="relative max-h-[calc(100vh-32px)] min-h-147.5 w-full max-w-125 overflow-y-auto border-b-10 border-[#D28A4C] bg-[#241612] px-8 pb-10 pt-11 sm:px-10"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Fechar janela de autenticação"
          onClick={onClose}
          className="absolute right-5 top-4 text-[#D28A4C] transition hover:text-[#f3b477]"
        >
          <X size={19} />
        </button>

        <div className="mx-auto w-full max-w-85 text-center">
          <div
            id="auth-dialog-title"
            className="mb-8 flex items-center justify-center gap-2 font-mono text-[20px] font-bold"
          >
            <button
              type="button"
              aria-pressed={!registering}
              onClick={() => form.switchMode("login")}
              className={
                registering
                  ? "text-[#f5f1eb] hover:text-[#E89B55]"
                  : "text-[#E89B55]"
              }
            >
              Entrar
            </button>
            <span className="font-normal text-[#F0805F]">|</span>
            <button
              type="button"
              aria-pressed={registering}
              onClick={() => form.switchMode("register")}
              className={
                registering
                  ? "text-[#E89B55]"
                  : "text-[#f5f1eb] hover:text-[#E89B55]"
              }
            >
              Criar conta
            </button>
          </div>

          <p className="mb-5 font-mono text-[13px] leading-5 text-[#f5f1eb]">
            {registering
              ? "Crie seu perfil de colecionador e conecte uma carteira quando quiser."
              : "Entre para gerenciar sua carteira, coleção e perfil de criador."}
          </p>

          {form.user && (
            <div className="mb-5">
              <AuthenticatedPanel
                user={form.user}
                pending={form.isPending}
                onSignOut={() => void form.signOut()}
              />
            </div>
          )}

          <form onSubmit={(event) => void form.submit(event)} className="space-y-3 text-left">
            {registering && (
              <Input
                type="text"
                aria-label="Nome de usuário"
                autoComplete="name"
                placeholder="Nome de usuário"
                value={form.displayName}
                onChange={(event) => form.setDisplayName(event.target.value)}
                required
                className="h-10 border-[#4b2d22] bg-transparent px-4 font-mono text-[14px] text-[#f5f1eb] placeholder:text-[#b38f63] focus-visible:border-[#D28A4C] focus-visible:ring-0"
              />
            )}
            <Input
              type="email"
              aria-label="E-mail"
              autoComplete="email"
              placeholder={registering ? "Digite seu e-mail" : "contato@email.com"}
              value={form.email}
              onChange={(event) => form.setEmail(event.target.value)}
              required
              className="h-10 border-[#4b2d22] bg-transparent px-4 font-mono text-[14px] text-[#f5f1eb] placeholder:text-[#b38f63] focus-visible:border-[#D28A4C] focus-visible:ring-0"
            />

            <div className="relative">
              <Input
                type={form.showPassword ? "text" : "password"}
                aria-label="Senha"
                autoComplete={registering ? "new-password" : "current-password"}
                placeholder={registering ? "Senha" : "••••••••••••"}
                value={form.password}
                onChange={(event) => form.setPassword(event.target.value)}
                required
                minLength={8}
                className={`h-10 bg-transparent px-4 pr-12 font-mono text-[14px] text-[#f5f1eb] focus-visible:ring-0 ${
                  registering
                    ? "border-[#4b2d22] placeholder:text-[#b38f63] focus-visible:border-[#D28A4C]"
                    : "border-[#D28A4C] placeholder:text-[#f5f1eb] focus-visible:border-[#f0aa66]"
                }`}
              />
              <button
                type="button"
                aria-label={form.showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={form.showPassword}
                onClick={form.toggleShowPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c5a36f] hover:text-[#f0aa66]"
              >
                {form.showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {registering ? (
              <Input
                type={form.showPassword ? "text" : "password"}
                aria-label="Confirmar senha"
                autoComplete="new-password"
                placeholder="Confirme sua senha"
                value={form.confirmPassword}
                onChange={(event) => form.setConfirmPassword(event.target.value)}
                required
                minLength={8}
                className="h-10 border-[#4b2d22] bg-transparent px-4 font-mono text-[14px] text-[#f5f1eb] placeholder:text-[#b38f63] focus-visible:border-[#D28A4C] focus-visible:ring-0"
              />
            ) : (
              <div className="-mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => void form.requestPasswordReset()}
                  className="font-mono text-[13px] text-[#E89B55] hover:text-[#f3b477]"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {form.feedback && (
              <p
                role="status"
                className={`rounded-md px-3 py-2 font-mono text-xs leading-5 ${
                  form.feedback.type === "error"
                    ? "bg-red-950/40 text-red-200"
                    : "bg-[#352419] text-[#e8bc87]"
                }`}
              >
                {form.feedback.message}
              </p>
            )}

            <Button
              type="submit"
              disabled={form.isPending}
              className={`${
                registering ? "mt-5" : "mt-1"
              } h-11 w-full rounded-[6px] bg-[#D28A4C] font-mono text-[16px] font-bold text-[#140d0a] hover:bg-[#e29a63]`}
            >
              {registering ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 font-mono text-[13px] text-[#f5f1eb]">
            <span className="h-px flex-1 bg-[#4b2d22]" />
            Ou continue com
            <span className="h-px flex-1 bg-[#4b2d22]" />
          </div>

          <div className="space-y-3">
            <OAuthButtons
              onUnavailable={(provider) =>
                form.notice(
                  `O acesso com ${provider} ficará disponível após configurar a autenticação OAuth.`,
                )
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthPage({
  mode,
  changeMode,
  onClose,
}: {
  mode: AuthMode;
  changeMode: (mode: AuthMode) => void;
  onClose: () => void;
}) {
  const form = useAuthForm(mode, changeMode);
  const registering = mode === "register";

  return (
    <main className="relative z-50 min-h-dvh bg-[#140d0a] px-7 pb-10 text-[#f5f1eb]">
      <div className="mx-auto w-full max-w-107.5 pt-[15vh]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Voltar à loja"
          className="mx-auto block font-mono text-[32px] font-black tracking-[0.08em] text-[#f5f1eb]"
        >
          KURIO
        </button>

        <h1 className="mt-19.5 text-center font-mono text-[18px] font-bold tracking-wide text-[#f5f1eb]">
          {registering ? "Criar perfil de colecionador" : "Entrar"}
        </h1>

        {form.user && (
          <div className="mt-8">
            <AuthenticatedPanel
              user={form.user}
              pending={form.isPending}
              onSignOut={() => void form.signOut()}
              className="rounded-[12px] border border-[#4b2d22] bg-[#291a14] px-4 py-3"
            />
          </div>
        )}

        <form
          onSubmit={(event) => void form.submit(event)}
          className="mt-8 space-y-3"
        >
          {registering && (
            <input
              type="text"
              aria-label="Nome de usuário"
              autoComplete="username"
              placeholder="Nome de usuário"
              value={form.displayName}
              onChange={(event) => form.setDisplayName(event.target.value)}
              required
              className="h-12.5 w-full rounded-[11px] border border-[#4b2d22] bg-transparent px-4 font-mono text-[14px] text-[#f5f1eb] outline-none placeholder:text-[#b38f63] focus:border-[#d28a4c]"
            />
          )}
          <input
            type="email"
            aria-label="E-mail"
            autoComplete="email"
            placeholder={registering ? "Digite seu e-mail" : "contato@email.com"}
            value={form.email}
            onChange={(event) => form.setEmail(event.target.value)}
            required
            className="h-12.5 w-full rounded-[11px] border border-[#4b2d22] bg-transparent px-4 font-mono text-[14px] text-[#f5f1eb] outline-none placeholder:text-[#b38f63] focus:border-[#d28a4c]"
          />

          <div className="relative">
            <input
              type={form.showPassword ? "text" : "password"}
              aria-label="Senha"
              autoComplete={registering ? "new-password" : "current-password"}
              placeholder={registering ? "Senha" : "••••••••••••"}
              value={form.password}
              onChange={(event) => form.setPassword(event.target.value)}
              required
              minLength={8}
              className="h-12.5 w-full rounded-[11px] border border-[#4b2d22] bg-transparent px-4 pr-12 font-mono text-[14px] text-[#f5f1eb] outline-none placeholder:text-[#b38f63] focus:border-[#d28a4c]"
            />
            <button
              type="button"
              aria-label={form.showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={form.showPassword}
              onClick={form.toggleShowPassword}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9c7149]"
            >
              {form.showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {registering ? (
            <div className="relative">
              <input
                type={form.showPassword ? "text" : "password"}
                aria-label="Confirmar senha"
                autoComplete="new-password"
                placeholder="Confirmar sua senha"
                value={form.confirmPassword}
                onChange={(event) => form.setConfirmPassword(event.target.value)}
                required
                minLength={8}
                className="h-12.5 w-full rounded-[11px] border border-[#4b2d22] bg-transparent px-4 pr-12 font-mono text-[14px] text-[#f5f1eb] outline-none placeholder:text-[#b38f63] focus:border-[#d28a4c]"
              />
              <button
                type="button"
                aria-label={form.showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={form.showPassword}
                onClick={form.toggleShowPassword}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9c7149]"
              >
                {form.showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          ) : (
            <div className="flex justify-end pr-1 pt-0.5">
              <button
                type="button"
                onClick={() => void form.requestPasswordReset()}
                className="font-mono text-[14px] text-[#df9853]"
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          {form.feedback && (
            <p
              role="status"
              className="rounded-lg bg-[#2e1d15] px-3 py-2 font-mono text-xs leading-5 text-[#e4bc8c]"
            >
              {form.feedback.message}
            </p>
          )}

          <button
            type="submit"
            disabled={form.isPending}
            className={`${
              registering ? "mt-7" : "mt-8"
            } h-15 w-full rounded-[11px] bg-[#d28a4c] font-mono text-[16px] font-bold text-[#170f0b] transition hover:bg-[#e29a63] disabled:opacity-60`}
          >
            {registering ? "Criar perfil" : "Entrar"}
          </button>
        </form>

        <div className="my-9 flex items-center gap-3 font-mono text-[13px] text-[#f5f1eb]">
          <span className="h-px flex-1 bg-[#4b2d22]" />
          Ou continue com
          <span className="h-px flex-1 bg-[#4b2d22]" />
        </div>

        <div className="space-y-4">
          <OAuthButtons
            onUnavailable={(provider) =>
              form.notice(
                `O acesso com ${provider} ficará disponível após configurar a autenticação OAuth.`,
              )
            }
            className="flex h-10.25 w-full items-center justify-center gap-3 rounded-[7px] border border-[#4b2d22] font-mono text-[13px] text-[#cfb28c] hover:bg-[#211610]"
          />
        </div>

        <p className="mt-10 pb-6 text-center font-mono text-[14px] text-[#c8aa80]">
          {registering ? "Já tem uma conta?" : "Novo na Kurio?"}{" "}
          <button
            type="button"
            onClick={() => form.switchMode(registering ? "login" : "register")}
            className="text-[#d8b990]"
          >
            {registering ? "Entre" : "Crie uma conta"}
          </button>
        </p>
      </div>
    </main>
  );
}

export function AuthLayerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [variant, setVariant] = useState<AuthVariant>("dialog");
  const [mode, setMode] = useState<AuthMode>("login");

  const open = useCallback((nextVariant: AuthVariant = "dialog") => {
    setVariant(nextVariant);
    setMode("login");
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<AuthLayerValue>(
    () => ({ isOpen, mode, variant, open, close, changeMode: setMode }),
    [close, isOpen, mode, open, variant],
  );

  return (
    <AuthLayerContext.Provider value={value}>{children}</AuthLayerContext.Provider>
  );
}

export function AuthLayer() {
  const { isOpen, variant, mode, close, changeMode } = useAuthLayer();

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [close, isOpen]);

  if (!isOpen) return null;

  return variant === "dialog" ? (
    <AuthDialog mode={mode} changeMode={changeMode} onClose={close} />
  ) : (
    <AuthPage mode={mode} changeMode={changeMode} onClose={close} />
  );
}
