import { Routes } from '@angular/router';

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
    loadComponent: () =>
      import('./pages/inicio/inicio.page').then((m) => m.InicioPage),
  },
  {
    path: 'menuingredientes',
    loadComponent: () => import('./pages/menuingredientes/menuingredientes.page').then( m => m.MenuingredientesPage)
  },
  {
    path: 'configuraciones',
    loadComponent: () => import('./pages/configuraciones/configuraciones.page').then( m => m.ConfiguracionesPage)
  },
  {
    path: 'quienessomos',
    loadComponent: () => import('./pages/quienessomos/quienessomos.page').then( m => m.QuienessomosPage)
  },
  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio.page').then( m => m.InicioPage)
  },
  {
    path: 'inicio-de-sesion',
    loadComponent: () => import('./pages/inicio-de-sesion/inicio-de-sesion.page').then( m => m.InicioDeSesionPage)
  },
  {
    path: 'camara',
    loadComponent: () => import('./pages/camara/camara.page').then( m => m.CamaraPage)
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./pages/usuarios/usuarios.page').then(m => m.UsuariosPage)
  },
];
