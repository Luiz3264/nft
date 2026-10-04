import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";

import {
  AccountEnsField,
  AccountField,
  AccountInput,
  AccountLinkButton,
  AccountPrimaryButton,
  AccountSelect,
  AccountToggle,
} from "@/components/account/controls";
import { AccountShell } from "@/components/account/shell";
import {
  accountDescription,
  accountFormGridDense,
  accountPrimaryButtonWide,
  accountSectionTitle,
  accountTitle,
} from "@/components/account/styles";
import { useSaveWallet, useSession, useWallets } from "@/api/hooks";
import { useAuthLayer } from "@/components/auth/authLayerContext";
import {
  WALLET_NETWORK_LABELS,
  WALLET_TYPE_LABELS,
  WALLET_TYPES,
  type Wallet,
  type WalletNetwork,
  type WalletType,
} from "@/api/contracts";

type FormState = {
  displayName: string;
  label: string;
  network: WalletNetwork | "";
  profileName: string;
  address: string;
  secondaryAddress: string;
  walletType: WalletType | "";
  referralCode: string;
  email: string;
  ensName: string;
  ensSuffix: string;
};

const emptyForm: FormState = {
  displayName: "",
  label: "Carteira principal",
  network: "",
  profileName: "",
  address: "",
  secondaryAddress: "",
  walletType: "",
  referralCode: "",
  email: "",
  ensName: "",
  ensSuffix: ".eth",
};

const ADDRESS_PATTERN = /^0x[a-f\d]{40}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ENS_PATTERN = /^[a-z0-9-]+$/i;

const networkEntries = Object.entries(WALLET_NETWORK_LABELS) as Array<
  [WalletNetwork, string]
>;

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

function toForm(wallet?: Wallet): FormState {
  if (!wallet) return { ...emptyForm };
  return {
    displayName: wallet.displayName ?? "",
    label: wallet.label,
    network: wallet.network,
    profileName: wallet.profileName ?? "",
    address: wallet.address,
    secondaryAddress: wallet.secondaryAddress ?? "",
    walletType: wallet.walletType ?? "",
    referralCode: wallet.referralCode ?? "",
    email: wallet.email ?? "",
    ensName: wallet.ensName ?? "",
    ensSuffix: ".eth",
  };
}

function validate(form: FormState, prefix: string) {
  const next: Record<string, string> = {};

  if (form.label.trim().length < 2)
    next[`${prefix}label`] = "Use ao menos dois caracteres.";
  if (!form.network) next[`${prefix}network`] = "Selecione uma rede.";
  if (!form.profileName.trim())
    next[`${prefix}profileName`] = "Informe o nome do perfil.";
  if (!ADDRESS_PATTERN.test(form.address.trim()))
    next[`${prefix}address`] = "Informe um endereço hexadecimal válido.";
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim()))
    next[`${prefix}email`] = "Digite um endereço de e-mail válido.";
  if (form.secondaryAddress.trim()) {
    const value = form.secondaryAddress.trim();
    if (!ADDRESS_PATTERN.test(value) && !ENS_PATTERN.test(value))
      next[`${prefix}secondaryAddress`] =
        "Informe um endereço 0x ou um nome ENS.";
  }
  if (form.ensName.trim() && !ENS_PATTERN.test(form.ensName.trim()))
    next[`${prefix}ensName`] = "Informe um nome ENS válido.";

  return next;
}

type FieldProps = {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: string) => void;
  prefix: string;
  errors: Record<string, string>;
};

