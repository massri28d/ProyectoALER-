import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon,
  IonItem, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonSpinner, IonImg, IonFab, IonFabButton,
  IonSelect, IonSelectOption, IonList, IonLabel, IonChip
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
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
    IonSpinner, IonImg, IonFab, IonFabButton,
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
  readonly isNative = Capacitor.isNativePlatform();

  constructor(private ocr: OcrService, private router: Router) {}

  async ngAfterViewInit() {
    // Webcam solo en PWA/web
    if (this.isWeb) await this.openWebcam();
  }

  ngOnDestroy() {
    this.stopWebcam();
    this.ocr.terminate();
  }

  // ===== Nativo (Android/iOS) =====
  private async ensurePerms() {
    const p = await Camera.checkPermissions();
    if (p.camera !== 'granted' || p.photos !== 'granted') {
      const r = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
      if (r.camera !== 'granted') throw new Error('Permiso de cámara denegado');
    }
  }

 async takePhotoNative() {
  await this.ensurePerms();
  const photo = await Camera.getPhoto({
    source: CameraSource.Camera,
    resultType: CameraResultType.DataUrl,
    quality: 100,
    width: 2000,
    correctOrientation: true,
    saveToGallery: false,
  });
  this.photoDataUrl = photo.dataUrl!;
  await this.runOcrAndParse();
}

  async pickFromGalleryNative() {
  await this.ensurePerms();
  const photo = await Camera.getPhoto({
    source: CameraSource.Photos,
    resultType: CameraResultType.DataUrl,
    quality: 100,
    width: 2000,
    correctOrientation: true,
  });
  this.photoDataUrl = photo.dataUrl!;
  await this.runOcrAndParse();
}

  // ===== WEB / PWA (getUserMedia) =====
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

  // ===== Fallback input file (solo web) =====
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

// ===== OCR + procesamiento mejorado con preprocesamiento de imagen =====

private async runOcrAndParse() {
  if (!this.photoDataUrl) return;

  this.scanning = true;
  this.ocrDone = false;

  try {
    // 1. Cargar imagen original
    const image = new Image();
    image.src = this.photoDataUrl;
    await new Promise(resolve => (image.onload = resolve));

    // 2. Preprocesar imagen (convertir a blanco/negro)
    const cleanedImage = this.preprocessImage(image);

    // 3. Ejecutar OCR sobre la imagen mejorada
    this.rawText = await this.ocr.recognize(cleanedImage);

    // 4. Procesar el texto extraído
    const { cleanedText, ingredientes, alergenos } = this.processLabel(this.rawText);
    this.ocrText = cleanedText;
    this.ingredientes = ingredientes;
    this.alergenos = alergenos;
  } catch (e) {
    console.error('[OCR] error:', e);
    this.ocrText = '';
    this.ingredientes = [];
    this.alergenos = [];
    this.errorMsg = 'No se pudo reconocer texto. Intenta con más luz/enfoque.';
  } finally {
    this.scanning = false;
    this.ocrDone = true;
  }
}

// ===== Preprocesamiento: binarizar imagen para OCR =====
private preprocessImage(image: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convertir a escala de grises + binarizar
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const gray = (r + g + b) / 3;
    const binary = gray < 140 ? 0 : 255;

    data[i] = data[i + 1] = data[i + 2] = binary; // RGB
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg'); // base64 de imagen tratada
}

// ===== Procesamiento de texto OCRizado =====
private processLabel(input: string) {
  let txt = (input || '')
    .replace(/-\s*\n\s*/g, '')
    .replace(/\n+/g, ' ')
    .replace(/[•·▪●]/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/\b1ngredientes\b/i, 'ingredientes')
    .replace(/0rigen/i, 'origen')
    .replace(/,(\S)/g, ', $1')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, '')
    .trim();

  const startMatch = /\bingredientes?\b[\s:–\-]*/i.exec(txt);
  let bloque = '';
  if (startMatch) {
    const startIdx = startMatch.index + startMatch[0].length;
    const after = txt.slice(startIdx);
    const corte = /(informacion|tabla|nutric|contenido neto|contiene\b|alergen|puede contener|conservar|lote|fecha|venc|fabricado|elaborado|origen|modo de|advert|preparacion)/i.exec(after);
    bloque = (corte ? after.slice(0, corte.index) : after).trim();
  } else {
    bloque = txt.slice(0, 600);
  }

  const ingredientes = this.splitIngredientsOutsideParens(bloque)
    .map(s => s.replace(/\s*[:;]\s*$/, '').trim())
    .filter(Boolean);

  const alergenos = this.detectAlergenos((startMatch ? bloque : txt).toLowerCase());

  return { cleanedText: txt, ingredientes, alergenos };
}

// ===== Separación de ingredientes fuera de paréntesis =====
private splitIngredientsOutsideParens(text: string): string[] {
  const out: string[] = [];
  let buf = '', depth = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if ((ch === ',' || ch === ';') && depth === 0) {
      out.push(buf.trim());
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());

  return out.flatMap((item: string) =>
    (item.includes(' y ') && !/[()]/.test(item))
      ? item.split(/\s+y\s+/i).map((s: string) => s.trim()).filter(Boolean)
      : [item]
  );
}

// ===== Alérgenos =====
private detectAlergenos(textLower: string): string[] {
  const found: string[] = [];

  const check = (regex: RegExp, nombre: string) => {
    if (regex.test(textLower)) found.push(nombre);
  };

  check(/\b(gluten|trigo|cebada|centeno|avena)\b/, 'Gluten');
  check(/\b(leche|lactosa|suero de leche|casein|lacteos|proteina de leche)\b/, 'Leche');
  check(/\b(huevo|albumina|ovoproductos|claras de huevo)\b/, 'Huevo');
  check(/\b(soja|soya)\b/, 'Soya');
  check(/\b(mani|maní|peanut|cacahuate)\b/, 'Maní');
  check(/\b(almendra|nuez(?! moscada)|avellana|pistacho|anacardo|cashew|pecana|macadamia|nueces)\b/, 'Frutos secos');
  check(/\b(pescado|atun|salmon|merluza|jurel|tilapia)\b/, 'Pescado');
  check(/\b(camaron|langost|cangrejo|jaiba|ostri|ostion|mejillon|almeja|calamar|pulpo)\b/, 'Crustáceos/Moluscos');
  check(/\b(sesamo|ajonjoli)\b/, 'Sésamo');
  check(/\b(apio)\b/, 'Apio');
  check(/\b(mostaza)\b/, 'Mostaza');
  check(/\b(sulfit|dioxido de azufre|so2)\b/, 'Sulfitos');

  return [...new Set(found)];
}

// ===== Navegación con resultado OCR =====
enviarAlMenu() {
  this.router.navigate(['/menuingredientes'], {
    queryParams: { texto: this.ocrText }
  });
}
}