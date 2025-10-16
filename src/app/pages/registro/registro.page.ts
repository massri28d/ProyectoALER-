import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonList, IonItem, IonLabel, IonInput,
  IonSelect, IonSelectOption, IonButton, IonSpinner, ToastController
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonList, IonItem, IonLabel, IonInput,
    IonSelect, IonSelectOption, IonButton, IonSpinner
  ]
})
export class RegistroPage {
  email = '';
  rut = '';
  nombre = '';
  fechaNacimiento = '';
  telefono = '';
  genero = '';
  password = '';
  isLoading = false;

  constructor(
    private router: Router,
    private auth: AuthService,
    private toastCtrl: ToastController
  ) {}

  async registrar() {
    if (!this.email || !this.rut || !this.nombre || !this.telefono || !this.genero || !this.password) {
      return this.showToast('Completa todos los campos');
    }
    if (!/^\S+@\S+\.\S+$/.test(this.email)) return this.showToast('Email inválido');
    if (!/^\d{8,15}$/.test(this.telefono)) return this.showToast('Teléfono inválido (solo números)');
    if (this.password.length < 6) return this.showToast('Mínimo 6 caracteres en contraseña');

    this.isLoading = true;

    try {
      const success = await this.auth.registrar({
        email: this.email,
        rut: this.rut,
        nombre: this.nombre,
        fechaNacimiento: this.fechaNacimiento,
        telefono: this.telefono,
        genero: this.genero,
        password: this.password
      });

      if (success) {
        await this.showToast('¡Registrado correctamente! Inicia sesión');
        this.router.navigate(['/login']);
      } else {
        this.showToast('El email ya está registrado o error en el registro');
      }
    } catch (e: any) {
      console.error(e);
      this.showToast('Error: ' + (e?.message ?? 'desconocido'));
    } finally {
      this.isLoading = false;
    }
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }

  private async showToast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2000 });
    t.present();
  }
}