function WalletFields({ form, update, prefix, errors }: FieldProps) {
  return (
    <>
      <AccountField
        dense
        id={`${prefix}-displayName`}
        label="Nome de exibição"
        error={errors[`${prefix}displayName`]}
      >
        <AccountInput
          id={`${prefix}-displayName`}
          value={form.displayName}
          onChange={(event) => update("displayName", event.target.value)}
          placeholder="Como aparece na Kurio"
        />
      </AccountField>

      <AccountField
        dense
        id={`${prefix}-label`}
        label="Apelido da carteira"
        error={errors[`${prefix}label`]}
      >
        <AccountInput
          id={`${prefix}-label`}
          value={form.label}
          onChange={(event) => update("label", event.target.value)}
          placeholder="Carteira principal"
        />
      </AccountField>

      <AccountField
        dense
        id={`${prefix}-network`}
        label="Rede"
        required
        error={errors[`${prefix}network`]}
      >
        <AccountSelect
          id={`${prefix}-network`}
          value={form.network}
          onChange={(event) =>
            update("network", event.target.value as WalletNetwork)
          }
        >
          <option value="">Selecione uma rede</option>
          {networkEntries.map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </AccountSelect>
      </AccountField>

      <AccountField
        dense
        id={`${prefix}-profileName`}
        label="Nome do perfil"
        required
        error={errors[`${prefix}profileName`]}
      >
        <AccountInput
          id={`${prefix}-profileName`}
          value={form.profileName}
          onChange={(event) => update("profileName", event.target.value)}
          placeholder="seu.perfil"
        />
      </AccountField>

      <AccountField
        dense
        id={`${prefix}-address`}
        label="Endereço da carteira"
        error={errors[`${prefix}address`]}
      >
        <AccountInput
          id={`${prefix}-address`}
          value={form.address}
          onChange={(event) => update("address", event.target.value)}
          placeholder="Endereço 0x da carteira"
        />
      </AccountField>

      <div className="min-w-0">
        <label htmlFor={`${prefix}-secondaryAddress`} className="sr-only">
          ENS ou carteira secundária (opcional)
        </label>
        <AccountInput
          id={`${prefix}-secondaryAddress`}
          value={form.secondaryAddress}
          onChange={(event) => update("secondaryAddress", event.target.value)}
          placeholder="ENS ou carteira secundária (opcional)"
        />
        {errors[`${prefix}secondaryAddress`] && (
          <p role="alert" className="mt-2 text-xs text-[#e0574a]">
            {errors[`${prefix}secondaryAddress`]}
          </p>
        )}
      </div>

      <AccountField
        dense
        id={`${prefix}-walletType`}
        label="Tipo de carteira"
        error={errors[`${prefix}walletType`]}
      >
        <AccountSelect
          id={`${prefix}-walletType`}
          value={form.walletType}
          onChange={(event) =>
            update("walletType", event.target.value as WalletType)
          }
        >
          <option value="">Selecione uma carteira</option>
          {WALLET_TYPES.map((type) => (
            <option key={type} value={type}>
              {WALLET_TYPE_LABELS[type]}
            </option>
          ))}
        </AccountSelect>
      </AccountField>

      <AccountField
        dense
        id={`${prefix}-referralCode`}
        label="Código de indicação"
        error={errors[`${prefix}referralCode`]}
      >
        <AccountInput
          id={`${prefix}-referralCode`}
          value={form.referralCode}
          onChange={(event) => update("referralCode", event.target.value)}
          placeholder="KURIO-0000"
        />
      </AccountField>

      <AccountField
        dense
        id={`${prefix}-email`}
        label="E-mail"
        error={errors[`${prefix}email`]}
      >
        <AccountInput
          id={`${prefix}-email`}
          type="email"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          placeholder="voce@kurio.art"
        />
      </AccountField>

      <AccountField
        dense
        id={`${prefix}-ensName`}
        label="Nome ENS"
        required
        error={errors[`${prefix}ensName`]}
      >
        <AccountEnsField
          id={`${prefix}-ensName`}
          value={form.ensName}
          suffix={form.ensSuffix}
          onValueChange={(value) => update("ensName", value)}
          onSuffixChange={(value) => update("ensSuffix", value)}
          placeholder="seu nome"
        />
      </AccountField>
    </>
  );
}

type FeedbackState = { type: "info" | "error"; message: string } | null;

function Feedback({ feedback }: { feedback: FeedbackState }) {
  if (!feedback) return null;
  return (
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
  );
}

function WalletForms({
  primaryWallet,
  secondaryWallet,
}: {
  primaryWallet?: Wallet;
  secondaryWallet?: Wallet;
}) {
  const saveWallet = useSaveWallet();

  const [primary, setPrimary] = useState<FormState>(() =>
    toForm(primaryWallet),
  );
  const [secondary, setSecondary] = useState<FormState>(() =>
    toForm(secondaryWallet),
  );
  const [showSecondary, setShowSecondary] = useState(() =>
    Boolean(secondaryWallet),
  );
  const [sameAsPrimary, setSameAsPrimary] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const updatePrimary = <K extends keyof FormState>(key: K, value: string) =>
    setPrimary((current) => ({ ...current, [key]: value }));

  const updateSecondary = <K extends keyof FormState>(key: K, value: string) =>
    setSecondary((current) => ({ ...current, [key]: value }));

  const submit = async (
    form: FormState,
    prefix: string,
    isPrimary: boolean,
  ) => {
    const resolved: FormState = {
      ...form,
      address:
        !isPrimary && sameAsPrimary ? primary.address.trim() : form.address.trim(),
    };

    const found = validate(resolved, prefix);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFeedback({ type: "error", message: "Revise os campos destacados." });
      return;
    }

    const existingId = isPrimary ? primaryWallet?.id : secondaryWallet?.id;

    try {
      await saveWallet.mutateAsync({
        ...(existingId ? { id: existingId } : {}),
        address: resolved.address,
        network: form.network as WalletNetwork,
        label: form.label.trim(),
        primary: isPrimary,
        displayName: form.displayName.trim(),
        profileName: form.profileName.trim(),
        ensName: form.ensName.trim(),
        secondaryAddress: form.secondaryAddress.trim(),
        walletType: (form.walletType || undefined) as WalletType | undefined,
        referralCode: form.referralCode.trim(),
        email: form.email.trim(),
      });
      setFeedback({
        type: "info",
        message: isPrimary
          ? "Carteira principal salva."
          : "Carteira secundária salva.",
      });
    } catch (error) {
      setErrors(readFields(error));
      setFeedback({
        type: "error",
        message: readMessage(error, "Não foi possível salvar a carteira."),
      });
    }
  };

  const handlePrimarySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    void submit(primary, "primary", true);
  };

  const handleSecondarySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    void submit(secondary, "secondary", false);
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className={accountTitle}>Carteira principal</h1>
        <AccountLinkButton onClick={() => setShowSecondary(true)}>
          Adicionar
        </AccountLinkButton>
      </div>
      <p className={`mt-2 ${accountDescription}`}>
        Estas carteiras ficam disponíveis no pagamento e para receber NFTs
        comprados.
      </p>

      <form onSubmit={handlePrimarySubmit} noValidate className="mt-9">
        <div className={accountFormGridDense}>
          <WalletFields
            form={primary}
            update={updatePrimary}
            prefix="primary"
            errors={errors}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <AccountPrimaryButton
            type="submit"
            className={accountPrimaryButtonWide}
            disabled={saveWallet.isPending}
          >
            Salvar carteira
          </AccountPrimaryButton>
          <Feedback feedback={feedback} />
        </div>
      </form>

      <div className="mt-9 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className={accountSectionTitle}>Carteira secundária</h2>
          <p className={`mt-3 ${accountDescription}`}>
            {showSecondary
              ? "Preencha os dados da carteira que será usada como alternativa."
              : "Você ainda não adicionou uma carteira secundária."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AccountToggle
            checked={sameAsPrimary}
            onCheckedChange={setSameAsPrimary}
            label="Igual à carteira principal"
          />
          <AccountLinkButton onClick={() => setShowSecondary(true)}>
            Adicionar
          </AccountLinkButton>
        </div>
      </div>

      {showSecondary && (
        <form onSubmit={handleSecondarySubmit} noValidate className="mt-7">
          <div className={accountFormGridDense}>
            <WalletFields
              form={secondary}
              update={updateSecondary}
              prefix="secondary"
              errors={errors}
            />
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <AccountPrimaryButton
              type="submit"
              className={accountPrimaryButtonWide}
              disabled={saveWallet.isPending}
            >
              Salvar carteira secundária
            </AccountPrimaryButton>
          </div>
        </form>
      )}
    </>
  );
}

export default function CarteirasPage() {
  const walletsQuery = useWallets();
  const session = useSession();
  const { open: openAuth } = useAuthLayer();

  if (walletsQuery.isError) {
    return (
      <AccountShell active="carteiras">
        <h1 className={accountTitle}>Carteira principal</h1>
        <div
          role="alert"
          className="mt-8 rounded-[4px] border border-[#4b2d22] bg-[#21130f] p-6"
        >
          <p className={accountDescription}>
            {readMessage(
              walletsQuery.error,
              "Entre na sua conta para gerenciar suas carteiras.",
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
              onClick={() => void walletsQuery.refetch()}
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

  const wallets = walletsQuery.data;
  const primaryWallet = wallets?.find((wallet) => wallet.primary);
  const secondaryWallet = wallets?.find((wallet) => !wallet.primary);

  return (
    <AccountShell active="carteiras">
      {wallets ? (
        <WalletForms
          primaryWallet={primaryWallet}
          secondaryWallet={secondaryWallet}
        />
      ) : (
        <p className={accountDescription}>Carregando suas carteiras…</p>
      )}
    </AccountShell>
  );
}