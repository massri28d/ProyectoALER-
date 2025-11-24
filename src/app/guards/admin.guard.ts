import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    // Primero verifica si está autenticado
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Obtiene el usuario actual
    const user = this.authService.getCurrentUser();

    // Verifica que el email termine con @admin.cl
    if (user?.email && user.email.toLowerCase().endsWith('@admin.cl')) {
      return true;
    }

    // Si no es admin, muestra un mensaje y redirige
    const toast = await this.toastCtrl.create({
      message: 'Acceso denegado. Solo administradores pueden acceder.',
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();

    this.router.navigate(['/inicio']);
    return false;
  }
}