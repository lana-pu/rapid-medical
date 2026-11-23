import { test, expect } from "@playwright/test";
import { sql } from "./helpers";

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
  // Bios open on About (decision 2026-11-10): /team/{slug} lands on the card, two lines of the bio show at once,
  // "Read full bio" opens the whole of it in place (DESIGN.md → About).
  await page.goto("/team/ronen");
  await expect(page).toHaveURL(/\/about-us#ronen$/);
  await expect(page.locator("#ronen")).toContainText("Co-Founder & CEO"); // the usual case, not CAPITALS
  await page.locator("#ronen").getByText("Read full bio").click();
  await expect(page.locator("#ronen details").getByText("Haas School of Business", { exact: false })).toBeVisible();
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

test("evidence products follow the region", async ({ page }) => {
  const lib = page.locator("#browse-by-product");
  await page.goto("/apac/evidence");
  await expect(lib.getByRole("button", { name: /^COLUMBUS™/ })).toBeVisible();
  await page.goto("/us/evidence");
  await expect(lib.getByRole("button", { name: /^COLUMBUS™/ })).toHaveCount(0);
  await expect(lib.getByRole("button", { name: /^DRIVEWIRE™/ })).toBeVisible();
});

test("Evidence: the region's numbers, the archive with search and a product anchor that filters it", async ({ page }) => {
  // DESIGN.md → Evidence; links from therapy cards end in #{product}
  await page.goto("/about-us");
  await page.goto("/us/evidence#comaneci");
  const lib = page.locator("#browse-by-product");
  await expect(lib.getByRole("button", { name: /^COMANECI/ })).toHaveAttribute("aria-pressed", "true");
  await expect(lib.getByText(/^Showing \d+ of \d+$/)).toBeVisible();
  const shown = Number((await lib.getByText(/^Showing/).innerText()).split(" of ")[1]);
  await expect(page.locator("dl").first()).toContainText(String(shown)); // the same number in the overview
  await lib.getByRole("button", { name: /^All \d+$/ }).click();
  await lib.getByLabel("Search publications").fill("zzzz-nothing");
  await expect(lib.getByText("Nothing found. Try fewer words or another product.")).toBeVisible();
  await page.goto("/about-us");
  await page.goto("/us/evidence#%"); // a malformed anchor does nothing
  await expect(page.locator("#browse-by-product").getByRole("button", { name: /^All \d+$/ })).toHaveAttribute("aria-pressed", "true");
});

test("about page renders the interactive map", async ({ page }) => {
  await page.goto("/about-us");
  await expect(page.locator("svg path").first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("UNITED STATES AND CANADA")).toBeVisible();
  // the intro's facts: publications counted, offices from Contact details; each office card has directions
  await expect(page.locator("dl").first()).toContainText("Clinical publications");
  await expect(page.locator("dl").first()).toContainText("Israel · USA · Germany");
  await expect(page.locator("#offices").getByText("Get directions ↗")).toHaveCount(3);
});

test("contact form stores a submission", async ({ page }) => {
  await page.goto("/contact-us?region=us&topic=demo");
  // topic first, as chips (docs/screens/contact-us.md); the one from the address is chosen
  await expect(page.locator("input[name=topic]")).toHaveValue("Request a demo");
  await expect(page.getByRole("radio", { name: "Request a demo" })).toBeChecked();
  // contacts of the region beside the form
  await expect(page.getByText("Call Americas")).toBeVisible();
  await page.fill("input[name=firstName]", "E2E");
  await page.fill("input[name=lastName]", "Tester");
  await page.fill("input[name=email]", "e2e@example.com");
  await expect(page.locator("input[name=state]")).toHaveCount(0);
  await page.selectOption("select[name=countryCode]", "US"); // State appears only for the US and Canada
  await expect(page.locator("input[name=state]")).toHaveCount(1);
  await page.click('button:has-text("Submit")');
  await expect(page.getByText("Thank you for contacting us.")).toBeVisible();
  await expect(page.getByText("We’ll reply to e2e@example.com.", { exact: false })).toBeVisible();
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
    await page.selectOption("select[name=countryCode]", "PT");
    await page.click('button:has-text("Submit")');
    // the error is at the field, not in a banner (DESIGN.md → Формы)
    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page.locator("input[name=firstName]")).toHaveValue("Laura");
    await expect(page.locator("textarea[name=message]")).toHaveValue("Please call me about a demo.");
    await expect(page.locator("input[name=email]")).toHaveAttribute("aria-invalid", "true");
  });

  test("a webinar's row opens the request form for it in a window", async ({ page }) => {
    await page.goto("/ous/webinars");
    const row = page.locator("ul li").filter({ has: page.getByRole("button", { name: "Request this recording" }) }).first();
    const title = (await row.locator("h3").first().innerText()).trim();
    await row.getByRole("button", { name: "Request this recording" }).click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog.getByRole("heading", { name: title })).toBeVisible();
    await expect(dialog.locator('form[data-form="webinar"] input[name=topic]')).toHaveValue(title);
  });

  test("careers with no open positions leads to the general-interest form", async ({ page, request }) => {
    await page.goto("/careers");
    await expect(page.getByRole("link", { name: "Send us your details ↓" }).first()).toHaveAttribute("href", /#general-interest$/);
    // the section stays and says so (DESIGN.md → Careers)
    await expect(page.locator("#open-positions")).toContainText("No open positions right now.");
    // the old list address leads to the section on Careers
    const old = await request.get("/open-positions", { maxRedirects: 0 });
    expect(old.status()).toBe(308);
    expect(old.headers()["location"]).toBe("/careers#open-positions");
    // a candidate's form: area of interest as chips, a LinkedIn or CV link instead of Organization
    const f = page.locator("form[data-form=careers]");
    await expect(f.locator("input[name=organization]")).toHaveCount(0);
    await f.getByText("Internship", { exact: true }).click();
    await f.locator("input[name=firstName]").fill("E2E");
    await f.locator("input[name=lastName]").fill("Candidate");
    await f.locator("input[name=email]").fill("candidate@example.com");
    await f.locator("input[name=meta_linkedin]").fill("https://linkedin.com/in/e2e");
    await f.locator("select[name=countryCode]").selectOption("DE");
    await f.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByRole("status")).toContainText("we've received your details");
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
  test("switching region on a therapy that the region does not have lands on its overview", async ({ request, page }) => {
    // no «not available» notice (decision 2026-11-15): the site has no links to therapies a region lacks
    const r = await request.get("/api/region?to=us&back=%2Fous%2Ftherapies%2Fmvo", { maxRedirects: 0 });
    expect(r.headers()["location"]).toMatch(/\/us\/therapies$/);
    await page.goto("/us/therapies?missing=mvo");
    await expect(page.getByText(/is not available in/)).toHaveCount(0);
    // the overview: groups of one therapy in one row, the group on the card; publications lead to Evidence
    await expect(page.getByText("Ischemic stroke · TIGERTRIEVER™")).toBeVisible();
    await expect(page.getByRole("link", { name: /^\d+ publications? →$/ }).first()).toHaveAttribute("href", "/us/evidence#tigertriever");
    // old Duda addresses of therapies the Americas do not have go to the overview, not to a missing page
    const old = await request.get("/us/vasospasm", { maxRedirects: 0 });
    expect(old.headers()["location"]).toMatch(/\/us\/therapies$/);
    const keep = await request.get("/api/region?to=ous&back=%2Fus%2Fevidence%23comaneci", { maxRedirects: 0 });
    expect(keep.headers()["location"]).toMatch(/\/ous\/evidence#comaneci$/);
  });

  test("Request to view on a therapy opens the webinars of that product", async ({ page }) => {
    await page.goto("/apac/therapies/aneurysm");
    const href = await page.locator('a:has-text("Request to view")').first().getAttribute("href"); // inside a closed tab
    expect(href).toMatch(/\/apac\/webinars\?product=/);
    await page.goto(href!);
    // the list opens filtered to that product
    await expect(page.getByRole("group", { name: "Product" }).locator('button[aria-pressed="true"]')).not.toHaveText(/^All/);
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

test.describe("user walk 2026-11-14", () => {
  test("links to other regions prefetched on screen do not switch the visitor's region; a click does", async ({ page, context }) => {
    const region = async () => (await context.cookies()).find((c) => c.name === "rm_region")?.value;
    await page.goto("/ous/therapies/mvo");
    await page.waitForLoadState("networkidle");
    expect(await region()).toBe("ous");
    await page.goto("/");
    await expect(page.getByLabel(/^Region:/).first()).toContainText("Europe & Middle East");
    await page.goto("/ous/therapies/mvo");
    await page.getByRole("link", { name: "Asia & Pacific version" }).click();
    await page.waitForURL(/\/apac\/therapies\/mvo/);
    await expect.poll(region).toBe("apac");
  });
});

test("choose your location is a window: opens when a regional page is asked for, not on arrival; the header opens it too", async ({ page, request }) => {
  // without JavaScript: the page with the same content
  expect(await (await request.get("/choose-your-location?back=%2Fabout-us")).text()).toContain("Find your country");
  // DESIGN.md → Выбор региона: no IP country here, so the region is unknown
  await page.goto("/about-us");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Evidence", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Choose your location" });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/about-us$/); // the visitor stays where they were
  // the country search marks its region
  await dialog.getByLabel("Find your country").fill("United Arab");
  await expect(dialog.getByText("United Arab Emirates is here")).toBeVisible();
  await dialog.getByRole("link", { name: /Go to Europe & Middle East/ }).click();
  await page.waitForURL(/\/ous\/evidence$/);
  // the header: the same window with the current region; the choice returns to the same page
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: /^Region: Europe & Middle East/ }).click();
  await expect(dialog.getByText("Current region")).toBeVisible();
  await expect(dialog.getByText("Your choice")).toBeVisible();
  await dialog.getByRole("link", { name: /Go to Americas/ }).click();
  await page.waitForURL(/\/us\/evidence$/);
});

