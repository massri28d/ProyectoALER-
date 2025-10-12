import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonList, IonItem, IonLabel, IonInput,
  IonSelect, IonSelectOption, IonButton, IonText
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/database.service';
import * as bcrypt from 'bcryptjs';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonList, IonItem, IonLabel, IonInput,
    IonSelect, IonSelectOption, IonButton, IonText
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
  dbReady = true;

  constructor(
    private router: Router,
    private db: DatabaseService,
    private toastCtrl: ToastController
  ) {}

  async registrar() {
    if (!this.dbReady) { return this.showToast('DB no lista'); }

    if (!this.email || !this.rut || !this.nombre || !this.telefono || !this.genero || !this.password) {
      return this.showToast('Completa todos los campos');
    }
    if (!/^\S+@\S+\.\S+$/.test(this.email)) return this.showToast('Email inválido');
    if (!/^\d{8,15}$/.test(this.telefono)) return this.showToast('Teléfono inválido');
    if (this.password.length < 6) return this.showToast('Mínimo 6 caracteres');

    try {
      const hashed = bcrypt.hashSync(this.password, 10);
      await this.db.addUser({
        email: this.email,
        rut: this.rut,
        nombre: this.nombre,
        fechaNacimiento: this.fechaNacimiento, // opcional
        telefono: this.telefono,
        genero: this.genero,                   // usa valores del select abajo
        password: hashed
      });
      await this.showToast('Registrado correctamente');
      this.router.navigate(['/inicio']);
    } catch (e: any) {
      console.error(e);
      this.showToast('Error al registrar: ' + (e?.message ?? e));
    }
  }

  volverLogin() { this.router.navigate(['/login']); }

  private async showToast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2000 });
    t.present();
  }
}
