import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection
} from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private DB_NAME = 'BD_ALER';
  private platform = Capacitor.getPlatform();
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  /**
   * Inicializa el plugin (llamar al inicio de la app)
   */
  async initializePlugin(): Promise<void> {
    // Si ya está inicializando, espera a que termine
    if (this.initPromise) {
      return this.initPromise;
    }

    // Si ya está inicializado, retorna
    if (this.isInitialized) {
      console.log('[DB] Ya está inicializado');
      return;
    }

    // Crea una promesa de inicialización
    this.initPromise = this._initialize();
    
    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private async _initialize(): Promise<void> {
    console.log('[DB] Plataforma:', this.platform);

    if (this.platform === 'web') {
      try {
        // Espera adicional para asegurar que jeep-sqlite está completamente registrado
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verifica que el elemento custom existe
        const jeepEl = document.createElement('jeep-sqlite');
        if (!customElements.get('jeep-sqlite')) {
          throw new Error('jeep-sqlite no está registrado como custom element');
        }
        console.log('[DB] jeep-sqlite custom element verificado');
        
        // Inicializa el web store
        await this.sqlite.initWebStore();
        console.log('[DB] Web store inicializado correctamente');
      } catch (err) {
        console.error('[DB] Error en initWebStore:', err);
        throw err;
      }
    }

    try {
      await this.createOrOpenDb();
      this.isInitialized = true;
      console.log('[DB] Base de datos inicializada correctamente');
    } catch (err) {
      console.error('[DB] Error en createOrOpenDb:', err);
      throw err;
    }
  }

  /**
   * Crea o abre la base de datos
   */
  private async createOrOpenDb(): Promise<void> {
    if (this.db) {
      console.log('[DB] Ya existe una conexión a la base de datos');
      return;
    }

    try {
      // Verifica si la conexión ya existe
      const ret = await this.sqlite.isConnection(this.DB_NAME, false);
      if (ret.result) {
        // Si existe, la recupera
        this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
        console.log('[DB] Conexión recuperada');
      } else {
        // Si no existe, la crea
        this.db = await this.sqlite.createConnection(
          this.DB_NAME,
          false,
          'no-encryption',
          1,
          false
        );
        console.log('[DB] Conexión creada');
      }

      // Abre la base de datos
      await this.db.open();
      console.log('[DB] Base de datos abierta');

      // Crea las tablas
      await this.createTables();
      console.log('[DB] Tablas creadas/verificadas');

      // IMPORTANTE: En web, guarda los cambios al store
      if (this.platform === 'web') {
        await this.sqlite.saveToStore(this.DB_NAME);
        console.log('[DB] Cambios guardados en el store');
      }

    } catch (err) {
      console.error('[DB] Error creando/abriendo la base de datos:', err);
      throw err;
    }
  }

  /**
   * Crea tablas
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      console.error('[DB] DB no inicializada en createTables');
      throw new Error('DB no inicializada');
    }

    const createUsers = `
      CREATE TABLE IF NOT EXISTS users (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         email TEXT UNIQUE,
         rut VARCHAR(20) NOT NULL,
         nombre TEXT NOT NULL,
         fechaNacimiento TEXT,
         telefono TEXT,
         genero TEXT CHECK(genero IN ('Masculino', 'Femenino', 'Otro', 'Prefiero no decir')),
         password VARCHAR(150)
      );
    `;

    try {
      await this.db.execute(createUsers);
      console.log('[DB] Tabla users creada/verificada');
    } catch (err) {
      console.error('[DB] Error creando tablas:', err);
      throw err;
    }
  }

  /**
   * Verifica que la DB esté lista antes de operaciones
   */
  private async ensureReady(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      console.warn('[DB] Reintentando inicialización...');
      await this.initializePlugin();
    }
    if (!this.db) {
      throw new Error('DB no inicializada después de intentar reiniciar');
    }
  }

  /**
   * Inserta un usuario
   */
  async addUser(user: {
    email: string;
    rut: string;
    nombre: string;
    fechaNacimiento: string;
    telefono: string;
    genero: string;
    password: string;
  }): Promise<any> {
    await this.ensureReady();

    const sql =
      'INSERT INTO users (email, nombre, fechaNacimiento, telefono, genero, password, rut) VALUES (?, ?, ?, ?, ?, ?, ?);';

    try {
      const res = await this.db!.run(sql, [
        user.email,
        user.nombre,
        user.fechaNacimiento,
        user.telefono,
        user.genero,
        user.password,
        user.rut
      ]);

      // En web, guarda los cambios
      if (this.platform === 'web') {
        await this.sqlite.saveToStore(this.DB_NAME);
        console.log('[DB] Usuario guardado en el store');
      }

      return res;
    } catch (err) {
      console.error('[DB] Error insertando usuario:', err);
      throw err;
    }
  }

  /**
   * Obtiene todos los usuarios
   */
  async getUsers(): Promise<any[]> {
    await this.ensureReady();

    try {
      const res = await this.db!.query('SELECT * FROM users;');
      return res.values ?? [];
    } catch (err) {
      console.error('[DB] Error obteniendo usuarios:', err);
      return [];
    }
  }

  /**
   * Obtiene un usuario por email
   */
  async getUserByEmail(email: string): Promise<any | null> {
    await this.ensureReady();

    try {
      const res = await this.db!.query(
        'SELECT * FROM users WHERE email = ? LIMIT 1;',
        [email]
      );
      return res.values && res.values.length ? res.values[0] : null;
    } catch (err) {
      console.error('[DB] Error obteniendo usuario por email:', err);
      return null;
    }
  }

  /**
   * Exporta la base de datos como archivo para descargar
   */
  async exportDb(): Promise<Blob | null> {
    await this.ensureReady();

    try {
      // Exporta la base de datos en formato JSON
      const result = await this.db!.exportToJson('full');
      const jsonStr = JSON.stringify(result, null, 2);
      // Crea un blob para descargar
      return new Blob([jsonStr], { type: 'application/json' });
    } catch (err) {
      console.error('[DB] Error exportando la base de datos:', err);
      return null;
    }
  }

  /**
   * Cierra la conexión (opcional, para limpieza)
   */
  async closeConnection(): Promise<void> {
    if (this.db) {
      try {
        await this.db.close();
        this.db = null;
        this.isInitialized = false;
        console.log('[DB] Conexión cerrada');
      } catch (err) {
        console.error('[DB] Error cerrando conexión:', err);
      }
    }
  }
}