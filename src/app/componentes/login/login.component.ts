import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service'; // ← import correto

@Component({
  selector: 'app-login',
  standalone: true,
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
    private authService: AuthService,
    private router: Router
  ) {
    this.formAdm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required]]
    });

    this.formCliente = this.fb.nonNullable.group({
      cpf: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
      senha: ['', [Validators.required]]
    });
  }

  enviarAdm(): void {
    if (this.formAdm.invalid) return;
    this.loading = true;
    const { email, senha } = this.formAdm.getRawValue();

    this.authService.login(email, senha).subscribe({
      next: () => {
        const user = this.authService.usuarioAtual;
        const rota = user?.role === 'ROLE_ADMIN' ? '/dashboard-adm' : '/dashboard';
        this.router.navigate([rota]);
        this.loading = false;
      },
      error: () => {
        this.mensagem = 'Erro no login administrativo.';
        this.loading = false;
      }
    });
  }

  enviarCliente(): void {
    if (this.formCliente.invalid) return;
    this.loading = true;
    const { cpf, senha } = this.formCliente.getRawValue();

    this.authService.login(cpf, senha).subscribe({
      next: () => {
        const user = this.authService.usuarioAtual;
        const rota = user?.role === 'ROLE_ADMIN' ? '/dashboard-adm' : '/dashboard';
        this.router.navigate([rota]);
        this.loading = false;
      },
      error: (err) => {
        const status = err.status;
        const msg = err.error;
        if (status === 403 && typeof msg === 'string' && msg.includes('desabilitado')) {
          this.mensagem = '⏳ Sua conta está em análise. Aguarde a aprovação do administrador.';
        } else if (status === 403) {
          this.mensagem = 'CPF ou senha incorretos.';
        } else {
          this.mensagem = 'Erro ao conectar com o servidor. Tente novamente.';
        }
        this.loading = false;
      }
    });
  }

  navegarParaSignIn(): void {
    this.router.navigate(['/sign-in']);
  }
}