import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuingredientesPage } from './menuingredientes.page';

describe('MenuingredientesPage', () => {
  let component: MenuingredientesPage;
  let fixture: ComponentFixture<MenuingredientesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuingredientesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
