import { test, expect } from "@playwright/test";
import { login, sql, ADMIN, totp, freshCodeWindow, publishFromEditor, TOTP_SECRET, TWO_STEP_SQL } from "./helpers";
import { E2E_CRON_SECRET } from "./secrets";

test.describe.configure({ mode: "serial" });

test("login → choose a project; the project in the header; its dashboard; the Inbox is mail; list filters", async ({ page }) => {
  sql(`delete from contact_submissions where email='home@example.com'`); // left by an earlier failed run
  sql(`insert into contact_submissions(form,first_name,last_name,email,status,message) values ('contact','E2E','Home','home@example.com','new','Please call me back')`);
  await login(page);
  // the project picker: no project tools yet (docs/screens/admin-choose.md)
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: /^Hello, / })).toBeVisible();
  await expect(page.getByRole("region", { name: "Projects" })).toContainText("Training tool");
  await expect(page.getByRole("navigation", { name: "Admin spaces" })).toHaveCount(0);
  await page.getByRole("region", { name: "Projects" }).getByRole("link", { name: /Website/ }).click();
  // inside the project: its name in the header with the way back, its spaces on the rail, its dashboard
  await expect(page).toHaveURL(/\/admin\/website$/);
  await expect(page.getByRole("banner")).toContainText("Website");
  await expect(page.getByRole("navigation", { name: "Admin spaces" }).getByRole("link", { name: /^Home/ })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("navigation", { name: "Quick actions" }).getByRole("link", { name: "+ News item" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Site health" })).toContainText(/pictures? without a description/); // not a message: on the dashboard
  await expect(page.getByRole("region", { name: "Coming up" })).toBeVisible();
  // the header's arrow is Back (to the picker we came from); «Rapid Medical» is the way to the projects from anywhere
  await page.getByRole("banner").getByRole("link", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/inbox");
  await page.getByRole("banner").getByRole("link", { name: /Rapid Medical/ }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 20_000 });
  await page.goto("/admin/website");
  await page.getByRole("link", { name: /unread messages? in the Inbox/ }).click();
  await expect(page).toHaveURL(/\/admin\/inbox$/);
  // the Inbox: messages only, like mail
  const inbox = page.getByRole("navigation", { name: "Inbox" });
  const msg = inbox.getByRole("link", { name: /E2E Home/ }).first();
  await expect(msg).toContainText("Please call me back");
  await msg.click();
  await expect(page).toHaveURL(/\/admin\/submissions\/\d+$/);
  await expect(page.locator("main")).toContainText("home@example.com");
  // opened = read, like mail
  await expect.poll(() => sql(`select read_at is not null from contact_submissions where email='home@example.com'`)).toBe("t");
  await inbox.getByRole("tab", { name: /^Unread/ }).click();
  await expect(inbox.getByRole("link", { name: /E2E Home/ })).toHaveCount(0);
  await expect(inbox.getByText(/pictures? without a description/)).toHaveCount(0);
  // Content: the tree and + New page
  await page.getByRole("navigation", { name: "Admin spaces" }).getByRole("link", { name: /^Content/ }).click();
  await expect(page.getByRole("navigation", { name: "Site" }).getByRole("link", { name: "Evidence", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "+ New page" }).click();
  await expect(page.getByRole("dialog")).toBeVisible(); // the template choice opens straight away
  sql(`delete from contact_submissions where email='home@example.com'`);
  await page.goto("/admin/solutions?region=apac");
  await expect(page.locator("tbody tr")).toHaveCount(5);
});

test("editing a live record creates pending changes, preview shows them, publish goes live", async ({ page, browser }) => {
  test.setTimeout(120_000); // the longest walk of the suite; under load it passes 60 s
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

test("requests: opened = read; Reply opens the ready email and marks who answers; Done, notes as a thread; filters", async ({ page }) => {
  sql(`delete from contact_submissions where email='req@example.com'`);
  sql(`insert into contact_submissions(form,topic,first_name,last_name,organization,email,region,status,message) values ('contact','Request a demo','Laura','Mendes','Hospital São José','req@example.com','Americas','new','Please call me back')`);
  const id = sql("select id from contact_submissions where email='req@example.com'");
  try {
    await login(page);
    await page.goto("/admin/submissions");
    await expect(page.getByRole("tab", { name: /New/, selected: true })).toBeVisible();
    await page.getByText("Laura Mendes, Hospital São José").click();
    await expect(page.getByRole("heading", { name: "Request a demo" })).toBeVisible();
    await expect.poll(() => sql(`select read_at is not null from contact_submissions where id=${id}`)).toBe("t");
    await expect(page.getByLabel("Request state")).toContainText("New · nobody answers");
    // the ready email: to, subject, greeting, the quoted message
    const reply = page.getByRole("link", { name: /Reply/ });
    const href = decodeURIComponent((await reply.getAttribute("href")) ?? "");
    expect(href).toMatch(/^mailto:req@example\.com\?/);
    expect(href).toContain("subject=Re: Request a demo — Rapid Medical");
    expect(href).toContain("Dear Laura Mendes,");
    expect(href).toContain("> Please call me back");
    // Reply marks me as the one who answers, In progress (the mail program itself is not opened in the test)
    await reply.evaluate((a) => a.addEventListener("click", (e) => e.preventDefault(), { once: true }));
    await reply.click();
    await expect.poll(() => sql(`select status || '|' || (assigned_to_id is not null) from contact_submissions where id=${id}`)).toBe("in_progress|true");
    await expect(page.getByLabel("Request state")).toContainText("In progress · you answer");
    // a note for the team: one more entry of the thread
    await page.getByLabel("New note").fill("Called back, demo on Friday");
    await page.getByRole("button", { name: "Add note" }).click();
    await expect(page.getByRole("region", { name: "Notes for the team" })).toContainText("Called back, demo on Friday");
    expect(sql(`select count(*) from request_notes where submission_id=${id}`)).toBe("1");
    // mine, in progress
    await page.goto("/admin/submissions?status=in_progress&mine=1&form=contact");
    await expect(page.getByText("Laura Mendes, Hospital São José")).toBeVisible();
    await page.goto("/admin/submissions?status=in_progress&form=webinar");
    await expect(page.getByText("Laura Mendes, Hospital São José")).toHaveCount(0);
    // Done at once, without Save; then Reopen
    await page.goto(`/admin/submissions/${id}`);
    await page.getByRole("button", { name: "✓ Done" }).click();
    await expect(page.getByRole("button", { name: "Reopen" })).toBeVisible();
    expect(sql(`select status from contact_submissions where id=${id}`)).toBe("done");
    // who answers: saved as soon as it is chosen
    await page.getByLabel("Who answers").selectOption("");
    await expect.poll(() => sql(`select assigned_to_id is null from contact_submissions where id=${id}`)).toBe("t");
  } finally {
    sql(`delete from contact_submissions where id=${id}`);
  }
});

test("the admin: functions on a rail, the site as a tree with collections; page screens; section screens", async ({ page }) => {
  await login(page);
  await page.goto("/admin/website");
  // functions apart from navigation (docs/screens/admin-sections.md → «Меню слева»)
  // four spaces; the site tree only in Content (docs/admin-ia.md)
  const rail = page.getByRole("navigation", { name: "Admin spaces" });
  for (const s of [/^Content/, /^Inbox/, /^Media/, /^Settings/]) await expect(rail.getByRole("link", { name: s })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Site" })).toHaveCount(0); // the Inbox has its own column
  await rail.getByRole("link", { name: /^Settings/ }).click();
  await expect(page).toHaveURL(/\/admin\/settings$/, { timeout: 20_000 });
  const settings = page.getByRole("navigation", { name: "Settings" });
  // Settings opens on an overview in blocks; the column has the same groups (docs/screens/admin-settings.md)
  for (const g of ["On the site", "Search & sharing", "Team", "You"]) await expect(page.getByRole("region", { name: g })).toBeVisible();
  await expect(settings.getByRole("link", { name: "Old links" })).toBeVisible();
  await settings.getByRole("link", { name: "Contact details" }).click();
  await expect(page.getByRole("region", { name: "Where requests go" })).toBeVisible(); // the form in blocks
  await settings.getByRole("link", { name: "Old links" }).click();
  await page.getByRole("navigation", { name: "Old links" }).getByRole("link", { name: "Redirects" }).click();
  await expect(page).toHaveURL(/\/admin\/redirects$/);
  await expect(settings.getByRole("link", { name: "Old links" })).toHaveAttribute("aria-current", "page");
  await settings.getByRole("link", { name: "Activity log" }).click();
  await expect(page).toHaveURL(/\/admin\/activity$/);
  await rail.getByRole("link", { name: /^Content/ }).click();

  // the site tree: every page once, collections under their page, marked
  const tree = page.getByRole("navigation", { name: "Site" });
  for (const s of ["Home", "Therapies", "Evidence", "Webinars", "News & Events", "Careers", "Contact Us", "Menu and footer"]) await expect(tree.getByRole("link", { name: s, exact: true })).toBeVisible();
  await expect(tree.getByRole("link", { name: "Large vessel stroke", exact: true })).toHaveCount(1);
  await expect(tree.getByRole("link", { name: /^▤?\s*Publications/ })).toContainText("▤");

  // a page screen: one screen — regions, performance, Google, files, details (docs/screens/admin-sections.md)
  await tree.getByRole("link", { name: "Medium vessel stroke", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/page\/therapies\/mvo$/);
  await expect(page.getByRole("heading", { name: "Medium vessel stroke", level: 1 })).toBeVisible();
  const regions = page.getByRole("region", { name: "Regions" });
  await expect(regions.getByRole("listitem", { name: "Americas" })).toContainText("No version"); // MVO is not in the Americas
  await expect(regions.getByRole("listitem", { name: "Americas" }).getByRole("button", { name: /^Create from / })).toBeVisible();
  await expect(regions.getByRole("link", { name: "Edit on page" })).toHaveCount(2);
  await expect(regions.getByRole("listitem", { name: "Europe & Middle East" })).toContainText(/On the site|Changes not published yet|Not on the site yet/);
  await expect(page.getByRole("region", { name: "Performance" })).toContainText(/page views|No visits counted here yet/);
  await expect(page.getByRole("region", { name: "Google" }).getByRole("link", { name: "Edit in Search & sharing" })).toHaveAttribute("href", /\/admin\/seo\?page=%2Ftherapies%2Fmvo$/);
  await expect(page.getByRole("complementary", { name: "Details" })).toContainText("/ous/therapies/mvo");
  await expect(page.getByRole("navigation", { name: "Page tabs" })).toHaveCount(0); // no tabs any more
  // a link for a LinkedIn post, tagged with the campaign
  await page.getByRole("button", { name: "Copy link for a post" }).click();
  const post = page.getByRole("dialog", { name: "Link for a post" });
  await post.getByLabel("Campaign name").fill("ESMINT 2026 recap");
  await expect(post.getByLabel("Link")).toHaveValue(/\/therapies\/mvo\?utm_source=linkedin&utm_medium=social&utm_campaign=esmint-2026-recap$/);
  await post.getByRole("button", { name: "Close" }).click();
  // a region's Settings: the record's form under the page's header; regions switch; back to the page
  await regions.getByRole("listitem", { name: "Europe & Middle East" }).getByRole("link", { name: "Settings" }).click();
  await expect(page.locator("input[name=metaTitle]")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
  await expect(page.getByRole("group", { name: "Region" }).getByRole("link", { name: "Europe & Middle East" })).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "← Page" }).click();
  await expect(page).toHaveURL(/\/admin\/page\/therapies\/mvo$/);
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Therapies" }).click();
  await expect(page.getByRole("heading", { name: "Therapies", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Pages under it" })).toHaveCount(0); // the tree shows them

  // a collection opens its records
  await tree.getByRole("link", { name: /Publications/ }).click();
  await expect(page).toHaveURL(/\/admin\/publications$/);
  await page.goto("/admin/page/news-events");
  await expect(page.getByRole("region", { name: "Collections on this page" })).toContainText("News");

  // section screens stay reachable by address
  await page.goto("/admin/site/therapies");
  await expect(page.locator('[data-cell="lvo:us"]')).toContainText("Edit on page");
  await expect(page.locator('[data-cell="mvo:us"]')).toHaveText("No version");
  await page.goto("/admin/site/other");
  await expect(page.getByRole("heading", { name: "Legal — linked from the footer" })).toBeVisible();
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
    await expect(ed.locator("input[name=__group]").first()).toHaveValue("contact");
    await ed.goto("/admin/settings?group=navigation"); // the menu's structure: designers
    await expect(ed.locator("input[name=__group]").first()).toHaveValue("contact");
    // on the page: no layout choice for a section
    await ed.goto(`/api/editor?on=1&redirect=${encodeURIComponent("/apac/therapies/mvo")}`);
    await expect(ed.getByRole("status")).toHaveText(/Live|Draft/);
    await ed.getByRole("navigation", { name: "Editor tools" }).getByRole("button", { name: "Sections" }).click();
    await ed.evaluate(() => window.scrollTo(0, 0));
    await ed.mouse.click((ed.viewportSize()?.width ?? 1280) - 12, 300);
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
    await de.goto("/admin/settings?group=navigation");
    await expect(de.locator("input[name=__group]").first()).toHaveValue("navigation");
    await de.goto(`/api/editor?on=1&redirect=${encodeURIComponent("/apac/therapies/mvo")}`);
    await expect(de.getByRole("status")).toHaveText(/Live|Draft/);
    await de.getByRole("navigation", { name: "Editor tools" }).getByRole("button", { name: "Sections" }).click();
    await de.evaluate(() => window.scrollTo(0, 0));
    await de.mouse.click((de.viewportSize()?.width ?? 1280) - 12, 300);
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
  await expect(page.getByText(name.replace(".png", ""))).toBeVisible({ timeout: 20_000 }); // the upload makes variants: slow under load
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
  await noa.waitForURL(/\/admin$/);
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
  await again.waitForURL(/\/admin$/);
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
  // in words, not codes: changes first, sign-ins in their own view (docs/screens/admin-activity.md)
  await expect(page.getByRole("listitem").filter({ hasText: / published / }).first()).toBeVisible();
  await expect(page.getByText(/\{"/)).toHaveCount(0); // no raw JSON
  await page.getByRole("navigation", { name: "Activity views" }).getByRole("link", { name: "Sign-ins" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: /failed to sign in/ }).first()).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: /signed in/ }).first()).toBeVisible();
});

test("on-page editor: inline text edit → pending → publish; Home is a site page", async ({ page, browser }) => {
  test.setTimeout(150_000); // two publishes and the home page: slower than 60 s on a loaded machine
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
  await expect(page.getByRole("status")).toHaveText("Live", { timeout: 20_000 }); // the page info loads after the page
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
  await form.locator("select[name=countryCode]").selectOption("DE"); // Country is required on the new Contact Us
  await form.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(/Thank you/)).toBeVisible();
  const id = sql("select id from contact_submissions where email = 'walk@example.com' order by id desc limit 1");
  expect(sql(`select meta->>'previous_page' from contact_submissions where id = ${id}`)).toBe("/us/therapies/lvo");
  await page.goto(`/admin/submissions/${id}`);
  // the message first; how they found the site is folded away (docs/screens/admin-requests.md)
  await expect(page.getByText("Page before the form")).toBeHidden();
  await page.getByText("How they found us").click();
  await expect(page.getByText("Page before the form")).toBeVisible();
  sql(`delete from contact_submissions where id = ${id}`);
});

test("analytics: the site counts visits without cookies (not bots, not the team); sources and requests on the screen", async ({ page, browser, request }) => {
  test.setTimeout(120_000);
  sql("delete from page_views");
  // a visitor from a LinkedIn post: one visit, its source and campaign
  // a real browser's name: headless browsers are left out like bots
  const visitor = await (await browser.newContext({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" })).newPage();
  await visitor.goto("/us/therapies/lvo?utm_source=linkedin&utm_medium=social&utm_campaign=e2e-post");
  await expect.poll(() => sql("select count(*) from page_views where visit and source='LinkedIn' and utm_campaign='e2e-post'")).toBe("1");
  await visitor.goto("/us/evidence"); // a second page of the same visit: a view, not a visit
  await expect.poll(() => sql("select count(*) from page_views where kind='view'")).toBe("2");
  expect(sql("select count(*) from page_views where visit")).toBe("1");
  expect(sql("select count(*) from page_views where path like '/us/%' and country is null and region='us'")).toBe("2");
  // no cookie of ours on the visitor
  expect((await visitor.context().cookies()).map((c) => c.name)).not.toContain("rm_visit");
  // a bot is not counted
  const bot = await request.post("/api/track", { headers: { "user-agent": "Googlebot/2.1", "content-type": "application/json" }, data: { k: "view", p: "/", v: true } });
  expect(bot.status()).toBe(204);
  expect(sql("select count(*) from page_views")).toBe("2");
  // only the site's own pages are counted (security review 2026-11-15)
  const ua = { "user-agent": "Mozilla/5.0 Chrome/131.0", "content-type": "application/json" };
  for (const p of ["/admin/users", "//evil.example/x", "/API/track", "/us/%2e%2e/admin", "/us/../admin"]) expect((await request.post("/api/track", { headers: ua, data: { k: "view", p, v: false } })).status()).toBe(400);
  expect(sql("select count(*) from page_views")).toBe("2");

  // the team's own visits are not counted; the screen shows where people came from
  await login(page);
  await page.goto("/us/therapies/lvo");
  await page.waitForLoadState("networkidle");
  expect(sql("select count(*) from page_views")).toBe("2");
  await page.goto("/admin/analytics?days=7");
  await expect(page.getByText(/LinkedIn brought 1 visit/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Where people come from" })).toContainText("LinkedIn");
  await expect(page.getByRole("region", { name: "LinkedIn posts and campaigns" })).toContainText("e2e-post");
  await expect(page.getByRole("region", { name: "Most visited pages" })).toContainText("Large vessel stroke (Americas)");
  await page.goto("/admin/website");
  // numbers from the first day, with since when they are counted and where the old site's visits are
  const week = page.getByRole("link", { name: "This week — open analytics" });
  await expect(week).toContainText("visits");
  await expect(week).toContainText(/Visits counted since/);
  await expect(page.getByRole("region", { name: "This week" }).getByRole("link", { name: /Google Analytics/ })).toBeVisible();
  // a counter older than the week: no «since», visits compared with last week
  sql(`insert into page_views(kind,path,visit,at) values ('view','/',false, now() - interval '8 days')`);
  await page.reload();
  await expect(week).not.toContainText(/counted since/);
  sql("delete from page_views");
});

test("inbox: every folder shown; Subscribed with the Mailchimp list; what leaves the site is named with its clicks", async ({ page, browser, request }) => {
  test.setTimeout(120_000);
  sql(`delete from contact_submissions where email like '%@sub.example'`);
  sql(`delete from events where slug='e2e-outside'`);
  sql(`delete from page_views where kind='out'`);
  sql(`insert into contact_submissions(form,topic,first_name,last_name,email,opt_in,status,created_at) values
    ('webinar','DISTALS update','Sub','Old','ann@sub.example',true,'done', now() - interval '2 days'),
    ('contact','Request a demo','Sub','New','Ann@sub.example',true,'new', now()),
    ('contact','Spam','Sub','Spam','spam@sub.example',true,'spam', now())`);
  sql(`insert into events(slug,title,starts_on,registration,registration_url,status) values ('e2e-outside','E2E outside congress', now() + interval '30 days','link','https://example.org/register','published')`);

  // a visitor clicks Register on the event page: only the page is counted (no destination, no cookie)
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" });
  await ctx.route("https://example.org/**", (r) => r.fulfill({ body: "ok" }));
  const visitor = await ctx.newPage();
  await visitor.goto("/events/e2e-outside");
  await visitor.getByRole("link", { name: "Register" }).click();
  await expect.poll(() => sql("select count(*) from page_views where kind='out' and path='/events/e2e-outside'")).toBe("1");
  await ctx.close();
  // a leave is counted only on an event or a job page
  const ua = { "user-agent": "Mozilla/5.0 Chrome/131.0", "content-type": "application/json" };
  expect((await request.post("/api/track", { headers: ua, data: { k: "out", p: "/us/therapies/lvo" } })).status()).toBe(400);

  await login(page);
  await page.goto("/admin/inbox");
  const inbox = page.getByRole("navigation", { name: "Inbox" });
  // two levels: the state (tabs) and which form it came from (every form of the site in one list)
  for (const f of ["Inbox", "Unread", "In progress", "Done", "Spam", "All"])
    await expect(inbox.getByRole("tab", { name: new RegExp(`^${f}`) })).toBeVisible();
  const from = inbox.getByLabel("Which form");
  for (const f of ["All sources", "Contact Us — contact form", "Webinars — recording requests", "Careers & jobs — applications", "Events — registrations", "Notes on pages", "Subscribed to news"])
    await expect(from.locator("option", { hasText: f })).toHaveCount(1);
  // like Gmail: no message open — the list takes the whole width, no reading pane
  await expect(page.getByRole("main")).toHaveCount(0);
  // Events: the outside registration, with its clicks
  await from.selectOption("event");
  await expect(inbox.getByRole("link", { name: /E2E outside congress — outside the site/ })).toContainText("Registration on example.org");
  await expect(inbox.getByRole("link", { name: /E2E outside congress/ })).toContainText("1 click on Register");
  // Subscribed to news, all states: one person (two requests, one address), spam left out; the export has them once
  await inbox.getByRole("tab", { name: /^All/ }).click();
  await from.selectOption("subscribed");
  await expect(inbox.getByRole("link", { name: /Sub New/ })).toBeVisible();
  await expect(inbox.getByRole("link", { name: /Sub Old/ })).toBeVisible(); // done, still subscribed
  await expect(inbox.getByRole("link", { name: /Sub Spam/ })).toHaveCount(0);
  // opening a message narrows the list beside it; the filters stay
  await inbox.getByRole("link", { name: /Sub New/ }).click();
  await expect(page).toHaveURL(/\/admin\/submissions\/\d+$/);
  await expect(page.getByRole("main")).toContainText("Ann@sub.example");
  await expect(from).toHaveValue("subscribed");
  await expect(inbox.getByRole("link", { name: /Sub Old/ })).toBeVisible();
  const csv = await (await page.request.get("/api/admin/submissions.csv?subscribed=1")).text();
  expect(csv.match(/ann@sub\.example/gi)).toHaveLength(1);
  expect(csv).not.toContain("spam@sub.example");
  expect(csv.split("\r\n")[0]).toContain("email,firstName,lastName");

  sql(`delete from contact_submissions where email like '%@sub.example'`);
  sql(`delete from events where slug='e2e-outside'`);
  sql(`delete from page_views where kind='out'`);
});

test("back goes where you came from: a record's Back, the header arrow, the editor's ←; a direct link — the page above", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);
  await page.goto("/admin/page/evidence");
  // the page screen → + New publication → Back: to the page screen, not the collection's list
  await page.getByRole("listitem", { name: "Publications" }).getByRole("link", { name: "+ New publication" }).click();
  await expect(page).toHaveURL(/\/admin\/publications\/new$/);
  await page.getByRole("link", { name: "← Back" }).click();
  await expect(page).toHaveURL(/\/admin\/page\/evidence$/);
  // the header arrow is Back too
  await page.getByRole("navigation", { name: "Admin spaces" }).getByRole("link", { name: /^Inbox/ }).click();
  await expect(page).toHaveURL(/\/admin\/inbox$/);
  await page.getByRole("banner").getByRole("link", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/page\/evidence$/);
  // the editor's ← returns to the admin page it was opened from, after moving between pages in it
  await page.getByRole("listitem", { name: "Americas" }).getByRole("link", { name: "Edit on page" }).click();
  await expect(page).toHaveURL(/\/us\/evidence/);
  await page.getByRole("link", { name: "Back to the admin" }).click();
  await expect(page).toHaveURL(/\/admin\/page\/evidence$/);
  // opened by a direct link (a new tab): Back has nothing behind it — the page above
  const fresh = await page.context().newPage();
  await fresh.goto("/admin/publications/new");
  await fresh.getByRole("link", { name: "← Back" }).click();
  await expect(fresh).toHaveURL(/\/admin\/publications$/);
  await fresh.close();
});

test("page screen: Publish from the page; a new address keeps the old one working (a redirect); Create from a region", async ({ page, request }) => {
  test.setTimeout(120_000);
  sql(`delete from redirects where "from" in ('/e2e-move','/e2e-moved')`);
  sql(`delete from pages where slug in ('e2e-move','e2e-moved')`);
  sql(`insert into pages(slug,title,status,meta_title) values ('e2e-move','E2E move','published','E2E move | Rapid Medical')`);
  const id = sql(`select id from pages where slug='e2e-move'`);
  // a pending change of the address (as the Settings form leaves it)
  sql(`insert into drafts(resource,record_id,data,updated_by_name) values ('pages',${id},'{"slug":"e2e-moved","title":"E2E move"}','E2E')`);
  try {
    await login(page);
    await page.goto("/admin/page/e2e-move");
    const row = page.getByRole("region", { name: "Regions" }).getByRole("listitem").first();
    await expect(row).toContainText("Changes not published yet");
    await row.getByRole("button", { name: "Publish" }).click();
    // back on the page's screen, at its new address
    await expect(page).toHaveURL(/\/admin\/page\/e2e-moved\?published=/);
    await expect(page.getByText("is published")).toBeVisible();
    expect(sql(`select "to" from redirects where "from"='/e2e-move'`)).toBe("/e2e-moved");
    const old = await request.get("/e2e-move", { maxRedirects: 0 });
    expect([301, 308]).toContain(old.status());
    expect(old.headers()["location"]).toMatch(/\/e2e-moved$/);
    await expect(page.getByRole("complementary", { name: "Details" })).toContainText(/moved it to \/e2e-moved/);
  } finally {
    sql(`delete from redirects where "from" in ('/e2e-move','/e2e-moved')`);
    sql(`delete from drafts where resource='pages' and record_id=${id}`);
    sql(`delete from pages where id=${id}`);
  }

  // Create from a region: a draft copy, the screen stays on the page
  await page.goto("/admin/page/therapies/mvo");
  const americas = page.getByRole("region", { name: "Regions" }).getByRole("listitem", { name: "Americas" });
  await americas.getByRole("button", { name: /^Create from / }).click();
  await expect(page).toHaveURL(/\/admin\/page\/therapies\/mvo\?created=us/);
  await expect(page.getByRole("region", { name: "Regions" }).getByRole("listitem", { name: "Americas" })).toContainText("Not on the site yet");
  sql(`delete from solutions where region='us' and slug='mvo'`);
});

test("page screen: files with previews; differences between regions with previews, edited in place", async ({ page }) => {
  test.setTimeout(120_000);
  const apac = sql(`select id from solutions where region='apac' and slug='lvo'`);
  sql(`delete from drafts where resource='solutions' and record_id=${apac}`);
  try {
    await login(page);
    await page.goto("/admin/page/therapies/lvo");
    // files: PDFs with Preview, pictures as thumbnails; a click shows the file large
    const files = page.getByRole("region", { name: "Files on this page" });
    await expect(files.getByRole("list", { name: "Pictures and videos" }).locator("img").first()).toBeVisible();
    await files.getByRole("button", { name: "Preview" }).first().click();
    await expect(page.getByRole("dialog", { name: /^Preview: .+\.pdf$/ }).locator("iframe")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: /^Preview:/ })).toHaveCount(0);

    // the second view: what differs between the regions, only the differences by default
    await page.getByRole("navigation", { name: "Page views" }).getByRole("link", { name: "Differences between regions" }).click();
    await expect(page).toHaveURL(/\?view=regions$/);
    await expect(page.getByRole("button", { name: /^Only differences/ })).toHaveAttribute("aria-pressed", "true");
    const table = page.locator("table");
    // Asia & Pacific is not in use now: hidden at first, the eye brings it back
    const regionsGroup = page.getByRole("group", { name: "Regions in the table" });
    await expect(regionsGroup.getByRole("button", { name: /Asia & Pacific/ })).toHaveAttribute("aria-pressed", "false");
    await expect(table.locator("thead")).not.toContainText("Asia & Pacific");
    await regionsGroup.getByRole("button", { name: /Asia & Pacific/ }).click();
    for (const r of ["Americas", "Europe & Middle East", "Asia & Pacific"]) await expect(table.locator("thead")).toContainText(r);
    // each group is a section of the page, with a way to see it there
    await expect(table.getByRole("link", { name: /^Show on page/ }).first()).toHaveAttribute("href", /#section-\d+$/);
    // a text of Asia & Pacific edited in place: saved as that region's unpublished change
    const heads = await table.locator("thead th").allInnerTexts();
    const col = heads.findIndex((h) => h.startsWith("Asia & Pacific")) + 1; // columns follow the region menu
    const cell = table.locator(`tbody tr[aria-label] td:nth-child(${col}) button[title='Click to edit']`).first();
    await cell.click();
    const box = table.getByRole("textbox").first();
    await box.fill("E2E text for Asia & Pacific");
    await box.press("Enter");
    await expect.poll(() => sql(`select (data::text like '%E2E text for Asia & Pacific%')::text from drafts where resource='solutions' and record_id=${apac}`)).toBe("true");
    await expect(table.locator("thead")).toContainText("unpublished changes");
    await expect(table).toContainText("E2E text for Asia & Pacific");
    // the eye: a region leaves the table and stays hidden after a reload; a click brings it back
    await table.getByRole("button", { name: "Hide Europe & Middle East" }).click();
    await expect(table.locator("thead")).not.toContainText("Europe & Middle East");
    await page.reload();
    await expect(page.locator("table thead")).not.toContainText("Europe & Middle East");
    await page.getByRole("group", { name: "Regions in the table" }).getByRole("button", { name: /Europe & Middle East/ }).click();
    await expect(page.locator("table thead")).toContainText("Europe & Middle East");
  } finally {
    sql(`delete from drafts where resource='solutions' and record_id=${apac}`);
  }
});

test("search & sharing: every page's Google texts in one place; a page's text waits for Publish, a list page's is live at once", async ({ page, request }) => {
  test.setTimeout(150_000);
  const home = sql(`select meta_description from site_pages where key='home'`);
  const news = sql(`select coalesce(value->>'newsDescription','') from site_settings where key='seo'`);
  try {
    await login(page);
    await page.goto("/admin/seo?page=%2F");
    const pagesNav = page.getByRole("navigation", { name: "Pages" });
    for (const s of ["Home", "Therapies", "Evidence", "Contact Us"]) await expect(pagesNav).toContainText(s);
    // Home: its own record — saved as an unpublished change, live after Publish
    const box = page.getByRole("region", { name: "Google texts — All regions" });
    await box.getByLabel(/Description in Google/).fill("E2E home description for Google.");
    await expect(box).toContainText("E2E home description for Google."); // the preview follows
    await box.getByRole("button", { name: "Save" }).click();
    await expect(box.getByRole("status")).toContainText("goes live when this page is published", { timeout: 20_000 }); // the screen re-reads every page
    await page.reload();
    await page.getByRole("region", { name: "Google texts — All regions" }).getByRole("button", { name: /^Publish/ }).click();
    await expect(page).toHaveURL(/\/admin\/seo\?page=%2F&published=/, { timeout: 20_000 });
    await expect.poll(async () => (await (await request.get("/")).text()).includes("E2E home description for Google.")).toBe(true);
    // the same field in the page's own Settings
    const id = sql(`select id from site_pages where key='home'`);
    await page.goto(`/admin/site-pages/${id}`);
    await expect(page.locator("textarea[name=metaDescription]")).toHaveValue("E2E home description for Google.");
    // News & Events: kept in Settings — live at once
    await page.goto("/admin/seo?page=%2Fnews-events");
    const list = page.getByRole("region", { name: "Google texts — All regions" });
    await list.getByLabel(/Description in Google/).fill("E2E news description.");
    await list.getByRole("button", { name: "Save" }).click();
    await expect(list.getByRole("status")).toContainText("live on the site", { timeout: 20_000 });
    await expect.poll(async () => (await (await request.get("/news-events")).text()).includes("E2E news description.")).toBe(true);
  } finally {
    sql(`update site_pages set meta_description='${home.replace(/'/g, "''")}' where key='home'`);
    sql(`delete from drafts where resource='site-pages' and record_id=(select id from site_pages where key='home')`);
    sql(`update site_settings set value = jsonb_set(value, '{newsDescription}', to_jsonb('${news.replace(/'/g, "''")}'::text)) where key='seo'`);
  }
});
