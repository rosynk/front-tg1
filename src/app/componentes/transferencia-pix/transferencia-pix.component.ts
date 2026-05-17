import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PixService } from '../../core/services/pix.service';
import { AuthService } from '../../core/services/auth.service'; // ✅ Sincronia com AuthService
import { VisibilidadeValoresService } from '../../core/services/visibilidade-valores.service';

@Component({
  selector: 'app-transferencia-pix',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './transferencia-pix.component.html',
  styleUrls: ['./transferencia-pix.component.css']
})
export class TransferenciaPixComponent implements OnInit {
  // --- CONTROLE DE ESTADO (ABAS) ---
  abaAtiva: 'lista' | 'cadastro' | 'transferir' | 'gerenciar' = 'transferir';

  // --- PROPRIEDADES DE DADOS ---
  conta: any;
  extrato: any;
  loading: boolean = true;
  loadingExtrato: boolean = false;
  periodoSelecionado: number = 30;
  erroChave: string = '';
  usuarioLogado: any = null;
  usuarioNome: string = '';
  erroTransferencia: string = '';
  sucessoTransferencia: string = '';

  // Variáveis para transferência
  chavePix: string = '';
  valorPix: number = 0;
  mensagemPix: string = '';

  // Objetos para formulários
  novaChave = { tipo: 'CPF', valor: '' };

  /**
   * ✅ UNIFICAÇÃO: Garantia de sincronia entre as variáveis usadas no HTML e no Debug
   */
  chaves: any[] = [];
  listaChaves: any[] = [];

  constructor(
  private router: Router,
  private pixService: PixService,
  private authService: AuthService,
  public visibilidadeValores: VisibilidadeValoresService
) {}

 ngOnInit(): void {
  this.authService.currentUser$.subscribe(user => {
    this.usuarioLogado = user;

    // Tenta pegar 'nomeCompleto' (API), depois 'nome' (Guardian), ou fallback
    const userData = user as any;
    this.usuarioNome = userData?.nomeCompleto || user?.nome || 'Usuário Bizi';
    console.log('👤 usuarioLogado completo:', JSON.stringify(user));
    console.log("👤 Dados para a tela:", {
      id: user?.id,
      nomeFinal: this.usuarioNome
    });
  });

  this.carregarDados();
  this.carregarChaves();
}

  // --- MÉTODOS DE NAVEGAÇÃO INTERNA (ABAS) ---

  mudarAba(aba: 'lista' | 'cadastro' | 'transferir' | 'gerenciar') {
    this.abaAtiva = aba;
    if (aba === 'gerenciar') {
      this.carregarChaves();
    }
  }

  // --- LÓGICA DE BACK-END (SPRING BOOT - PORTA 8086) ---

  carregarDados(): void {
    this.loading = true;
    this.loadingExtrato = true; // Ativa o spinner do histórico
    this.pixService.getContaInfo().subscribe({
      next: (data: any) => {
        this.conta = data;
        this.extrato = data.extrato;
        this.loading = false;
        this.loadingExtrato = false;
      },
      error: (err) => {
        console.error("Erro conta:", err);
        this.loading = false;
        this.loadingExtrato = false;
      }
    });
  }

  irParaGerenciar() {
    this.abaAtiva = 'gerenciar'; // Muda a aba visualmente
    this.carregarChaves();      // Chama a função que busca no Spring
  }

  // AQUI! Coloque a função entre os outros métodos
  formatarTipoChave(tipo: string): string {
    if (!tipo) return 'Chave Pix';

    if (/^\d{11}$/.test(tipo)) return 'CPF';

    const tipos: any = {
      'EMAIL': 'E-mail',
      'TELEFONE': 'Telefone',
      'ALEATORIA': 'Chave Aleatória'
    };

    return tipos[tipo.toUpperCase()] || tipo;
  }

