import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonInput, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-configuraciones',
  templateUrl: './configuraciones.page.html',
  styleUrls: ['./configuraciones.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonInput,
    IonSelect,
    IonSelectOption  
  ]
})
export class ConfiguracionesPage implements OnInit, OnDestroy {

  user: {
    rut?: string;
    correo?: string;
    fechaNacimiento?: string;
    nombre?: string;
    telefono?: string;
    genero?: string;
  } = {};
  editMode = false;
  form: { nombre?: string; telefono?: string; genero?: string } = {};
  isSaving = false;

  private userSub?: Subscription;

  constructor(private authService: AuthService, private apiService: ApiService, private toastCtrl: ToastController, private loadingCtrl: LoadingController) { }

  ngOnInit() {
    // Suscribirse al usuario actual desde AuthService (sessionStorage)
    this.userSub = this.authService.currentUser$.subscribe(u => {
      if (u) {
        this.user = {
          rut: u.rut || '',
          correo: u.email || '',
          fechaNacimiento: u.fechaNacimiento || '',
          nombre: u.nombre || '',
          telefono: u.telefono || '',
          genero: u.genero || ''
        };
        // Inicializar formulario con los valores actuales
        this.form = { nombre: this.user.nombre, telefono: this.user.telefono, genero: this.user.genero };
      } else {
        // Si no hay usuario, limpiar campos
        this.user = {
          rut: '',
          correo: '',
          fechaNacimiento: '',
          nombre: '',
          telefono: '',
          genero: ''
        };
      }
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
  }

  onEdit() {
    this.editMode = true;
  }

  onCancel() {
    this.editMode = false;
    // Revertir cambios en el formulario
    this.form = { nombre: this.user.nombre, telefono: this.user.telefono, genero: this.user.genero };
  }

  async onSave() {
    // Validaciones simples
    if (!this.form.nombre || this.form.nombre.trim().length < 2) {
      const t = await this.toastCtrl.create({ message: 'Nombre inválido (mínimo 2 caracteres)', duration: 2500, color: 'warning' });
      await t.present();
      return;
    }

    const phone = (this.form.telefono || '').toString().trim();
    const phoneRegex = /^[+0-9]{7,15}$/;
    if (!phone || !phoneRegex.test(phone)) {
      const t = await this.toastCtrl.create({ message: 'Teléfono inválido (solo números y +, 7-15 dígitos)', duration: 3000, color: 'warning' });
      await t.present();
      return;
    }

    const current = this.authService.getCurrentUser();
    if (!current) {
      const t = await this.toastCtrl.create({ message: 'No hay usuario en sesión. Inicia sesión e inténtalo de nuevo.', duration: 3000, color: 'danger' });
      await t.present();
      return;
    }

    const payload = {
      id: current.id,
      nombre: this.form.nombre,
      telefono: this.form.telefono,
      genero: this.form.genero
    };

    let loading: HTMLIonLoadingElement | null = null;
    try {
      this.isSaving = true;
      loading = await this.loadingCtrl.create({ message: 'Guardando cambios...', spinner: 'crescent' });
      await loading.present();

      // Llamada al API para actualizar perfil
      const res = await this.apiService.actualizarPerfil(payload).toPromise();

      // Dismiss loading
      await loading.dismiss();
      this.isSaving = false;

      // Si la API responde con éxito, actualizar sesión local
      if (res && (res.success || res.updated)) {
        const generoFinal = payload.genero || '';
        const updatedUser = { ...current, nombre: payload.nombre, telefono: payload.telefono, genero: generoFinal };
        this.authService.setCurrentUser(updatedUser as any);
        this.editMode = false;
        const t = await this.toastCtrl.create({ message: 'Perfil actualizado correctamente', duration: 2500, color: 'success' });
        await t.present();
      } else {
        const t = await this.toastCtrl.create({ message: 'No se pudo actualizar el perfil. Intenta nuevamente.', duration: 3000, color: 'danger' });
        await t.present();
      }
    } catch (e: any) {
      console.error('Error actualizando perfil', e);
      if (loading) {
        try { await loading.dismiss(); } catch(_) {}
      }
      this.isSaving = false;
      const msg = e?.message || 'Error desconocido';
      const t = await this.toastCtrl.create({ message: 'Error actualizando perfil: ' + msg, duration: 4000, color: 'danger' });
      await t.present();
    }
  }

}
