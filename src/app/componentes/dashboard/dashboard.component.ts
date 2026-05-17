import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisibilidadeValoresService } from '../../core/services/visibilidade-valores.service';

// --- Interfaces ---
interface Usuario {
  idUsuario: number;
  nomeCompleto: string;
  cpf: string;
}

interface Transacao {
  dataHora: string;
  tipoTransacao: string;
  valor: number;
  cpfDestino?: string;
  nomeContraparte?: string;
}

interface Extrato {
  titular: string;
  saldoAtual: number;
  transacoes: Transacao[];
}

interface Conta {
  id: number;
  usuario: Usuario;
  tipoConta: string;
  numeroAgencia: string;
  numeroConta: string;
  saldo: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  // --- Dados da Tela ---
  extrato: Extrato | null = null;
  conta: Conta | null = null;
  loading = true;
  erro = '';
  percentualSaldoMes = 0;

  totalEntradasMes = 0;
  totalSaidasMes = 0;
  percentualEntradasMes = 0;
  percentualSaidasMes = 0;

  // --- Dados da Transferência ---
  transferenciaData = {
    numeroContaDestino: '',
    valor: null as number | null,
    tipo: 'TED',
    detalhes: '',
    idContaOrigem: 0
  };

  loadingTransfer = false;
  msgSucesso = '';
  msgErro = '';

  private readonly API_BASE = 'http://localhost:8086/api';

constructor(
  private http: HttpClient,
  private router: Router,
  public visibilidadeValores: VisibilidadeValoresService
) {}

  ngOnInit() {
    this.carregarDados();
  }

  // --- Navegação ---
  irParaTransacao() {
    console.log('💸 Navegando para área de transferência...');
    this.router.navigate(['/transacao']);
  }

  testeNavegacao() {
    console.log("🚀 Botão clicado! Tentando navegar...");
    this.router.navigate(['/transferencia']).then(podeIr => {
      if (!podeIr) console.error("❌ Rota bloqueada ou inexistente!");
    });
  }

  // --- Lógica de Dados ---
  carregarDados() {
    this.loading = true;

    // 1. Busca Dados da Conta primeiro para ter o saldo atualizado
    this.http.get<Conta[]>(`${this.API_BASE}/contas`).subscribe({
      next: (contas) => {
        if (contas && contas.length > 0) {
          this.conta = contas[0];
          this.transferenciaData.idContaOrigem = this.conta.id;

          // 2. Só busca o extrato após ter os dados da conta (para evitar undefined no saldo)
          this.buscarExtrato();
        }
      },
      error: (err) => this.tratarErro(err)
    });
  }

private buscarExtrato() {
  this.loading = true;

  // Adicionamos um timestamp (?t=...) para garantir que a requisição vá ao servidor e não ao cache
  const timestamp = new Date().getTime();

  this.http.get<Transacao[]>(`${this.API_BASE}/transacoes/extrato?t=${timestamp}`).subscribe({
    next: (data) => {
      // 1. Criamos a nova lista formatada
      const transacoesFormatadas = (data || []).map(t => {
        const tipo = t.tipoTransacao || '';
        const nome = t.nomeContraparte || t.cpfDestino || 'Destinatário';

        let tituloExibicao = '';
        const ehSaida = tipo.includes('ENVIADA') || tipo.endsWith('_SAIDA') || tipo.includes('SAQUE') || tipo.includes('PAGAMENTO');

        if (tipo.includes('RECEBIDA')) {
          tituloExibicao = `Recebido de ${nome}`;
        } else if (tipo.includes('ENVIADA')) {
          tituloExibicao = `Transferência para ${nome}`;
        } else if (tipo.includes('PAGAMENTO')) {
          tituloExibicao = `Pagamento para ${nome}`;
        } else if (tipo.includes('SAQUE')) {
          tituloExibicao = `Saque Realizado`;
        } else if (tipo.includes('DEPOSITO')) {
          tituloExibicao = `Depósito em Conta`;
        } else {
          tituloExibicao = `Transação: ${nome}`;
        }

        return {
          ...t,
          tituloDinamico: tituloExibicao,
          valor: ehSaida ? -Math.abs(t.valor) : Math.abs(t.valor)
        };
      });

      // 2. Ordenação rigorosa por data e hora (decrescente)
      transacoesFormatadas.sort((a, b) => {
        return new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime();
      });

      // 3. Resetamos o objeto extrato com uma nova referência para o Angular detectar a mudança
      this.extrato = {
        titular: this.conta?.usuario?.nomeCompleto || 'Usuário Bizi',
        saldoAtual: this.conta?.saldo || 0,
        transacoes: [...transacoesFormatadas] 
      };
      this.calcularResumoMensal(this.extrato.transacoes);

      this.loading = false;
      console.log('✅ Extrato atualizado com sucesso:', this.extrato.transacoes);
    },
    error: (err) => {
      this.tratarErro(err);
      this.loading = false;
    }
  });
}
  enviarTransferencia() {
    if (!this.transferenciaData.valor || this.transferenciaData.valor <= 0) {
      this.msgErro = 'Informe um valor válido.';
      return;
    }

    this.loadingTransfer = true;
    this.msgSucesso = '';
    this.msgErro = '';

    this.http.post(`${this.API_BASE}/transferencias`, this.transferenciaData).subscribe({
      next: () => {
        this.msgSucesso = 'Transferência realizada com sucesso!';
        this.loadingTransfer = false;
        this.limparFormulario();
        this.carregarDados(); // Recarrega saldo e lista
      },
      error: (err) => {
        this.msgErro = err.error?.mensagem || 'Erro na transferência.';
        this.loadingTransfer = false;
      }
    });
  }

  private limparFormulario() {
    this.transferenciaData.valor = null;
    this.transferenciaData.numeroContaDestino = '';
    this.transferenciaData.detalhes = '';
  }

  private tratarErro(err: any) {
    console.error('❌ Erro capturado:', err);
    this.loading = false;
    if (err.status === 403 || err.status === 401) {
      // Resolve o erro Forbidden da imagem fffffffff.png
      this.router.navigate(['/login']);
    } else {
      this.erro = 'Erro ao carregar dados do servidor.';
    }
  }

  private calcularResumoMensal(transacoes: Transacao[]): void {
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  const transacoesDoMes = (transacoes || []).filter((tx: any) => {
    const dataTransacao = new Date(tx.dataHora);
    return (
      dataTransacao.getMonth() === mesAtual &&
      dataTransacao.getFullYear() === anoAtual
    );
  });

  this.totalEntradasMes = transacoesDoMes
    .filter(tx => tx.valor > 0)
    .reduce((total, tx) => total + tx.valor, 0);

  this.totalSaidasMes = transacoesDoMes
    .filter(tx => tx.valor < 0)
    .reduce((total, tx) => total + Math.abs(tx.valor), 0);

  this.percentualEntradasMes = this.calcularPercentual(this.totalEntradasMes, this.conta?.saldo || 0);
this.percentualSaidasMes = this.calcularPercentual(this.totalSaidasMes, this.conta?.saldo || 0);

this.percentualSaldoMes = this.calcularPercentual(
  this.totalEntradasMes - this.totalSaidasMes,
  this.conta?.saldo || 0
);
}

private calcularPercentual(valor: number, saldo: number): number {
  if (!saldo || saldo <= 0) return 0;
  return (valor / saldo) * 100;
}
} // Fim da Classe
