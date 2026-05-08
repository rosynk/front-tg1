import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../core/services/login.service';

@Component({
  selector: 'app-login',
  standalone: true,
  // Adicionado FormsModule aqui para evitar erros de ngModel em componentes filhos ou modais
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  formAdm;
  formCliente;
  mensagem: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router
  ) {
    // Form para Admin
    this.formAdm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required]]
    });

    // 🏦 FORM DO CLIENTE (Foco no CPF)
    this.formCliente = this.fb.nonNullable.group({
      cpf: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
      senha: ['', [Validators.required]]
    });
  }



  enviarAdm(): void {
    if (this.formAdm.invalid) return;
    this.loading = true;

    this.loginService.login(this.formAdm.getRawValue()).subscribe({
      next: (res: any) => {
        // Redireciona Admin para o Welcome
        this.processarSucessoLogin(res, '/welcome');
      },
      error: () => {
        this.mensagem = 'Erro no login administrativo.';
        this.loading = false;
      }
    });
  }

  // 🛡️ MÉTODO DO CLIENTE CORRIGIDO
  enviarCliente(): void {
    if (this.formCliente.invalid) {
      alert('Por favor, preencha o CPF e a senha corretamente.');
      return;
    }

    this.loading = true;
    const { cpf, senha } = this.formCliente.getRawValue();

    console.log(`📡 [Bizi Bank] Iniciando autenticação para CPF: ${cpf}...`);

    this.loginService.login({ cpf, senha }).subscribe({
      next: (res: any) => {
        console.log('✅ [Login] Credenciais aceitas pelo Java!');

        // REDIRECIONAMENTO: Alterado de '/dashboard' para '/transferencia-pix'
        this.processarSucessoLogin(res, '/dashboard');
      },
      error: (err) => {
        console.error('❌ [Login] Falha na autenticação:', err);
        this.mensagem = 'CPF ou Senha incorretos.';
        this.loading = false;
        alert('Dados inválidos. Verifique seu CPF e senha.');
      }
    });
  }

  /**
   * Método auxiliar para padronizar o salvamento de sessão
   */
  private processarSucessoLogin(res: any, rotaDestino: string): void {
    // Limpa sessões anteriores por segurança (LGPD)
    localStorage.clear();

    // Salva o token JWT retornado pelo Spring Boot
    if (res.token) {
      localStorage.setItem('token', res.token);
    }

    // Armazena dados básicos do usuário
    const usuarioLogado = {
      id: res.cpf || res.sub,
      nome: res.nome || 'Cliente Bizi',
      role: res.role || 'ROLE_USER'
    };

    localStorage.setItem('user', JSON.stringify(usuarioLogado));

    console.log(`🚀 Sessão preparada para ${usuarioLogado.nome}. Navegando para ${rotaDestino}...`);

    // Pequeno timeout para garantir a escrita no LocalStorage
    setTimeout(() => {
      this.router.navigate([rotaDestino]);
    }, 100);
  }

  navegarParaSignIn(): void {
    this.router.navigate(['/cadastro']);
  }
}
