import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

interface Proposta {
  id: number;
  nomeCompleto: string;
  cpf: string;
  status: 'PENDENTE' | 'APROVADA' | 'NEGADA';
  observacao: string;
  scoreNoMomento: number;
  dataCriacao: string;
  urlSelfie: string | null;
  urlRgFrente: string | null;
  urlRgVerso: string | null;
  urlComprovanteResidencia: string | null;
}

interface AvaliacaoRequest {
  novoStatus: 'APROVADA' | 'NEGADA';
  observacao: string;
}

@Component({
  selector: 'app-dashboard-adm',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard-adm.component.html',
  styleUrl: './dashboard-adm.component.css'
})
export class DashboardAdmComponent implements OnInit {

  propostas: Proposta[] = [];
  propostasFiltradas: Proposta[] = [];
  propostaSelecionada: Proposta | null = null;

  abaAtiva = 'propostas';
  filtroStatus = 'PENDENTE';

  loading = true;
  erro = '';
  loadingAcao: number | null = null;

  mostrarModalLogout = false; // ← novo

  observacaoMap: { [id: number]: string } = {};
  msgSucessoMap: { [id: number]: string } = {};
  msgErroMap: { [id: number]: string } = {};

  imagemAmpliada: string | null = null;

  private readonly API_BASE = 'http://localhost:8086/api';
  private readonly DOCS_BASE = 'http://localhost:8086';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService // ← novo
  ) {}

  ngOnInit() {
    this.carregarPropostas();
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  confirmarLogout(): void {
    this.mostrarModalLogout = true;
  }

  cancelarLogout(): void {
    this.mostrarModalLogout = false;
  }

  efetuarLogout(): void {
    this.mostrarModalLogout = false;
    this.authService.logout();
    this.router.navigate(['/welcome']);
  }

  // ── Getters de totais ──────────────────────────────────────────────────────
  get totalPendentes(): number {
    return this.propostas.filter(p => p.status === 'PENDENTE').length;
  }

  get totalAprovadas(): number {
    return this.propostas.filter(p => p.status === 'APROVADA').length;
  }

  get totalNegadas(): number {
    return this.propostas.filter(p => p.status === 'NEGADA').length;
  }

  // ── Carregamento ──────────────────────────────────────────────────────────
  carregarPropostas() {
    this.loading = true;
    this.erro = '';

    this.http.get<Proposta[]>(`${this.API_BASE}/propostas`).subscribe({
      next: (data) => {
        this.propostas = data.sort((a, b) =>
          new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
        );
        this.aplicarFiltro();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar propostas:', err);
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        } else {
          this.erro = 'Erro ao carregar propostas. Verifique a conexão.';
        }
        this.loading = false;
      }
    });
  }

  filtrarStatus(status: string) {
    this.filtroStatus = status;
    this.aplicarFiltro();
    this.propostaSelecionada = null;
  }

  private aplicarFiltro() {
    if (!this.filtroStatus) {
      this.propostasFiltradas = [...this.propostas];
    } else {
      this.propostasFiltradas = this.propostas.filter(p => p.status === this.filtroStatus);
    }
  }

  toggleProposta(p: Proposta) {
    this.propostaSelecionada = this.propostaSelecionada?.id === p.id ? null : p;
  }

  getDocUrl(caminho: string): string {
    if (!caminho) return '';
    if (caminho.startsWith('http')) return caminho;
    const nomeArquivo = caminho.split(/[\\/]/).pop();
    return `${this.DOCS_BASE}/api/documentos/ver/${nomeArquivo}`;
  }

  abrirImagem(url: string) {
    this.imagemAmpliada = url;
  }

  fecharImagem() {
    this.imagemAmpliada = null;
  }

  avaliarProposta(id: number, novoStatus: 'APROVADA' | 'NEGADA') {
    this.loadingAcao = id;
    this.msgSucessoMap[id] = '';
    this.msgErroMap[id] = '';

    const body: AvaliacaoRequest = {
      novoStatus,
      observacao: this.observacaoMap[id] || (novoStatus === 'APROVADA' ? 'Aprovado pelo administrador' : 'Negado pelo administrador')
    };

    this.http.put<Proposta>(`${this.API_BASE}/propostas/${id}/avaliar`, body).subscribe({
      next: (propostaAtualizada) => {
        const idx = this.propostas.findIndex(p => p.id === id);
        if (idx !== -1) this.propostas[idx] = propostaAtualizada;
        this.aplicarFiltro();

        this.msgSucessoMap[id] = novoStatus === 'APROVADA'
          ? 'Conta aprovada com sucesso! Usuário notificado.'
          : 'Proposta negada. Documentos serão removidos conforme LGPD.';

        this.loadingAcao = null;
        this.propostaSelecionada = propostaAtualizada;
        setTimeout(() => { this.msgSucessoMap[id] = ''; }, 4000);
      },
      error: (err) => {
        console.error('Erro ao avaliar proposta:', err);
        this.msgErroMap[id] = err.error?.message || 'Erro ao processar avaliação. Tente novamente.';
        this.loadingAcao = null;
        setTimeout(() => { this.msgErroMap[id] = ''; }, 5000);
      }
    });
  }
}