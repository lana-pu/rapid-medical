import { test, expect, type Page } from "@playwright/test";
import { login, sql, publishFromEditor, TOTP_SECRET, TWO_STEP_SQL } from "./helpers";

/** Page editor: sections, review, history, regions, conflicts, Pages list (docs/screens/on-page-editor.md, admin-editor-pages.md). */
test.describe.configure({ mode: "serial" });

const PAGE = "/apac/therapies/mvo";
/** Marks of the page's own sections (sections inside Product details tabs have a list `l`). */
const pageMarks = `Array.from(document.querySelectorAll("[data-rm-b]")).filter((e) => !JSON.parse(e.getAttribute("data-rm-b") || "{}").l)`;
const ids = (page: Page) => page.evaluate((q) => (eval(q) as Element[]).map((e) => JSON.parse(e.getAttribute("data-rm-b") || "{}").id as string), pageMarks);

async function open(page: Page, path = PAGE) {
  await page.goto(`/api/editor?on=1&redirect=${encodeURIComponent(path)}`);
  await page.waitForURL((u) => u.pathname === path);
  await expect(page.getByRole("status")).toHaveText(/Live|Draft/);
}

/** Click an empty spot of the n-th section (left gutter): selects it. */
async function selectSection(page: Page, n: number) {
  const y = await page.evaluate(([i, q]) => {
    const marks = eval(q as string) as Element[];
    const r = document.createRange();
    r.setStartAfter(marks[i]);
    r.setEndBefore(marks[i + 1]);
    window.scrollBy(0, r.getBoundingClientRect().top - 200);
    const b = r.getBoundingClientRect();
    return b.top + Math.min(b.height / 2, 120);
  }, [n, pageMarks] as const);
  await page.mouse.click(8, y);
  await expect(page.locator("#rm-section-toolbar")).toBeVisible();
}

test("sections: add from presets, edit its text, move, undo, delete; the regulatory block stays", async ({ page, browser }) => {
  test.setTimeout(150_000);
  await login(page);
  await open(page);
  const before = await ids(page);

  // add after the first section
  await selectSection(page, 0);
  await page.locator("button[data-rm-plus]").filter({ hasText: "Add section" }).nth(1).click();
  await page.getByRole("complementary", { name: "Add section" }).getByRole("button", { name: /Circles/ }).click();
  await expect(page.getByRole("status")).toHaveText("Added Key numbers. Not live yet");
  await expect.poll(async () => (await ids(page)).length).toBe(before.length + 1);
  const added = (await ids(page))[1];
  expect(before).not.toContain(added);
  await expect(page.locator("#rm-section-toolbar")).toContainText("Key numbers");

  // its sample text is editable like any other
  const v = page.locator('[data-e*="blocks.1.data.items.0.value"]');
  await v.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("47%");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Saved. Not live yet");

  // move it down, then undo the move
  await page.locator('#rm-section-toolbar button[aria-label="Move down"]').click();
  await expect.poll(async () => (await ids(page))[2]).toBe(added);
  await page.getByRole("button", { name: "↶ Undo" }).click();
  await expect.poll(async () => (await ids(page))[1]).toBe(added);
  // redo puts the move back, undo takes it away again
  await page.getByRole("button", { name: "↷ Redo" }).click();
  await expect.poll(async () => (await ids(page))[2]).toBe(added);
  await expect(page.getByRole("button", { name: "↷ Redo" })).toBeDisabled();
  await page.keyboard.press("ControlOrMeta+Z");
  await expect.poll(async () => (await ids(page))[1]).toBe(added);

  // visitors still see the old page
  const anon = await (await browser.newContext()).newPage();
  await anon.goto(PAGE);
  await expect(anon.getByText("47%")).toHaveCount(0);

  // review lists the change in words, then publish
  await page.click('#rm-editor-ui button:has-text("Publish")');
  await expect(page.getByRole("dialog", { name: "Review changes" })).toContainText("Added section Key numbers");
  await page.click('[role=dialog] button:has-text("Publish now")');
  await expect(page.getByRole("dialog", { name: "Live now" })).toContainText(PAGE);
  await page.click('[role=dialog] button:has-text("Keep editing")');
  await anon.reload();
  await expect(anon.getByText("47%")).toBeVisible();

  // the regulatory block (last) cannot be removed or moved
  const all = await ids(page);
  await selectSection(page, all.length - 2);
  await expect(page.locator("#rm-section-toolbar")).toContainText("Indications");
  await expect(page.locator('#rm-section-toolbar button:has-text("Delete")')).toBeDisabled();
  await expect(page.locator('#rm-section-toolbar button[aria-label="Move up"]')).toBeDisabled();

  // delete the added section and publish: the page is as before
  await open(page);
  await selectSection(page, 1);
  await page.locator('#rm-section-toolbar button:has-text("Delete")').click();
  await expect(page.getByRole("status")).toHaveText(/^Deleted Key numbers/);
  await publishFromEditor(page);
  expect(await ids(page)).toEqual(before);
});

