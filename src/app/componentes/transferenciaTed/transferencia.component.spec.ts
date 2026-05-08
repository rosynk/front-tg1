import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransferenciaComponent } from './transferencia.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('TransferenciaComponent', () => {
  let component: TransferenciaComponent;
  let fixture: ComponentFixture<TransferenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Importa o componente standalone
      imports: [TransferenciaComponent],
      // Fornece os serviços necessários para o teste não quebrar
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(), // Simula o backend
        provideRouter([])           // Simula as rotas (routerLink)
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransferenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve iniciar com os valores de transferência vazios', () => {
    expect(component.transferenciaData.valor).toBeNull();
    expect(component.transferenciaData.agenciaDestino).toBe('');
    expect(component.transferenciaData.numeroContaDestino).toBe('');
  });
});
