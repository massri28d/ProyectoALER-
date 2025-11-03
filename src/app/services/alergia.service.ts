// src/app/services/alergia.service.ts
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { lastValueFrom } from 'rxjs';

export interface Alergia {
  id: number;
  nombre: string;
  descripcion?: string;
  seleccionado?: boolean; // Para uso en la UI
}

export interface AlergiaUsuario extends Alergia {
  nota?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlergiaService {
  private alergiasCache: Alergia[] = [];
  private alergiasUsuarioCache: AlergiaUsuario[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  /**
   * Obtiene todas las alergias disponibles
   */
  async obtenerTodasLasAlergias(forzarRecarga: boolean = false): Promise<Alergia[]> {
    if (this.alergiasCache.length > 0 && !forzarRecarga) {
      return this.alergiasCache;
    }

    try {
      this.alergiasCache = await lastValueFrom(this.apiService.obtenerAlergias());
      return this.alergiasCache;
    } catch (error: any) {
      console.error('Error obteniendo alergias:', error.message || error);
      return [];
    }
  }

  /**
   * Obtiene las alergias del usuario actual
   */
  async obtenerAlergiasUsuario(forzarRecarga: boolean = false): Promise<AlergiaUsuario[]> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      console.error('No hay usuario autenticado');
      return [];
    }

    if (this.alergiasUsuarioCache.length > 0 && !forzarRecarga) {
      return this.alergiasUsuarioCache;
    }

    try {
      this.alergiasUsuarioCache = await lastValueFrom(
        this.apiService.obtenerAlergiasUsuario(userId)
      );
      return this.alergiasUsuarioCache;
    } catch (error: any) {
      console.error('Error obteniendo alergias del usuario:', error.message || error);
      return [];
    }
  }

  /**
   * Agrega una alergia al perfil del usuario
   */
  async agregarAlergiaUsuario(alergiaId: number, nota?: string): Promise<boolean> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      console.error('No hay usuario autenticado');
      return false;
    }

    try {
      await lastValueFrom(
        this.apiService.agregarAlergiaUsuario(userId, alergiaId, nota)
      );
      
      // Limpiar caché para forzar recarga
      this.alergiasUsuarioCache = [];
      
      console.log('✅ Alergia agregada correctamente');
      return true;
    } catch (error: any) {
      console.error('Error agregando alergia:', error.message || error);
      return false;
    }
  }

  /**
   * Guarda múltiples alergias seleccionadas
   */
  async guardarAlergiasSeleccionadas(alergiasSeleccionadas: Alergia[]): Promise<{
    exitosas: number;
    fallidas: number;
  }> {
    let exitosas = 0;
    let fallidas = 0;

    // Obtener alergias actuales del usuario
    const alergiasActuales = await this.obtenerAlergiasUsuario(true);
    const idsActuales = alergiasActuales.map(a => a.id);

    // Agregar solo las que no tiene
    for (const alergia of alergiasSeleccionadas) {
      if (!idsActuales.includes(alergia.id)) {
        const resultado = await this.agregarAlergiaUsuario(alergia.id);
        if (resultado) {
          exitosas++;
        } else {
          fallidas++;
        }
      }
    }

    return { exitosas, fallidas };
  }

  /**
   * Verifica si el usuario tiene una alergia específica
   */
  async tieneAlergia(alergiaId: number): Promise<boolean> {
    const alergias = await this.obtenerAlergiasUsuario();
    return alergias.some(a => a.id === alergiaId);
  }

  /**
   * Obtiene las alergias con su estado de selección para el usuario actual
   */
  async obtenerAlergiasConEstado(): Promise<Alergia[]> {
    const todasLasAlergias = await this.obtenerTodasLasAlergias();
    const alergiasUsuario = await this.obtenerAlergiasUsuario();
    const idsUsuario = alergiasUsuario.map(a => a.id);

    return todasLasAlergias.map(alergia => ({
      ...alergia,
      seleccionado: idsUsuario.includes(alergia.id)
    }));
  }

  /**
   * Limpia el caché
   */
  limpiarCache() {
    this.alergiasCache = [];
    this.alergiasUsuarioCache = [];
  }
}