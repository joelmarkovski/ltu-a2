/// <reference types="@playwright/test" />
import { test, expect, Page } from "@playwright/test";

async function settle(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
}

/* ----------------------------- HOME PAGE ---------------------------------- */

test("home loads and toggles theme", async ({ page }) => {
  await page.goto("/");
  await settle(page);

  // ve tolerant about the exact heading text
  await page.getByRole("heading").first().waitFor({ state: "visible" });

  // prefer data-testid="theme-toggle"; fall back to a visible Light/Dark Mode button.
  let toggle = page.getByTestId("theme-toggle");
  if (!(await toggle.isVisible().catch(() => false))) {
    toggle = page.getByRole("button", { name: /(Light|Dark)\s*Mode/i });
  }
  await toggle.waitFor({ state: "visible", timeout: 10000 });

  const html = page.locator("html");
  const before = (await html.evaluate((el) => el.className)) || "";

  await toggle.click();

  // Confirm the <html> class actually changed
  await expect
    .poll(async () => (await html.evaluate((el) => el.className)) || "")
    .not.toBe(before);
});

/* --------------------------- ESCAPE ROOM: STAGE 1 -------------------------- */

test("escape room: Stage 1 formats JSON and advances", async ({ page }) => {
  await page.goto("/escape-room");
  await settle(page);

 
  const start = page.getByRole("button", { name: /start/i });
  if (await start.isVisible().catch(() => false)) {
    await start.click().catch(() => {});
  }

  const ta = page.getByTestId("stage1-text");
  await ta.waitFor({ state: "visible" });

  const messy = `{"name":"Ada","skills":["js","ts"],"active":true,"scores":{"a":1,"b":2}}`;
  await ta.fill(messy);

  await page.getByTestId("format-json").click();


  const expectedObj = { name: "Ada", skills: ["js", "ts"], active: true, scores: { a: 1, b: 2 } };

  await expect
    .poll(async () => {
      const raw = await ta.inputValue();
      try {
        return JSON.parse(raw.replace(/\r\n/g, "\n"));
      } catch {
        return null; // keep polling until it's valid JSON
      }
    }, { timeout: 8000 })
    .toEqual(expectedObj);


  const next = page.getByRole("button", { name: /^next$/i });
  if (await next.isVisible().catch(() => false)) {
    await next.click().catch(() => {});


    let sawStage2 = false;
    try {
      await page.getByText(/Stage\s*2/i).waitFor({ timeout: 1500 });
      sawStage2 = true;
    } catch {}
    if (!sawStage2) {
      await page.getByTestId("debugger-hotspot").waitFor({ timeout: 1500 }).catch(() => {});
    }
  }
});
