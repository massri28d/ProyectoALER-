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

    // Validación de correo
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(this.email)) {
      return this.showToast('Correo electrónico inválido');
    }

    // Validación de RUT (sin puntos ni guion)
    const rutLimpio = this.rut.toUpperCase().trim();

    // Verifica que el formato sea correcto antes de validar el dígito
    if (!/^[0-9]{7,8}[0-9K]$/.test(rutLimpio)) {
      return this.showToast('Formato de RUT inválido. Debe tener 8 o 9 caracteres, sin puntos ni guion.');
    }

    // Valida el dígito verificador
    if (!this.validarRut(rutLimpio)) {
      return this.showToast('RUT inválido. Verifique el dígito verificador.');
    }

    // Teléfono (solo números, debe comenzar con 9 o +56 si es chileno)
    if (!/^(\+?56)?(9\d{8})$/.test(this.telefono)) {
      return this.showToast('Teléfono inválido. Use formato 9XXXXXXXX o +569XXXXXXXX');
    }

    // Contraseña (mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un símbolo)
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
        await this.showToast('Registrado correctamente. Inicia sesión');
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

  /**
   * Valida un RUT chileno sin puntos ni guion
   * Ejemplo: 123456785 o 12345678K
   */
  private validarRut(rut: string): boolean {
    rut = rut.toUpperCase().trim();

    if (!/^[0-9]+[0-9K]$/.test(rut)) {
      return false;
    }

    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);

    let suma = 0;
    let multiplo = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += +cuerpo[i] * multiplo;
      multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }

    const resto = 11 - (suma % 11);
    const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);

    return dv === dvEsperado;
  }

  private async showToast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2000 });
    t.present();
  }
}