import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";

import "./index.css";
import { CartProvider } from "./lib/cart";
import { router } from "./router";
import { queryClient } from "./api/queryClient";
import { RealtimeBridge } from "./api/RealtimeBridge";
import { AuthLayerProvider } from "./components/auth/AuthLayer";
import { worker } from "./mocks/browser";
import { mockStore, selectInitialScenario } from "./mocks/state";

async function startApp() {
  if (import.meta.env.VITE_API_MOCKS === "true") {
    const scenario = selectInitialScenario();
    if (scenario !== mockStore.scenario) mockStore.reset(scenario);
    await worker.start({ onUnhandledRequest: "bypass", quiet: true });
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthLayerProvider>
          <CartProvider>
            <RealtimeBridge />
            <RouterProvider router={router} />
          </CartProvider>
        </AuthLayerProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

void startApp();
