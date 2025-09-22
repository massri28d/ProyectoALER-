import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class RegistroPage {
  email = '';
  nombre = '';
  fechaNacimiento = '';
  telefono = '';
  genero = '';
  password = '';

  constructor(private router: Router) {}

  registrar() {
    // Aquí iría la lógica de registro
    this.router.navigate(['/inicio']);
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }
}
