import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-menuingredientes',
  templateUrl: './menuingredientes.page.html',
  styleUrls: ['./menuingredientes.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class MenuingredientesPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
