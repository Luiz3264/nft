import { createContext, useContext } from "react";

export type AuthMode = "login" | "register";
export type AuthVariant = "dialog" | "page";

export type AuthLayerValue = {
  isOpen: boolean;
  mode: AuthMode;
  variant: AuthVariant;
  open: (variant?: AuthVariant) => void;
  close: () => void;
  changeMode: (mode: AuthMode) => void;
};

export const AuthLayerContext = createContext<AuthLayerValue | null>(null);

export function useAuthLayer(): AuthLayerValue {
  const context = useContext(AuthLayerContext);

  if (!context) {
    throw new Error("useAuthLayer must be used inside AuthLayerProvider");
  }

  return context;
}
