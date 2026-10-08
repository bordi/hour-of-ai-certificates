import './styles.css';
import { parseNames, MAX_NAMES } from './names';
import { decodeText, parseCsvNames } from './csv';
import { renderCertificates, type Assets } from './certificate';
import { certificateFileName } from './filenames';
import { buildZip } from './zip';
import { Preview } from './preview';
import { pluralUk } from './plural';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const textarea = $<HTMLTextAreaElement>('names');
const fileInput = $<HTMLInputElement>('file');
const count = $('count');
const status = $('status');
const generateBtn = $<HTMLButtonElement>('generate');
const downloadBtn = $<HTMLButtonElement>('download');
const printBtn = $<HTMLButtonElement>('print');
const pager = $('pager');
const pageLabel = $('page-label');
const preview = new Preview($<HTMLCanvasElement>('preview-canvas'));

let assets: Assets | null = null;
let generated: { names: string[]; combinedUrl: string } | null = null;
// Bumped on every list edit; async handlers capture it and bail if it changed.
let version = 0;
// Bumped on every file selection, so only the latest import may fill the list.
let importSeq = 0;

function setStatus(text: string, isError = false) {
  status.textContent = text;
  status.classList.toggle('error', isError);
}

function updatePager() {
  pager.hidden = !generated;
  pageLabel.textContent = `${preview.page} / ${preview.pageCount}`;
}

function invalidate() {
  version++;
  if (!generated) return;
  URL.revokeObjectURL(generated.combinedUrl);
  generated = null;
  downloadBtn.disabled = true;
  printBtn.disabled = true;
  updatePager();
  if (assets) void preview.show(assets.template);
  setStatus('Список змінено — сформуйте сертифікати ще раз.');
}

function updateCount() {
  count.textContent = `Учнів: ${parseNames(textarea.value).length}`;
}

textarea.addEventListener('input', () => {
  updateCount();
  invalidate();
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  fileInput.value = '';
  if (!file) return;
  const myImport = ++importSeq;
  const myVersion = version;
  const bytes = new Uint8Array(await file.arrayBuffer());
  // The teacher picked another file or edited the list while this one was loading.
  if (myImport !== importSeq || myVersion !== version) return;
  const names = parseCsvNames(decodeText(bytes));
  if (names.length === 0) {
    setStatus('У файлі не знайдено жодного імені.', true);
    return;
  }
  textarea.value = names.join('\n');
  textarea.dispatchEvent(new Event('input'));
  setStatus(`Завантажено ${names.length} ${pluralUk(names.length, 'ім’я', 'імені', 'імен')} з файлу «${file.name}». Перевірте список.`);
});

generateBtn.addEventListener('click', async () => {
  if (!assets) return;
  const names = parseNames(textarea.value);
  if (names.length === 0) return setStatus('Додайте хоча б одне ім’я.', true);
  if (names.length > MAX_NAMES) return setStatus(`Забагато імен: максимум ${MAX_NAMES}.`, true);

  const myVersion = version;
  const stale = () => myVersion !== version;
  generateBtn.disabled = true;
  setStatus('Формуємо сертифікати…');
  let url: string | null = null;
  try {
    const combined = await renderCertificates(assets, names);
    if (stale()) return;
    url = URL.createObjectURL(new Blob([combined as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }));
    await preview.show(combined);
    if (stale()) {
      // List changed while the preview loaded: discard and restore the blank template.
      URL.revokeObjectURL(url);
      url = null;
      await preview.show(assets.template);
      return;
    }
    if (generated) URL.revokeObjectURL(generated.combinedUrl);
    generated = { names, combinedUrl: url };
    url = null;
    downloadBtn.disabled = false;
    printBtn.disabled = false;
    updatePager();
    setStatus(`Готово: ${names.length} ${pluralUk(names.length, 'сертифікат', 'сертифікати', 'сертифікатів')}.`);
  } catch (e) {
    if (url) URL.revokeObjectURL(url);
    console.error(e);
    if (!stale()) setStatus('Не вдалося сформувати сертифікати. Спробуйте ще раз.', true);
  } finally {
    generateBtn.disabled = false;
  }
});

downloadBtn.addEventListener('click', async () => {
  if (!generated || !assets) return;
  const gen = generated;
  const { names } = gen;
  const myVersion = version;
  const stale = () => myVersion !== version || generated !== gen;
  downloadBtn.disabled = true;
  try {
    const entries = [];
    for (let i = 0; i < names.length; i++) {
      if (stale()) return;
      setStatus(`Готуємо архів… ${i + 1} / ${names.length}`);
      const data = await renderCertificates(assets, [names[i]]);
      if (stale()) return;
      entries.push({ name: certificateFileName(i, names.length, names[i]), data });
    }
    const zip = await buildZip(entries);
    if (stale()) return;
    const url = URL.createObjectURL(new Blob([zip as Uint8Array<ArrayBuffer>], { type: 'application/zip' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sertyfikaty.zip';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setStatus('Архів завантажено.');
  } catch (e) {
    console.error(e);
    if (!stale()) setStatus('Не вдалося створити архів.', true);
  } finally {
    downloadBtn.disabled = !generated;
  }
});

printBtn.addEventListener('click', () => {
  if (!generated) return;
  const win = window.open(generated.combinedUrl, '_blank');
  setStatus(win ? 'Файл для друку відкрито в новій вкладці — натисніть «Друк» (Ctrl/Cmd + P).' : 'Браузер заблокував нову вкладку. Дозвольте спливаючі вікна для цього сайту.', !win);
});

$('prev').addEventListener('click', () => preview.go(-1).then(updatePager));
$('next').addEventListener('click', () => preview.go(1).then(updatePager));

async function init() {
  generateBtn.disabled = true;
  setStatus('Завантаження шаблону…');
  try {
    const base = import.meta.env.BASE_URL;
    const [template, font] = await Promise.all(
      [`${base}template.pdf`, `${base}fonts/WixMadeforDisplay-Bold.ttf`].map(async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${url}: ${res.status}`);
        return new Uint8Array(await res.arrayBuffer());
      }),
    );
    assets = { template, font };
    await preview.show(template);
    generateBtn.disabled = false;
    setStatus('');
  } catch (e) {
    console.error(e);
    setStatus('Не вдалося завантажити шаблон. Оновіть сторінку.', true);
  }
  updateCount();
}

void init();
