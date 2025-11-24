import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';

interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  telefono?: string;
  genero?: string;
  fechaNacimiento?: string;
  rut?: string;
}

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class UsuariosPage implements OnInit {
  usuarios: Usuario[] = [];
  loading = true;
  isAdmin = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    // Verificación de seguridad: solo admins con @admin.cl
    const user = this.authService.getCurrentUser();
    if (!user?.email?.toLowerCase().endsWith('@admin.cl')) {
      console.warn(' Intento de acceso no autorizado a módulo de usuarios');
      await this.mostrarToast('Acceso denegado. Solo administradores.', 'danger');
      this.router.navigate(['/inicio']);
      return;
    }

    this.isAdmin = true;
    await this.cargarUsuarios();
  }

  /**
   * Carga la lista de usuarios desde la API PHP
   */
  async cargarUsuarios() {
    this.loading = true;
    try {
      this.usuarios = await this.apiService.obtenerUsuarios().toPromise() || [];
      
      if (this.usuarios.length > 0) {
        console.log(` Se cargaron ${this.usuarios.length} usuario(s)`);
        await this.mostrarToast(`${this.usuarios.length} usuario(s) cargados`, 'success');
      } else {
        console.log('ℹNo hay usuarios registrados');
      }
    } catch (err: any) {
      console.error('❌ Error cargando usuarios:', err);
      await this.mostrarToast('Error al cargar usuarios', 'danger');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Recarga la lista de usuarios
   */
  async recargar(event?: any) {
    await this.cargarUsuarios();
    if (event) {
      event.target.complete();
    }
  }

  /**
   * Descarga la base de datos como JSON
   */
  async descargarDb() {
    // Verificación adicional antes de descargar
    const user = this.authService.getCurrentUser();
    if (!user?.email?.toLowerCase().endsWith('@admin.cl')) {
      await this.mostrarToast('Acceso denegado', 'danger');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Preparando descarga...'
    });
    await loading.present();

    try {
      // Crear JSON con los usuarios
      const dataToDownload = {
        timestamp: new Date().toISOString(),
        totalUsuarios: this.usuarios.length,
        usuarios: this.usuarios
      };

      const jsonStr = JSON.stringify(dataToDownload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      
      // Crear link de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `BD_ALER_usuarios_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      
      console.log(' Base de datos descargada correctamente');
      await this.mostrarToast('Base de datos descargada', 'success');
    } catch (err) {
      console.error(' Error descargando BD:', err);
      await this.mostrarToast('Error al descargar la base de datos', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  /**
   * Muestra un mensaje toast
   */
  private async mostrarToast(mensaje: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}