//vscode asocia a tipos jasmine
/// <reference types="jasmine" />

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CamaraPage } from './camara.page';

describe('CamaraPage', () => {
  let component: CamaraPage;
  let fixture: ComponentFixture<CamaraPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CamaraPage],
    }).compileComponents();

    fixture = TestBed.createComponent(CamaraPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});