import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon,
  IonItem, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonSpinner, IonImg, IonFab, IonFabButton,
  IonSelect, IonSelectOption, IonList, IonLabel, IonChip, IonBadge
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { OcrService } from '../../services/ocr.service';
import { AlergiaService } from '../../services/alergia.service';
import { AuthService } from '../../services/auth.service';

type AnyImageCapture = any;

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
    IonSelect, IonSelectOption, IonList, IonLabel, IonChip, IonBadge
  ]
})
export class CamaraPage implements AfterViewInit, OnDestroy {
  @ViewChild('videoEl')  videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  private stream?: MediaStream;
  private track?: MediaStreamTrack;
  private imageCapture?: AnyImageCapture;

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
  
  // Variables para verificación con BD
  alergiasUsuario: string[] = [];
  puedeConsumir: boolean | null = null;
  alergenosEncontrados: string[] = [];
  verificando = false;

  readonly isWeb = Capacitor.getPlatform() === 'web';
  readonly isNative = Capacitor.isNativePlatform();

  constructor(
    private ocr: OcrService, 
    private router: Router,
    private alergiaService: AlergiaService,
    private authService: AuthService
  ) {}

  async ngAfterViewInit() {
    if (this.isWeb) await this.openWebcam();
    // Cargar alergias del usuario al iniciar
    await this.cargarAlergiasUsuario();
  }

  ngOnDestroy() {
    this.stopWebcam();
    this.ocr.terminate();
  }

  // Cargar alergias del usuario desde la BD
  async cargarAlergiasUsuario() {
    try {
      const alergias = await this.alergiaService.obtenerAlergiasUsuario();
      this.alergiasUsuario = alergias.map(a => a.nombre.toLowerCase());
      console.log('Alergias del usuario cargadas:', this.alergiasUsuario);
    } catch (error) {
      console.error('Error cargando alergias:', error);
    }
  }

  // ===== Nativo (Android/iOS) =====
  private async ensurePerms() {
    const p = await Camera.checkPermissions();
    if (p.camera !== 'granted' || p.photos !== 'granted') {
      const r = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
      if (r.camera !== 'granted') throw new Error('Permiso de cámara denegado');
    }
  }

