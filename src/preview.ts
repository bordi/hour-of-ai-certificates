import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist/legacy/build/pdf.mjs';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export class Preview {
  private doc: PDFDocumentProxy | null = null;
  private task: RenderTask | null = null;
  private seq = 0;
  page = 1;

  constructor(private canvas: HTMLCanvasElement) {}

  get pageCount(): number {
    return this.doc?.numPages ?? 0;
  }

  async show(bytes: Uint8Array): Promise<void> {
    const old = this.doc;
    this.doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    void old?.loadingTask.destroy();
    this.page = 1;
    await this.render();
  }

  async go(delta: number): Promise<void> {
    const next = Math.min(Math.max(this.page + delta, 1), this.pageCount);
    if (next === this.page) return;
    this.page = next;
    await this.render();
  }

  private async render(): Promise<void> {
    if (!this.doc) return;
    const seq = ++this.seq;
    const page = await this.doc.getPage(this.page);
    if (seq !== this.seq) return; // a newer render started while we awaited
    this.task?.cancel(); // cancel right before reusing the canvas
    const cssWidth = this.canvas.clientWidth || 800;
    const scale = (cssWidth * window.devicePixelRatio) / page.getViewport({ scale: 1 }).width;
    const viewport = page.getViewport({ scale });
    this.canvas.width = Math.round(viewport.width);
    this.canvas.height = Math.round(viewport.height);
    this.task = page.render({ canvas: this.canvas, canvasContext: this.canvas.getContext('2d')!, viewport });
    try {
      await this.task.promise;
    } catch (e) {
      if ((e as Error).name !== 'RenderingCancelledException') throw e;
    }
  }
}
