import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PixService } from '../../core/services/pix.service';
import { AuthService } from '../../core/services/auth.service';
import { VisibilidadeValoresService } from '../../core/services/visibilidade-valores.service';

@Component({
  selector: 'app-transferencia-pix',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './transferencia-pix.component.html',
  styleUrls: ['./transferencia-pix.component.css']
})
export class TransferenciaPixComponent implements OnInit {

  // --- CONTROLE DE ESTADO ---
  abaAtiva: 'lista' | 'cadastro' | 'transferir' | 'gerenciar' = 'transferir';

  // --- DADOS ---
  conta: any;
  extrato: any;
  loading = true;
  loadingExtrato = false;
  periodoSelecionado = 30;
  erroChave = '';
  usuarioLogado: any = null;
  usuarioNome = '';
  erroTransferencia = '';
  sucessoTransferencia = '';

  chavePix = '';
  valorPix = 0;
  mensagemPix = '';
  novaChave = { tipo: 'CPF', valor: '' };
  chaves: any[] = [];
  listaChaves: any[] = [];

  // --- MODAL ---
  modalAberto = false;
  destinatarioNome = '';
  destinatarioChave = '';
  buscandoDestinatario = false;

  valorDigitado = '';

  private readonly API_BASE = 'http://localhost:8086/api';

  constructor(
    private router: Router,
    private pixService: PixService,
    private authService: AuthService,
    private http: HttpClient,
    public visibilidadeValores: VisibilidadeValoresService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.usuarioLogado = user;
      const userData = user as any;
      this.usuarioNome = userData?.nomeCompleto || user?.nome || 'Usuário Bizi';
    });
    this.carregarDados();
    this.carregarChaves();
  }

  mudarAba(aba: 'lista' | 'cadastro' | 'transferir' | 'gerenciar') {
    this.abaAtiva = aba;
    if (aba === 'gerenciar') this.carregarChaves();
  }

  carregarDados(): void {
    this.loading = true;
    this.loadingExtrato = true;
    this.pixService.getContaInfo().subscribe({
      next: (data: any) => {
        this.conta = data;
        this.extrato = data.extrato;
        this.loading = false;
        this.loadingExtrato = false;
      },
      error: (err) => {
        console.error('Erro conta:', err);
        this.loading = false;
        this.loadingExtrato = false;
      }
    });
  }

  // --- ABRE MODAL COM BUSCA DO DESTINATÁRIO ---
  abrirConfirmacao(): void {
    this.erroTransferencia = '';

    if (!this.chavePix?.trim()) {
      this.erroTransferencia = 'Informe a chave Pix do destinatário.';
      return;
    }

    if (!this.valorNumerico || this.valorNumerico <= 0) {
      this.erroTransferencia = 'Informe um valor válido.';
      return;
    }

    if (this.conta && this.valorNumerico > this.conta.saldo) {
      this.erroTransferencia = 'Saldo insuficiente para este Pix.';
      return;
    }

    this.buscandoDestinatario = true;

    // Busca o nome do destinatário pela chave Pix
    this.http.get<any>(`${this.API_BASE}/chaves-pix/buscar`, {
      params: { chave: this.chavePix.trim() }
    }).subscribe({
      next: (res) => {
        this.destinatarioNome = res?.nomeCompleto || res?.nome || 'Destinatário';
        this.destinatarioChave = this.chavePix.trim();
        this.buscandoDestinatario = false;
        this.modalAberto = true;
      },
      error: () => {
        // Se o endpoint de busca por chave não existir ainda, abre o modal com fallback
        this.destinatarioNome = 'Destinatário';
        this.destinatarioChave = this.chavePix.trim();
        this.buscandoDestinatario = false;
        this.modalAberto = true;
      }
    });
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  // --- CONFIRMA E ENVIA ---
  confirmarPix(): void {
    this.erroTransferencia = '';
    this.sucessoTransferencia = '';

    const payload = {
      chavePixDestino: this.chavePix.trim(),
      valor: this.valorNumerico
    };

    this.loading = true;

    this.pixService.realizarTransferencia(payload).subscribe({
      next: (res: any) => {
        this.modalAberto = false;
        this.sucessoTransferencia = res?.message || 'Pix enviado com sucesso!';
        this.chavePix = '';
        this.valorDigitado = '';
        this.carregarDados();
        this.loading = false;
        setTimeout(() => { this.sucessoTransferencia = ''; }, 4000);
      },
      error: (err: any) => {
        this.modalAberto = false;
        this.erroTransferencia = err.error?.message || err.error?.mensagem || 'Erro ao realizar Pix. Tente novamente.';
        this.loading = false;
      }
    });
  }

  // --- CHAVES ---
  formatarTipoChave(tipo: string): string {
    if (!tipo) return 'Chave Pix';
    if (/^\d{11}$/.test(tipo)) return 'CPF';
    const tipos: any = { 'EMAIL': 'E-mail', 'TELEFONE': 'Telefone', 'ALEATORIA': 'Chave Aleatória' };
    return tipos[tipo.toUpperCase()] || tipo;
  }

  carregarChaves() {
    this.loading = true;
    this.pixService.listarChaves().subscribe({
      next: (res: any) => {
        const dados = res?.data || res?.dados || res || [];
        this.chaves = dados;
        this.listaChaves = dados;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar chaves:', err);
        this.chaves = [];
        this.listaChaves = [];
        this.loading = false;
      }
    });
  }

  previsualizarChave(): string {
    const tipo = this.novaChave.tipo;
    const user = this.usuarioLogado as any;
    if (tipo === 'CPF') return user?.cpf || 'Seu CPF';
    if (tipo === 'EMAIL') return user?.email || 'Seu e-mail';
    if (tipo === 'TELEFONE') return user?.telefone || 'Seu telefone';
    return 'Gerada automaticamente';
  }

  salvarNovaChave(): void {
    this.loading = true;
    this.erroChave = '';
    this.pixService.cadastrarChavePix({ tipo: this.novaChave.tipo }).subscribe({
      next: () => {
        this.novaChave = { tipo: 'CPF', valor: '' };
        this.carregarChaves();
        this.loading = false;
      },
      error: (err) => {
        this.erroChave = err.error?.message || 'Erro ao cadastrar chave.';
        this.loading = false;
      }
    });
  }

  removerChave(id: any) {
    if (confirm('Deseja realmente excluir esta chave?')) {
      this.pixService.excluirChave(id).subscribe({
        next: () => { alert('Chave removida!'); this.carregarChaves(); },
        error: (err) => console.error('Erro ao remover:', err)
      });
    }
  }

  irParaGerenciar() { this.abaAtiva = 'gerenciar'; this.carregarChaves(); }
  irParaTransferir(): void { this.mudarAba('transferir'); }
  abrirModalCriarChave(): void { this.mudarAba('cadastro'); }
  abrirModalGerenciar(): void { this.mudarAba('gerenciar'); }
  setPeriodo(dias: number): void { this.periodoSelecionado = dias; }
  exportarPDF(): void { alert('O download do seu extrato PDF começará em instantes.'); }

  // --- VALOR FORMATADO ---
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
    this.valorDigitado = input.value.replace(/\D/g, '');
    input.value = this.valorFormatado;
  }

  onTeclaValor(event: KeyboardEvent) {
    const permitidas = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'];
    if (permitidas.includes(event.key)) {
      if (event.key === 'Backspace') {
        this.valorDigitado = this.valorDigitado.slice(0, -1);
        (event.target as HTMLInputElement).value = this.valorFormatado;
        event.preventDefault();
      }
      return;
    }
    if (!/^\d$/.test(event.key)) event.preventDefault();
  }
}