// Собрать PDF атласа. Запуск из проекта с Playwright: node build-pdf.cjs <страница.html> <папка с img/> <выход.pdf>
// Экраны ужимаются (shrink-img.py), иначе PDF не влезает в лимит 15 МБ на файл артефакта.
const path = require('path'), fs = require('fs'), os = require('os');
const { execFileSync } = require('child_process');
const { chromium } = require(path.join(process.cwd(), 'node_modules/playwright'));
(async () => {
  const [page, imgRoot, out] = process.argv.slice(2);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-'));
  if (fs.existsSync(path.join(imgRoot, 'img'))) execFileSync('python3', [path.join(__dirname, 'shrink-img.py'), path.join(imgRoot, 'img'), path.join(dir, 'img')]);
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0">${fs.readFileSync(page, 'utf8')}</body></html>`);
  const b = await chromium.launch({ channel: 'chrome' });
  try {
    const p = await b.newPage({ viewport: { width: 1200, height: 900 }, colorScheme: 'light' });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(dir, 'index.html') + '#all'); await p.waitForTimeout(1500);
    await p.evaluate(async () => {
      const imgs = [...document.images]; imgs.forEach(i => { i.loading = 'eager'; });
      await Promise.all(imgs.map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    });
    await p.emulateMedia({ media: 'print', colorScheme: 'light' });
    await p.pdf({ path: out, format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
      displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: '<div style="font-size:8px;color:#888;width:100%;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>' });
    console.log(out, (fs.statSync(out).size / 1048576).toFixed(1) + ' МБ', errs.length ? errs : 'без ошибок');
  } finally { await b.close(); }
})();