  /**
   * ✅ CORREÇÃO: Popula tanto 'chaves' quanto 'listaChaves' para evitar listas vazias
   */
  carregarChaves() {
    this.loading = true;
    console.log("📡 [DEBUG BIZI] 1. Iniciando chamada para o Service...");

    this.pixService.listarChaves().subscribe({
      next: (res: any) => {
        console.log("📦 [DEBUG BIZI] 2. Resposta bruta do Back-end:", res);

        if (res && res.data) {
          console.log("✅ [DEBUG BIZI] 3. Campo 'data' localizado:", res.data);

          // CORREÇÃO CRÍTICA: Alimentando ambas as variáveis para garantir compatibilidade com seu HTML
          this.chaves = res.data;
          this.listaChaves = res.data;

          console.log("🔍 [DEBUG BIZI] 4. Conteúdo do primeiro item:", res.data[0]);
        } else {
          console.error("❌ [DEBUG BIZI] 3. Estrutura inválida. Recebido:", res);
          this.chaves = [];
          this.listaChaves = [];
        }

        console.log("📏 [DEBUG BIZI] 5. Total em 'this.chaves':", this.chaves.length);
        console.log("📏 [DEBUG BIZI] 6. Total em 'this.listaChaves':", this.listaChaves.length);

        this.loading = false;

        // Debug de Renderização (Verifica se o HTML vai "ver" a mudança)
        setTimeout(() => {
          console.log("⏱️ [DEBUG BIZI] 7. Verificação após renderização - Array continua com:", this.listaChaves.length);
        }, 500);
      },
      error: (err) => {
        console.error("🔥 [DEBUG BIZI] ERRO HTTP:", err);
        this.loading = false;
      }
    });
  }

executarTransferencia() {
  this.erroTransferencia = '';
  this.sucessoTransferencia = '';

  const payload = {
    chavePixDestino: this.chavePix?.trim(), 
    valor: this.valorNumerico  
  };

  if (!payload.chavePixDestino || payload.valor <= 0) {
    this.erroTransferencia = 'Informe uma chave Pix e um valor maior que zero.';
    return;
  }

  this.loading = true;

  this.pixService.realizarTransferencia(payload).subscribe({
    next: (res: any) => {
      this.sucessoTransferencia = res?.message || 'Pix enviado com sucesso!';
      this.chavePix = '';
      this.valorPix = 0;
      this.carregarDados();
      this.loading = false;

      setTimeout(() => { this.sucessoTransferencia = ''; }, 4000);
    },
    error: (err: any) => {
      // O backend retorna { success: false, message: "..." }
      this.erroTransferencia = err.error?.message || err.error?.mensagem || 'Erro ao realizar Pix. Tente novamente.';
      this.loading = false;
    }
  });
}

  previsualizarChave(): string {
  const tipo = this.novaChave.tipo;
  const user = this.usuarioLogado as any;
  if (tipo === 'CPF') return user?.id || 'Seu CPF';
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
      console.log('Removendo chave ID:', id);
      this.pixService.excluirChave(id).subscribe({
        next: () => {
          alert('Chave removida!');
          this.carregarChaves(); // Recarrega a lista
        },
        error: (err) => console.error('Erro ao remover:', err)
      });
    }
  }

  // --- MÉTODOS DE UI E FILTROS ---

  setPeriodo(dias: number): void {
    this.periodoSelecionado = dias;
  }

  exportarPDF(): void {
    alert("O download do seu extrato PDF começará em instantes.");
  }

  irParaTransferir(): void {
    this.mudarAba('transferir');
  }

  abrirModalCriarChave(): void {
    this.mudarAba('cadastro');
  }

  abrirModalGerenciar(): void {
    this.mudarAba('gerenciar');
  }

  /**
   * ✅ MANTIDO: Método solicitado para debug
   */
  listarChaves(): void {
    this.pixService.listarChaves().subscribe({
      next: (res: any) => {
        console.log('--- DEBUG BIZIBANCO (listarChaves): RESPOSTA ---', res);
        const dados = res.dados || res.data || res;
        this.chaves = dados;
        this.listaChaves = dados;
      },
      error: (err: any) => {
        console.error('--- ERRO NA CHAMADA DAS CHAVES ---', err);
      }
    });
  }

  valorDigitado: string = ''; // armazena só os dígitos

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
    // Pega só os dígitos do que foi digitado
    const apenasDigitos = input.value.replace(/\D/g, '');
    this.valorDigitado = apenasDigitos;
    // Força o input a mostrar o valor formatado
    input.value = this.valorFormatado;
  }

  onTeclaValor(event: KeyboardEvent) {
    // Permite: números, backspace, delete, tab, enter
    const permitidas = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'];
    if (permitidas.includes(event.key)) {
      if (event.key === 'Backspace') {
        this.valorDigitado = this.valorDigitado.slice(0, -1);
        const input = event.target as HTMLInputElement;
        input.value = this.valorFormatado;
        event.preventDefault();
      }
      return;
    }
    // Bloqueia qualquer coisa que não seja número
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }
}
