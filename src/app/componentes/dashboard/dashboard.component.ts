import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CurrencyPipe, DatePipe } from '@angular/common';

interface Transacao {
  data: string;
  tipo: string;
  valor: number;
  detalhes: string;
}

interface Extrato {
  titular: string;
  saldoAtual: number;
  transacoes: Transacao[];
}

interface Conta {
  id: number;
  usuarioId: number;
  tipoConta: string;
  numeroAgencia: string;
  numeroConta: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  extrato: Extrato | null = null;
  conta: Conta | null = null;
  loading = true;
  erro = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.loading = true;
    this.erro = '';

    // Busca extrato (saldo + transações)
    this.http.get<Extrato>('/api/extrato').subscribe({
      next: (data) => {
        this.extrato = data;
        this.loading = false;
      },
      error: (err) => {
        this.erro = err?.error?.message || 'Erro ao carregar extrato.';
        this.loading = false;
      }
    });

    // Busca dados da conta
    this.http.get<Conta>('/api/contas').subscribe({
      next: (data) => {
        this.conta = data;
      },
      error: () => {
        // silencia erro de conta, não é crítico
      }
    });
  }
}