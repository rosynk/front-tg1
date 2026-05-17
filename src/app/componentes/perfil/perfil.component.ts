import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {

  usuario: any = null;
  conta: any = null;
  loading = true;
  salvando = false;
  msgSucesso = '';
  msgErro = '';

  // Controle de edição
  editandoEndereco = false;
  editandoContato = false;

  // Cópias editáveis
  enderecoEdit: any = {};
  contatoEdit: any = {};

  private readonly API_BASE = 'http://localhost:8086/api';

  constructor(
    private http: HttpClient,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.loading = true;

    this.http.get<any[]>(`${this.API_BASE}/contas`).subscribe({
      next: (contas) => {
        if (contas && contas.length > 0) {
          this.conta = contas[0];
          this.usuario = contas[0].usuario;
          this.resetarForms();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar perfil:', err);
        this.msgErro = 'Erro ao carregar dados do perfil.';
        this.loading = false;
      }
    });
  }

  resetarForms(): void {
    this.enderecoEdit = {
      rua: this.usuario?.endereco?.rua || '',
      numero: this.usuario?.endereco?.numero || '',
      complemento: this.usuario?.endereco?.complemento || '',
      bairro: this.usuario?.endereco?.bairro || '',
      cidade: this.usuario?.endereco?.cidade || '',
      estado: this.usuario?.endereco?.estado || '',
      cep: this.usuario?.endereco?.cep || ''
    };

    this.contatoEdit = {
      email: this.usuario?.email || '',
      telefone: this.usuario?.telefone || ''
    };
  }

  // --- EDIÇÃO DE ENDEREÇO ---
  abrirEdicaoEndereco(): void {
    this.resetarForms();
    this.editandoEndereco = true;
    this.editandoContato = false;
    this.msgSucesso = '';
    this.msgErro = '';
  }

  cancelarEndereco(): void {
    this.editandoEndereco = false;
    this.resetarForms();
  }

  salvarEndereco(): void {
    this.salvando = true;
    this.msgErro = '';

    this.http.patch(`${this.API_BASE}/usuarios/meu-perfil/endereco`, this.enderecoEdit).subscribe({
      next: () => {
        this.msgSucesso = 'Endereço atualizado com sucesso!';
        this.editandoEndereco = false;
        this.salvando = false;
        this.carregarDados();
        setTimeout(() => this.msgSucesso = '', 4000);
      },
      error: (err) => {
        this.msgErro = err.error?.mensagem || 'Erro ao salvar endereço.';
        this.salvando = false;
      }
    });
  }

  // --- EDIÇÃO DE CONTATO ---
  abrirEdicaoContato(): void {
    this.resetarForms();
    this.editandoContato = true;
    this.editandoEndereco = false;
    this.msgSucesso = '';
    this.msgErro = '';
  }

  cancelarContato(): void {
    this.editandoContato = false;
    this.resetarForms();
  }

  salvarContato(): void {
    this.salvando = true;
    this.msgErro = '';

    this.http.patch(`${this.API_BASE}/usuarios/meu-perfil/contato`, this.contatoEdit).subscribe({
      next: () => {
        this.msgSucesso = 'Contato atualizado com sucesso!';
        this.editandoContato = false;
        this.salvando = false;
        this.carregarDados();
        setTimeout(() => this.msgSucesso = '', 4000);
      },
      error: (err) => {
        this.msgErro = err.error?.mensagem || 'Erro ao salvar contato.';
        this.salvando = false;
      }
    });
  }

  buscarCep(): void {
    const cep = this.enderecoEdit.cep?.replace(/\D/g, '');
    if (cep?.length !== 8) return;

    this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
      next: (dados) => {
        if (dados.erro) {
          this.msgErro = 'CEP não encontrado.';
          return;
        }
        this.enderecoEdit.rua    = dados.logradouro;
        this.enderecoEdit.bairro = dados.bairro;
        this.enderecoEdit.cidade = dados.localidade;
        this.enderecoEdit.estado = dados.uf;
      },
      error: () => this.msgErro = 'Erro ao buscar CEP.'
    });
  }

  // --- UTILS ---
  formatarCpf(cpf: string): string {
    if (!cpf) return '—';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  formatarTelefone(tel: string): string {
    if (!tel) return '—';
    return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  formatarData(data: string): string {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
  }

  get iniciais(): string {
    const nome = this.usuario?.nomeCompleto || '';
    return nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  get enderecoCompleto(): string {
    const e = this.usuario?.endereco;
    if (!e) return 'Endereço não cadastrado';
    const comp = e.complemento ? `, ${e.complemento}` : '';
    return `${e.rua}, ${e.numero}${comp} — ${e.bairro}, ${e.cidade}/${e.estado} · CEP ${e.cep}`;
  }
}