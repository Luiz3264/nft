import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";

import {
  AccountAvatar,
  AccountEnsField,
  AccountField,
  AccountInput,
  AccountPasswordInput,
  AccountPrimaryButton,
} from "@/components/account/controls";
import { AccountShell } from "@/components/account/shell";
import {
  accountDescription,
  accountFormGrid,
  accountPrimaryButtonWide,
  accountSectionTitle,
  accountTitle,
} from "@/components/account/styles";
import { useProfile, useSession, useUpdateProfile } from "@/api/hooks";
import { useAuthLayer } from "@/components/auth/authLayerContext";
import { api } from "@/api/service";
import type { Profile } from "@/api/contracts";

type FormState = {
  displayName: string;
  username: string;
  email: string;
  ensName: string;
  ensSuffix: string;
  walletLabel: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9_.-]{3,30}$/i;
const ENS_PATTERN = /^[a-z0-9-]+$/i;

function toForm(profile: Profile): FormState {
  return {
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    ensName: profile.ensName,
    ensSuffix: ".eth",
    walletLabel: profile.walletLabel,
  };
}

function readMessage(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message ?? fallback
  );
}

function readFields(error: unknown) {
  return (
    (error as { response?: { data?: { fields?: Record<string, string> } } })
      .response?.data?.fields ?? {}
  );
}

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function PerfilForm({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile();

  const [form, setForm] = useState<FormState>(() => toForm(profile));
  const [avatar, setAvatar] = useState<string | null>(profile.avatarUrl);
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{
    type: "info" | "error";
    message: string;
  } | null>(null);

  const update = <K extends keyof FormState>(key: K, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};

    if (form.displayName.trim().length < 2)
      next.displayName = "Use ao menos dois caracteres.";
    if (!EMAIL_PATTERN.test(form.email.trim()))
      next.email = "Digite um endereço de e-mail válido.";
    if (!ENS_PATTERN.test(form.ensName.trim()))
      next.ensName = "Informe um nome ENS válido.";
    if (form.walletLabel.trim().length < 2)
      next.walletLabel = "Use ao menos dois caracteres.";
    if (form.username.trim() && !USERNAME_PATTERN.test(form.username.trim()))
      next.username =
        "Use de três a trinta caracteres: letras, números, ponto, hífen ou sublinhado.";

    const touchesPassword = Object.values(passwords).some(Boolean);
    if (touchesPassword) {
      if (!passwords.current) next.currentPassword = "Informe a senha atual.";
      if (passwords.next.length < 8)
        next.newPassword = "Use ao menos oito caracteres.";
      else if (passwords.next !== passwords.confirm)
        next.confirmPassword = "As senhas não coincidem.";
    }

    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFeedback({
        type: "error",
        message: "Revise os campos destacados.",
      });
      return;
    }

    try {
      await updateProfile.mutateAsync({
        displayName: form.displayName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        ensName: form.ensName.trim(),
        walletLabel: form.walletLabel.trim(),
        avatarUrl: avatar,
      });

      if (Object.values(passwords).some(Boolean)) {
        await api.changePassword({
          currentPassword: passwords.current,
          newPassword: passwords.next,
        });
        setPasswords({ current: "", next: "", confirm: "" });
      }

      setFeedback({
        type: "info",
        message: "Perfil atualizado com sucesso.",
      });
    } catch (error) {
      setErrors(readFields(error));
      setFeedback({
        type: "error",
        message: readMessage(error, "Não foi possível salvar o perfil."),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className={accountFormGrid}>
        <AccountField
          id="displayName"
          label="Nome de exibição"
          error={errors.displayName}
        >
          <AccountInput
            id="displayName"
            value={form.displayName}
            onChange={(event) => update("displayName", event.target.value)}
            placeholder="Como você aparece na Kurio"
          />
        </AccountField>

        <AccountField id="username" label="Nome de usuário" error={errors.username}>
          <AccountInput
            id="username"
            value={form.username}
            onChange={(event) => update("username", event.target.value)}
            placeholder="seu.usuario"
          />
        </AccountField>

        <AccountField id="email" label="E-mail" error={errors.email}>
          <AccountInput
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="voce@kurio.art"
          />
        </AccountField>

        <AccountField id="ensName" label="Nome ENS" required error={errors.ensName}>
          <AccountEnsField
            id="ensName"
            value={form.ensName}
            suffix={form.ensSuffix}
            onValueChange={(value) => update("ensName", value)}
            onSuffixChange={(value) => update("ensSuffix", value)}
            placeholder="seu nome"
          />
        </AccountField>

        <AccountField
          id="walletLabel"
          label="Apelido da carteira"
          error={errors.walletLabel}
        >
          <AccountInput
            id="walletLabel"
            value={form.walletLabel}
            onChange={(event) => update("walletLabel", event.target.value)}
            placeholder="Carteira principal"
          />
        </AccountField>

        <div className="min-w-0">
          <span className="block text-sm font-medium text-[#f5f1eb]">
            Avatar
          </span>
          <div className="mt-4">
            <AccountAvatar
              src={avatar}
              onPick={(file) => {
                void readImage(file)
                  .then(setAvatar)
                  .catch(() =>
                    setFeedback({
                      type: "error",
                      message: "Não foi possível carregar a imagem.",
                    }),
                  );
              }}
              onRemove={() => setAvatar(null)}
            />
          </div>
        </div>
      </div>

      <h2 className={`mt-9 ${accountSectionTitle}`}>Alterar senha</h2>

      <div className="mt-6 max-w-[417px] space-y-4">
        <AccountField
          id="currentPassword"
          label="Senha atual"
          error={errors.currentPassword}
        >
          <AccountPasswordInput
            id="currentPassword"
            autoComplete="current-password"
            value={passwords.current}
            onChange={(value) =>
              setPasswords((current) => ({ ...current, current: value }))
            }
          />
        </AccountField>

        <AccountField
          id="newPassword"
          label="Nova senha"
          error={errors.newPassword}
        >
          <AccountPasswordInput
            id="newPassword"
            autoComplete="new-password"
            value={passwords.next}
            onChange={(value) =>
              setPasswords((current) => ({ ...current, next: value }))
            }
          />
        </AccountField>

        <AccountField
          id="confirmPassword"
          label="Confirmar nova senha"
          error={errors.confirmPassword}
        >
          <AccountPasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            value={passwords.confirm}
            onChange={(value) =>
              setPasswords((current) => ({ ...current, confirm: value }))
            }
          />
        </AccountField>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <AccountPrimaryButton
          type="submit"
          className={accountPrimaryButtonWide}
          disabled={updateProfile.isPending}
        >
          Salvar
        </AccountPrimaryButton>
        {feedback && (
          <p
            role="status"
            className={
              feedback.type === "error"
                ? "text-sm text-[#e0574a]"
                : "text-sm text-[#C8A77F]"
            }
          >
            {feedback.message}
          </p>
        )}
      </div>
    </form>
  );
}

export default function PerfilPage() {
  const profileQuery = useProfile();
  const session = useSession();
  const { open: openAuth } = useAuthLayer();

  if (profileQuery.isError) {
    return (
      <AccountShell active="perfil">
        <h1 className={accountTitle}>Perfil do colecionador</h1>
        <div
          role="alert"
          className="mt-8 rounded-[4px] border border-[#4b2d22] bg-[#21130f] p-6"
        >
          <p className={accountDescription}>
            {readMessage(
              profileQuery.error,
              "Entre na sua conta para gerenciar os dados do perfil.",
            )}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {!session.data?.user && (
              <button
                type="button"
                onClick={() => openAuth("dialog")}
                className="rounded-[4px] bg-[#D28A4C] px-4 py-2 font-mono text-xs font-bold text-[#140d0a] transition hover:bg-[#e29a63]"
              >
                Entrar
              </button>
            )}
            <button
              type="button"
              onClick={() => void profileQuery.refetch()}
              className="font-mono text-sm text-[#E89B55] hover:text-[#efa45f]"
            >
              Tentar novamente
            </button>
            <Link
              to="/"
              className="font-mono text-sm text-[#E89B55] hover:text-[#efa45f]"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </AccountShell>
    );
  }

  const profile = profileQuery.data;

  return (
    <AccountShell active="perfil">
      <h1 className={accountTitle}>Perfil do colecionador</h1>
      <div className="mt-8">
        {profile ? (
          <PerfilForm profile={profile} />
        ) : (
          <p className={accountDescription}>Carregando dados do perfil…</p>
        )}
      </div>
    </AccountShell>
  );
}