/** Sections inside the open Product details tab: [{ id, l, t }] in page order. */
const tabSections = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-rm-b]"))
      .map((e) => JSON.parse(e.getAttribute("data-rm-b") || "{}") as { id: string; l?: string; t?: string })
      .filter((m) => m.l && m.id !== "end" && /^[^/]+\/0$/.test(m.l)),
  );

/** Click an empty spot (no editable text, no button or link) inside a section of a tab: selects that section. */
async function selectInTab(page: Page, id: string) {
  const p = await page.evaluate((want) => {
    const marks = Array.from(document.querySelectorAll<HTMLElement>("[data-rm-b]"));
    const i = marks.findIndex((m) => JSON.parse(m.getAttribute("data-rm-b") || "{}").id === want);
    const l = JSON.parse(marks[i].getAttribute("data-rm-b") || "{}").l as string;
    const end = marks.slice(i + 1).find((m) => {
      const x = JSON.parse(m.getAttribute("data-rm-b") || "{}").l ?? "";
      return x === l || x.startsWith(`${l}/`);
    })!;
    const r = document.createRange();
    r.setStartAfter(marks[i]);
    r.setEndBefore(end);
    window.scrollBy(0, r.getBoundingClientRect().top - 250);
    const b = r.getBoundingClientRect();
    for (let y = b.top + 2; y < b.bottom; y += 6)
      for (let x = b.left + 2; x < b.right; x += 12) {
        const el = document.elementFromPoint(x, y);
        if (el && !el.closest("[data-e],a,button,#rm-editor-ui")) return { x, y };
      }
    return null;
  }, id);
  expect(p).not.toBeNull();
  await page.mouse.click(p!.x, p!.y);
  await expect(page.locator("#rm-section-toolbar")).toBeVisible();
}

test("sections inside a product tab: add only tab blocks, move, review in words, delete", async ({ page }) => {
  test.setTimeout(150_000);
  await login(page);
  await open(page);
  const before = await tabSections(page);
  expect(before.length).toBeGreaterThan(0);
  const pageIds = await ids(page);

  await selectInTab(page, before[0].id);
  await page.locator("button[data-rm-plus]").filter({ hasText: "Add section to this tab" }).nth(1).click();
  const panel = page.getByRole("complementary", { name: "Add section to this tab" });
  await expect(panel.getByRole("heading", { name: "Hero" })).toHaveCount(0); // a banner cannot go inside a tab
  await panel.getByRole("button", { name: /Circles/ }).click();
  await expect(page.getByRole("status")).toHaveText("Added Key numbers. Not live yet");
  await expect.poll(async () => (await tabSections(page)).length).toBe(before.length + 1);
  expect((await tabSections(page))[1].t).toBe("keyNumbers");
  await expect(page.locator("#rm-section-toolbar")).toContainText("Key numbers");
  expect(await ids(page)).toEqual(pageIds); // the page's own sections are as they were

  // move it up: it is the first in the tab now and stays selected
  await page.locator('#rm-section-toolbar button[aria-label="Move up"]').click();
  await expect.poll(async () => (await tabSections(page))[0].t).toBe("keyNumbers");
  await expect(page.locator("#rm-section-toolbar")).toContainText("Key numbers");
  await expect(page.locator('#rm-section-toolbar button[aria-label="Move up"]')).toBeDisabled();

  await page.click('#rm-editor-ui button:has-text("Publish")');
  await expect(page.getByRole("dialog", { name: "Review changes" })).toContainText(/Added Key numbers.* in tab “/);
  await page.click('[role=dialog] button:has-text("Keep editing")');

  await page.locator('#rm-section-toolbar button:has-text("Delete")').click();
  await expect(page.getByRole("status")).toHaveText(/^Deleted Key numbers/);
  await expect.poll(async () => (await tabSections(page)).map((m) => m.t)).toEqual(before.map((m) => m.t));
  // the page is as it was: nothing to publish; drop the draft
  await page.click('#rm-editor-ui button:has-text("Publish")');
  await expect(page.locator('[role=dialog] button:has-text("Publish now")')).toBeDisabled();
  await page.click('[role=dialog] button:has-text("Discard all changes")');
  await page.click('[role=dialog] button:has-text("Click again to discard all")');
  await expect(page.getByRole("status")).toHaveText(/Changes discarded|^Live$/);
});

