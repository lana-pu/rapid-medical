import { test, expect } from "@playwright/test";
import { login, sql, ADMIN, totp, publishFromEditor } from "./helpers";

test.describe.configure({ mode: "serial" });

test("login, dashboard, list filters", async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/admin\/editor$/); // editors land on Pages
  await page.goto("/admin");
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

const addUser = (email: string, role: string) =>
  sql(`insert into users(email,name,password_hash,role) values ('${email}','${role}',(select password_hash from users where email='${ADMIN.email}'),'${role}') on conflict (email) do update set role='${role}'`);

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
    await ed.selectOption("select[name=status]", "published");
    await ed.click('button:has-text("Save")');
    await ed.waitForURL(/saved=1/);
    expect(sql(`select status from news_items where id=${id}`)).toBe("published");
    // Site settings without Branding, Integrations and Workflow
    await ed.goto("/admin/settings?group=integrations");
    await expect(ed.getByRole("link", { name: "Integrations" })).toHaveCount(0);
    await expect(ed.getByRole("link", { name: "Branding" })).toHaveCount(0);
    await expect(ed.getByRole("link", { name: "Workflow" })).toHaveCount(0);
    await expect(ed.locator("input[name=__group]").first()).toHaveValue("contact");
    // on the page: no layout choice for a section
    await ed.goto(`/api/editor?on=1&redirect=${encodeURIComponent("/apac/therapies/mvo")}`);
    await expect(ed.getByRole("status")).toHaveText(/Live|Draft/);
    await ed.evaluate(() => window.scrollTo(0, 0));
    await ed.mouse.click(8, 300);
    await expect(ed.locator("#rm-section-toolbar")).toBeVisible();
    await expect(ed.locator('#rm-section-toolbar select[aria-label="Layout"]')).toHaveCount(0);

    const de = await (await browser.newContext()).newPage();
    await login(de, "designer@e2e.test", ADMIN.password);
    await de.goto("/admin/settings?group=branding");
    await expect(de.locator("input[name=__group]").first()).toHaveValue("branding");
    await expect(de.getByRole("link", { name: "Integrations" })).toHaveCount(0);
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
    await page.click('button:has-text("Save")');
    await page.waitForURL(/pending=1/);
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
  await page.click('button:has-text("Save")');
  await page.waitForURL(/pending=1/);
  await page.fill("input[name=publishAt]", "2020-01-01T00:00");
  await page.click('button:has-text("Set")');
  await page.waitForURL(/scheduled=1/);
  const res = await (await request.get("/api/cron/publish")).json();
  expect(res.published).toContainEqual({ resource: "solutions", id: Number(id) });
  // the schedule went with the draft: the next run does not publish it again
  expect(sql(`select count(*) from drafts where resource='solutions' and record_id=${id}`)).toBe("0");
  const again = await (await request.get("/api/cron/publish")).json();
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
  await fresh.waitForURL(/\/admin\/editor$/);
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
