import { Injectable } from '@angular/core';
import Tesseract from 'tesseract.js';

@Injectable({ providedIn: 'root' })
export class OcrService {
  private worker: any = null;
  private initialized = false;

  private async ensureWorker() {
    if (this.initialized && this.worker) return;

    // v5: primer argumento = idiomas; segundo = opciones del worker.
    // SIN 'logger' para evitar "Function object could not be cloned".
    this.worker = await (Tesseract as any).createWorker(
      'spa', // <── idioma principal
      {
        workerPath: 'https://unpkg.com/tesseract.js@5/dist/worker.min.js',
        corePath:   'https://unpkg.com/tesseract.js-core@5/tesseract-core.wasm.js',
        wasmPath:   'https://unpkg.com/tesseract.js-core@5/tesseract-core.wasm',
        langPath:   'https://tessdata.projectnaptha.com/4.0.0',
      }
    );

    // Compatibilidad: en v5 muchos pasos ya están hechos,
    // pero en v4 estos métodos existen y hay que llamarlos:
    if (this.worker.load)            await this.worker.load();
    if (this.worker.loadLanguage)    await this.worker.loadLanguage('spa');
    if (this.worker.initialize)      await this.worker.initialize('spa');

    // Mantener espacios entre palabras pequeñas
    if (this.worker.setParameters) {
      await this.worker.setParameters({ preserve_interword_spaces: '1' });
    }

    this.initialized = true;
  }

  async recognize(image: string | Blob): Promise<string> {
    await this.ensureWorker();
    const { data } = await this.worker.recognize(image);
    return (data?.text || '').trim();
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.initialized = false;
    }
  }
}