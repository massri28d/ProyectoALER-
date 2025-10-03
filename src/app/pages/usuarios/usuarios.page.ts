import { Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/services/database.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class UsuariosPage implements OnInit {
  usuarios: any[] = [];
  loading = true;

  constructor(private db: DatabaseService) {}

  async ngOnInit() {
    try {
      this.usuarios = await this.db.getUsers();
    } catch (err) {
      console.error('Error obteniendo usuarios', err);
    } finally {
      this.loading = false;
    }
  }

  async descargarDb() {
    const blob = await this.db.exportDb();
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'BD_ALER.json';
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      alert('No se pudo exportar la base de datos.');
    }
  }
}
