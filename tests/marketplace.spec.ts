import { expect, test } from "@playwright/test";

test.describe("desktop marketplace", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
  });

  test("filters NFT cards by category and trend", async ({ page }) => {
    await page.getByRole("button", { name: /Fotografia/ }).click();
    await expect(
      page.getByText("Copper Bloom #118", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Neon Vessel #552", { exact: true }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Limpar filtros" }).click();
    await page.getByRole("button", { name: "Em alta" }).click();
    await expect(
      page.getByText("Emerald Ape #042", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Sage Monk #009", { exact: true })).toHaveCount(
      0,
    );

    await page.getByRole("button", { name: "Limpar filtros" }).click();
    await page.getByLabel("Ordenar por").selectOption("price-ascending");
    await expect(
      page.getByTestId("marketplace-nft-card").first(),
    ).toContainText("Golden Signal #160");

    await page.getByRole("button", { name: "Limpar filtros" }).click();
    const maxPriceThumb = page.getByRole("slider").nth(1);
    await maxPriceThumb.press("ArrowLeft");
    await maxPriceThumb.press("ArrowLeft");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(
      page.getByText("Orbit Runner #031", { exact: true }),
    ).toHaveCount(0);
  });

  test("desktop search icon filters NFTs and works from the detail page", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Abrir busca" }).click();
    const searchInput = page.getByRole("textbox", { name: "Buscar NFTs" });
    await expect(searchInput).toBeFocused();
    await searchInput.fill("Generativa");
    await expect(
      page.getByText("Neon Vessel #552", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Copper Bloom #118", { exact: true }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Limpar busca" }).click();
    await searchInput.fill("Copper Bloom");
    await page.getByTestId("marketplace-nft-card").click();
    await expect(
      page.getByRole("heading", { name: "Copper Bloom #118" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Buscar NFTs" }).click();
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeFocused();
    await expect(searchInput).toHaveValue("Copper Bloom");
  });

  test("opens NFT details, toggles favorite, and buys selected quantity", async ({
    page,
  }) => {
    await page
      .locator('[role="button"]')
      .filter({ hasText: "Emerald Ape #042" })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Emerald Ape #042" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Favoritar" }).click();
    await expect(
      page.getByRole("button", { name: "Favoritado" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Aumentar quantidade" }).click();
    const buyButton = page.getByRole("button", { name: /Comprar · 2\.38 ETH/ });
    await expect(buyButton).toBeVisible();
    await buyButton.click();

    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole("heading", { name: "Carrinho" })).toBeVisible();
    await expect(
      page
        .getByRole("link", {
          name: "Ver detalhes de Emerald Ape #042",
          exact: true,
        })
        .first(),
    ).toBeVisible();
    await expect(
      page.locator("aside").getByText("2.38 ETH", { exact: true }).last(),
    ).toBeVisible();

    const desktopSummary = page.getByTestId("desktop-cart-summary");
    await desktopSummary.getByLabel("Código promocional").fill("KURIO10");
    await desktopSummary.getByRole("button", { name: "Aplicar" }).click();
    await expect(desktopSummary.getByRole("status")).toHaveText(
      "Cupom KURIO10 aplicado: 10% de desconto.",
    );
    await expect(
      desktopSummary.getByText("2.158 ETH", { exact: true }),
    ).toBeVisible();

    await page
      .getByRole("link", {
        name: "Ver detalhes de Emerald Ape #042",
        exact: true,
      })
      .first()
      .click();
    await expect(page).toHaveURL(/\/nft\/1$/);
    await expect(
      page.getByRole("heading", { name: "Emerald Ape #042" }),
    ).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/cart$/);

    await page
      .getByRole("button", { name: "Remover Emerald Ape #042" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Seu carrinho está vazio" }).last(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Explorar NFTs/ }).last(),
    ).toBeVisible();
  });

  test("validates registration and reports unavailable authentication backend", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByRole("button", { name: "Criar conta", exact: true })
      .first()
      .click();

    await dialog
      .getByRole("textbox", { name: "Nome de usuário" })
      .fill("Colecionador");
    await dialog
      .getByRole("textbox", { name: "E-mail" })
      .fill("colecionador@example.com");
    await dialog
      .getByRole("textbox", { name: "Senha", exact: true })
      .fill("senha-segura-123");
    await dialog
      .getByRole("textbox", { name: "Confirmar senha", exact: true })
      .fill("senha-diferente-123");
    await dialog
      .getByRole("button", { name: "Criar conta", exact: true })
      .last()
      .click();
    await expect(dialog.getByRole("status")).toHaveText(
      "As senhas não coincidem.",
    );

    await dialog
      .getByRole("textbox", { name: "Confirmar senha", exact: true })
      .fill("senha-segura-123");
    await dialog
      .getByRole("button", { name: "Criar conta", exact: true })
      .last()
      .click();
    await expect(dialog.getByRole("status")).toHaveText(
      "Conta criada com sucesso.",
    );
  });
});

test.describe("mobile marketplace", () => {
  test("searches NFTs and opens a detail page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page
      .getByRole("textbox", { name: "Explorar coleções" })
      .fill("Emerald");
    await expect(
      page.getByRole("button", { name: "Ver detalhes de Emerald Ape #042" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Ver detalhes de Sage Monk #009" }),
    ).toHaveCount(0);

    await page
      .getByRole("button", { name: "Emerald Ape #042", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Emerald Ape #042" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Voltar para as coleções" }).click();
    await expect(
      page.getByRole("textbox", { name: "Explorar coleções" }),
    ).toBeVisible();
  });

  test("mobile bottom menu filters favorites, focuses search, and opens full-screen auth", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.getByRole("button", { name: "Favoritos", exact: true }).click();
    await expect(
      page.getByText(/Você ainda não tem NFTs favoritos/),
    ).toBeVisible();
    await page.getByRole("button", { name: "Início" }).click();

    await page
      .getByRole("button", { name: "Adicionar Emerald Ape #042 aos favoritos" })
      .click();
    await page.getByRole("button", { name: "Favoritos", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Emerald Ape #042", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sage Monk #009", exact: true }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Buscar NFTs" }).click();
    await expect(
      page.getByRole("textbox", { name: "Explorar coleções" }),
    ).toBeFocused();

    await page.getByRole("button", { name: "Conta" }).click();
    await expect(
      page.getByRole("heading", { name: "Entrar", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "E-mail", exact: true })
      .fill("ada@example.test");
    await page
      .getByRole("textbox", { name: "Senha", exact: true })
      .fill("demo-pass-123");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.getByRole("status")).toContainText(
      "Bem-vindo, Ada Collector.",
    );

    await page.getByRole("button", { name: "Crie uma conta" }).click();
    await expect(
      page.getByRole("heading", { name: "Criar perfil de colecionador" }),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "Nome de usuário" })
      .fill("Mobile Collector");
    await page
      .getByRole("textbox", { name: "E-mail" })
      .fill("mobile@example.com");
    await page
      .getByRole("textbox", { name: "Senha", exact: true })
      .fill("senha-segura-123");
    await page
      .getByRole("textbox", { name: "Confirmar senha" })
      .fill("senha-diferente-123");
    await page.getByRole("button", { name: "Criar perfil" }).click();
    await expect(page.getByRole("status")).toHaveText(
      "As senhas não coincidem.",
    );

    await page.getByRole("button", { name: "Entre", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Entrar", exact: true }),
    ).toBeVisible();
  });

  test("uses the mobile cart layout and keeps quantity, coupon, and checkout functional", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page
      .getByRole("button", { name: "Adicionar Emerald Ape #042 ao carrinho" })
      .click();
    await page.getByRole("link", { name: "Carrinho, 1 itens" }).click();

    await expect(
      page.getByRole("heading", { name: "Carrinho de NFTs" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("link", { name: "Ver detalhes de Emerald Ape #042" })
        .first(),
    ).toBeVisible();
    await expect(page.getByText("Edição: 1/50")).toBeVisible();
    await expect(
      page.getByRole("article").getByText("1.19 ETH", { exact: true }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Aumentar quantidade de Emerald Ape #042" })
      .click();
    await expect(
      page.getByRole("article").getByText("2.38 ETH", { exact: true }),
    ).toBeVisible();
    const mobileSummary = page.getByTestId("mobile-cart-summary");
    await mobileSummary.getByLabel("Código promocional").fill("KURIO10");
    await mobileSummary.getByRole("button", { name: "Aplicar" }).click();
    await expect(mobileSummary.getByRole("status")).toHaveText(
      "Cupom KURIO10 aplicado: 10% de desconto.",
    );
    await expect(
      mobileSummary.getByText("2.158 ETH", { exact: true }),
    ).toBeVisible();

    await mobileSummary
      .getByRole("button", { name: "Conectar e finalizar" })
      .click();
    await expect(mobileSummary.getByRole("status").last()).toContainText(
      "Autenticação necessária.",
    );
  });
});
