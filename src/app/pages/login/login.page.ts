import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class LoginPage {
  email = '';
  password = '';

  constructor(private router: Router) {}

  login() {
    // Aquí iría la lógica de autenticación
    this.router.navigate(['/inicio']);
  }

  goToRegister() {
    this.router.navigate(['/registro']);
  }
}
