import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { VisibilidadeValoresService } from '../../core/services/visibilidade-valores.service';

@Component({
  selector: 'app-transferencia',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './transferencia.component.html',
  styleUrl: './transferencia.component.css'
})
export class TransferenciaComponent implements OnInit {
  usuarioLogado: User | null = null;
  conta: any = null;

  loading = false;
  loadingTransfer = false;
  msgSucesso = '';
  msgErro = '';

  // --- Controle do modal ---
  modalAberto = false;
  destinatarioNome = '';
  destinatarioAgencia = '';
  buscandoDestinatario = false;
  erroDestinatario = '';

  transferenciaData = {
    contaOrigem: 0,
    agenciaDestino: '',
    numeroContaDestino: '',
    valor: null as number | null,
    tipoTransferencia: 'TED'
  };

  valorDigitado: string = '';

  private readonly API_BASE = 'http://localhost:8086/api';

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    public visibilidadeValores: VisibilidadeValoresService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.usuarioLogado = user;
    });
    this.carregarConta();
  }

  carregarConta() {
    this.loading = true;
    this.http.get<any[]>(`${this.API_BASE}/contas`).subscribe({
      next: (contas) => {
        if (contas && contas.length > 0) {
          this.conta = contas[0];
          this.transferenciaData.contaOrigem = this.conta.id;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar conta', err);
        this.loading = false;
      }
    });
  }

  // --- Abre o modal de confirmação ---
  abrirConfirmacao() {
    this.msgErro = '';
    this.erroDestinatario = '';

    if (!this.transferenciaData.agenciaDestino || !this.transferenciaData.numeroContaDestino) {
      this.msgErro = 'Preencha a agência e o número da conta de destino.';
      return;
    }

    if (!this.valorNumerico || this.valorNumerico <= 0) {
      this.msgErro = 'Informe um valor válido.';
      return;
    }

    if (this.conta && this.valorNumerico > this.conta.saldo) {
      this.msgErro = 'Saldo insuficiente para esta transferência.';
      return;
    }

    this.transferenciaData.valor = this.valorNumerico;

    // Busca o nome do destinatário pela conta de destino
    this.buscandoDestinatario = true;

    this.http.get<any>(`${this.API_BASE}/contas/buscar`, {
      params: {
        agencia: this.transferenciaData.agenciaDestino,
        numeroConta: this.transferenciaData.numeroContaDestino
      }
    }).subscribe({
      next: (destino) => {
        this.destinatarioNome = destino.nomeCompleto || 'Destinatário';
        this.destinatarioAgencia = destino.numeroAgencia;
        this.buscandoDestinatario = false;
        this.modalAberto = true;
      },
      error: () => {
        this.msgErro = 'Conta de destino não encontrada. Verifique a agência e o número.';
        this.buscandoDestinatario = false;
      }
    });
  }

  fecharModal() {
    this.modalAberto = false;
  }

  // --- Confirma e envia após o modal ---
  confirmarTransferencia() {
    this.loadingTransfer = true;
    this.msgSucesso = '';
    this.msgErro = '';

    this.http.post(`${this.API_BASE}/transferencias`, this.transferenciaData).subscribe({
      next: () => {
        this.modalAberto = false;
        this.msgSucesso = 'Transferência realizada com sucesso!';
        this.loadingTransfer = false;
        this.limparFormulario();
        this.carregarConta();
      },
      error: (err) => {
        this.modalAberto = false;
        this.msgErro = err.error?.mensagem || 'Erro ao realizar transferência.';
        this.loadingTransfer = false;
      }
    });
  }

  // --- Getters de valor formatado ---
  get valorFormatado(): string {
    if (!this.valorDigitado) return '';
    const numero = parseInt(this.valorDigitado, 10) / 100;
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  get valorNumerico(): number {
    return parseInt(this.valorDigitado || '0', 10) / 100;
  }

  onDigitarValor(event: Event) {
    const input = event.target as HTMLInputElement;
    const apenasDigitos = input.value.replace(/\D/g, '');
    this.valorDigitado = apenasDigitos;
    input.value = this.valorFormatado;
    this.transferenciaData.valor = this.valorNumerico;
  }

  onTeclaValor(event: KeyboardEvent) {
    const permitidas = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'];
    if (permitidas.includes(event.key)) {
      if (event.key === 'Backspace') {
        this.valorDigitado = this.valorDigitado.slice(0, -1);
        const input = event.target as HTMLInputElement;
        input.value = this.valorFormatado;
        this.transferenciaData.valor = this.valorNumerico;
        event.preventDefault();
      }
      return;
    }
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  private limparFormulario() {
    this.valorDigitado = '';
    this.transferenciaData.valor = null;
    this.transferenciaData.agenciaDestino = '';
    this.transferenciaData.numeroContaDestino = '';
  }
}