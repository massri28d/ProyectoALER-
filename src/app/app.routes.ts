import { Routes } from '@angular/router';

export const routes: Routes = [
{
  path: '',
  redirectTo: 'inicio',
  pathMatch: 'full'
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
];
