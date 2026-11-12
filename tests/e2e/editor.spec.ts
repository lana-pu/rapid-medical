import { test, expect, type Page } from "@playwright/test";
import { login, sql, publishFromEditor } from "./helpers";

/** Page editor: sections, review, history, regions, conflicts, Pages list (docs/screens/on-page-editor.md, admin-editor-pages.md). */
test.describe.configure({ mode: "serial" });

const PAGE = "/apac/therapies/mvo";
const ids = (page: Page) => page.evaluate(() => Array.from(document.querySelectorAll("[data-rm-b]")).map((e) => JSON.parse(e.getAttribute("data-rm-b") || "{}").id as string));

async function open(page: Page, path = PAGE) {
  await page.goto(`/api/editor?on=1&redirect=${encodeURIComponent(path)}`);
  await page.waitForURL((u) => u.pathname === path);
  await expect(page.getByRole("status")).toHaveText(/Live|Draft/);
}

/** Click an empty spot of the n-th section (left gutter): selects it. */
async function selectSection(page: Page, n: number) {
  const y = await page.evaluate((i) => {
    const marks = Array.from(document.querySelectorAll("[data-rm-b]"));
    const r = document.createRange();
    r.setStartAfter(marks[i]);
    r.setEndBefore(marks[i + 1]);
    window.scrollBy(0, r.getBoundingClientRect().top - 200);
    const b = r.getBoundingClientRect();
    return b.top + Math.min(b.height / 2, 120);
  }, n);
  await page.mouse.click(8, y);
  await expect(page.locator("#rm-section-toolbar")).toBeVisible();
}

test("sections: add from presets, edit its text, move, undo, delete; the regulatory block stays", async ({ page, browser }) => {
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
  sql(`insert into users(email,name,password_hash,role) values ('second@e2e.test','Second editor',(select password_hash from users where email='e2e@rapid-medical.com'),'editor') on conflict (email) do nothing`);
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
  await expect(page.getByRole("status")).toHaveText(/Live/);
});

test("Pages: search, open in the editor, new page from a template", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();
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
