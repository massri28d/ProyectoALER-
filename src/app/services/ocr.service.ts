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
      const langs: SupportedLangs = ['spa', 'eng'];
      const worker = await createWorker(langs, OEM.DEFAULT, {
        // logger: m => console.log(m), // útil para depurar
      });
      await worker.setParameters({
        preserve_interword_spaces: '1',
        user_defined_dpi: '300',
      });
      this.worker = worker;
    })();

    await this.creating;
  }

  async recognize(dataUrl: string): Promise<string> {
    await this.ensureWorker();

    // 1) Genera variantes de preproceso
    const variants = await this.preprocessVariants(dataUrl);

    // 2) Prueba PSM/rotaciones sobre cada variante
    const tries: Array<{ psm: PSM; rot: 0|90|180|270 }> = [
      { psm: PSM.SPARSE_TEXT,  rot: 0   },
      { psm: PSM.SINGLE_BLOCK, rot: 0   },
      { psm: PSM.SPARSE_TEXT,  rot: 90  },
      { psm: PSM.SINGLE_BLOCK, rot: 90  },
      { psm: PSM.SPARSE_TEXT,  rot: 180 },
      { psm: PSM.SINGLE_BLOCK, rot: 180 },
      { psm: PSM.SPARSE_TEXT,  rot: 270 },
      { psm: PSM.SINGLE_BLOCK, rot: 270 },
    ];

    let bestText = '';
    let bestConf = -1;

    for (const v of variants) {
      for (const t of tries) {
        await this.worker!.setParameters({ tessedit_pageseg_mode: t.psm });
        const img = t.rot ? await this.rotate(v, t.rot) : v;

        const { data } = await this.worker!.recognize(img);
        const text = (data?.text || '').trim();
        const conf = (data?.confidence ?? 0);

        const looksLikeIngredients =
          /ingredien|ingredients|composici[oó]n|componentes|contiene\b/i.test(text);

        if (looksLikeIngredients && conf >= 70) return text; // éxito temprano
        if (conf > bestConf) { bestConf = conf; bestText = text; }
      }
    }
    return bestText;
  }

  async terminate() {
    await this.worker?.terminate();
    this.worker = undefined;
    this.creating = undefined;
  }

  // ---------- Preproceso: varias variantes ----------

  private async preprocessVariants(src: string): Promise<string[]> {
    const img = await this.loadImage(src);

    // Recorte leve de bordes
    const cropMargin = 0.02;
    const sx = Math.round(img.width * cropMargin);
    const sy = Math.round(img.height * cropMargin);
    const sw = Math.max(1, img.width - 2 * sx);
    const sh = Math.max(1, img.height - 2 * sy);

    // Escalar a ~2400px (cap a 2x para evitar blur por sobre-escalado)
    const targetW = 2400;
    const scale = Math.min(2, Math.max(1, targetW / Math.max(sw, 1)));
    const w = Math.round(sw * scale);
    const h = Math.round(sh * scale);

    // Base color
    const base = document.createElement('canvas');
    base.width = w; base.height = h;
    const bctx = base.getContext('2d')!;
    bctx.imageSmoothingEnabled = true;
    bctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

    // A) Color “sharpen”
    const colorSharp = this.sharpen(base, 0.55);

    // B) Escala de grises + sharpen
    const graySharp = this.toGray(colorSharp, 1.12 /*gamma*/);

    // C) Binarización adaptativa (t=0.12) + dilate 3x3
    const bin12 = this.adaptiveBradley(graySharp, Math.max(15, Math.round(Math.min(w, h) / 32)), 0.12);
    const bin12Dil = this.dilate3(bin12);

    // D) Binarización adaptativa (t=0.08) + dilate 3x3 (más conservadora p/ letras finas)
    const bin08 = this.adaptiveBradley(graySharp, Math.max(15, Math.round(Math.min(w, h) / 28)), 0.08);
    const bin08Dil = this.dilate3(bin08);

    // E) Invertida (útil si el texto es claro sobre fondo oscuro)
    const inv = this.invert(bin08Dil);

    return [
      base.toDataURL('image/png', 1),
      colorSharp.toDataURL('image/png', 1),
      graySharp.toDataURL('image/png', 1),
      bin12Dil.toDataURL('image/png', 1),
      bin08Dil.toDataURL('image/png', 1),
      inv.toDataURL('image/png', 1),
    ];
  }

  private async rotate(srcDataUrl: string, deg: 0|90|180|270): Promise<string> {
    if (deg === 0) return srcDataUrl;
    const img = await this.loadImage(srcDataUrl);
    const cw = (deg === 90 || deg === 270) ? img.height : img.width;
    const ch = (deg === 90 || deg === 270) ? img.width  : img.height;

    const c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    const ctx = c.getContext('2d')!;
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate(deg * Math.PI / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    return c.toDataURL('image/png', 1);
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise(res => {
      const i = new Image();
      i.onload = () => res(i);
      i.src = src;
    });
  }

  // ---------- Filtros de imagen en Canvas ----------

  private toGray(srcCanvas: HTMLCanvasElement, gamma = 1): HTMLCanvasElement {
    const c = this.cloneCanvas(srcCanvas);
    const ctx = c.getContext('2d')!;
    const id = ctx.getImageData(0, 0, c.width, c.height);
    const d = id.data;
    for (let p = 0; p < d.length; p += 4) {
      let y = 0.299*d[p] + 0.587*d[p+1] + 0.114*d[p+2];
      if (gamma !== 1) y = 255 * Math.pow(y / 255, 1 / gamma);
      d[p] = d[p+1] = d[p+2] = y;
      d[p+3] = 255;
    }
    ctx.putImageData(id, 0, 0);
    return c;
  }

  private sharpen(srcCanvas: HTMLCanvasElement, amount = 0.5): HTMLCanvasElement {
    // Unsharp mask sencillo: original + amount*(original - blur)
    const c = this.cloneCanvas(srcCanvas);
    const ctx = c.getContext('2d')!;
    const id = ctx.getImageData(0, 0, c.width, c.height);

    // blur box 3x3
    const blur = new Uint8ClampedArray(id.data);
    const w = c.width, h = c.height;
    const get = (x: number, y: number, ch: number) => {
      x = Math.max(0, Math.min(w-1, x));
      y = Math.max(0, Math.min(h-1, y));
      return blur[(y*w + x)*4 + ch];
    };
    const out = id.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        for (let ch = 0; ch < 3; ch++) {
          let s = 0;
          for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) s += get(x+dx, y+dy, ch);
          const avg = s / 9;
          const i = (y*w + x)*4 + ch;
          const val = out[i] + amount*(out[i] - avg);
          out[i] = Math.max(0, Math.min(255, val));
        }
      }
    }
    ctx.putImageData(id, 0, 0);
    return c;
  }

  private adaptiveBradley(srcCanvas: HTMLCanvasElement, windowSize: number, t = 0.12): HTMLCanvasElement {
    const c = this.cloneCanvas(srcCanvas);
    const ctx = c.getContext('2d')!;
    const id = ctx.getImageData(0, 0, c.width, c.height);
    const { width: w, height: h, data: d } = id;

    // integral image
    const s2 = Math.max(3, (windowSize | 1)); // impar
    const integral = new Float64Array((w + 1) * (h + 1));
    const idx = (x: number, y: number) => y * (w + 1) + x;

    for (let y = 1; y <= h; y++) {
      let rowSum = 0;
      for (let x = 1; x <= w; x++) {
        const p = 4 * ((y - 1) * w + (x - 1));
        const gray = 0.299*d[p] + 0.587*d[p+1] + 0.114*d[p+2];
        rowSum += gray;
        integral[idx(x, y)] = integral[idx(x, y - 1)] + rowSum;
      }
    }

    const half = (s2 - 1) >> 1;
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - half);
      const y1 = Math.min(h - 1, y + half);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - half);
        const x1 = Math.min(w - 1, x + half);

        const A = integral[idx(x0, y0)];
        const B = integral[idx(x1 + 1, y0)];
        const C = integral[idx(x0, y1 + 1)];
        const D = integral[idx(x1 + 1, y1 + 1)];
        const sum = D - B - C + A;
        const area = (x1 - x0 + 1) * (y1 - y0 + 1);
        const avg = sum / area;

        const p = 4 * (y * w + x);
        const gray = 0.299*d[p] + 0.587*d[p+1] + 0.114*d[p+2];
        const v = gray < avg * (1 - t) ? 0 : 255; // binario
        d[p] = d[p+1] = d[p+2] = v;
        d[p+3] = 255;
      }
    }
    ctx.putImageData(id, 0, 0);
    return c;
  }

  private dilate3(srcCanvas: HTMLCanvasElement): HTMLCanvasElement {
    const c = this.cloneCanvas(srcCanvas);
    const ctx = c.getContext('2d')!;
    const id = ctx.getImageData(0, 0, c.width, c.height);
    const { width: w, height: h, data: d } = id;

    const copy = new Uint8ClampedArray(d);
    const at = (x: number, y: number) => {
      x = Math.max(0, Math.min(w-1, x));
      y = Math.max(0, Math.min(h-1, y));
      return copy[(y*w + x)*4]; // gris binario
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let white = false;
        for (let dy=-1; dy<=1 && !white; dy++)
          for (let dx=-1; dx<=1 && !white; dx++)
            white = at(x+dx, y+dy) > 127;
        const i = (y*w + x)*4;
        const v = white ? 255 : 0;
        d[i] = d[i+1] = d[i+2] = v;
        d[i+3] = 255;
      }
    }
    ctx.putImageData(id, 0, 0);
    return c;
  }

  private invert(srcCanvas: HTMLCanvasElement): HTMLCanvasElement {
    const c = this.cloneCanvas(srcCanvas);
    const ctx = c.getContext('2d')!;
    const id = ctx.getImageData(0, 0, c.width, c.height);
    const d = id.data;
    for (let p = 0; p < d.length; p += 4) {
      d[p]   = 255 - d[p];
      d[p+1] = 255 - d[p+1];
      d[p+2] = 255 - d[p+2];
    }
    ctx.putImageData(id, 0, 0);
    return c;
  }

  private cloneCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(src, 0, 0);
    return c;
  }
}