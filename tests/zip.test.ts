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
});
