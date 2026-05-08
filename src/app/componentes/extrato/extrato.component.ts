import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LoginService } from '../../core/services/login.service';
import { ExtratoService, ExtratoResponse } from '../../core/services/extrato.service';
import { AuthService } from '../../core/services/auth.service'; // Certifique-se de que o caminho está correto

@Component({
  selector: 'app-extrato',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule],
  templateUrl: './extrato.component.html',
  styleUrl: './extrato.component.css',
  providers: [CurrencyPipe, DatePipe]
})
export class ExtratoComponent implements OnInit {
  conta: any = null;
  erro: string | null = null;
  extrato: any = { transacoes: [] };
  loading: boolean = true;
  periodoSelecionado: number = 30;

  dataInicio: string = '';
  dataFim: string = '';

  totalEntradas: number = 0;
  totalSaidas: number = 0;
  saldoPeriodo: number = 0;

  usuarioNome: string = '';
  usuarioLogado: any = null; // Variável para o objeto completo do Jose

  constructor(
    private loginService: LoginService,
    private extratoService: ExtratoService,
    private authService: AuthService // Injeção do AuthService para o Jose aparecer
  ) { }

  ngOnInit(): void {
    // MÉTODO INCLUÍDO: Sincronização em tempo real com o AuthService
    this.authService.currentUser$.subscribe(user => {
      this.usuarioLogado = user;
      this.usuarioNome = user?.nome || 'Jose da Paixao Sa Santos';
    });

    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);

    this.dataFim = hoje.toISOString().split('T')[0];
    this.dataInicio = trintaDiasAtras.toISOString().split('T')[0];

    this.carregarDados(30);
  }

  carregarDados(dias?: number) {
    if (dias) this.periodoSelecionado = dias;
    this.loading = true;
    this.erro = null;

    this.extratoService.obterExtrato(this.dataInicio, this.dataFim).subscribe({
      next: (res: ExtratoResponse) => {
        if (res.transacoes) {
          res.transacoes.sort((a: any, b: any) =>
            new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
          );
        }

        this.extrato = res;
        this.calcularResumo(res.transacoes);
        this.loading = false;
      },
      error: (err) => {
        console.error("Erro ao carregar extrato:", err);
        this.erro = "Não foi possível carregar os lançamentos.";
        this.loading = false;
      }
    });
  }

  private calcularResumo(transacoes: any[]): void {
    this.totalEntradas = 0;
    this.totalSaidas = 0;
    if (!transacoes) return;

    transacoes.forEach(t => {
      if (t.valor > 0) this.totalEntradas += t.valor;
      else this.totalSaidas += Math.abs(t.valor);
    });
    this.saldoPeriodo = this.totalEntradas - this.totalSaidas;
  }

  exportarPDF(): void {
    if (!this.dataInicio || !this.dataFim) {
      this.erro = "Selecione um período para exportar.";
      return;
    }

    this.loading = true;
    this.extratoService.exportarPdf(this.dataInicio, this.dataFim).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `extrato_${this.dataInicio}_a_${this.dataFim}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.loading = false;
      },
      error: (err) => {
        console.error("Erro ao exportar PDF:", err);
        this.loading = false;
        this.erro = 'Não foi possível gerar o arquivo PDF.';
      }
    });
  }

  limparDescricao(transacao: any): string {
    const tipo = (transacao.tipo || '').toUpperCase();
    let bruto = (transacao.nomeContraparte || transacao.detalhe || 'NOME NÃO DISPONÍVEL').toUpperCase();

    const nomeLimpo = bruto
      .replace(/TRANSFERÊNCIA PARA /gi, '')
      .replace(/TRANSFERENCIA PARA /gi, '')
      .replace(/TRANSFERENCIA DE /gi, '')
      .replace(/PAGAMENTO PARA /gi, '')
      .replace(/SAQUE /gi, '')
      .replace(/DEPOSITO/gi, '')
      .trim();

    if (tipo.includes('PIX')) {
      return tipo.includes('RECEBIDA') || tipo.includes('CRED')
        ? `PIX RECEBIDO DE ${nomeLimpo}`
        : `PIX ENVIADO PARA ${nomeLimpo}`;
    }

    if (tipo.includes('TRANSFERENCIA') || tipo.includes('TED')) {
      return tipo.includes('RECEBIDA') || tipo.includes('CRED')
        ? `TED RECEBIDA DE ${nomeLimpo}`
        : `TED ENVIADA PARA ${nomeLimpo}`;
    }

    if (tipo.includes('PAGAMENTO') || tipo.includes('PAGTO')) {
      return `PAGAMENTO PARA ${nomeLimpo}`;
    }

    if (tipo.includes('SAQUE')) return `SAQUE EM ESPÉCIE`;
    if (tipo.includes('DEPOSITO')) return `DEPÓSITO EM CONTA`;

    return nomeLimpo;
  }

  extrairNomeSubtitulo(transacao: any): string {
    let bruto = (transacao.nomeContraparte || transacao.detalhe || 'Nome não disponível');

    let limpo = bruto
      .replace(/TRANSFERÊNCIA PARA /gi, '')
      .replace(/TRANSFERENCIA PARA /gi, '')
      .replace(/TRANSFERENCIA DE /gi, '')
      .replace(/PAGAMENTO PARA /gi, '')
      .replace(/SAQUE /gi, '')
      .replace(/DEPOSITO/gi, '')
      .trim()
      .toLowerCase();

    return limpo.replace(/(^\w{1})|(\s+\w{1})/g, (letra: string) => letra.toUpperCase());
  }

  obterIcone(tipo: string): string {
    if (!tipo) return 'bi-cash';
    const t = tipo.toUpperCase();
    if (t.includes('ENVIADA') || t.includes('PAGTO') || t.includes('SAQUE')) return 'bi-arrow-up-circle-fill text-danger';
    if (t.includes('RECEBIDA') || t.includes('DEPOSITO') || t.includes('CRED')) return 'bi-arrow-down-circle-fill text-success';
    return 'bi-cash-stack';
  }

  obterClasseValor(valor: number): string {
    return valor >= 0 ? 'valor-positivo' : 'valor-negativo';
  }
}
