// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rut: string;
  telefono: string;
  genero: string;
  fechaNacimiento?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.restoreSession();
  }

  /**
   * Restaura la sesión del usuario si existe
   */
  private restoreSession() {
    try {
      const userData = sessionStorage.getItem('currentUser');
      if (userData) {
        this.currentUserSubject.next(JSON.parse(userData));
      }
    } catch (e) {
      console.error('Error restaurando sesión:', e);
      sessionStorage.removeItem('currentUser');
    }
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async login(email: string, password: string): Promise<boolean> {
    try {
      if (!email || !password) {
        console.error('Email y contraseña son requeridos');
        return false;
      }

      // Llamada a la API
      const usuario = await lastValueFrom(this.apiService.login(email, password));

      if (usuario) {
        // Almacenar usuario en sesión
        const userData: Usuario = {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rut: usuario.rut,
          telefono: usuario.telefono,
          genero: usuario.genero,
          fechaNacimiento: usuario.fechaNacimiento
        };

        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        this.currentUserSubject.next(userData);

        console.log('✅ Login exitoso:', userData.nombre);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Error en login:', error.message || error);
      return false;
    }
  }

  /**
   * Registra un nuevo usuario
   */
  async registrar(datosRegistro: {
    email: string;
    rut: string;
    nombre: string;
    fechaNacimiento: string;
    telefono: string;
    genero: string;
    password: string;
  }): Promise<boolean> {
    try {
      // Validaciones básicas
      if (!datosRegistro.email || !datosRegistro.password) {
        console.error('Email y contraseña son requeridos');
        return false;
      }

      // Llamada a la API
      const response = await lastValueFrom(this.apiService.registrar(datosRegistro));

      if (response.success) {
        console.log('✅ Usuario registrado correctamente');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Error en registro:', error.message || error);
      return false;
    }
  }

  /**
   * Cierra sesión
   */
  logout() {
    sessionStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    console.log('✅ Sesión cerrada');
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  /**
   * Actualiza el usuario en sesión (sessionStorage + BehaviorSubject).
   * Útil para sincronizar cambios locales después de editar el perfil.
   */
  setCurrentUser(user: Usuario) {
    try {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
    } catch (e) {
      console.error('Error guardando usuario en sesión', e);
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Obtiene el ID del usuario actual
   */
  getCurrentUserId(): number | null {
    const user = this.currentUserSubject.value;
    return user ? user.id : null;
  }

  /**
   * Obtiene todos los usuarios (para módulo de administración)
   */
  async obtenerUsuarios(): Promise<any[]> {
    try {
      return await lastValueFrom(this.apiService.obtenerUsuarios());
    } catch (error: any) {
      console.error('Error obteniendo usuarios:', error.message || error);
      return [];
    }
  }
}