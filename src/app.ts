import './styles.css';
import { parseNames, MAX_NAMES } from './names';
import { decodeText, parseCsvNames } from './csv';
import { renderCertificates, type Assets } from './certificate';
import { certificateFileName } from './filenames';
import { buildZip } from './zip';
import { Preview } from './preview';
import { activeLocale, applyToDocument, t } from './i18n';

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
  setStatus(t('listChanged'));
}

function updateCount() {
  count.textContent = t('studentCount', { count: parseNames(textarea.value, activeLocale().name).length });
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
  const { csv } = activeLocale();
  const names = parseCsvNames(decodeText(bytes, csv.fallbackEncoding), csv.headerWords, activeLocale().name);
  if (names.length === 0) {
    setStatus(t('noNamesInFile'), true);
    return;
  }
  textarea.value = names.join('\n');
  textarea.dispatchEvent(new Event('input'));
  setStatus(t('importedFromFile', { count: names.length, file: file.name }));
});

generateBtn.addEventListener('click', async () => {
  if (!assets) return;
  const names = parseNames(textarea.value, activeLocale().name);
  if (names.length === 0) return setStatus(t('addAtLeastOneName'), true);
  if (names.length > MAX_NAMES) return setStatus(t('tooManyNames', { max: MAX_NAMES }), true);

  const myVersion = version;
  const stale = () => myVersion !== version;
  generateBtn.disabled = true;
  setStatus(t('generating'));
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
    setStatus(t('generated', { count: names.length }));
  } catch (e) {
    if (url) URL.revokeObjectURL(url);
    console.error(e);
    if (!stale()) setStatus(t('generateFailed'), true);
  } finally {
    generateBtn.disabled = false;
  }
});

downloadBtn.addEventListener('click', async () => {
  if (!generated || !assets) return;
  const gen = generated;
  const { names } = gen;
  const { fileNameStrategy } = activeLocale();
  const myVersion = version;
  const stale = () => myVersion !== version || generated !== gen;
  downloadBtn.disabled = true;
  try {
    const entries = [];
    for (let i = 0; i < names.length; i++) {
      if (stale()) return;
      setStatus(t('preparingArchive', { current: i + 1, total: names.length }));
      const data = await renderCertificates(assets, [names[i]]);
      if (stale()) return;
      entries.push({ name: certificateFileName(i, names.length, names[i], fileNameStrategy), data });
    }
    const zip = await buildZip(entries);
    if (stale()) return;
    const url = URL.createObjectURL(new Blob([zip as Uint8Array<ArrayBuffer>], { type: 'application/zip' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sertyfikaty.zip';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setStatus(t('archiveDownloaded'));
  } catch (e) {
    console.error(e);
    if (!stale()) setStatus(t('archiveFailed'), true);
  } finally {
    downloadBtn.disabled = !generated;
  }
});

printBtn.addEventListener('click', () => {
  if (!generated) return;
  const win = window.open(generated.combinedUrl, '_blank');
  setStatus(t(win ? 'printOpened' : 'popupBlocked'), !win);
});

$('prev').addEventListener('click', () => preview.go(-1).then(updatePager));
$('next').addEventListener('click', () => preview.go(1).then(updatePager));

async function init() {
  applyToDocument();
  generateBtn.disabled = true;
  setStatus(t('loadingTemplate'));
  try {
    const { templateUrl, fontUrl } = activeLocale();
    const [template, font] = await Promise.all(
      [templateUrl, fontUrl].map(async (url) => {
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
    setStatus(t('templateLoadFailed'), true);
  }
  updateCount();
}

void init();
