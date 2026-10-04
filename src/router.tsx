import {
  createRootRoute,
  createRoute,
  createRouter,
  useParams,
} from "@tanstack/react-router";

import App from "./App";
import AppDesktop from "./AppDesktop";
import CartPage from "./routes/cart";
import CarteirasPage from "./routes/carteiras";
import PerfilPage from "./routes/perfil";
import PedidoConfirmadoPage from "./routes/pedido-confirmado";
import RootLayout from "./routes/root-layout";

function NftDetailRoute() {
  const params = useParams({ strict: false });
  const nftId = Number(params.nftId);

  return <AppDesktop initialNftId={nftId} />;
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: CartPage,
});

const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/nft/$nftId",
  component: NftDetailRoute,
});

const perfilRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/perfil",
  component: PerfilPage,
});

const carteirasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/carteiras",
  component: CarteirasPage,
});

const pedidoConfirmadoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pedido/$orderId",
  component: PedidoConfirmadoPage,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  cartRoute,
  nftDetailRoute,
  perfilRoute,
  carteirasRoute,
  pedidoConfirmadoRoute,
]);

export const router = createRouter({ routeTree });

export type RouterType = typeof router;
