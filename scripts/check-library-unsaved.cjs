const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { chromium } = require(process.argv[2] || 'playwright');

const compile = (file) => ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 },
}).outputText;

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="root"></div>');
    for (const [pkg, file] of [['react', 'react.development.js'], ['react-dom', 'react-dom.development.js']]) {
      await page.addScriptTag({ path: path.join(path.dirname(require.resolve(`${pkg}/package.json`)), 'umd', file) });
    }
    await page.evaluate(({ hook, editor }) => {
      const modules = {
        react: window.React,
        'next/navigation': { useRouter: () => ({ refresh() {} }) },
        '@/components/admin/toast': { useToast: () => ({ success() {}, error() {} }) },
        './actions': new Proxy({}, { get: () => async () => ({ ok: true, id: 9 }) }),
      };
      const load = (code) => {
        const exports = {};
        new Function('require', 'exports', 'React', code)((key) => modules[key], exports, window.React);
        return exports;
      };
      modules['@/components/admin/use-unsaved-close'] = load(hook);
      const { LibraryAdminEditor } = load(editor);
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(LibraryAdminEditor, {
        categories: [{ id: 1, name: 'Travel', emoji: '', display_order: 0, is_hidden: false }],
        items: [{ id: 2, category_id: 1, name: 'Existing', display_order: 0,
          photos: [{ id: 3, url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', position: 0 }] }],
      }));
    }, {
      hook: compile('components/admin/use-unsaved-close.ts'),
      editor: compile('app/admin/(protected)/library/library-admin-editor.tsx'),
    });
    let prompts = 0;
    let accept = false;
    page.on('dialog', async (dialog) => {
      prompts++;
      assert.match(dialog.message(), /Perubahan belum disimpan/);
      await (accept ? dialog.accept() : dialog.dismiss());
    });
    const open = () => page.getByRole('button', { name: '+ Tambah Item', exact: true }).click();
    const close = () => page.getByRole('button', { name: 'Tutup modal' }).click();
    const description = () => page.getByPlaceholder('Ceritakan kenapa kamu suka ini...');
    const unloadPrevented = () => page.evaluate(() => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    });
    await open();
    await close();
    assert.equal(prompts, 0, 'Pristine form closes without a warning');
    await open();
    await description().fill('1. Baju\n2. Celana');
    assert.equal(await unloadPrevented(), true);
    await close();
    await page.getByRole('button', { name: 'Batal', exact: true }).click();
    await page.keyboard.press('Escape');
    await page.locator('div.fixed.inset-0').dispatchEvent('click');
    assert.equal(prompts, 4, 'All four modal close paths are guarded');
    assert.equal(await description().inputValue(), '1. Baju\n2. Celana');
    accept = true;
    await close();
    assert.equal(await page.locator('h2').count(), 0);
    assert.equal(await unloadPrevented(), false, 'Listener removed on close');
    accept = false;
    await open();
    await description().fill('changed');
    await description().fill('');
    const before = prompts;
    await close();
    assert.equal(prompts, before, 'Reverting text restores pristine state');
    await open();
    await page.getByPlaceholder('atau paste URL foto').fill('https://example.com/photo.jpg');
    await close();
    assert.equal(prompts, before + 1, 'Unsubmitted gallery URL is guarded');
    accept = true;
    await close();
    accept = false;
    await page.getByRole('button', { name: 'edit', exact: true }).last().click();
    await description().fill('Keep this text after deleting a photo');
    await page.getByRole('button', { name: 'Hapus foto', exact: true }).click();
    assert.equal(await description().inputValue(), 'Keep this text after deleting a photo');
    assert.equal(await page.getByRole('button', { name: 'Hapus foto', exact: true }).count(), 0);
    const beforeSave = prompts;
    await page.getByRole('button', { name: 'Simpan', exact: true }).click();
    await page.locator('h2').waitFor({ state: 'detached' });
    assert.equal(prompts, beforeSave, 'Successful save closes without discard prompt');
    await page.getByRole('button', { name: '+ Kategori baru', exact: true }).click();
    await page.getByPlaceholder('Vinyl Record').fill('New category');
    await close();
    assert.equal(prompts, beforeSave + 1, 'Category changes are guarded too');
    console.log('PASS: pristine/reverted forms, X/Cancel/Escape/backdrop, unload cleanup, gallery URL, photo deletion, save and category protection');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
