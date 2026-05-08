import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferenciaPixComponent } from './transferencia-pix.component';

describe('TransferenciaPixComponent', () => {
  let component: TransferenciaPixComponent;
  let fixture: ComponentFixture<TransferenciaPixComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferenciaPixComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransferenciaPixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
