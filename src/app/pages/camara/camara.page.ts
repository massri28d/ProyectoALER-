import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon,
  IonItem, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  /*IonTextarea, */ IonSpinner, IonImg, IonFab, IonFabButton,
  IonSelect, IonSelectOption, IonList, IonLabel, IonChip
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { OcrService } from '../../services/ocr.service';

@Component({
  selector: 'app-camara',
  templateUrl: './camara.page.html',
  styleUrls: ['./camara.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon,
    IonItem, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    /*IonTextarea, */ IonSpinner, IonImg, IonFab, IonFabButton,
    IonSelect, IonSelectOption, IonList, IonLabel, IonChip
  ]
})
export class CamaraPage implements AfterViewInit, OnDestroy {
  @ViewChild('videoEl')  videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  private stream?: MediaStream;
  devices: MediaDeviceInfo[] = [];
  selectedDeviceId?: string;

  webcamReady = false;
  photoDataUrl?: string;

  scanning = false;
  errorMsg = '';
  ocrDone = false;

  rawText = '';
  ocrText = '';
  ingredientes: string[] = [];
  alergenos: string[] = [];

  readonly isWeb = Capacitor.getPlatform() === 'web';

  constructor(private ocr: OcrService, private router: Router) {}

  async ngAfterViewInit() {
    if (this.isWeb) await this.openWebcam();
  }

  ngOnDestroy() {
    this.stopWebcam();
    this.ocr.terminate();
  }

  // ---------- Webcam ----------
  private async listCameras() {
    const all = await navigator.mediaDevices.enumerateDevices();
    this.devices = all.filter(d => d.kind === 'videoinput');
    if (!this.devices.length) throw new Error('No hay cámaras disponibles');
    if (!this.selectedDeviceId) {
      const back = this.devices.find(d => /back|rear|environment|trasera/i.test(d.label));
      this.selectedDeviceId = (back ?? this.devices[0]).deviceId;
    }
  }

  private async openWebcam() {
    this.errorMsg = '';
    try {
      await this.listCameras().catch(() => {});
      const constraints: MediaStreamConstraints = {
        video: this.selectedDeviceId
          ? { deviceId: { exact: this.selectedDeviceId } }
          : { facingMode: { ideal: 'environment' } }
      };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      const v = this.videoRef.nativeElement;
      v.srcObject = this.stream;
      await v.play().catch(() => {});
      this.webcamReady = true;
      await this.listCameras().catch(() => {});
    } catch (e: any) {
      this.webcamReady = false;
      const name = e?.name || '';
      if (name === 'NotAllowedError') this.errorMsg = 'Permiso de cámara denegado. Actívalo en el candado.';
      else if (name === 'NotFoundError') this.errorMsg = 'No se encontró cámara. Conecta una webcam o usa la galería.';
      else if (name === 'NotReadableError') this.errorMsg = 'La cámara está en uso por otra app.';
      else this.errorMsg = 'No se pudo acceder a la cámara.';
      console.warn('getUserMedia error:', e);
    }
  }

