import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/service";
import { queryClient } from "@/api/queryClient";
import { useSession } from "@/api/hooks";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
  discount: number;
  fee: number;
  errorMessage: string;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const session = useSession();
  const identity = session.data?.user.id ?? null;
  const summary = useQuery({
    queryKey: ["cart-summary"],
    queryFn: api.cartSummary,
  });

  const syncCart = (cart: Awaited<ReturnType<typeof api.cart>>) => {
    setItems(
      cart.items.map((item) => ({
        id: item.nftId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    );
    setErrorMessage("");
    void queryClient.invalidateQueries({ queryKey: ["cart-summary"] });
  };

  const handleCartError = (error: unknown) => {
    setErrorMessage(
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ?? "Não foi possível atualizar o carrinho. Tente novamente.",
    );
  };

  // Recarrega o carrinho na montagem e a cada troca de identidade
  // (convidado ⇄ usuário logado), porque o servidor particiona por usuário.
  useEffect(() => {
    let active = true;

    void api
      .cart()
      .then((cart) => {
        if (active) syncCart(cart);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [identity]);

  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    setErrorMessage("");
    void api
      .addCartItem(item.id, quantity)
      .then(syncCart)
      .catch(handleCartError);
  };

  const removeItem = (id: number) => {
    setErrorMessage("");
    void api.removeCartItem(id).then(syncCart).catch(handleCartError);
  };

  const updateQuantity = (id: number, quantity: number) => {
    setErrorMessage("");
    void api
      .updateCartItem(id, Math.max(0, quantity))
      .then(syncCart)
      .catch(handleCartError);
  };

  const clearCart = () => {
    void Promise.all(items.map((item) => api.removeCartItem(item.id)))
      .then((carts) => {
        if (carts[0]) syncCart(carts[0]);
      })
      .catch(handleCartError);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total: summary.data?.subtotal ?? 0,
        discount: summary.data?.discount ?? 0,
        fee: summary.data?.networkFee ?? 0,
        errorMessage:
          errorMessage ||
          (summary.isError
            ? "Não foi possível carregar o resumo do carrinho."
            : ""),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }

  return context;
}