  private async dataUrlFromPhoto(photo: Photo): Promise<string> {
    const path = photo.webPath || photo.path || (photo as any).savePath;
    if (!path && photo.dataUrl) return photo.dataUrl;
    const res = await fetch(path!);
    const blob = await res.blob();
    return await new Promise<string>(resolve => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.readAsDataURL(blob);
    });
  }

  async takePhotoNative() {
    await this.ensurePerms();
    const photo = await Camera.getPhoto({
      source: CameraSource.Camera,
      resultType: CameraResultType.Uri,
      quality: 100,
      allowEditing: false,
      correctOrientation: true,
      saveToGallery: false,
    });
    this.photoDataUrl = await this.dataUrlFromPhoto(photo);
    await this.runOcrAndParse();
  }

  async pickFromGalleryNative() {
    await this.ensurePerms();
    const photo = await Camera.getPhoto({
      source: CameraSource.Photos,
      resultType: CameraResultType.Uri,
      quality: 100,
      allowEditing: false,
      correctOrientation: true,
    });
    this.photoDataUrl = await this.dataUrlFromPhoto(photo);
    await this.runOcrAndParse();
  }

  // ===== WEB / PWA (getUserMedia + ImageCapture) =====
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
          ? { deviceId: { exact: this.selectedDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 }, facingMode: { ideal: 'environment' } as any }
          : { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 }, facingMode: { ideal: 'environment' } as any }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      const v = this.videoRef.nativeElement;
      v.srcObject = this.stream;
      await v.play().catch(() => {});
      this.webcamReady = true;

      this.track = this.stream.getVideoTracks()[0];
      try {
        if ((window as any).ImageCapture) {
          this.imageCapture = new (window as any).ImageCapture(this.track);
        }
        const caps: any = this.track.getCapabilities?.();
        const adv: any = {};
        if (caps?.focusMode?.includes?.('continuous')) adv.focusMode = 'continuous';
        if (caps?.zoom) adv.zoom = Math.min(caps.zoom.max, (caps.zoom.min ?? 1) + (caps.zoom.step ?? 0) * 2);
        if (Object.keys(adv).length) await this.track.applyConstraints({ advanced: [adv] });
      } catch {}

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
    this.track = undefined;
    this.imageCapture = undefined;
    this.webcamReady = false;
  }

  async onChangeCamera(ev: CustomEvent) {
    this.selectedDeviceId = (ev as any).detail.value;
    this.stopWebcam();
    await this.openWebcam();
  }

  private captureToDataUrlFromVideo(scale = 1.9, crop = 0.03): string {
    const video = this.videoRef.nativeElement;
    const baseW = video.videoWidth || 1280;
    const baseH = video.videoHeight || 720;

    const w = Math.max(640, Math.floor(baseW * scale));
    const h = Math.max(480, Math.floor(baseH * scale));

    const c = this.canvasRef.nativeElement;
    c.width = w; c.height = h;
    const ctx = c.getContext('2d')!;

    const sx = Math.round(baseW * crop);
    const sy = Math.round(baseH * crop);
    const sw = baseW - 2 * sx;
    const sh = baseH - 2 * sy;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);

    return c.toDataURL('image/jpeg', 0.95);
  }

  private async blobToDataUrl(blob: Blob): Promise<string> {
    return await new Promise<string>(res => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.readAsDataURL(blob);
    });
  }

  private async captureFromWebcam() {
    if (this.imageCapture?.takePhoto) {
      try {
        const blob: Blob = await this.imageCapture.takePhoto();
        this.photoDataUrl = await this.blobToDataUrl(blob);
        await this.runOcrAndParse();
        return;
      } catch {}
    }
    if (!this.videoRef?.nativeElement) return;
    if (!this.videoRef.nativeElement.videoWidth) await new Promise(r => setTimeout(r, 120));
    this.photoDataUrl = this.captureToDataUrlFromVideo(1.9, 0.03);
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

  // ===== OCR + parsing + VERIFICACIÓN CON BD =====
  private async runOcrAndParse() {
    if (!this.photoDataUrl) return;
    this.scanning = true; 
    this.ocrDone = false;
    this.puedeConsumir = null;
    this.alergenosEncontrados = [];
    
    try {
      this.rawText = await this.ocr.recognize(this.photoDataUrl);
      const { cleanedText, ingredientes, alergenos } = this.processLabel(this.rawText);
      this.ocrText = cleanedText;
      this.ingredientes = this.postProcessIngredientes(ingredientes);
      
      // Detectar alérgenos en el texto COMPLETO, no solo en el bloque de ingredientes
      this.alergenos = this.detectAlergenos(this.rawText.toLowerCase());
      
      // Verificar contra alergias del usuario
      await this.verificarContraAlergias();
      
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

  // Verificar ingredientes contra alergias del usuario en BD
  private async verificarContraAlergias() {
    if (!this.authService.isAuthenticated()) {
      console.warn('Usuario no autenticado');
      return;
    }

    this.verificando = true;

    try {
      // Recargar alergias por si cambiaron
      await this.cargarAlergiasUsuario();

      if (this.alergiasUsuario.length === 0) {
        this.puedeConsumir = true;
        this.verificando = false;
        return;
      }

      // Buscar también en el texto OCR completo (no solo en ingredientes procesados)
      const textoCompletoLower = this.ocrText.toLowerCase();
      const ingredientesLower = this.ingredientes.map(i => i.toLowerCase());
      const alergenosDetectadosLower = this.alergenos.map(a => a.toLowerCase());

      this.alergenosEncontrados = [];

      // Verificar cada alergia del usuario
      for (const alergia of this.alergiasUsuario) {
        let encontrado = false;

        // 1. Buscar en ingredientes detectados
        const coincideIngrediente = ingredientesLower.some(ing => 
          ing.includes(alergia) || alergia.includes(ing)
        );

        // 2. Buscar en alérgenos detectados por el método detectAlergenos
        const coincideAlergeno = alergenosDetectadosLower.some(al => 
          al.toLowerCase().includes(alergia) || alergia.includes(al.toLowerCase())
        );

        // 3. Buscar en el texto completo con variantes comunes
        const variantes = this.obtenerVariantesAlergia(alergia);
        const coincideTextoCompleto = variantes.some(variante => 
          textoCompletoLower.includes(variante)
        );

        // 4. Buscar advertencias de contaminación cruzada
        const tieneAdvertencia = this.buscarAdvertenciaContaminacion(textoCompletoLower, alergia);

        encontrado = coincideIngrediente || coincideAlergeno || coincideTextoCompleto || tieneAdvertencia;

        if (encontrado) {
          // Capitalizar para mostrar
          this.alergenosEncontrados.push(
            alergia.charAt(0).toUpperCase() + alergia.slice(1)
          );
        }
      }

      // Determinar si puede consumir
      this.puedeConsumir = this.alergenosEncontrados.length === 0;

      console.log('Verificacion completada:', {
        alergiasUsuario: this.alergiasUsuario,
        alergenosEncontrados: this.alergenosEncontrados,
        puedeConsumir: this.puedeConsumir
      });

    } catch (error) {
      console.error('Error verificando alergias:', error);
    } finally {
      this.verificando = false;
    }
  }

  // Método para obtener variantes de nombres de alergias
  private obtenerVariantesAlergia(alergia: string): string[] {
    const variantes: { [key: string]: string[] } = {
      'soya': ['soya', 'soja', 'soy'],
      'soja': ['soya', 'soja', 'soy'],
      'maní': ['maní', 'mani', 'cacahuete', 'cacahuate', 'peanut'],
      'mani': ['maní', 'mani', 'cacahuete', 'cacahuate', 'peanut'],
      'lácteos': ['lácteos', 'lacteos', 'leche', 'lactosa', 'caseína', 'casein', 'dairy'],
      'lacteos': ['lácteos', 'lacteos', 'leche', 'lactosa', 'caseína', 'casein', 'dairy'],
      'leche': ['leche', 'lactosa', 'caseína', 'casein', 'lácteo', 'lacteo', 'milk', 'dairy'],
      'gluten': ['gluten', 'trigo', 'wheat', 'cebada', 'centeno', 'avena'],
      'huevo': ['huevo', 'egg', 'albúmina', 'albumina', 'ovoalbumina'],
      'pescado': ['pescado', 'fish', 'atún', 'atun', 'salmon', 'salmón', 'merluza'],
      'mariscos': ['mariscos', 'camarón', 'camaron', 'langosta', 'cangrejo', 'shellfish', 'crustaceos', 'crustáceos'],
      'frutos secos': ['nueces', 'almendras', 'avellanas', 'pistachos', 'anacardo', 'cashew', 'nuts'],
      'sésamo': ['sésamo', 'sesamo', 'ajonjolí', 'ajonjoli', 'sesame'],
      'sesamo': ['sésamo', 'sesamo', 'ajonjolí', 'ajonjoli', 'sesame'],
      'mostaza': ['mostaza', 'mustard'],
      'apio': ['apio', 'celery'],
      'legumbres': ['legumbres', 'guisantes', 'habas', 'lentejas', 'garbanzos'],
      'conservantes': ['conservantes', 'benzoatos', 'nitritos', 'preservatives'],
      'aditivos': ['aditivos', 'potenciadores', 'sabor', 'glutamato', 'msg'],
      'colorantes': ['colorantes', 'tartrazina', 'rojo 40', 'colorant'],
      'sulfitos': ['sulfitos', 'sulfito', 'dioxido de azufre', 'dióxido de azufre', 'so2']
    };

    const alergiaLower = alergia.toLowerCase();
    
    // Buscar variantes específicas
    for (const [key, valores] of Object.entries(variantes)) {
      if (alergiaLower.includes(key) || key.includes(alergiaLower)) {
        return valores;
      }
    }

    // Si no hay variantes específicas, retornar la alergia original
    return [alergiaLower];
  }

  // Método para detectar advertencias de contaminación cruzada
  private buscarAdvertenciaContaminacion(textoLower: string, alergia: string): boolean {
    const variantes = this.obtenerVariantesAlergia(alergia);
    
    // Crear patrón con variantes
    const variantesPattern = variantes.join('|');
    
    // Patrones comunes de advertencia
    const patronesAdvertencia = [
      new RegExp(`elaborado en (?:líneas|lineas|instalaciones|plantas?) (?:que |donde )?(?:también |tambien |también|tambien)?(?:se )?(?:procesan?|fabrican?|elaboran?|manipulan?).{0,100}(${variantesPattern})`, 'i'),
      new RegExp(`puede contener.{0,50}(${variantesPattern})`, 'i'),
      new RegExp(`(?:trazas|vestigios) de.{0,30}(${variantesPattern})`, 'i'),
      new RegExp(`contiene.{0,50}(${variantesPattern})`, 'i'),
      new RegExp(`(?:no apto|prohibido) para (?:personas con |alérgicos|alergicos a ).{0,30}(${variantesPattern})`, 'i'),
      new RegExp(`procesado en.{0,50}(${variantesPattern})`, 'i'),
      new RegExp(`compartido con.{0,50}(${variantesPattern})`, 'i')
    ];

    return patronesAdvertencia.some(patron => patron.test(textoLower));
  }

  private processLabel(input: string) {
    let txt = (input || '')
      .replace(/-\s*\n\s*/g, '')
      .replace(/\n+/g, ' ')
      .replace(/[•·▪●・]/g, ', ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const startRe = /(ingredientes?|ingredients?|composici[oó]n|componentes?)\s*[:\-]?\s*/i;
    const startMatch = startRe.exec(txt);

    let bloque = '';
    if (startMatch) {
      const startIdx = startMatch.index + startMatch[0].length;
      const after = txt.slice(startIdx);
      const corteRe =
        /(informaci[oó]n|tabla|nutric|contenido (neto)?|calor[ií]as|porci[oó]n)/i;
      const m = corteRe.exec(after);
      bloque = (m ? after.slice(0, m.index) : after).trim();
    } else {
      bloque = txt.slice(0, 800);
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
    return out.flatMap((item: string) =>
      (item.includes(' y ') && !/[()]/.test(item))
        ? item.split(/\s+y\s+/i).map((s: string) => s.trim()).filter(Boolean)
        : [item]
    );
  }

  private postProcessIngredientes(list: string[]): string[] {
    const cleaned = list
      .map(s => this.normalizeIng(s))
      .map(s => s.replace(/\b(\d+[.,]?\d*)\s*(%|mg|g|kg|ug|mcg|kcal)\b/gi, '').trim())
      .map(s => s.replace(/[,:;.\-–—]+$/g, '').trim())
      .map(s => this.fixCommonOCR(s))
      .filter(s => s.length >= 2 && !/^(informaci|tabla|vitaminas|minerales|energ[ií]a|porci[oó]n)/i.test(s));

    const uniq = Array.from(new Set(cleaned));
    return uniq
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
      .map(s => this.titleCaseEs(s));
  }

  private normalizeIng(s: string): string {
    return (s || '')
      .replace(/^[+•·▪●\-–—,.;:|§™®©]+/g, '')
      .replace(/[|§™®©]+/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\(\s*$/,'')
      .trim();
  }

  private fixCommonOCR(s: string): string {
    return s.replace(/\bina de trigo\b/i, 'harina de trigo');
  }

  private titleCaseEs(s: string): string {
    const keepLower = ['de', 'del', 'la', 'las', 'los', 'y', 'o', 'en', 'con', 'para', 'a'];
    return s.toLowerCase()
      .split(' ')
      .map((w, i) => (i > 0 && keepLower.includes(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private detectAlergenos(textLower: string): string[] {
    const has = (re: RegExp) => re.test(textLower);
    const f: string[] = [];
    
    if (has(/\b(gluten|trigo|cebada|centeno|avena|wheat)\b/)) f.push('Gluten');
    if (has(/\b(leche|l[aá]cteo|lactosa|suero de leche|casein[aeo]?|lactosuero|milk|dairy)\b/)) f.push('Leche');
    if (has(/\b(huevo|al[bv][úu]mina|ov[oó]alb[úu]mina|egg)\b/)) f.push('Huevo');
    if (has(/\b(soja|soya|soy)\b/)) f.push('Soya');
    if (has(/\b(man[ií]|cacahuate|cacahuete|peanut)\b/)) f.push('Maní');
    if (has(/\b(almendra|nuez(?! moscada)|avellana|pistacho|anacardo|cashew|pecana|macadamia|nuts)\b/)) f.push('Frutos secos');
    if (has(/\b(pescado|at[uú]n|salm[oó]n|merluza|jurel|fish)\b/)) f.push('Pescado');
    if (has(/\b(camar[oó]n|langost|cangrejo|jaiba|ostri|ost[ií]on|mejill[oó]n|almeja|calamar|pulpo|shrimp|shellfish)\b/)) f.push('Crustáceos/Moluscos');
    if (has(/\b(s[eé]samo|ajonjol[ií]|sesame)\b/)) f.push('Sésamo');
    if (has(/\b(apio|celery)\b/)) f.push('Apio');
    if (has(/\b(mostaza|mustard)\b/)) f.push('Mostaza');
    if (has(/\b(sulfit|d[ií]oxido de azufre)\b|\bso2\b/)) f.push('Sulfitos');
    
    return [...new Set(f)];
  }

  enviarAlMenu() {
    this.router.navigate(['/menuingredientes'], { queryParams: { texto: this.ocrText } });
  }
}