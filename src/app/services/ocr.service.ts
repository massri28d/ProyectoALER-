import { Injectable } from '@angular/core';
import { createWorker, type Worker, PSM, OEM } from 'tesseract.js';

type SupportedLangs = NonNullable<Parameters<typeof createWorker>[0]>;

@Injectable({ providedIn: 'root' })
export class OcrService {
  private worker?: Worker;
  private creating?: Promise<void>;

  private async ensureWorker() {
    if (this.worker) return;
    if (this.creating) return this.creating;

    this.creating = (async () => {
      // v6: (langs, oem?, options?)
      const langs: SupportedLangs = ['spa', 'eng'];
      const worker = await createWorker(langs, OEM.DEFAULT, {
        // logger: m => console.log(m), // opcional
      });

      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // ≈ “texto en bloque”
        preserve_interword_spaces: '1',
      });

      this.worker = worker;
    })();

    await this.creating;
  }

  async recognize(dataUrl: string): Promise<string> {
    await this.ensureWorker();

    // Preproceso: escalar y binarizar para subir contraste
    const pre = await this.preprocess(dataUrl);

    const { data } = await this.worker!.recognize(pre);
    return (data?.text || '').trim();
  }

  async terminate() {
    await this.worker?.terminate();
    this.worker = undefined;
    this.creating = undefined;
  }

  // Escala a ~2000px de ancho y pasa a B/N con umbral simple
  private async preprocess(src: string): Promise<string> {
    const img = await new Promise<HTMLImageElement>(res => {
      const i = new Image();
      i.onload = () => res(i);
      i.src = src;
    });

    const maxW = 2000;
    const scale = Math.max(1, Math.min(maxW / Math.max(img.width, 1), 3));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);

    const id = ctx.getImageData(0, 0, w, h);
    const d = id.data;
    for (let p = 0; p < d.length; p += 4) {
      const y = 0.299*d[p] + 0.587*d[p+1] + 0.114*d[p+2]; // gris
      const y2 = y * 1.25 + 10;                            // +contraste/brillo
      const v = y2 > 170 ? 255 : 0;                        // umbral
      d[p] = d[p+1] = d[p+2] = v; d[p+3] = 255;
    }
    ctx.putImageData(id, 0, 0);
    return c.toDataURL('image/png', 1);
  }
}
