import JSZip from 'jszip';

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/** PDFs are already compressed, so STORE (no deflate) keeps it fast. */
export async function buildZip(entries: ZipEntry[]): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const e of entries) zip.file(e.name, e.data);
  return zip.generateAsync({ type: 'uint8array', compression: 'STORE' });
}
