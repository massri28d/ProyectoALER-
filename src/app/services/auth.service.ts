import { Injectable, inject } from '@angular/core';
import * as bcrypt from 'bcryptjs';
import { BehaviorSubject } from 'rxjs';

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rut: string;
  telefono: string;
  genero: string;
  fechaNacimiento?: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Base de datos temporal en memoria
  private usuariosTemporal: Usuario[] = [];
  private usuariosId = 1;

  constructor() {
    this.restoreSession();
    this.inicializarUsuariosDemo();
  }

  /**
   * Inicializa usuarios de demostración para pruebas
   */
  private inicializarUsuariosDemo() {
    // Usuario demo para pruebas
    const passwordDemo = bcrypt.hashSync('123456', 10);
    
    this.usuariosTemporal = [
      {
        id: 1,
        email: 'usuario@test.com',
        nombre: 'Usuario Test',
        rut: '12345678-9',
        telefono: '912345678',
        genero: 'Masculino',
        fechaNacimiento: '1990-01-01',
        password: passwordDemo
      },
      {
        id: 2,
        email: 'admin@test.com',
        nombre: 'Admin Sistema',
        rut: '98765432-1',
        telefono: '987654321',
        genero: 'Femenino',
        fechaNacimiento: '1985-05-15',
        password: passwordDemo
      }
    ];
    
    this.usuariosId = 3;
    
    console.log('✅ Usuarios demo inicializados');
    console.log('📧 Email: usuario@test.com | Contraseña: 123456');
    console.log('📧 Email: admin@test.com | Contraseña: 123456');
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
      if (!email || !password) return false;

      const user = this.usuariosTemporal.find(u => u.email === email);

      if (!user) {
        console.error('Usuario no encontrado');
        return false;
      }

      // Comparar contraseña con hash almacenado
      const isValid = bcrypt.compareSync(password, user.password);

      if (!isValid) {
        console.error('Contraseña incorrecta');
        return false;
      }

      // Almacenar usuario en sesión (sin contraseña)
      const userData = {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rut: user.rut,
        telefono: user.telefono,
        genero: user.genero,
        fechaNacimiento: user.fechaNacimiento
      };

      sessionStorage.setItem('currentUser', JSON.stringify(userData));
      this.currentUserSubject.next(userData);

      return true;
    } catch (e) {
      console.error('Error en login:', e);
      return false;
    }
  }

  /**
   * Registra un nuevo usuario (temporal en memoria)
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
      // Verificar si el email ya existe
      const existe = this.usuariosTemporal.find(u => u.email === datosRegistro.email);
      if (existe) {
        console.error('El email ya está registrado');
        return false;
      }

      // Hash de la contraseña
      const passwordHash = bcrypt.hashSync(datosRegistro.password, 10);

      // Crear nuevo usuario
      const nuevoUsuario: Usuario = {
        id: this.usuariosId++,
        email: datosRegistro.email,
        nombre: datosRegistro.nombre,
        rut: datosRegistro.rut,
        telefono: datosRegistro.telefono,
        genero: datosRegistro.genero,
        fechaNacimiento: datosRegistro.fechaNacimiento,
        password: passwordHash
      };

      this.usuariosTemporal.push(nuevoUsuario);
      console.log('✅ Usuario registrado correctamente:', nuevoUsuario.email);
      
      return true;
    } catch (e) {
      console.error('Error en registro:', e);
      return false;
    }
  }

  /**
   * Obtiene todos los usuarios (para pruebas)
   */
  getUsuarios(): Usuario[] {
    return this.usuariosTemporal.map(u => ({
      ...u,
      password: '' // No devolver la contraseña
    }));
  }

  /**
   * Cierra sesión
   */
  logout() {
    sessionStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }
}