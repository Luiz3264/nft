import { expect, test, type Page } from "@playwright/test";

const CREDENTIALS = {
  email: "ada@example.test",
  password: "demo-pass-123",
};

async function waitForMockWorker(page: Page) {
  await page.goto("/?mockScenario=success");
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), {
      timeout: 15_000,
    })
    .toBe(true);
  await page.evaluate(() =>
    fetch("/api/mock/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: "success" }),
    }).then((response) => response.json()),
  );
}

async function signIn(page: Page) {
  await page.evaluate(
    async ({ email, password }) => {
      const session = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).then((response) => response.json());
      window.localStorage.setItem("kurio.mock.token", session.token);
    },
    CREDENTIALS,
  );
}

async function createOrder(page: Page) {
  return page.evaluate(async () => {
    const token = window.localStorage.getItem("kurio.mock.token");
    const headers = { Authorization: `Bearer ${token}` };
    const wallets = await fetch("/api/wallets", { headers }).then((response) =>
      response.json(),
    );
    const wallet = wallets.find((entry: { primary: boolean }) => entry.primary) ?? wallets[0];
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ walletId: wallet.id, items: [{ nftId: 1, quantity: 1 }] }),
    });
    return { status: response.status, order: await response.json() };
  });
}

test.describe("confirmação de pedido", () => {
  test("exibe o resumo do pedido confirmado para a sessão autenticada", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await waitForMockWorker(page);
    await signIn(page);

    const created = await createOrder(page);
    expect(created.status).toBe(201);
    expect(created.order.status).toBe("confirmed");

    await page.goto(`/pedido/${created.order.id}`);

    const card = page.getByTestId("desktop-order-confirmation");
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("data-status", "confirmed");
    await expect(card.getByRole("heading", { name: "Pedido confirmado" })).toBeVisible();
    await expect(card).toContainText(created.order.id);
    await expect(card).toContainText(`${created.order.total.toFixed(3)} ETH`);
    await expect(card).toContainText(created.order.transactionReference);
  });

  test("renderiza o cartão mobile com o botão de retorno ao carrinho", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForMockWorker(page);
    await signIn(page);
    const created = await createOrder(page);

    await page.goto(`/pedido/${created.order.id}`);

    const card = page.getByTestId("mobile-order-confirmation");
    await expect(card).toBeVisible();
    await expect(card).toContainText(created.order.id);
    await expect(
      page.getByRole("link", { name: "Voltar ao carrinho" }),
    ).toBeVisible();
  });

  test("protege a tela sem sessão e reaproveita o pedido criado", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await waitForMockWorker(page);
    await signIn(page);
    const created = await createOrder(page);

    await page.evaluate(() =>
      window.localStorage.removeItem("kurio.mock.token"),
    );
    await page.goto(`/pedido/${created.order.id}`);
    await expect(
      page.getByRole("heading", { name: "Pedido protegido" }),
    ).toBeVisible();

    await signIn(page);
    await page.goto(`/pedido/${created.order.id}`);
    await expect(page.getByTestId("desktop-order-confirmation")).toContainText(
      created.order.id,
    );
  });
});
