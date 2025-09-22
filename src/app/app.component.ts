import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonMenuToggle,
  IonItem, IonIcon, IonLabel, IonRouterOutlet, IonRouterLink,
  IonHeader, IonToolbar, IonTitle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  scanCircleOutline, scanCircleSharp,
  settingsOutline, settingsSharp,
  informationCircleOutline, informationCircleSharp,
  personCircleOutline, personCircleSharp
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    RouterLink, RouterLinkActive,
    IonApp, IonSplitPane, IonMenu, IonHeader, IonToolbar,
    IonContent, IonList, IonMenuToggle, IonItem, IonIcon, IonLabel,
    IonRouterLink, IonRouterOutlet, IonTitle
  ],
})
export class AppComponent {
  // Menú lateral según tus vistas
  public appPages = [
    { title: 'Detectar ingredientes', url: '/analizar', icon: 'scan-circle' },
    { title: 'Configuraciones', url: '/configuraciones', icon: 'settings' },
    { title: '¿Quiénes somos?', url: '/quienes', icon: 'information-circle' },
    { title: 'Cuenta', url: '/cuenta', icon: 'person-circle' },
  ];

  constructor() {
    addIcons({
      scanCircleOutline, scanCircleSharp,
      settingsOutline, settingsSharp,
      informationCircleOutline, informationCircleSharp,
      personCircleOutline, personCircleSharp
    });
  }
}
