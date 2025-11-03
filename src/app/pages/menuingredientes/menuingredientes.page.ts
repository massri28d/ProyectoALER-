// src/app/pages/menuingredientes/menuingredientes.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, 
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, 
  IonItem, IonLabel, IonCheckbox, IonSpinner, ToastController 
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { AlergiaService, Alergia } from '../../services/alergia.service';

@Component({
  selector: 'app-menuingredientes',
  templateUrl: './menuingredientes.page.html',
  styleUrls: ['./menuingredientes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonSpinner
  ]
})
export class MenuingredientesPage implements OnInit {
  listaAlergias: Alergia[] = [];
  cargando = true;
  guardando = false;

  constructor(
    private alergiaService: AlergiaService,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    await this.cargarAlergias();
  }

  /**
   * Carga las alergias disponibles y marca las del usuario
   */
  async cargarAlergias() {
    this.cargando = true;
    try {
      // Obtiene todas las alergias con su estado de selección
      this.listaAlergias = await this.alergiaService.obtenerAlergiasConEstado();
      
      if (this.listaAlergias.length === 0) {
        this.mostrarToast('No se pudieron cargar las alergias');
      }
    } catch (error) {
      console.error('Error cargando alergias:', error);
      this.mostrarToast('Error al cargar alergias');
    } finally {
      this.cargando = false;
    }
  }

  /**
   * Guarda las alergias seleccionadas
   */
  async guardarSeleccion() {
    const seleccionadas = this.listaAlergias.filter(a => a.seleccionado);
    
    if (seleccionadas.length === 0) {
      this.mostrarToast('No has seleccionado ninguna alergia');
      return;
    }

    this.guardando = true;
    
    try {
      const resultado = await this.alergiaService.guardarAlergiasSeleccionadas(seleccionadas);
      
      if (resultado.exitosas > 0) {
        const nombres = seleccionadas.map(a => a.nombre).join(', ');
        this.mostrarToast(`✅ Alergias guardadas: ${nombres}`);
        
        // Recargar alergias
        await this.cargarAlergias();
      } else if (resultado.fallidas > 0) {
        this.mostrarToast('⚠️ Algunas alergias no se pudieron guardar');
      }
    } catch (error) {
      console.error('Error guardando alergias:', error);
      this.mostrarToast('Error al guardar alergias');
    } finally {
      this.guardando = false;
    }
  }

  /**
   * Recarga las alergias desde la API
   */
  async recargar(event?: any) {
    await this.cargarAlergias();
    if (event) {
      event.target.complete();
    }
  }

  /**
   * Muestra un mensaje toast
   */
  private async mostrarToast(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}