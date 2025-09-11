import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonCheckbox } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';

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
    IonCheckbox
  ]
})
export class MenuingredientesPage implements OnInit {

  listaAlergias = [
    { nombre: 'Maní', seleccionado: false },
    { nombre: 'Gluten', seleccionado: false },
    { nombre: 'Lácteos', seleccionado: false },
    { nombre: 'Mariscos', seleccionado: false },
    { nombre: 'Huevo', seleccionado: false },
  ];

  constructor() { }

  ngOnInit() {
  }

  guardarSeleccion() {
    const seleccionadas = this.listaAlergias.filter(alergia => alergia.seleccionado);
    const nombres = seleccionadas.map(a => a.nombre).join(', ');

    alert(`Seleccionaste: ${nombres}`);
    // Aquí puedes almacenar en localStorage, enviar a un backend, etc.
  }
}