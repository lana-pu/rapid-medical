import { test, expect } from "@playwright/test";
import { login, sql, ADMIN, totp, freshCodeWindow, publishFromEditor, TOTP_SECRET, TWO_STEP_SQL } from "./helpers";
import { E2E_CRON_SECRET } from "./secrets";

test.describe.configure({ mode: "serial" });

test("login → website or training tool → what needs you; list filters", async ({ page }) => {
  sql(`insert into contact_submissions(form,first_name,last_name,email,status) values ('contact','E2E','Home','home@example.com','new')`);
  await login(page);
  await expect(page).toHaveURL(/\/admin\/start$/);
  await expect(page.getByRole("heading", { name: "What do you want to work on?" })).toBeVisible();
  await expect(page.getByText("Training tool")).toBeVisible();
  await page.getByRole("link", { name: /Website/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: /^Hello, / })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Needs your attention" })).toBeVisible();
  await expect(page.getByText(/\d+ new requests?/)).toBeVisible();
  await expect(page.getByText(/pictures? without a description/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Evidence" }).first()).toBeVisible();
  await page.getByRole("link", { name: "New page" }).click();
  await expect(page.getByRole("dialog")).toBeVisible(); // the template choice opens straight away
  sql(`delete from contact_submissions where email='home@example.com'`);
  await page.goto("/admin/solutions?region=apac");
  await expect(page.locator("tbody tr")).toHaveCount(5);
});

test("editing a live record creates pending changes, preview shows them, publish goes live", async ({ page, browser }) => {
  await login(page);
  const id = sql("select id from solutions where region='ous' and slug='lvo'");
  await page.goto(`/admin/solutions/${id}`);
  await expect(page.locator("select[name=status]")).toHaveCount(0); // on the site only through Publish
  await expect(page.getByTestId("record-status")).toHaveText("Live");
  // page content is edited on the page (ADR-007): the form keeps basics and SEO only
  await expect(page.locator("input[name=heroTitle]")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Edit on page ✎" }).first()).toBeVisible();
  const anon = await (await browser.newContext()).newPage();
  await anon.goto("/ous/therapies/lvo");
  const originalTitle = await anon.title();

  await page.fill("input[name=metaTitle]", "E2E pending title");
  await page.locator("input[name=metaTitle]").blur(); // autosave on leaving the field
  await expect(page.locator("[role=status]", { hasText: /^Saved automatically/ })).toBeVisible();
  await expect(page.getByTestId("record-status")).toHaveText("Live, with unpublished changes");
  await page.reload();

  await anon.reload();
  await expect(anon).toHaveTitle(originalTitle);

  const preview = await page.locator('a:has-text("Preview")').getAttribute("href");
  await anon.goto(preview!);
  await expect(anon).toHaveTitle("E2E pending title");
  await expect(anon.locator("h1")).toHaveText("A patient-centric approach to AIS"); // the form save kept the page's sections
  await expect(anon.getByText("Preview mode")).toBeVisible();

  await page.click('button:has-text("Publish changes")');
  await page.waitForURL(/published=1/);
  await anon.goto("/api/preview?exit=1&redirect=/ous/therapies/lvo");
  await expect(anon).toHaveTitle("E2E pending title");
  await expect(anon.locator("h1")).toHaveText("A patient-centric approach to AIS");

  // history has the baseline + draft + published, restore baseline
  await page.goto(`/admin/solutions/${id}/history`);
  const rows = page.locator("table tbody tr");
  expect(await rows.count()).toBeGreaterThanOrEqual(3);
  await rows.last().locator('button:has-text("restore")').click();
  await page.waitForURL(/restored=1/);
  await page.click('button:has-text("Publish changes")');
  await page.waitForURL(/published=1/);
  await anon.goto("/ous/therapies/lvo");
  await expect(anon).toHaveTitle(originalTitle);
  await expect(anon.locator("h1")).toHaveText("A patient-centric approach to AIS");
});

test("new publication: mistakes listed on top with links, month and year, Israel time for the schedule", async ({ page }) => {
  await login(page);
  await page.goto("/admin/publications/new");
  await expect(page.locator("input[name=publishedOn]")).toHaveAttribute("type", "month");
  await expect(page.locator("select[name=status]")).toHaveCount(0);
  await page.click('button:has-text("Create draft")');
  const summary = page.getByRole("alert").filter({ hasText: /attention/ });
  await expect(summary).toContainText(/fields? needs? attention/);
  await expect(summary).toBeFocused();
  await summary.getByRole("link", { name: "Title" }).click();
  await expect(page).toHaveURL(/#title$/);
  // an existing publication: the schedule says which time zone it uses
  const id = sql("select id from publications order by id limit 1");
  await page.goto(`/admin/publications/${id}`);
  await expect(page.getByText(/Time zone: Israel \(UTC\+[23]\)/)).toBeVisible();
  await expect(page.locator("input[name=publishedOn]")).toHaveValue(/^\d{4}-\d{2}$/);
});

test("requests: who answers, status and a note for the team; filters", async ({ page }) => {
  sql(`delete from contact_submissions where email='req@example.com'`);
  sql(`insert into contact_submissions(form,topic,first_name,last_name,organization,email,region,status) values ('contact','Request a demo','Laura','Mendes','Hospital São José','req@example.com','Americas','new')`);
  const id = sql("select id from contact_submissions where email='req@example.com'");
  try {
    await login(page);
    await page.goto("/admin/submissions");
    await expect(page.getByRole("tab", { name: /New/, selected: true })).toBeVisible();
    await expect(page.getByText("Laura Mendes, Hospital São José")).toBeVisible();
    await page.getByText("Laura Mendes, Hospital São José").click();
    await expect(page.getByRole("heading", { name: "Request a demo" })).toBeVisible();
    await page.getByRole("button", { name: "I'll answer" }).click();
    await page.waitForURL(/saved=1/);
    expect(sql(`select status || '|' || (assigned_to_id is not null) from contact_submissions where id=${id}`)).toBe("in_progress|true");
    await expect(page.getByText(/took it/)).toBeVisible(); // the page shows the new state (the form is rebuilt with it)
    await expect(page.getByLabel("Who answers")).not.toHaveValue("");
    await page.getByLabel("Note for the team").fill("Called back, demo on Friday");
    await page.getByRole("button", { name: "Save" }).click();
    await expect.poll(() => sql(`select note from contact_submissions where id=${id}`)).toBe("Called back, demo on Friday");
    await expect(page.getByText(/took it/)).toBeVisible();
    // mine, in progress
    await page.goto("/admin/submissions?status=in_progress&mine=1&form=contact");
    await expect(page.getByText("Laura Mendes, Hospital São José")).toBeVisible();
    await page.goto("/admin/submissions?status=in_progress&form=webinar");
    await expect(page.getByText("Laura Mendes, Hospital São José")).toHaveCount(0);
  } finally {
    sql(`delete from contact_submissions where id=${id}`);
  }
});

test("the admin by the site's sections: menu, therapies in each region, lists, breadcrumbs", async ({ page }) => {
  await login(page);
  await page.goto("/admin");
  const menu = page.getByRole("navigation", { name: "Admin" });
  for (const s of ["Home", "Therapies", "Evidence", "Webinars", "News & Events", "About Us", "Careers", "Contact Us", "Other pages", "Menu and footer"]) await expect(menu.getByRole("link", { name: s, exact: true })).toBeVisible();

  await menu.getByRole("link", { name: "Therapies", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Therapies", level: 1 })).toBeVisible();
  await expect(page.locator('[data-cell="lvo:us"]')).toContainText("Edit on page");
  await expect(page.locator('[data-cell="mvo:us"]')).toHaveText("No version"); // MVO is not in the Americas
  await expect(page.locator('[data-cell="mvo:ous"]')).toContainText("Live");

  await menu.getByRole("link", { name: "Evidence", exact: true }).click();
  await expect(page.getByText(/Evidence — (Americas|Asia & Pacific|Europe & Middle East)/)).toHaveCount(3);
  await page.getByRole("link", { name: "Publications" }).first().click();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Website›Evidence");
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Evidence" }).click();
  await expect(page).toHaveURL(/\/admin\/site\/evidence$/);

  await menu.getByRole("link", { name: "Other pages", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Legal — linked from the footer" })).toBeVisible();
  await expect(page.getByText("Privacy Statement")).toBeVisible();
  await menu.getByRole("link", { name: "Careers", exact: true }).click();
  await expect(page.getByText("No open positions — the list is hidden on Careers.")).toBeVisible();
});

const addUser = (email: string, role: string) =>
  sql(`insert into users(email,name,password_hash,role,totp_secret,totp_enabled_at) values ('${email}','${role}',(select password_hash from users where email='${ADMIN.email}'),'${role}','${TOTP_SECRET}',now()) on conflict (email) do update set role='${role}', ${TWO_STEP_SQL}`);

test("roles: an editor publishes, but cannot change how a section looks or open Integrations; a designer can", async ({ browser }) => {
  test.setTimeout(120_000);
  addUser("editor@e2e.test", "editor");
  addUser("designer@e2e.test", "designer");
  const id = sql("select id from news_items where status='published' order by id limit 1");
  sql(`update news_items set status='draft' where id=${id}`);
  try {
    const ed = await (await browser.newContext()).newPage();
    await login(ed, "editor@e2e.test", ADMIN.password);
    // no approval step: the status field publishes an unpublished record
    await ed.goto(`/admin/news/${id}`);
    await expect(ed.getByText("Submit for review")).toHaveCount(0);
    await expect(ed.getByTestId("record-status")).toHaveText("Draft · not on the site");
    await ed.click('button[name=__intent][value=publish]');
    await ed.waitForURL(/published=1/);
    expect(sql(`select status from news_items where id=${id}`)).toBe("published");
    // Site settings without Branding, Integrations and Workflow
    await ed.goto("/admin/settings?group=integrations");
    await expect(ed.getByRole("link", { name: "Integrations" })).toHaveCount(0);
    await expect(ed.getByRole("link", { name: "Branding" })).toHaveCount(0);
    await expect(ed.getByRole("link", { name: "Workflow" })).toHaveCount(0);
    await expect(ed.locator("main").getByRole("link", { name: "Menu and footer" })).toHaveCount(0); // the menu's structure: designers
    await expect(ed.locator("input[name=__group]").first()).toHaveValue("contact");
    // on the page: no layout choice for a section
    await ed.goto(`/api/editor?on=1&redirect=${encodeURIComponent("/apac/therapies/mvo")}`);
    await expect(ed.getByRole("status")).toHaveText(/Live|Draft/);
    await ed.evaluate(() => window.scrollTo(0, 0));
    await ed.mouse.click(8, 300);
    await expect(ed.locator("#rm-section-toolbar")).toBeVisible();
    await expect(ed.locator('#rm-section-toolbar select[aria-label="Layout"]')).toHaveCount(0);
    // …but the menu's labels are everyone's, on the page
    const careers = ed.locator('header [data-e*="menu.5.label"]');
    await careers.click();
    await ed.keyboard.press("ControlOrMeta+A");
    await ed.keyboard.type("Careers at Rapid");
    await ed.keyboard.press("Enter");
    await expect(ed.getByRole("status")).toHaveText("Saved. Not live yet");
    sql(`delete from setting_drafts where key='navigation'`);

    const de = await (await browser.newContext()).newPage();
    await login(de, "designer@e2e.test", ADMIN.password);
    await de.goto("/admin/settings?group=branding");
    await expect(de.locator("input[name=__group]").first()).toHaveValue("branding");
    await expect(de.getByRole("link", { name: "Integrations" })).toHaveCount(0);
    await expect(de.locator("main").getByRole("link", { name: "Menu and footer" })).toBeVisible();
    await de.goto(`/api/editor?on=1&redirect=${encodeURIComponent("/apac/therapies/mvo")}`);
    await expect(de.getByRole("status")).toHaveText(/Live|Draft/);
    await de.evaluate(() => window.scrollTo(0, 0));
    await de.mouse.click(8, 300);
    await expect(de.locator('#rm-section-toolbar select[aria-label="Layout"]')).toBeVisible();
  } finally {
    sql(`delete from drafts where resource='news' and record_id=${id}`);
    sql(`update news_items set status='published' where id=${id}`);
  }
});

test("unpublish keeps the pending changes in the record and cancels the schedule", async ({ page }) => {
  await login(page);
  const id = sql("select id from news_items where status='published' order by id desc limit 1");
  const title = sql(`select title from news_items where id=${id}`);
  try {
    await page.goto(`/admin/news/${id}`);
    await page.fill("input[name=title]", "E2E pending title");
    await page.locator("input[name=title]").blur();
    await expect(page.locator("[role=status]", { hasText: /^Saved automatically/ })).toBeVisible();
    await page.reload();
    sql(`update drafts set publish_at=now() + interval '1 day' where resource='news' and record_id=${id}`);
    await page.click('button:has-text("Unpublish")');
    await page.waitForURL(/unpublished=1/);
    expect(sql(`select status || '|' || title from news_items where id=${id}`)).toBe("draft|E2E pending title");
    expect(sql(`select count(*) from drafts where resource='news' and record_id=${id}`)).toBe("0");
  } finally {
    sql(`delete from drafts where resource='news' and record_id=${id}`);
    sql(`update news_items set status='published', title='${title.replace(/'/g, "''")}' where id=${id}`);
  }
});

test("bulk unpublish works like Unpublish: the schedule is cancelled", async ({ page }) => {
  await login(page);
  await page.goto("/admin/news");
  const id = await page.locator('input[name=ids]').first().getAttribute("value");
  const was = sql(`select status from news_items where id=${id}`);
  sql(`update news_items set status='published' where id=${id}`);
  sql(`insert into drafts(resource,record_id,data,publish_at,updated_by_name) values ('news',${id},null,now() + interval '1 day','Admin') on conflict (resource,record_id) do update set publish_at=now() + interval '1 day'`);
  try {
    await page.reload();
    await page.check(`input[name=ids][value="${id}"]`);
    await page.click('button[value=unpublish]');
    await page.waitForURL(/bulk=unpublish/);
    expect(sql(`select status from news_items where id=${id}`)).toBe("draft");
    expect(sql(`select count(*) from drafts where resource='news' and record_id=${id}`)).toBe("0");
  } finally {
    sql(`delete from drafts where resource='news' and record_id=${id}`);
    sql(`update news_items set status='${was}' where id=${id}`);
  }
});

test("scheduled publishing via cron", async ({ page, request }) => {
  await login(page);
  const id = sql("select id from solutions where region='apac' and slug='drivewire'");
  await page.goto(`/admin/solutions/${id}`);
  await page.fill("input[name=metaTitle]", "Scheduled title");
  await page.locator("input[name=metaTitle]").blur();
  await expect(page.locator("[role=status]", { hasText: /^Saved automatically/ })).toBeVisible();
  await page.fill("input[name=publishAt]", "2020-01-01T00:00");
  await page.click('button:has-text("Set")');
  await page.waitForURL(/scheduled=1/);
  const res = await (await request.get("/api/cron/publish", { headers: { authorization: `Bearer ${E2E_CRON_SECRET}` } })).json();
  expect(res.published).toContainEqual({ resource: "solutions", id: Number(id) });
  // the schedule went with the draft: the next run does not publish it again
  expect(sql(`select count(*) from drafts where resource='solutions' and record_id=${id}`)).toBe("0");
  const again = await (await request.get("/api/cron/publish", { headers: { authorization: `Bearer ${E2E_CRON_SECRET}` } })).json();
  expect(again.published).not.toContainEqual({ resource: "solutions", id: Number(id) });
  const site = await request.get("/apac/therapies/drivewire");
  expect(await site.text()).toContain("Scheduled title");
});

test("media library: upload, variants, usage guard", async ({ page, request }) => {
  await login(page);
  await page.goto("/admin/media");
  const name = `e2e-${Date.now()}.png`;
  await page.setInputFiles('input[type=file]', { name, mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64") });
  await expect(page.getByText(name.replace(".png", ""))).toBeVisible();
  const uploaded = sql(`select id from media where filename like '${name.replace(".png", "")}%'`);
  expect(sql(`select jsonb_array_length(variants) from media where id=${uploaded}`)).toBe("1"); // 1×1 px → single variant
  expect((await page.request.delete(`/api/admin/media?id=${uploaded}`)).status()).toBe(200);
  const inUse = sql("select m.id from media m where exists (select 1 from team_members t where t.photo_url = m.url) limit 1");
  expect(inUse).not.toBe("");
  const del = await page.request.delete(`/api/admin/media?id=${inUse}`);
  expect(del.status()).toBe(409);
  void request;
});

test("invite → welcome link → two-step sign-in set up on the first visit → a recovery code works", async ({ page, browser }) => {
  test.setTimeout(120_000);
  sql(`delete from users where email='invited@e2e.test'`);
  await login(page);
  await page.goto("/admin/users");
  await page.getByRole("button", { name: "Invite a person" }).click();
  const dlg = page.getByRole("dialog", { name: "Invite a person" });
  await dlg.getByLabel("Email").fill("invited@e2e.test");
  await dlg.getByLabel("Name").fill("Noa B");
  await dlg.getByLabel(/Designer/).check();
  await dlg.getByRole("button", { name: "Send invite" }).click();
  const link = await dlg.getByLabel("Invite link").inputValue();
  expect(link).toMatch(/\/admin\/welcome\?token=[a-f0-9]{64}$/);
  await dlg.getByRole("button", { name: "Done" }).click();
  await page.reload();
  await expect(page.locator('[data-person="invited@e2e.test"]')).toContainText("Waiting for sign-in");
  // the same email again
  await page.getByRole("button", { name: "Invite a person" }).click();
  await dlg.getByLabel("Email").fill("invited@e2e.test");
  await dlg.getByLabel("Name").fill("Noa B");
  await dlg.getByRole("button", { name: "Send invite" }).click();
  await expect(dlg).toContainText("Already has access");

  const noa = await (await browser.newContext()).newPage();
  await noa.goto(new URL(link).pathname + new URL(link).search);
  await expect(noa.getByRole("heading", { name: "Welcome, Noa B" })).toBeVisible();
  await noa.getByLabel("Password").fill("noa-password-123456");
  await noa.click('button:has-text("Continue")');
  await noa.waitForURL(/\/admin\/login\/setup$/);
  // nothing else opens until two-step sign-in is on
  await noa.goto("/admin/editor");
  await expect(noa).toHaveURL(/\/admin\/login\/setup$/);
  expect((await noa.request.get("/api/admin/media")).status()).toBe(401);
  const key = (await noa.getByTestId("totp-key").textContent())!.trim();
  await noa.getByLabel("Your password").fill("noa-password-123456");
  await freshCodeWindow(noa);
  await noa.getByLabel("Code from the app").fill(totp(key));
  await noa.getByRole("button", { name: "Turn on" }).click();
  const codes = (await noa.getByLabel("Recovery codes").textContent())!.trim().split("\n");
  expect(codes).toHaveLength(8);
  expect(noa.url()).not.toContain(codes[0]); // never in the address
  await noa.getByRole("link", { name: "Continue" }).click();
  await noa.waitForURL(/\/admin\/start$/);
  expect(sql("select role from users where email='invited@e2e.test'")).toBe("designer");

  // the invite link is used up
  const again = await (await browser.newContext()).newPage();
  await again.goto(new URL(link).pathname + new URL(link).search);
  await expect(again.getByRole("heading", { name: "This link has expired" })).toBeVisible();

  // next sign-in: password, then a recovery code instead of the app
  await again.goto("/admin/login");
  await again.fill("input[name=email]", "invited@e2e.test");
  await again.fill("input[name=password]", "noa-password-123456");
  await again.click('button:has-text("Sign in")');
  await again.waitForURL(/\/admin\/login\/2fa/);
  await again.fill("input[name=code]", codes[0]);
  await again.click('button:has-text("Verify")');
  await again.waitForURL(/\/admin\/start$/);
  expect(sql(`select jsonb_array_length(recovery_codes) from users where email='invited@e2e.test'`)).toBe("7");
  await again.goto("/admin/account");
  await expect(again.getByRole("button", { name: "Set up on a new phone" })).toBeVisible();
  await expect(again.getByRole("button", { name: "Disable" })).toHaveCount(0);

  await page.reload();
  await expect(page.locator('[data-person="invited@e2e.test"]')).toContainText("On");
  sql(`delete from users where email='invited@e2e.test'`);
});

test("security: uploads by content, redirects stay on the site, two-step codes are limited", async ({ page, browser }) => {
  await login(page);
  // a page named and typed as a picture, and an SVG with a script, are refused
  const html = await page.request.post("/api/admin/upload", { multipart: { file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("<!doctype html><script>alert(1)</script>") } } });
  expect(html.status()).toBe(400);
  const svg = await page.request.post("/api/admin/upload", { multipart: { file: { name: "x.svg", mimeType: "image/svg+xml", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>') } } });
  expect(await svg.json()).toEqual({ error: "This SVG contains scripts" });
  // a real picture with a lying name gets the extension of what it is
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
  const ok = await (await page.request.post("/api/admin/upload", { multipart: { file: { name: "e2e-sniff.html", mimeType: "text/html", buffer: png } } })).json();
  expect(ok.url).toMatch(/\.png$/);
  const served = await page.request.get(ok.url);
  expect(served.headers()["x-content-type-options"]).toBe("nosniff");
  expect((await page.request.delete(`/api/admin/media?id=${ok.id}`)).status()).toBe(200);

  // redirects from parameters never leave the site
  for (const url of ["/api/preview?exit=1&redirect=https://evil.example", "/api/preview?exit=1&redirect=/%5Cevil.example", "/api/editor?on=1&redirect=/%5Cevil.example"]) {
    const r = await page.request.get(url, { maxRedirects: 0 });
    expect(new URL(r.headers()["location"], "http://localhost:3100").host).toBe("localhost:3100");
  }
  await page.goto("/admin/login?next=/%5Cevil.example");
  expect(new URL(page.url()).host).toBe("localhost:3100");

  // five wrong codes from the phone: the session is closed, the password is needed again
  const p2 = await (await browser.newContext()).newPage();
  await p2.goto("/admin/login");
  await p2.fill("input[name=email]", ADMIN.email);
  await p2.fill("input[name=password]", ADMIN.password);
  await p2.click('button:has-text("Sign in")');
  await p2.waitForURL(/\/admin\/login\/2fa/);
  for (let i = 0; i < 5; i++) {
    await p2.fill("input[name=code]", "000000");
    await Promise.all([p2.waitForResponse((r) => r.request().method() === "POST"), p2.click('button:has-text("Verify")')]);
    await p2.waitForLoadState("networkidle");
  }
  await expect(p2).toHaveURL(/\/admin\/login\?error=throttled/);
  await expect(p2.getByText("Too many attempts")).toBeVisible();
  sql(`delete from login_attempts where key = 'totp:' || (select id from users where email='${ADMIN.email}')`);
});

test("login throttling", async ({ page }) => {
  for (let i = 0; i < 9; i++) {
    await page.goto("/admin/login");
    await page.fill("input[name=email]", ADMIN.email);
    await page.fill("input[name=password]", "wrong");
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/error=/);
  }
  expect(new URL(page.url()).searchParams.get("error")).toBe("throttled");
  sql("delete from login_attempts");
});

test("activity log records actions", async ({ page }) => {
  await login(page);
  await page.goto("/admin/activity");
  await expect(page.locator("tbody td span", { hasText: /^publish$/ }).first()).toBeVisible();
  await expect(page.locator("tbody td span", { hasText: /^login_failed$/ }).first()).toBeVisible();
});

test("on-page editor: inline text edit → pending → publish; Home is a site page", async ({ page, browser }) => {
  await login(page);
  await page.goto("/api/editor?on=1&redirect=/ous/therapies/lvo");
  await page.waitForURL(/\/ous\/therapies\/lvo/);
  await expect(page.locator("#rm-editor-ui")).toBeAttached();
  await expect(page.locator("h1 [data-e]")).toBeVisible();

  const h1 = page.locator("h1 [data-e]");
  await h1.click();
  await expect(h1).toHaveAttribute("contenteditable", /plaintext-only|true/);
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("Inline edited title");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Saved. Not live yet");
  expect(sql("select data->'blocks'->0->'data'->>'title' from drafts where resource='solutions'")).toBe("Inline edited title");

  const anon = await (await browser.newContext()).newPage();
  await anon.goto("/ous/therapies/lvo");
  await expect(anon.locator("h1")).toHaveText("A patient-centric approach to AIS");
  await expect(anon.locator("[data-e]")).toHaveCount(0);

  await publishFromEditor(page);
  await anon.reload();
  await expect(anon.locator("h1")).toHaveText("Inline edited title");

  // restore via the editor
  await page.locator("h1 [data-e]").click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("A patient-centric approach to AIS");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Saved. Not live yet");
  await publishFromEditor(page);

  // Home is a site page (ADR-007): its numbers are in its block list, the change waits in drafts until Publish
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("Live");
  const stat = page.locator('[data-e*="stats.0.value"]');
  await stat.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("99K+");
  await page.keyboard.press("Enter");
  const statIn = (table: string) => `select b->'data'->'stats'->0->>'value' from ${table}, jsonb_array_elements(blocks) b where b->>'type'='textMedia' and b->>'variant'='statement'`;
  await expect.poll(() => sql(statIn("(select data->'blocks' as blocks from drafts where resource='site-pages') d"))).toBe("99K+");
  expect(sql(statIn("(select blocks from site_pages where key='home') s"))).toBe("50K+");
  await page.click('#rm-editor-ui button:has-text("Publish")');
  await page.click('[role=dialog] button:has-text("Discard all changes")');
  await page.click('[role=dialog] button:has-text("Click again to discard all")');
  await expect.poll(() => sql("select count(*) from drafts where resource='site-pages'")).toBe("0");

  // exit
  await page.goto("/api/editor?off=1&redirect=/");
  await expect(page.locator("[data-e]")).toHaveCount(0);
});

test("user walk 2026-11-14: a draft is deleted from its own page; a request names the page before the form", async ({ page }) => {
  await login(page);
  await page.goto("/admin/news/new");
  await page.getByLabel(/^Title/).fill("E2E draft to delete");
  await page.getByLabel(/^Date/).fill("2026-11-14");
  await page.getByLabel(/^External link/).fill("https://example.com/e2e");
  await page.getByRole("button", { name: "Create draft" }).click();
  await page.waitForURL(/\/admin\/news\/\d+/);
  await expect(page.getByText("Status", { exact: true })).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete draft" }).click();
  await page.waitForURL(/\/admin\/news\?bulk=delete&n=1/);
  expect(sql("select count(*) from news_items where title = 'E2E draft to delete'")).toBe("0");

  // a published item has no Delete draft: Unpublish first
  const live = sql("select id from news_items where status = 'published' order by id limit 1");
  await page.goto(`/admin/news/${live}`);
  await expect(page.getByRole("button", { name: "Delete draft" })).toHaveCount(0);

  // the therapy whose «Request a demo» led to the form is in the request
  await page.goto("/us/therapies/lvo");
  await page.getByRole("link", { name: "Request a demo" }).first().click();
  await page.waitForURL(/\/contact-us/);
  const form = page.locator("form[data-form]").first();
  await form.locator("input[name=firstName]").fill("Walk");
  await form.locator("input[name=lastName]").fill("Tester");
  await form.locator("input[name=email]").fill("walk@example.com");
  await form.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(/Thank you/)).toBeVisible();
  const id = sql("select id from contact_submissions where email = 'walk@example.com' order by id desc limit 1");
  expect(sql(`select meta->>'previous_page' from contact_submissions where id = ${id}`)).toBe("/us/therapies/lvo");
  await page.goto(`/admin/submissions/${id}`);
  await expect(page.getByText("Page before the form")).toBeVisible();
  sql(`delete from contact_submissions where id = ${id}`);
});