test("News & Events: highlights instead of a carousel, rows without repeats, upcoming events never disappear", async ({ page }) => {
  // DESIGN.md → News & Events
  await page.goto("/news-events");
  await expect(page.getByRole("heading", { level: 1, name: "News & Events" })).toBeVisible();
  const top = await page.locator("#highlights h2, #highlights li").allInnerTexts();
  expect(top.length).toBe(4);
  const rows = page.locator("#all-news li");
  await expect(rows).toHaveCount(10);
  const rowTexts = await rows.allInnerTexts();
  const bigTitle = (await page.locator("#highlights h2").innerText()).trim();
  expect(rowTexts.some((t) => t.includes(bigTitle))).toBe(false); // the highlights are not repeated below
  await page.locator("#all-news").getByRole("button", { name: "Show more" }).click();
  await expect(rows).toHaveCount(20);
  // the seeded events are all past: the section stays with a line and a way to the archive
  await expect(page.locator("#upcoming-events")).toContainText("No upcoming events right now.");
  await expect(page.locator("#upcoming-events").getByRole("link", { name: "See past events ↓" })).toHaveAttribute("href", "#past-events");
  await expect(page.locator("#past-events")).toBeVisible();
});

test("publications, news and studies have their own pages (docs/screens/material.md)", async ({ page, request }) => {
  // Evidence row → the publication's page: its facts, the PDF shown here or the original, more of the product
  await page.goto("/us/evidence");
  const row = page.locator("#browse-by-product li a[href^='/us/evidence/']").first();
  const title = (await row.innerText()).trim();
  await row.click();
  await expect(page).toHaveURL(/\/us\/evidence\/\d+-[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(page.getByText(/^Publication · /)).toBeVisible();
  await expect(page.locator("figure[data-document] img, h2:has-text('Abstract'), a:has-text('Read the article ↗')").first()).toBeVisible();
  // a wrong slug goes to the right one; a publication of another region is not there
  const id = page.url().match(/evidence\/(\d+)/)![1];
  expect((await request.get(`/us/evidence/${id}-wrong`, { maxRedirects: 0 })).status()).toBe(308);
  expect((await request.get("/us/evidence/999999-nothing")).status()).toBe(404);
  // no right to the full text: the abstract as published, with its source
  await page.goto("/ous/evidence/13");
  await expect(page.getByRole("heading", { name: "Abstract" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^PubMed \d+$/ })).toBeVisible();
  // News & Events row → the news page: source, the original, more news
  await page.goto("/news-events");
  await page.locator("#all-news li a").first().click();
  await expect(page).toHaveURL(/\/news-events\/\d+-[a-z0-9-]+$/);
  await expect(page.getByRole("link", { name: /Read the full release/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "More news" })).toBeVisible();
  // a study page: the conclusion, key figures with their quotes, the passport and the source
  await page.goto("/us/success-study-final-results");
  await expect(page.getByText("Study · COMANECI™")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Study at a glance" })).toBeVisible();
  await expect(page.getByText("90 consecutive subjects")).toBeVisible();
  await expect(page.getByText("95%", { exact: true })).toBeVisible();
  // the study itself is shown on the page, not linked (decision 2026-11-15): its pages as pictures (2026-11-16)
  await expect(page.locator("object[type='application/pdf']")).toHaveCount(0);
  await expect(page.locator("figure[data-document]")).toHaveCount(1);
  await page.goto("/LongTerm_Outcomes");
  const doc = page.locator("figure[data-document]");
  await expect(doc).toHaveCount(1);
  // the first pages, then «Show all»; a page opens large; the text is under the pages
  await expect(doc.locator("img")).toHaveCount(2);
  await doc.getByRole("button", { name: /^Show all \d+ pages$/ }).click();
  await expect(doc.locator("img")).toHaveCount(7);
  await doc.getByRole("button", { name: "Enlarge page 1 of 7" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(doc.getByText("Text of this document")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open PDF" })).toHaveCount(0);
});

test("News bar: off by default; switched on, the newest highlight above the header of Home only (docs/screens/home.md)", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("a", { has: page.locator("b", { hasText: /^News$/ }) })).toHaveCount(0);
  sql(`insert into site_settings(key, value) values ('newsBar', '{"enabled": true}'::jsonb) on conflict (key) do update set value = excluded.value`);
  try {
    const newest = sql("select title from materials where show_in_news and featured and status='published' order by published_on desc, id desc limit 1");
    await page.goto("/");
    const bar = page.locator("a", { has: page.locator("b", { hasText: /^News$/ }) });
    await expect(bar).toContainText(newest);
    await bar.click();
    await expect(page.locator("h1")).toHaveText(newest);
    await page.goto("/us/therapies");
    await expect(page.locator("a", { has: page.locator("b", { hasText: /^News$/ }) })).toHaveCount(0);
  } finally {
    sql("delete from site_settings where key='newsBar'");
  }
});
