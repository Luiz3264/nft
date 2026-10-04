import { useId, useState, type ReactNode } from "react";
import { ChevronDown, Eye, EyeOff, User } from "lucide-react";
import { cn } from "cn";

import {
  accountControl,
  accountControlCompact,
  accountLabel,
  accountLinkButton,
  accountMutedButton,
  accountPrimaryButton,
  accountPrimaryButtonNarrow,
  accountRequired,
} from "./styles";

function AccountField({
  id,
  label,
  required,
  error,
  dense,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  dense?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className={accountLabel}>
        {label}
        {required && <span className={accountRequired}>*</span>}
      </label>
      <div className={dense ? "mt-1.5" : "mt-4"}>{children}</div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-[#e0574a]">
          {error}
        </p>
      )}
    </div>
  );
}

function AccountInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return <input data-slot="account-input" className={cn(accountControl, className)} {...props} />;
}

function AccountSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="account-select"
        className={cn(
          accountControl,
          "appearance-none pr-10",
          !props.value && !props.defaultValue
            ? "text-[#928174]"
            : "text-[#f5f1eb]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        size={15}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#C8A77F]"
      />
    </div>
  );
}

function AccountPasswordInput({
  id,
  value,
  onChange,
  placeholder,
  invalid,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  autoComplete?: string;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={revealed ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(accountControl, "pr-11")}
      />
      <button
        type="button"
        aria-label={revealed ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={revealed}
        onClick={() => setRevealed((current) => !current)}
        className="absolute right-4 top-1/2 flex -translate-y-1/2 text-[#a78965] transition-colors hover:text-[#C8A77F]"
      >
        {revealed ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

const ensSuffixes = [
  { value: ".eth", label: ".eth" },
  { value: ".lens", label: ".lens" },
];

function AccountEnsField({
  id,
  value,
  suffix,
  onValueChange,
  onSuffixChange,
  invalid,
  placeholder,
}: {
  id: string;
  value: string;
  suffix: string;
  onValueChange: (value: string) => void;
  onSuffixChange: (value: string) => void;
  invalid?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="relative w-[76px] shrink-0">
        <select
          aria-label="Sufixo ENS"
          value={suffix}
          onChange={(event) => onSuffixChange(event.target.value)}
          className={cn(accountControlCompact, "w-full appearance-none pr-7")}
        >
          {ensSuffixes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          size={13}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#C8A77F]"
        />
      </div>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(accountControl, "min-w-0 flex-1")}
      />
    </div>
  );
}

function AccountPrimaryButton({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button data-slot="account-primary-button" className={cn(accountPrimaryButton, className)} {...props} />
  );
}

function AccountLinkButton({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return <button type="button" className={cn(accountLinkButton, className)} {...props} />;
}

function AccountMutedButton({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return <button type="button" className={cn(accountMutedButton, className)} {...props} />;
}

function AccountToggle({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  const id = useId();

  return (
    <div className="flex items-center gap-2.5">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          checked
            ? "border-[#D28A4C] bg-[#D28A4C]"
            : "border-[#f5f1eb] bg-transparent hover:border-[#C8A77F]",
        )}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-[#140d0a]" />}
      </button>
      <span className="text-sm text-[#f5f1eb]">{label}</span>
    </div>
  );
}

function AccountAvatar({
  src,
  onPick,
  onRemove,
}: {
  src: string | null;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const inputId = useId();

  return (
    <div className="flex items-center gap-6 pt-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2b1c16] text-[#f5f1eb]">
        {src ? (
          <img src={src} alt="Avatar do colecionador" className="h-full w-full object-cover" />
        ) : (
          <User size={20} />
        )}
      </span>
      <div className="flex items-center gap-5">
        <AccountPrimaryButton
          type="button"
          className={accountPrimaryButtonNarrow}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          Alterar
        </AccountPrimaryButton>
        <AccountMutedButton type="button" onClick={onRemove} disabled={!src}>
          Remover
        </AccountMutedButton>
      </div>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}

export {
  AccountAvatar,
  AccountEnsField,
  AccountField,
  AccountInput,
  AccountLinkButton,
  AccountMutedButton,
  AccountPasswordInput,
  AccountPrimaryButton,
  AccountSelect,
  AccountToggle,
};