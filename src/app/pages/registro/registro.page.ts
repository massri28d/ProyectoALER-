import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { DatabaseService } from 'src/app/services/database.service';// importa el servicio
import * as bcrypt from 'bcryptjs'; // para encriptar contraseña

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class RegistroPage {
  email = '';
  rut = '';
  nombre = '';
  fechaNacimiento = '';
  telefono = '';
  genero = '';
  password = '';
  dbReady = false;

  constructor(
    private router: Router,
    private db: DatabaseService,
    private toastCtrl: ToastController
  ) {
    // inicializa la DB al entrar a la página (si no lo hiciste en AppComponent)
    this.initDb();
  }

  async initDb() {
    try {
      await this.db.initializePlugin();
      this.dbReady = true;
      console.log('DB inicializada desde RegistroPage');
    } catch (err) {
      this.dbReady = false;
      console.error('Error inicializando DB', err);
    }
  }

  async registrar() {
    if (!this.dbReady) {
      this.showToast('La base de datos no está lista. Intenta de nuevo en unos segundos.');
      return;
    }
    // Validaciones
    if (!this.email || !this.rut || !this.nombre || !this.fechaNacimiento || !this.telefono || !this.genero || !this.password) {
      this.showToast('Todos los campos son obligatorios');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(this.email)) {
      this.showToast('El email no es válido');
      return;
    }
    if (!/^([0-9]+-[0-9kK])$/.test(this.rut)) {
      this.showToast('El RUT no es válido. Debe ser formato 12345678-9');
      return;
    }
    if (this.nombre.length < 2) {
      this.showToast('El nombre debe tener al menos 2 caracteres');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.fechaNacimiento)) {
      this.showToast('La fecha de nacimiento debe ser YYYY-MM-DD');
      return;
    }
    if (!/^\d{8,15}$/.test(this.telefono)) {
      this.showToast('El teléfono debe tener entre 8 y 15 dígitos');
      return;
    }
    if (!['masculino','femenino','otro','prefiero no decir'].includes(this.genero.toLowerCase())) {
      this.showToast('El género no es válido');
      return;
    }
    if (this.password.length < 6) {
      this.showToast('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      // encriptar contraseña
      const hashed = bcrypt.hashSync(this.password, 10);

      // insertar usuario en SQLite
      await this.db.addUser({
        email: this.email,
        rut: this.rut,
        nombre: this.nombre,
        fechaNacimiento: this.fechaNacimiento,
        telefono: this.telefono,
        genero: this.genero,
        password: hashed
      });

      await this.showToast('Usuario registrado correctamente');
      this.router.navigate(['/inicio']);
    } catch (err: any) {
      console.error('Error registrando usuario', err);
      const msg = err?.message ?? JSON.stringify(err);
      this.showToast('Error al registrar: ' + msg);
    }
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000
    });
    await toast.present();
  }
}



