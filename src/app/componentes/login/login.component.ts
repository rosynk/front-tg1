import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  formAdm;
  formCliente;
  mensagem: string | null = null;

  constructor(private fb: FormBuilder, private loginService: LoginService, private router: Router) {
    this.formAdm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required]]
    });

    this.formCliente = this.fb.nonNullable.group({
      numero_conta: ['', [Validators.required]],
      agencia: ['001', [Validators.required]],
      senha: ['', [Validators.required]]
    });
  }

  enviarAdm(): void {
    if (this.formAdm.invalid) return;
    this.loginService.loginAdministrador(this.formAdm.getRawValue()).subscribe({
      next: (res) => this.mensagem = res?.message ?? 'Sucesso',
      error: (err) => this.mensagem = err?.error?.error ?? 'Erro no login'
    });
  }

  enviarCliente(): void {
  if (this.formCliente.invalid) return;

  const formValue = this.formCliente.getRawValue();

  const payload = {
    ...formValue,
    numero_conta: Number(formValue.numero_conta) // 👈 conversão aqui
  };

  this.loginService.loginCliente(payload).subscribe({
    next: (res) => this.mensagem = res?.message ?? 'Sucesso',
    error: (err) => this.mensagem = err?.error?.error ?? 'Erro no login'
  });
}

  navegarParaSignIn(): void {
    console.log('Botão clicado! Navegando para sign-in...');
    this.router.navigate(['/sign-in']).then(
      (success) => console.log('Navegação bem-sucedida:', success),
      (error) => console.error('Erro na navegação:', error)
    );
  }
}
