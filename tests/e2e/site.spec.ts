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

test.describe("usability pass 2026-11-13", () => {
  test("a server error keeps what the visitor typed and marks the field", async ({ page }) => {
    await page.goto("/contact-us?region=us&topic=demo");
    await page.fill("input[name=firstName]", "Laura");
    await page.fill("input[name=lastName]", "Mendes");
    await page.fill("input[name=email]", "laura@clinic"); // the browser lets it through, the server does not
    await page.fill("textarea[name=message]", "Please call me about a demo.");
    await page.click('button:has-text("Submit")');
    await expect(page.getByText("Please check the highlighted fields.")).toBeVisible();
    await expect(page.locator("input[name=firstName]")).toHaveValue("Laura");
    await expect(page.locator("textarea[name=message]")).toHaveValue("Please call me about a demo.");
    await expect(page.locator("input[name=email]")).toHaveAttribute("aria-invalid", "true");
  });

  test("a webinar card picks its webinar in the request form", async ({ page }) => {
    await page.goto("/ous/webinars");
    const card = page.locator("ul li").filter({ has: page.getByRole("button", { name: "Request this recording" }) }).first();
    const title = (await card.locator(".font-medium").first().innerText()).trim();
    await card.getByRole("button", { name: "Request this recording" }).click();
    await expect(page.locator('form[data-form="webinar"] select[name=topic]')).toHaveValue(title);
    await expect(page.getByText("Which webinar?*")).toBeVisible();
  });

  test("careers with no open positions leads to the general-interest form", async ({ page }) => {
    await page.goto("/careers");
    await expect(page.getByRole("link", { name: "Submit general interest" }).first()).toHaveAttribute("href", /#general-interest$/);
  });

  test("therapy: the breadcrumb leads back, support opens with its topic", async ({ page }) => {
    await page.goto("/us/therapies/lvo");
    await expect(page.getByRole("link", { name: "Therapies", exact: true }).first()).toHaveAttribute("href", "/us/therapies");
    await expect(page.getByRole("link", { name: "Customer support" }).first()).toHaveAttribute("href", "/contact-us?region=us&topic=support");
  });

  test("a therapy missing in a region says where it is", async ({ page }) => {
    const res = await page.goto("/us/therapies/mvo");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("is not available in Americas");
    await expect(page.getByRole("link", { name: /Europe & Middle East/ })).toHaveAttribute("href", "/ous/therapies/mvo");
    await expect(page.getByRole("link", { name: "All therapies in Americas" })).toBeVisible();
  });
});

test.describe("usability pass 2026-11-13, part 2", () => {
  test("switching region on a therapy that the region does not have explains it", async ({ request, page }) => {
    const r = await request.get("/api/region?to=us&back=%2Fous%2Ftherapies%2Fmvo", { maxRedirects: 0 });
    expect(r.headers()["location"]).toContain("/us/therapies?missing=mvo");
    await page.goto("/us/therapies?missing=mvo");
    await expect(page.getByRole("status")).toContainText("Medium vessel stroke is not available in Americas");
    const keep = await request.get("/api/region?to=ous&back=%2Fus%2Fevidence%23comaneci", { maxRedirects: 0 });
    expect(keep.headers()["location"]).toMatch(/\/ous\/evidence#comaneci$/);
  });

  test("Request to view on a therapy picks that product's webinar", async ({ page }) => {
    await page.goto("/apac/therapies/aneurysm");
    const href = await page.locator('a:has-text("Request to view")').first().getAttribute("href"); // inside a closed tab
    expect(href).toMatch(/\/apac\/webinars\?product=/);
    await page.goto(href!);
    await expect(page.locator('form[data-form="webinar"] select[name=topic]')).not.toHaveValue("");
  });

  test("titles: no doubled brand on text pages, 404 says what it is", async ({ page }) => {
    await page.goto("/privacy-statement");
    expect((await page.title()).match(/Rapid Medical/g)?.length ?? 0).toBeLessThanOrEqual(1);
    await page.goto("/no-such-page-e2e");
    await expect(page).toHaveTitle(/^Page not found/);
  });

  test("a section heading includes its eyebrow; news dates are in words", async ({ page }) => {
    await page.goto("/ous/therapies/lvo");
    await expect(page.getByRole("heading", { level: 2, name: /Gain active\s*control/i }).first()).toBeVisible();
    await page.goto("/news-events");
    await expect(page.getByText(/^[A-Z][a-z]{2} 20\d\d$/).first()).toBeVisible();
  });
});
