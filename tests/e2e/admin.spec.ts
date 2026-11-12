import { test, expect } from "@playwright/test";
import { login, sql, ADMIN, totp } from "./helpers";

test.describe.configure({ mode: "serial" });

test("login, dashboard, list filters", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.goto("/admin/solutions?region=apac");
  await expect(page.locator("tbody tr")).toHaveCount(5);
});

test("editing a live record creates pending changes, preview shows them, publish goes live", async ({ page, browser }) => {
  await login(page);
  const id = sql("select id from solutions where region='ous' and slug='lvo'");
  await page.goto(`/admin/solutions/${id}`);
  await expect(page.locator("select[name=status]")).toHaveCount(0); // live record: status via panel
  // page content is edited on the page (ADR-007): the form keeps basics and SEO only
  await expect(page.locator("input[name=heroTitle]")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Edit on page ✎" }).first()).toBeVisible();
  const anon = await (await browser.newContext()).newPage();
  await anon.goto("/ous/therapies/lvo");
  const originalTitle = await anon.title();

  await page.fill("input[name=metaTitle]", "E2E pending title");
  await page.click('button:has-text("Save")');
  await page.waitForURL(/pending=1/);

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

test("approval workflow blocks editors from publishing", async ({ page, browser }) => {
  sql(`update site_settings set value='{"requireApproval": true}' where key='workflow'`);
  sql(`insert into users(email,name,password_hash,role) values ('editor@e2e.test','Editor',(select password_hash from users where email='${ADMIN.email}'),'editor') on conflict (email) do nothing`);
  const id = sql("select id from solutions where region='us' and slug='lvo'");
  const ed = await (await browser.newContext()).newPage();
  await login(ed, "editor@e2e.test", ADMIN.password);
  await ed.goto(`/admin/solutions/${id}`);
  await ed.fill("textarea[name=metaDescription]", "Changed by editor");
  await ed.click('button:has-text("Save")');
  await ed.waitForURL(/pending=1/);
  await expect(ed.locator('button:has-text("Publish changes")')).toBeDisabled();
  await ed.click('button:has-text("Submit for review")');
  await ed.waitForURL(/review=in_review/);

  await login(page); // admin
  await page.goto("/admin");
  await expect(page.getByText("In review")).toBeVisible();
  await page.goto(`/admin/solutions/${id}`);
  await page.click('button:has-text("Approve")');
  await page.waitForURL(/review=approved/);
  await page.click('button:has-text("Publish changes")');
  await page.waitForURL(/published=1/);
  sql(`update site_settings set value='{"requireApproval": false}' where key='workflow'`);
});

test("scheduled publishing via cron", async ({ page, request }) => {
  await login(page);
  const id = sql("select id from solutions where region='apac' and slug='drivewire'");
  await page.goto(`/admin/solutions/${id}`);
  await page.fill("input[name=metaTitle]", "Scheduled title");
  await page.click('button:has-text("Save")');
  await page.waitForURL(/pending=1/);
  await page.fill("input[name=publishAt]", "2020-01-01T00:00");
  await page.click('button:has-text("Set")');
  await page.waitForURL(/scheduled=1/);
  const res = await (await request.get("/api/cron/publish")).json();
  expect(res.published).toContainEqual({ resource: "solutions", id: Number(id) });
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

test("two-factor: enable, enforce, recovery code", async ({ page, browser }) => {
  await login(page);
  await page.goto("/admin/account?setup=1");
  const secret = await page.locator("input[name=secret]").inputValue();
  await page.fill("input[name=code]", totp(secret));
  await page.click('button:has-text("Turn on")');
  await page.waitForURL(/codes=/);
  const codes = decodeURIComponent(new URL(page.url()).searchParams.get("codes")!).split(",");
  expect(codes).toHaveLength(8);

  const fresh = await (await browser.newContext()).newPage();
  await fresh.goto("/admin/login");
  await fresh.fill("input[name=email]", ADMIN.email);
  await fresh.fill("input[name=password]", ADMIN.password);
  await fresh.click('button:has-text("Sign in")');
  await fresh.waitForURL(/\/admin\/login\/2fa/);
  await fresh.fill("input[name=code]", codes[0]);
  await fresh.click('button:has-text("Verify")');
  await fresh.waitForURL(/\/admin$/);
  expect(sql(`select jsonb_array_length(recovery_codes) from users where email='${ADMIN.email}'`)).toBe("7");
  sql(`update users set totp_secret=null,totp_enabled_at=null,recovery_codes='[]' where email='${ADMIN.email}'`);
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

test("on-page editor: inline text edit → pending → publish; settings draft", async ({ page, browser }) => {
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
  await expect(page.getByText("1 pending change on this page")).toBeVisible();
  expect(sql("select data->'blocks'->0->'data'->>'title' from drafts where resource='solutions'")).toBe("Inline edited title");

  const anon = await (await browser.newContext()).newPage();
  await anon.goto("/ous/therapies/lvo");
  await expect(anon.locator("h1")).toHaveText("A patient-centric approach to AIS");
  await expect(anon.locator("[data-e]")).toHaveCount(0);

  await page.click('#rm-editor-ui button:has-text("Publish")');
  await expect(page.getByText("No pending changes on this page")).toBeVisible();
  await anon.reload();
  await expect(anon.locator("h1")).toHaveText("Inline edited title");

  // restore via the editor
  await page.locator("h1 [data-e]").click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("A patient-centric approach to AIS");
  await page.keyboard.press("Enter");
  await expect(page.getByText("1 pending change on this page")).toBeVisible();
  await page.click('#rm-editor-ui button:has-text("Publish")');
  await expect(page.getByText("No pending changes on this page")).toBeVisible();

  // settings-backed page (home): draft table, then publish
  await page.goto("/");
  const stat = page.locator('[data-e*="stats.0.value"]');
  await stat.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("99K+");
  await page.keyboard.press("Enter");
  await expect(page.getByText("1 pending change on this page")).toBeVisible();
  expect(sql("select value->'stats'->0->>'value' from setting_drafts where key='home'")).toBe("99K+");
  expect(sql("select value->'stats'->0->>'value' from site_settings where key='home'")).toBe("50K+");
  page.once("dialog", (d) => d.accept());
  await page.click('#rm-editor-ui button:has-text("Discard")');
  await expect(page.getByText("No pending changes on this page")).toBeVisible();
  expect(sql("select count(*) from setting_drafts")).toBe("0");

  // exit
  await page.goto("/api/editor?off=1&redirect=/");
  await expect(page.locator("[data-e]")).toHaveCount(0);
});
