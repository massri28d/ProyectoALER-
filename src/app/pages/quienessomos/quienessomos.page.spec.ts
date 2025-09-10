import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuienessomosPage } from './quienessomos.page';

describe('QuienessomosPage', () => {
  let component: QuienessomosPage;
  let fixture: ComponentFixture<QuienessomosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(QuienessomosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