  private stopWebcam() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = undefined;
    this.webcamReady = false;
  }

  async onChangeCamera(ev: CustomEvent) {
    this.selectedDeviceId = (ev as any).detail.value;
    this.stopWebcam();
    await this.openWebcam();
  }

  // Escala el frame para mejorar OCR (texto pequeño)
  private captureToDataUrlFromVideo(scale = 1.8): string {
    const video = this.videoRef.nativeElement;
    const w = Math.max(640, Math.floor((video.videoWidth || 1280) * scale));
    const h = Math.max(480, Math.floor((video.videoHeight || 720) * scale));
    const canvas = this.canvasRef.nativeElement;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.95);
  }

  private async captureFromWebcam() {
    if (!this.videoRef?.nativeElement) return;
    if (!this.videoRef.nativeElement.videoWidth) await new Promise(r => setTimeout(r, 120));
    this.photoDataUrl = this.captureToDataUrlFromVideo(1.8);
    await this.runOcrAndParse();
  }

  async onClickBigCamera() {
    if (!this.isWeb) return;
    if (!this.webcamReady) {
      await this.openWebcam();
      if (!this.webcamReady) { alert(this.errorMsg || 'No se pudo abrir la cámara.'); return; }
    }
    await this.captureFromWebcam();
  }

  // ---------- Galería ----------
  pickFromGallery() { this.fileInput?.nativeElement.click(); }
  onFileChange(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      this.photoDataUrl = reader.result as string;
      await this.runOcrAndParse();
    };
    reader.readAsDataURL(file);
  }

  // ---------- OCR + Parsing ----------
  private async runOcrAndParse() {
    if (!this.photoDataUrl) return;
    this.scanning = true; this.ocrDone = false;
    try {
      this.rawText = await this.ocr.recognize(this.photoDataUrl);
      const { cleanedText, ingredientes, alergenos } = this.processLabel(this.rawText);
      this.ocrText = cleanedText;
      this.ingredientes = ingredientes;
      this.alergenos = alergenos;
    } catch (e) {
      console.error('[OCR] error:', e);
      this.ocrText = ''; this.ingredientes = []; this.alergenos = [];
      this.errorMsg = 'No se pudo reconocer texto. Intenta con más luz/enfoque.';
    } finally {
      this.scanning = false; this.ocrDone = true;
    }
  }

  private processLabel(input: string) {
    let txt = (input || '')
      .replace(/-\s*\n\s*/g, '')
      .replace(/\n+/g, ' ')
      .replace(/[•·▪●]/g, ',')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Bloque de “Ingredientes”
    const startMatch = /(ingredientes?)\s*[:\-]?\s*/i.exec(txt);
    let bloque = '';
    if (startMatch) {
      const startIdx = startMatch.index + startMatch[0].length;
      const after = txt.slice(startIdx);
      const corte = /(información|tabla|nutric|contenido (neto)?|contiene\b|al[ée]rgen|puede contener|conservar|lote|fecha|venc|fabricado|elaborado|origen|modo de|advert|preparaci[oó]n)/i.exec(after);
      bloque = (corte ? after.slice(0, corte.index) : after).trim();
    } else {
      bloque = txt.slice(0, 600);
    }

    const ingredientes = this.splitIngredientsOutsideParens(bloque)
      .map(s => s.replace(/\s*[:;]\s*$/,'').trim())
      .filter(Boolean);

    const alergenos = this.detectAlergenos((startMatch ? bloque : txt).toLowerCase());
    return { cleanedText: txt, ingredientes, alergenos };
  }

  private splitIngredientsOutsideParens(text: string): string[] {
    const out: string[] = [];
    let buf = '', depth = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '(') depth++;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if ((ch === ',' || ch === ';') && depth === 0) { out.push(buf.trim()); buf = ''; continue; }
      buf += ch;
    }
    if (buf.trim()) out.push(buf.trim());
    return out.flatMap(item =>
      (item.includes(' y ') && !/[()]/.test(item))
        ? item.split(/\s+y\s+/i).map(s => s.trim()).filter(Boolean)
        : item
    );
  }

  private detectAlergenos(textLower: string): string[] {
    const has = (re: RegExp) => re.test(textLower);
    const f: string[] = [];
    if (has(/\bgluten|trigo|cebada|centeno|avena\b/)) f.push('Gluten');
    if (has(/\bleche|lactosa|suero de leche|casein\b/)) f.push('Leche');
    if (has(/\bhuevo|al[bv]úmina\b/)) f.push('Huevo');
    if (has(/\bsoja|soya\b/)) f.push('Soya');
    if (has(/\bman[ií]|peanut\b/)) f.push('Maní');
    if (has(/\balmendra|nuez(?! moscada)|avellana|pistacho|anacardo|cashew|pecana|macadamia\b/)) f.push('Frutos secos');
    if (has(/\bpescado|at[uú]n|salm[oó]n|merluza|jurel\b/)) f.push('Pescado');
    if (has(/\bcamar[oó]n|langost|cangrejo|jaiba|ostri|ost[ií]on|mejill[oó]n|almeja|calamar|pulpo\b/)) f.push('Crustáceos/Moluscos');
    if (has(/\bs[eé]samo|ajonjol[ií]\b/)) f.push('Sésamo');
    if (has(/\bapio\b/)) f.push('Apio');
    if (has(/\bmostaza\b/)) f.push('Mostaza');
    if (has(/\bsulfit|d[ií]oxido de azufre\b|\bso2\b/)) f.push('Sulfitos');
    return [...new Set(f)];
  }

  enviarAlMenu() {
    this.router.navigate(['/menuingredientes'], { queryParams: { texto: this.ocrText } });
  }
}
