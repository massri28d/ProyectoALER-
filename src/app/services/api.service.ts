// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  usuario?: T;
  usuarios?: T[];
  alergias?: T[];
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // IMPORTANTE: Cambia esta URL según tu configuración
  private readonly API_URL = 'http://localhost/ProyectoALER/api';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  // ==================== USUARIOS ====================

  /**
   * Login de usuario
   */
  login(email: string, password: string): Observable<any> {
    const body = { email, password };
    return this.http.post<ApiResponse>(`${this.API_URL}/usuarios/login.php`, body, this.httpOptions)
      .pipe(
        map(response => {
          if (response.success && response.usuario) {
            return response.usuario;
          }
          throw new Error(response.error || 'Error en login');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Registro de usuario
   */
  registrar(usuario: {
    email: string;
    nombre: string;
    rut: string;
    telefono: string;
    genero: string;
    fechaNacimiento: string;
    password: string;
  }): Observable<any> {
    return this.http.post<ApiResponse>(`${this.API_URL}/usuarios/registro.php`, usuario, this.httpOptions)
      .pipe(
        map(response => {
          if (response.success) {
            return response;
          }
          throw new Error(response.error || 'Error en registro');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener todos los usuarios
   */
  obtenerUsuarios(): Observable<any[]> {
    return this.http.get<ApiResponse>(`${this.API_URL}/usuarios/obtener.php`)
      .pipe(
        map(response => {
          if (response.success && response.usuarios) {
            return response.usuarios;
          }
          throw new Error(response.error || 'Error al obtener usuarios');
        }),
        catchError(this.handleError)
      );
  }

  // ==================== ALERGIAS ====================

  /**
   * Obtener todas las alergias
   */
  obtenerAlergias(): Observable<any[]> {
    return this.http.get<ApiResponse>(`${this.API_URL}/alergias/obtener.php`)
      .pipe(
        map(response => {
          if (response.success && response.alergias) {
            return response.alergias;
          }
          throw new Error(response.error || 'Error al obtener alergias');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener alergias de un usuario específico
   */
  obtenerAlergiasUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<ApiResponse>(`${this.API_URL}/perfil/alergias_usuario.php?usuario_id=${usuarioId}`)
      .pipe(
        map(response => {
          if (response.success && response.alergias) {
            return response.alergias;
          }
          throw new Error(response.error || 'Error al obtener alergias del usuario');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Agregar alergia a un usuario
   */
  agregarAlergiaUsuario(usuarioId: number, alergiaId: number, nota?: string): Observable<any> {
    const body = { usuario_id: usuarioId, alergia_id: alergiaId, nota };
    return this.http.post<ApiResponse>(`${this.API_URL}/perfil/agregar_alergia.php`, body, this.httpOptions)
      .pipe(
        map(response => {
          if (response.success) {
            return response;
          }
          throw new Error(response.error || 'Error al agregar alergia');
        }),
        catchError(this.handleError)
      );
  }

  // ==================== MANEJO DE ERRORES ====================

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Código de error: ${error.status}, Mensaje: ${error.message}`;
      }
    }

    console.error('API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}