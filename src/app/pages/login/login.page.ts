import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonList, IonItem, IonLabel, IonInput,
  IonButton, IonImg, ToastController, IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonList, IonItem, IonLabel, IonInput,
    IonButton, IonSpinner
  ]
})
export class LoginPage {
  email = '';
  password = '';
  isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastCtrl: ToastController
  ) {}

  async login() {
    if (!this.email || !this.password) {
      this.showToast('Por favor completa todos los campos');
      return;
    }

    this.isLoading = true;

    try {
      // Simular pequeño delay como si fuera una consulta
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const success = await this.authService.login(this.email, this.password);

      if (success) {
        this.showToast('¡Sesión iniciada correctamente!');
        this.router.navigate(['/inicio']);
      } else {
        this.showToast('Email o contraseña incorrectos');
      }
    } catch (e) {
      console.error('Error en login:', e);
      this.showToast('Error al iniciar sesión');
    } finally {
      this.isLoading = false;
    }
  }

  goToRegister() {
    this.router.navigate(['/registro']);
  }

  private async showToast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2000 });
    t.present();
  }
}