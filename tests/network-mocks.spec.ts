import { expect, test, type Page } from "@playwright/test";

/**
 * O service worker do MSW só assume o controle da página depois do `load`, então
 * um `fetch` imediato cairia no Vite e devolveria o index.html em vez do mock.
 */
async function waitForMockWorker(page: Page) {
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), {
      timeout: 15_000,
    })
    .toBe(true);
}

test.describe("shared network mock contracts", () => {
  test("catalog supports filtering, pagination, empty results, and configured HTTP failures", async ({
    page,
  }) => {
    await page.goto("/?mockScenario=success");
    await waitForMockWorker(page);
    const results = await page.evaluate(async () => {
      const first = await fetch(
        "/api/nfts?page=1&pageSize=3&category=Arte%20digital",
      ).then((response) => response.json());
      await fetch("/api/mock/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: "empty" }),
      });
      const empty = await fetch("/api/nfts?page=1&pageSize=3").then(
        (response) => response.json(),
      );
      await fetch("/api/mock/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: "http-4xx" }),
      });
      const clientError = await fetch("/api/nfts").then(
        (response) => response.status,
      );
      await fetch("/api/mock/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: "http-5xx" }),
      });
      const serverError = await fetch("/api/nfts").then(
        (response) => response.status,
      );
      return { first, empty, clientError, serverError };
    });

    expect(results.first.items).toHaveLength(3);
    expect(results.first.total).toBe(3);
    expect(results.first.items[0].category).toBe("Arte digital");
    expect(results.empty.items).toHaveLength(0);
    expect(results.clientError).toBe(400);
    expect(results.serverError).toBe(503);
  });

  test("real Socket.IO client receives catalog changes from the same MSW store", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/?mockScenario=success");
    await expect
      .poll(() =>
        page.evaluate(() =>
          fetch("/api/mock/socket-status").then((response) => response.json()),
        ),
      )
      .toMatchObject({ subscribers: 1 });
    const emerald = page
      .getByTestId("marketplace-nft-card")
      .filter({ hasText: "Emerald Ape #042" });
    await expect(emerald).toContainText("1.19 ETH");

    const status = await page.evaluate(async () => {
      const response = await fetch("/api/mock/events/price-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nftId: 1, price: 1.55 }),
      });
      return response.status;
    });

    expect(status).toBe(200);
    await expect(emerald).toContainText("1.55 ETH");
  });
});
