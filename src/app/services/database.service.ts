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

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  /**
   * Inicializa el plugin (llamar al inicio de la app)
   */
  async initializePlugin(): Promise<void> {
    const platform = Capacitor.getPlatform();
    console.log('[DB] Plataforma:', platform);
    if (platform === 'web') {
      try {
        await this.sqlite.initWebStore();
        console.log('[DB] initWebStore ejecutado correctamente');
      } catch (err) {
        console.error('[DB] Error en initWebStore:', err);
        throw err;
      }
    }
    try {
      await this.createOrOpenDb();
      console.log('[DB] createOrOpenDb ejecutado correctamente');
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
      this.db = await this.sqlite.createConnection(
        this.DB_NAME,
        false,
        'no-encryption',
        1,
        false
      );
      console.log('[DB] Conexión creada');
      await this.db.open();
      console.log('[DB] Base de datos abierta');
      await this.createTables();
      console.log('[DB] Tablas creadas');
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

    // ahora se usa execute(sqlString) directamente
    await this.db.execute(createUsers);
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
    if (!this.db) throw new Error('DB no inicializada');

    const sql =
      'INSERT INTO users (email, nombre, fechaNacimiento, telefono, genero, password, rut) VALUES (?, ?, ?, ?, ?, ?, ?);';

    // run(sql, values)
    const res = await this.db.run(sql, [
      user.email,
      user.rut,
      user.nombre,
      user.fechaNacimiento,
      user.telefono,
      user.genero,
      user.password
    ]);
    return res;
  }

  /**
   * Obtiene todos los usuarios
   */
  async getUsers(): Promise<any[]> {
    if (!this.db) throw new Error('DB no inicializada');

    // query(sql)
    const res = await this.db.query('SELECT * FROM users;');
    return res.values ?? [];
  }

  /**
   * Exporta la base de datos como archivo para descargar
   */
  async exportDb(): Promise<Blob | null> {
    if (!this.db) {
      console.error('[DB] No hay conexión a la base de datos');
      return null;
    }
    try {
      // Exporta la base de datos en formato Uint8Array
      const result = await this.db.exportToJson('full');
      const jsonStr = JSON.stringify(result);
      // Crea un blob para descargar
      return new Blob([jsonStr], { type: 'application/json' });
    } catch (err) {
      console.error('[DB] Error exportando la base de datos:', err);
      return null;
    }
  }
}