test("tabs of Product details: add, rename, move, delete; review says so", async ({ page }) => {
  test.setTimeout(150_000);
  await login(page);
  await open(page);
  // select Product details by its tab bar
  await page.getByRole("tab", { name: /Product overview/ }).first().click();
  await expect(page.locator("#rm-section-toolbar")).toContainText("Product details");
  await page.locator('#rm-section-toolbar button:has-text("Tabs")').click();
  const panel = page.getByRole("complementary", { name: "Tabs" });
  const before = await panel.getByRole("textbox", { name: /^Name of tab/ }).count();

  await panel.getByLabel("New tab name").fill("Sizes");
  await panel.getByRole("button", { name: "+ Add tab" }).click();
  await expect(page.getByRole("status")).toHaveText("Added tab Sizes. Not live yet");
  await expect(page.getByRole("tab", { name: "Sizes" })).toBeVisible();
  await expect(panel.getByRole("textbox", { name: /^Name of tab/ })).toHaveCount(before + 1);

  const last = panel.getByRole("textbox", { name: `Name of tab ${before + 1}` });
  await last.fill("Sizes and models");
  await last.press("Enter");
  await expect(page.getByRole("tab", { name: "Sizes and models" })).toBeVisible();
  await panel.getByRole("button", { name: "Move tab Sizes and models up" }).click();
  await expect(page.getByRole("status")).toHaveText("Moved a tab. Not live yet");

  await page.click('#rm-editor-ui button:has-text("Publish")');
  const review = page.getByRole("dialog", { name: "Review changes" });
  await expect(review).toContainText("Added tab “Sizes and models”");
  await page.click('[role=dialog] button:has-text("Keep editing")');

  const row = panel.locator("li", { has: page.getByRole("textbox", { name: /Name of tab/ }).and(page.locator('[value="Sizes and models"]')) });
  await row.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("tab", { name: "Sizes and models" })).toHaveCount(0);
  // nothing left to publish: drop the draft
  await page.click('#rm-editor-ui button:has-text("Publish")');
  await page.click('[role=dialog] button:has-text("Discard all changes")');
  await page.click('[role=dialog] button:has-text("Click again to discard all")');
});

test("menu and footer: a label changed on the page waits for Publish; Site settings start from the current menu", async ({ page, browser }) => {
  test.setTimeout(150_000);
  sql(`delete from site_settings where key='navigation'; delete from setting_drafts where key='navigation'`);
  try {
    await login(page);
    await page.goto("/admin/settings?group=navigation");
    await expect(page.getByRole("heading", { name: "Menu and footer" }).or(page.getByText("Menu and footer").first())).toBeVisible();
    await expect(page.locator('input[name="menu"], [name="menu"]').first()).toHaveValue(/Careers/);

    await open(page);
    const label = page.locator('header [data-e*="menu.5.label"]');
    await expect(label).toHaveText("Careers");
    await label.click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("Join us");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toHaveText("Saved. Not live yet");
    const anon = await (await browser.newContext()).newPage();
    await anon.goto("/about-us");
    await expect(anon.getByRole("navigation", { name: "Main" })).toContainText("Careers");
    await publishFromEditor(page);
    await anon.reload();
    await expect(anon.getByRole("navigation", { name: "Main" })).toContainText("Join us");
    await expect(anon.getByRole("navigation", { name: "Main" })).toContainText("About Us"); // the rest of the menu stays
    await expect(anon.locator("footer")).toContainText("Privacy Statement");
  } finally {
    sql(`delete from site_settings where key='navigation'; delete from setting_drafts where key='navigation'`);
  }
});

