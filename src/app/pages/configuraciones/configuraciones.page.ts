import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

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
    IonCardContent  
  ]
})
export class ConfiguracionesPage implements OnInit, OnDestroy {

  user: {
    rut?: string;
    correo?: string;
    fechaNacimiento?: string;
    telefono?: string;
    genero?: string;
  } = {};

  private userSub?: Subscription;

  constructor(private authService: AuthService) { }

  ngOnInit() {
    // Suscribirse al usuario actual desde AuthService (sessionStorage)
    this.userSub = this.authService.currentUser$.subscribe(u => {
      if (u) {
        this.user = {
          rut: u.rut || '',
          correo: u.email || '',
          fechaNacimiento: u.fechaNacimiento || '',
          telefono: u.telefono || '',
          genero: u.genero || ''
        };
      } else {
        // Si no hay usuario, limpiar campos
        this.user = {
          rut: '',
          correo: '',
          fechaNacimiento: '',
          telefono: '',
          genero: ''
        };
      }
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
  }

}
