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
  IonBadge,
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
  logOutOutline, logOutSharp,
  shieldOutline, shieldSharp
} from 'ionicons/icons';
import { CommonModule } from '@angular/common'; 

// SQLite
import { DatabaseService } from './services/database.service';
import { AuthService } from './services/auth.service';

// Status bar (Capacitor)
import { StatusBar, Style } from '@capacitor/status-bar';

interface AppPage {
  title: string;
  url: string;
  icon: string;
  admin?: boolean; // Indicar si es solo para admins
}

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
    IonButton,
    IonBadge
  ]
})
export class AppComponent {
  public appPages: AppPage[] = [];

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
      logOutOutline, logOutSharp,
      shieldOutline, shieldSharp
    });
  }

  async ngOnInit() {
    await this.platform.ready();

    // 1) Configura la status bar
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#17864B' });
    } catch {
      // en web/no soportado, simplemente ignora
    }

    // 2) Actualizar menú (incluyendo verificación de admin)
    this.updateAppPages();

    // 3) Suscribirse a cambios del usuario para actualizar menú en tiempo real
    this.authService.currentUser$.subscribe(() => {
      this.updateAppPages();
    });
  }

  /**
   * Actualiza las páginas del menú según el rol del usuario (admin o no)
   */
  private updateAppPages() {
    const user = this.authService.getCurrentUser();
    const isAdmin = user?.email?.toLowerCase().endsWith('@admin.cl') ?? false;

    // Array base de páginas
    const allPages: AppPage[] = [
      { title: 'Inicio', url: '/inicio', icon: 'home', admin: false },
      { title: 'Detectar ingredientes', url: '/menuingredientes', icon: 'restaurant', admin: false },
      { title: 'Configuraciones', url: '/configuraciones', icon: 'settings', admin: false },
      { title: '¿ Quienes somos ?', url: '/quienessomos', icon: 'people', admin: false },
      { title: 'Usuarios (Admin)', url: '/usuarios', icon: 'shield', admin: true }
    ];

    // Filtrar según si es admin o no
    this.appPages = allPages.filter(page => {
      if (page.admin) {
        return isAdmin; // Solo mostrar si es admin
      }
      return true; // Mostrar siempre si no es admin
    });
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

  /**
   * Verifica si el usuario actual es administrador
   */
  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.email?.toLowerCase().endsWith('@admin.cl') ?? false;
  }
}