test("comments: on a section, a pin on the page, reply, resolve; listed on the admin home", async ({ page }) => {
  test.setTimeout(150_000);
  sql("delete from comments");
  await login(page);
  await open(page);
  await page.getByRole("button", { name: /^Comment/ }).click();
  const panel = page.getByRole("complementary", { name: "Comments" });
  await expect(panel).toContainText("No open comments on this page.");
  await panel.getByRole("button", { name: "Comment on a section" }).click();
  await page.mouse.click(8, 300); // the first section
  await expect(panel).toContainText(/Comment on Hero/);
  await panel.getByRole("textbox", { name: "Comment" }).fill("Check the claim with regulatory");
  await panel.getByRole("button", { name: "Comment", exact: true }).click();
  await expect(panel.locator("[data-comment]")).toContainText("Check the claim with regulatory");
  await expect(page.getByRole("button", { name: /^1 comment on Hero/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Comment (1)" })).toBeVisible();
  // nothing on the page changed: no unpublished changes
  await expect(page.getByRole("status")).toHaveText("Live");

  await panel.getByRole("textbox", { name: "Reply" }).fill("Done, see the footnote");
  await panel.getByRole("button", { name: "Reply", exact: true }).click();
  await expect(panel.locator("[data-comment]")).toContainText("Done, see the footnote");

  await page.goto("/admin");
  await expect(page.getByText(/1 open comment on /)).toBeVisible();

  await open(page);
  await page.getByRole("button", { name: /^1 comment on Hero/ }).click();
  await panel.getByRole("button", { name: "Resolve" }).click();
  await expect(panel).toContainText("No open comments on this page.");
  await expect(page.getByRole("button", { name: /comment on Hero/ })).toHaveCount(0);
  await panel.getByLabel("Show resolved").check();
  await expect(panel.locator("[data-comment]")).toContainText(/resolved by/);
  await panel.locator("[data-comment]").getByRole("button", { name: "Delete" }).last().click(); // the thread, with its reply
  await expect(panel.locator("[data-comment]")).toHaveCount(0);
  expect(sql("select count(*) from comments")).toBe("0");
});

test("history: restore an earlier version as a draft", async ({ page }) => {
  await login(page);
  await open(page);
  const h1 = page.locator("h1 [data-e]").first();
  const original = (await h1.innerText()).trim();
  await h1.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("History test title");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Saved. Not live yet");
  await publishFromEditor(page);

  await page.getByRole("button", { name: "History" }).click();
  const panel = page.getByRole("complementary", { name: "History" });
  await expect(panel).toContainText("Changed title in Hero");
  // the version before the change = the second "Published" entry
  await panel.locator("li", { hasText: "Published" }).nth(1).getByRole("button", { name: "Restore this version" }).click();
  await expect(page.getByRole("status")).toHaveText(/Version restored/);
  await expect(page.locator("h1")).toHaveText(original);
  await publishFromEditor(page);

  // restoring the version that is live leaves nothing to publish (UX walk 2026-11-14)
  await h1.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("Restore same test");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Saved. Not live yet");
  await page.getByRole("button", { name: "History" }).click();
  await page.getByRole("complementary", { name: "History" }).locator("li", { hasText: "Published" }).first().getByRole("button", { name: "Restore this version" }).click();
  await expect(page.getByRole("status")).toHaveText(/nothing to publish/);
  await expect(page.locator('#rm-editor-ui button:has-text("Publish")')).toBeDisabled();

  // restoring a version taken while live does not publish an unpublished page (Publish stays a step)
  const id = sql("select id from solutions where region='apac' and slug='mvo'");
  sql(`update solutions set status='draft' where id=${id}`);
  await open(page);
  await expect(page.getByRole("status")).toHaveText("Draft — not live yet");
  await page.getByRole("button", { name: "History" }).click();
  await page.getByRole("complementary", { name: "History" }).locator("li", { hasText: "Published" }).nth(1).getByRole("button", { name: "Restore this version" }).click();
  await expect(page.getByRole("status")).toHaveText(/Version restored/);
  expect(sql(`select status from solutions where id=${id}`)).toBe("draft");
  sql(`update solutions set status='published' where id=${id}`);
});

test("compare with another region and switch region", async ({ page }) => {
  await login(page);
  await open(page);
  await page.selectOption('select[aria-label="Compare with"]', "ous");
  await expect(page.getByRole("status")).toHaveText(/differ from Europe & Middle East|Same as Europe & Middle East/);
  await page.selectOption('select[aria-label="Region"]', "ous");
  await page.waitForURL(/\/ous\/therapies\/mvo/);
  await expect(page.getByRole("status")).toHaveText(/Live/);
});

test("two editors: the second save is refused, not silently overwritten", async ({ page, browser }) => {
  test.setTimeout(150_000); // two sign-ins and two editor loads
  sql(`insert into users(email,name,password_hash,role,totp_secret,totp_enabled_at) values ('second@e2e.test','Second editor',(select password_hash from users where email='e2e@rapid-medical.com'),'editor','${TOTP_SECRET}',now()) on conflict (email) do update set ${TWO_STEP_SQL}`);
  await login(page);
  await open(page);
  const other = await (await browser.newContext()).newPage();
  await login(other, "second@e2e.test", "e2e-password-123456");
  await open(other);

  // first editor changes the page
  await selectSection(page, 0);
  await page.locator('#rm-section-toolbar button:has-text("Copy")').click();
  await expect(page.getByRole("status")).toHaveText(/^Copied/);

  // second editor, with the old version, tries to change it too
  await selectSection(other, 0);
  await other.locator('#rm-section-toolbar button:has-text("Copy")').click();
  await expect(other.getByRole("dialog", { name: "Someone else changed this page" })).toContainText("Admin");

  // clean up
  await page.click('#rm-editor-ui button:has-text("Publish")');
  await page.click('[role=dialog] button:has-text("Discard all changes")');
  await page.click('[role=dialog] button:has-text("Click again to discard all")');
  await expect(page.getByRole("status")).toHaveText(/Live|Changes discarded/);
});

test("Pages: search, open in the editor, new page from a template", async ({ page }) => {
  await login(page);
  await page.goto("/admin/editor");
  await expect(page.getByRole("heading", { name: "Find a page" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Therapies" })).toBeVisible(); // grouped by the site's sections
  await page.getByRole("searchbox", { name: "Search pages" }).fill("aneurysm");
  await expect(page.locator("main ul > li").first()).toBeVisible();
  for (const t of await page.locator("main ul > li").allInnerTexts()) expect(t.toLowerCase()).toContain("aneurysm");
  await page.getByRole("searchbox", { name: "Search pages" }).fill("zzzz");
  await expect(page.getByText("No pages match")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();

  await page.getByRole("button", { name: "New page" }).click();
  const dlg = page.getByRole("dialog", { name: "New page" });
  await dlg.getByLabel(/Landing page/).check();
  await dlg.getByLabel("Name", { exact: true }).fill("E2E campaign");
  await dlg.getByRole("button", { name: "Create and open" }).click();
  await page.waitForURL(/\/us\/e2e-campaign$/);
  await expect(page.getByRole("status")).toHaveText("Draft — not live yet");
  await expect(page.locator("h1")).toHaveText("E2E campaign");

  // the same address again is refused
  await page.goto("/admin/editor");
  await page.getByRole("button", { name: "New page" }).click();
  await dlg.getByLabel("Name", { exact: true }).fill("E2E campaign");
  await dlg.getByRole("button", { name: "Create and open" }).click();
  await expect(dlg).toContainText("already exists in Americas");
  sql("delete from pages where slug='e2e-campaign'");
});

test("user walk 2026-11-14: the Statement media takes a picture or a video; the library opens above the panel", async ({ page }) => {
  await login(page);
  await open(page, "/");
  // the media slot of the Statement section names both fields: a picture goes to the picture, not into the video
  const slot = page.locator(".rm-e-media", { has: page.locator("video") }).first();
  const tag = JSON.parse((await slot.getAttribute("data-e")) ?? "{}") as { f: string; fv?: string };
  expect(tag.f).toMatch(/imageUrl$/);
  expect(tag.fv).toMatch(/videoUrl$/);
  await slot.scrollIntoViewIfNeeded();
  await slot.click();
  const panel = page.getByRole("complementary", { name: "Picture or video" });
  await expect(panel.locator("video")).toBeVisible(); // the current clip, not a broken picture
  await panel.getByRole("button", { name: "Replace image…" }).click();
  const lib = page.getByRole("dialog", { name: "Media library" });
  await expect(lib).toBeVisible();
  // nothing of the editor covers the library: its right edge is clickable
  const box = (await lib.locator("xpath=./div").boundingBox())!;
  const top = await page.evaluate(([x, y]) => (document.elementFromPoint(x, y)?.closest('[aria-label="Media library"]') ? "library" : "other"), [box.x + box.width - 20, box.y + 20]);
  expect(top).toBe("library");
  await page.keyboard.press("Escape");
});
