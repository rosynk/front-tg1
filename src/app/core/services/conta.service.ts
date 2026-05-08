import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class ContaService {
  private apiUrl = 'http://localhost:8086/api/contas';

  // O "Subject" que vai segurar os dados da conta ativa
  private contaAtivaSubject = new BehaviorSubject<any | null>(null);
  public contaAtiva$ = this.contaAtivaSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Carrega os dados e notifica todos os interessados (Pix, Extrato, TED)
  carregarDadosDaConta(idUsuario: number) {
    this.http.get<any[]>(`${this.apiUrl}/usuario/${idUsuario}`).subscribe({
      next: (contas) => {
        if (contas && contas.length > 0) {
          this.contaAtivaSubject.next(contas[0]); // Define a conta principal
        }
      },
      error: (err) => console.error('Erro ao sincronizar conta', err)
    });
  }

  // Getters para uso rápido
  get dadosConta() {
    return this.contaAtivaSubject.value;
  }
}
