import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { buildZip } from '../src/zip';

describe('buildZip', () => {
  it('stores every file under its name', async () => {
    const bytes = await buildZip([
      { name: '01_A.pdf', data: new Uint8Array([1, 2]) },
      { name: '02_B.pdf', data: new Uint8Array([3]) },
    ]);
    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files).sort()).toEqual(['01_A.pdf', '02_B.pdf']);
    expect(await zip.file('02_B.pdf')!.async('uint8array')).toEqual(new Uint8Array([3]));
  });

  it('stores non-ASCII names as UTF-8 and flags them, so Windows and macOS show the letters', async () => {
    const names = ['01_דוד_כהן.pdf', '02_José.pdf', '03_Ivan.pdf'];
    const bytes = await buildZip(names.map((name) => ({ name, data: new Uint8Array([1]) })));

    expect(Object.keys((await JSZip.loadAsync(bytes)).files).sort()).toEqual([...names].sort());

    // Walk the local file headers: flags (offset 6) bit 11 = "file name is UTF-8".
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const flagged = new Map<string, boolean>();
    for (let at = 0; at + 30 <= bytes.length && view.getUint32(at, true) === 0x04034b50; ) {
      const nameLength = view.getUint16(at + 26, true);
      const extraLength = view.getUint16(at + 28, true);
      const size = view.getUint32(at + 18, true);
      const name = new TextDecoder().decode(bytes.subarray(at + 30, at + 30 + nameLength));
      flagged.set(name, (view.getUint16(at + 6, true) & 0x0800) !== 0);
      at += 30 + nameLength + extraLength + size;
    }
    expect(flagged.get('01_דוד_כהן.pdf')).toBe(true);
    expect(flagged.get('02_José.pdf')).toBe(true);
    expect(flagged.size).toBe(3);
  });
});
