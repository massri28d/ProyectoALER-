import { Component } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  Router
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
  IonButton,
  Platform
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, homeSharp,
  restaurantOutline, restaurantSharp,
  settingsOutline, settingsSharp,
  peopleOutline, peopleSharp,
  logInOutline, logInSharp,
  personCircleOutline, personCircleSharp,
  bookmarkOutline, bookmarkSharp,
  logOutOutline, logOutSharp
} from 'ionicons/icons';
import { CommonModule } from '@angular/common'; 

// SQLite
import { DatabaseService } from './services/database.service';
import { AuthService } from './services/auth.service';

// Status bar (Capacitor)
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
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
    IonRouterOutlet,
    IonButton
  ]
})
export class AppComponent {
  public appPages = [
    { title: 'Inicio', url: '/inicio' },
    { title: 'Detectar ingredientes', url: '/menuingredientes' },
    { title: 'Configuraciones', url: '/configuraciones' },
    { title: '¿ Quienes somos ?', url: '/quienessomos' },
  ].map(page => ({
    ...page,
    icon: this.getIconForTitle(page.title)
  }));

  public labels: string[] = [];

  constructor(
    private platform: Platform,
    private dbService: DatabaseService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({
      homeOutline, homeSharp,
      restaurantOutline, restaurantSharp,
      settingsOutline, settingsSharp,
      peopleOutline, peopleSharp,
      logInOutline, logInSharp,
      personCircleOutline, personCircleSharp,
      bookmarkOutline, bookmarkSharp,
      logOutOutline, logOutSharp
    });
  }

  async ngOnInit() {
    await this.platform.ready();

    // 1) Evita que la status bar tape el header
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#17864B' });
    } catch {
      // en web/no soportado, simplemente ignora
    }

    // 2) Inicializa SQLite y crea tablas (opcional por ahora)
    // await this.dbService.initializePlugin();
  }

  getIconForTitle(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('inicio') && !lowerTitle.includes('sesion')) return 'home';
    if (lowerTitle.includes('ingrediente')) return 'restaurant';
    if (lowerTitle.includes('config')) return 'settings';
    if (lowerTitle.includes('quienes') || lowerTitle.includes('somos')) return 'people';
    if (lowerTitle.includes('sesion')) return 'log-in';
    return 'bookmark';
  }

  /**
   * Cierra sesión y redirige al login
   */
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser() {
    return this.authService.getCurrentUser();
  }
}