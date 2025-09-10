import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InicioDeSesionPage } from './inicio-de-sesion.page';

describe('InicioDeSesionPage', () => {
  let component: InicioDeSesionPage;
  let fixture: ComponentFixture<InicioDeSesionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InicioDeSesionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
