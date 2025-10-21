import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonList, IonItem, IonLabel, IonInput,
  IonSelect, IonSelectOption, IonButton, 
} from '@ionic/angular/standalone';
import { ToastController, LoadingController } from '@ionic/angular';
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
    IonSelect, IonSelectOption, IonButton
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

   saving = false;

  private dbReady = false;

  constructor(
    private router: Router,
    private db: DatabaseService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async registrar() {
    if (!this.email || !this.rut || !this.nombre || !this.telefono || !this.genero || !this.password) {
      return this.showToast('Completa todos los campos obligatorios');
    }
    
    if (!/^\S+@\S+\.\S+$/.test(this.email)) {
      return this.showToast('Email invalido');
    }
    
    if (!/^\d{8,15}$/.test(this.telefono)) {
      return this.showToast('Telefono invalido (solo numeros, 8-15 digitos)');
    }
    
    if (this.password.length < 6) {
      return this.showToast('La contrasena debe tener minimo 6 caracteres');
    }

    const loading = await this.loadingCtrl.create({
      message: 'Registrando usuario...',
    });
    await loading.present();

    try {
      console.log('[REGISTRO] Iniciando registro para:', this.email);
      
      const hashed = bcrypt.hashSync(this.password, 10);
      console.log('[REGISTRO] Contrasena hasheada');
      
      await this.db.addUser({
        email: this.email,
        rut: this.rut,
        nombre: this.nombre,
        fechaNacimiento: this.fechaNacimiento,
        telefono: this.telefono,
        genero: this.genero,
        password: hashed
      });
      
      console.log('[REGISTRO] Usuario registrado exitosamente');
      await loading.dismiss();
      await this.showToast('Usuario registrado correctamente');
      this.router.navigate(['/inicio']);
      
    } catch (e: any) {
      console.error('[REGISTRO] Error:', e);
      await loading.dismiss();
      
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes('UNIQUE constraint failed')) {
        this.showToast('Este email ya esta registrado');
      } else {
        this.showToast('Error al registrar: ' + errorMsg);
      }
    }
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}