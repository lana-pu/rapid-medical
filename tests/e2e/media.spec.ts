import { test, expect } from "@playwright/test";
import { login, sql } from "./helpers";

/** Media library: replace everywhere as unpublished changes, describe pictures (docs/screens/admin-media.md). */
test.describe.configure({ mode: "serial" });

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

test("replace a picture everywhere: unpublished changes on each page, visitors see the old one until Publish", async ({ page, browser }) => {
  test.setTimeout(120_000);
  await login(page);
  // a picture used on a therapy page
  const row = sql(
    "select m.id || '|' || m.url || '|' || s.region || '/' || s.slug from media m join solutions s on s.blocks::text like '%' || m.url || '\"%' where m.mime like 'image/%' and s.status = 'published' order by m.id limit 1",
  );
  const [id, url, where] = row.split("|");
  const places = Number(sql(`select count(*) from solutions where blocks::text like '%${url}"%'`));
  expect(places).toBeGreaterThan(0);

  await page.goto(`/admin/media?id=${id}`);
  await page.getByRole("button", { name: "Replace everywhere" }).click();
  const dlg = page.getByRole("dialog", { name: /^Replace / });
  await dlg.locator("input[type=file]").setInputFiles({ name: `e2e-replace-${Date.now()}.png`, mimeType: "image/png", buffer: PNG });
  await expect(dlg.getByRole("button", { name: "Replace", exact: true })).toBeEnabled();
  await expect(dlg.getByLabel(/Add as unpublished changes/)).toBeChecked();
  await dlg.getByRole("button", { name: "Replace", exact: true }).click();
  await expect(dlg).toContainText("as unpublished changes");
  await expect(dlg.getByText("Not live yet").first()).toBeVisible();

  const newUrl = sql("select url from media where filename like 'e2e-replace-%' order by id desc limit 1");
  // drafts hold the new file, live pages still the old one
  expect(Number(sql(`select count(*) from drafts where resource='solutions' and data::text like '%${newUrl}%'`))).toBeGreaterThanOrEqual(places);
  expect(Number(sql(`select count(*) from solutions where blocks::text like '%${url}"%'`))).toBe(places);
  const anon = await (await browser.newContext()).newPage();
  const html = await (await anon.request.get(`/${where}`)).text();
  expect(html).toContain(url);
  expect(html).not.toContain(newUrl);

  // the old file is still in use (in the drafts too): it cannot be deleted
  expect((await page.request.delete(`/api/admin/media?id=${id}`)).status()).toBe(409);

  // clean up: the drafts, then the uploaded file itself (no longer used anywhere)
  sql(`delete from drafts where data::text like '%${newUrl}%'`);
  const newId = sql(`select id from media where url = '${newUrl}'`);
  expect((await page.request.delete(`/api/admin/media?id=${newId}`)).status()).toBe(200);
});

test("describe pictures: filter, queue, Enter saves and moves on", async ({ page }) => {
  await login(page);
  const before = Number(sql("select count(*) from media where mime like 'image/%' and alt = ''"));
  expect(before).toBeGreaterThan(1);
  await page.goto("/admin/media");
  await expect(page.getByRole("link", { name: `Describe pictures (${before})` })).toBeVisible();
  await page.getByRole("link", { name: /Describe pictures/ }).click();
  await expect(page.getByRole("status")).toHaveText(`${before} left`);
  const first = page.getByRole("textbox", { name: /^Description of / }).first();
  const name = (await first.getAttribute("aria-label"))!.replace("Description of ", "");
  await first.fill("E2E: device on a white background");
  await first.press("Enter");
  await expect(page.getByRole("status")).toHaveText(`${before - 1} left`);
  await expect(page.getByRole("textbox", { name: /^Description of / }).first()).toBeFocused();
  expect(sql(`select alt from media where filename = '${name}'`)).toBe("E2E: device on a white background");
  sql(`update media set alt = '' where filename = '${name}'`);
});

test("library in order: groups by where files are used, a page by its sections, unused files deleted after a list", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);
  await page.goto("/admin/media");
  const groups = page.getByRole("navigation", { name: "Media groups" });
  await expect(groups.getByRole("link", { name: /^Not used/ })).toBeVisible({ timeout: 20_000 });
  await expect(groups.getByRole("link", { name: /^Large vessel stroke/ })).toBeVisible();

  // a therapy page: its files under the sections of the page
  await groups.getByRole("link", { name: /^Large vessel stroke/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Large vessel stroke" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("region").first()).toBeVisible();
  await expect(page.getByText(/^On Large vessel stroke/).first()).toBeVisible();

  // a fresh upload is not used anywhere: select it in «Not used» and delete after the list
  const name = `e2e-unused-${Date.now()}`;
  await page.goto("/admin/media");
  await page.setInputFiles("input[type=file]", { name: `${name}.png`, mimeType: "image/png", buffer: PNG });
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 20_000 });
  await page.goto(`/admin/media?show=unused&q=${name}`);
  await page.getByRole("checkbox", { name: new RegExp(`^Select ${name}`) }).check();
  await page.getByRole("button", { name: /^Delete selected \(1\)/ }).click();
  const dlg = page.getByRole("dialog", { name: "Delete files" });
  await expect(dlg).toContainText(name);
  await dlg.getByRole("button", { name: "Delete 1" }).click();
  await expect(page.getByText("Every file is used somewhere.")).toBeVisible({ timeout: 20_000 });
  expect(sql(`select count(*) from media where filename like '${name}%'`)).toBe("0");
});
