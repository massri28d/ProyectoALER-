

import { Component } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonListHeader,
  IonNote,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonRouterLink,
  Platform // ✅ añadimos Platform aquí
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';

import {
  homeOutline, homeSharp,
  restaurantOutline, restaurantSharp,
  settingsOutline, settingsSharp,
  peopleOutline, peopleSharp,
  logInOutline, logInSharp,
  personCircleOutline, personCircleSharp,
  bookmarkOutline, bookmarkSharp
} from 'ionicons/icons';

// ✅ importamos DatabaseService
import { DatabaseService } from './services/database.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonListHeader,
    IonNote,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterLink,
    IonRouterOutlet
  ]
})
export class AppComponent {
  public appPages = [
    { title: 'Inicio', url: '/inicio' },
    { title: 'Detectar ingredientes', url: '/menuingredientes' },
    { title: 'Configuraciones', url: '/configuraciones' },
    { title: '¿ Quienes somos ?', url: '/quienessomos' },
    { title: 'Inicio de sesion', url: '/login' },
  ].map(page => ({
    ...page,
    icon: this.getIconForTitle(page.title)
  }));

  public labels = [];

  constructor(
    private platform: Platform,
    private dbService: DatabaseService // ✅ inyectamos servicio
  ) {
    addIcons({
      homeOutline, homeSharp,
      restaurantOutline, restaurantSharp,
      settingsOutline, settingsSharp,
      peopleOutline, peopleSharp,
      logInOutline, logInSharp,
      personCircleOutline, personCircleSharp,
      bookmarkOutline, bookmarkSharp
    });

    // inicializamos la base de datos al arrancar
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();
    await this.dbService.initializePlugin(); // ✅ inicializa SQLite y crea tablas
  }

  getIconForTitle(title: string): string {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('inicio') && !lowerTitle.includes('sesion')) return 'home';
    if (lowerTitle.includes('ingrediente')) return 'restaurant';
    if (lowerTitle.includes('config')) return 'settings';
    if (lowerTitle.includes('quienes') || lowerTitle.includes('somos')) return 'people';
    if (lowerTitle.includes('sesion')) return 'log-in';

    return 'bookmark'; // ícono por defecto
  }
}
