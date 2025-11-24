import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'registro',
    loadChildren: () => import('./pages/registro/registro.module').then(m => m.RegistroPageModule)
  },
  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio.page').then((m) => m.InicioPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'menuingredientes',
    loadComponent: () => import('./pages/menuingredientes/menuingredientes.page').then(m => m.MenuingredientesPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'configuraciones',
    loadComponent: () => import('./pages/configuraciones/configuraciones.page').then(m => m.ConfiguracionesPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'quienessomos',
    loadComponent: () => import('./pages/quienessomos/quienessomos.page').then(m => m.QuienessomosPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'inicio-de-sesion',
    loadComponent: () => import('./pages/inicio-de-sesion/inicio-de-sesion.page').then(m => m.InicioDeSesionPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'camara',
    loadComponent: () => import('./pages/camara/camara.page').then(m => m.CamaraPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./pages/usuarios/usuarios.page').then(m => m.UsuariosPage),
    canActivate: [AdminGuard]  // ← SOLO ADMINS
  },
];