import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton} from '@ionic/angular/standalone';

@Component({
  selector: 'app-quienessomos',
  templateUrl: './quienessomos.page.html',
  styleUrls: ['./quienessomos.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton]
})
export class QuienessomosPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
