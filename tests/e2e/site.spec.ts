import { test, expect } from "@playwright/test";

const PUBLIC = ["/", "/choose-your-location", "/us/therapies", "/ous/therapies", "/apac/therapies", "/ous/therapies/lvo", "/apac/therapies/mvo", "/us/therapies/aneurysm", "/us/evidence", "/ous/evidence", "/apac/evidence", "/ous/webinars", "/news-events", "/about-us", "/team/ronen", "/careers", "/open-positions", "/contact-us", "/privacy-statement", "/distals-results", "/ous/comparison-video", "/sitemap.xml", "/robots.txt"];

for (const path of PUBLIC) {
  test(`renders ${path}`, async ({ request }) => {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
  });
}

test("seeded pages and bios keep their text", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "1. Acceptance of the Terms" })).toBeVisible();
  // Bios open on About (decision 2026-11-10): /team/{slug} lands on the card, "Read bio" opens it in place.
  await page.goto("/team/ronen");
  await expect(page).toHaveURL(/\/about-us#ronen$/);
  await page.locator("#ronen").getByText("Read bio").click();
  await expect(page.getByText("Ronen Eckhouse is the co-founder")).toBeVisible();
});

test("legacy URLs redirect", async ({ request }) => {
  for (const [from, to] of [["/welcome_d", "/"], ["/us/lvo", "/us/therapies/lvo"], ["/ronen", "/about-us#ronen"], ["/us/therapies/access", "/us/therapies/drivewire"]]) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers().location).toContain(to);
  }
});

test("legacy subdomains redirect to path regions", async ({ request }) => {
  const res = await request.get("/vasospasm", { headers: { host: "apac.rapid-medical.com" }, maxRedirects: 0 });
  expect(res.status()).toBe(301);
  expect(res.headers().location).toContain("/apac/therapies/vasospasm");
});

test("therapy page has video hero, tabs and regulatory text", async ({ page }) => {
  await page.goto("/ous/therapies/lvo");
  await expect(page.locator("video").first()).toHaveAttribute("src", /\.mp4/);
  await expect(page.getByRole("tab", { name: "How it works" })).toBeVisible();
  await page.getByRole("tab", { name: "How it works" }).click();
  await expect(page.getByText("PENETRATE")).toBeVisible();
  await expect(page.getByText("Sadasivan C")).toBeVisible();
});

test("evidence tabs follow the region", async ({ page }) => {
  await page.goto("/apac/evidence");
  await expect(page.getByRole("tab", { name: "COLUMBUS™" })).toBeVisible();
  await page.goto("/us/evidence");
  await expect(page.getByRole("tab", { name: "COLUMBUS™" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "DRIVEWIRE™" })).toBeVisible();
});

test("a product anchor opens its evidence tab", async ({ page }) => {
  await page.goto("/us/evidence#comaneci");
  await expect(page.getByRole("tab", { name: /COMANECI/ })).toHaveAttribute("aria-selected", "true");
  await page.goto("/us/evidence#drivewire");
  await expect(page.getByRole("tab", { name: /DRIVEWIRE/ })).toHaveAttribute("aria-selected", "true");
  await page.goto("/us/evidence#%");
  await expect(page.getByRole("tab").first()).toHaveAttribute("aria-selected", "true");
});

test("about page renders the interactive map", async ({ page }) => {
  await page.goto("/about-us");
  await expect(page.locator("svg path").first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("UNITED STATES AND CANADA")).toBeVisible();
});

test("contact form stores a submission", async ({ page }) => {
  await page.goto("/contact-us?region=us&topic=demo");
  await expect(page.locator("select[name=topic]")).toHaveValue("Request a demo");
  await page.fill("input[name=firstName]", "E2E");
  await page.fill("input[name=lastName]", "Tester");
  await page.fill("input[name=email]", "e2e@example.com");
  await page.click('button:has-text("Submit")');
  await expect(page.getByText("Thank you for contacting us.")).toBeVisible();
});

test("unknown path returns 404", async ({ request }) => {
  expect((await request.get("/definitely-not-here")).status()).toBe(404);
});

test("style guide shows every block, is noindex and not in the sitemap", async ({ page, request }) => {
  await page.goto("/style-guide");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  for (const name of ["Hero", "Text and media", "Product details", "Indications and references"]) {
    await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
  }
  for (const name of ["Rich text", "Media", "Form", "Offices and map", "Gallery", "News", "Publications", "Webinars", "Jobs", "Region chooser"]) {
    await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
  }
  // sample forms cannot be sent
  await expect(page.locator("#form").getByRole("button", { name: "Submit" }).first()).toBeDisabled();
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("style-guide");
});
