import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface Usuario {
  idUsuario: number;
  nomeCompleto: string;
  cpf: string;
}

export interface Conta {
  id: number;
  usuario: Usuario;
  tipoConta: string;
  numeroAgencia: string;
  numeroConta: string;
  saldo: number;
}

export interface Transacao {
  dataHora: string;
  tipoTransacao: string;
  valor: number;
  cpfDestino?: string;
  nomeContraparte?: string;
}

@Injectable({ providedIn: 'root' })
export class SharedDataService {

  private readonly API_BASE = 'http://localhost:8086/api';

  // Dados reativos — qualquer componente pode se inscrever
  private contaSubject = new BehaviorSubject<Conta | null>(null);
  conta$ = this.contaSubject.asObservable();

  private transacoesSubject = new BehaviorSubject<Transacao[]>([]);
  transacoes$ = this.transacoesSubject.asObservable();

  // Getters síncronos para uso direto no template via `shared.conta`
  get conta(): Conta | null { return this.contaSubject.value; }
  get transacoes(): Transacao[] { return this.transacoesSubject.value; }

  constructor(private http: HttpClient) {}

  carregarConta(): void {
    this.http.get<Conta[]>(`${this.API_BASE}/contas`).subscribe({
      next: (contas) => {
        if (contas?.length) {
          this.contaSubject.next(contas[0]);
          this.carregarTransacoes();
        }
      },
      error: (err) => console.error('Erro ao carregar conta:', err)
    });
  }

  carregarTransacoes(): void {
    const t = Date.now();
    this.http.get<Transacao[]>(`${this.API_BASE}/transacoes/extrato?t=${t}`).subscribe({
      next: (data) => {
        const formatadas = (data || []).map(tx => {
          const tipo = tx.tipoTransacao || '';
          const ehSaida = tipo.includes('ENVIADA') || tipo.includes('SAQUE') || tipo.includes('PAGAMENTO');
          return { ...tx, valor: ehSaida ? -Math.abs(tx.valor) : Math.abs(tx.valor) };
        }).sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());

        this.transacoesSubject.next(formatadas);
      },
      error: (err) => console.error('Erro ao carregar transações:', err)
    });
  }

  // Chame após qualquer transferência para atualizar tudo
  recarregarTudo(): void {
    this.carregarConta();
  }
}