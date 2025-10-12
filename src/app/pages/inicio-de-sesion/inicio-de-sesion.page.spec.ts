/// <reference types="jasmine" />

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { InicioDeSesionPage } from './inicio-de-sesion.page';
import { RouterTestingModule } from '@angular/router/testing';

describe('InicioDeSesionPage', () => {
  let component: InicioDeSesionPage;
  let fixture: ComponentFixture<InicioDeSesionPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InicioDeSesionPage,     // componente standalone
        RouterTestingModule     // por el routerLink del template
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InicioDeSesionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
