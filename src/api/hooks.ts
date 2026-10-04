import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./service";
import { clearToken, readToken, writeToken } from "./token";
import type { Session } from "./contracts";

export const queryKeys = {
  catalog: ["catalog"] as const,
  favorites: ["favorites"] as const,
  cart: ["cart"] as const,
  profile: ["profile"] as const,
  wallets: ["wallets"] as const,
  orders: ["orders"] as const,
  session: ["session"] as const,
};

function isUnauthorized(error: unknown): boolean {
  const status = (error as { response?: { status?: number } } | null)?.response
    ?.status;
  return status === 401 || status === 403;
}

/**
 * Sessão corrente. Só consulta `/auth/session` quando existe token no storage;
 * um 401/403 descarta o token e devolve a app para o estado deslogado.
 */
export function useSession() {
  const query = useQuery({
    queryKey: queryKeys.session,
    queryFn: api.session,
    retry: false,
    enabled: readToken() !== null,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.isError && isUnauthorized(query.error)) clearToken();
  }, [query.error, query.isError]);

  return query;
}

/**
 * Login, cadastro e logout. O token é persistido no cliente nos dois fluxos de
 * entrada, e a troca de identidade invalida os recursos particionados por usuário
 * (favoritos, carrinho, perfil e carteiras).
 */
export function useAuth() {
  const queryClient = useQueryClient();

  const applySession = (session: Session) => {
    writeToken(session.token);
    queryClient.setQueryData(queryKeys.session, session);
    for (const key of [
      queryKeys.favorites,
      queryKeys.profile,
      queryKeys.wallets,
      ["cart-summary"],
    ]) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  };

  const login = useMutation({
    mutationFn: api.login,
    onSuccess: applySession,
  });

  const register = useMutation({
    mutationFn: api.register,
    onSuccess: applySession,
  });

  const logout = useMutation({
    mutationFn: async () => {
      await api.logout().catch(() => undefined);
      clearToken();
      queryClient.clear();
    },
  });

  return { login, register, logout };
}

export function useCatalog() {
  return useQuery({
    queryKey: queryKeys.catalog,
    queryFn: () => api.catalog({ page: 1, pageSize: 50 }),
  });
}

export function useFavorites() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: api.favorites,
  });
  const mutation = useMutation({
    mutationFn: ({ nftId, favorite }: { nftId: number; favorite: boolean }) =>
      api.toggleFavorite(nftId, favorite),
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites });
      const previous =
        queryClient.getQueryData<number[]>(queryKeys.favorites) ?? [];
      queryClient.setQueryData<number[]>(
        queryKeys.favorites,
        favorite
          ? [...new Set([...previous, nftId])]
          : previous.filter((id) => id !== nftId),
      );
      return { previous };
    },
    onError: (_error, _variables, context) =>
      queryClient.setQueryData(queryKeys.favorites, context?.previous ?? []),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites }),
  });
  return {
    ...query,
    favoriteIds: query.data ?? [],
    toggleFavorite: (nftId: number) =>
      mutation.mutate({
        nftId,
        favorite: !(
          queryClient.getQueryData<number[]>(queryKeys.favorites) ?? []
        ).includes(nftId),
      }),
  };
}

export function useMockReset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scenario?: string) => api.resetMocks(scenario),
    onSuccess: () => queryClient.clear(),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: api.profile,
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateProfile,
    onSuccess: (profile) => queryClient.setQueryData(queryKeys.profile, profile),
  });
}

export function useWallets() {
  return useQuery({
    queryKey: queryKeys.wallets,
    queryFn: api.wallets,
    retry: false,
  });
}

export function useSaveWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.saveWallet,
    onSuccess: (wallets) => queryClient.setQueryData(queryKeys.wallets, wallets),
  });
}

/**
 * Detalhe de um pedido. A chave deriva de `queryKeys.orders` para que o
 * `order.updated` do socket invalide a tela de confirmação sem refetch manual.
 */
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: [...queryKeys.orders, orderId],
    queryFn: () => api.order(orderId),
    retry: false,
    enabled: orderId.length > 0,
  });
}
