import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, NgSwitch, NgSwitchCase } from '@angular/common';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    CommonModule,       // ← já cobre tudo: *ngIf, *ngFor, ngSwitch, etc.
    ReactiveFormsModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent implements OnInit {

  currentStep = 1;
  showPassword = false;
  termosAceitos = false;
  mensagem = '';

  formCadastro!: FormGroup;

  get senhaForca(): number {
    const senha = this.formCadastro.get('senha')?.value || '';
    let score = 0;
    if (senha.length >= 8) score++;
    if (/[A-Z]/.test(senha)) score++;
    if (/[0-9]/.test(senha)) score++;
    if (/[^A-Za-z0-9]/.test(senha)) score++;
    return score;
  }

  get forcaTexto(): string {
    const f = this.senhaForca;
    if (f <= 1) return 'Weak';
    if (f === 2) return 'Fair';
    if (f === 3) return 'Good';
    return 'Strong';
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.formCadastro = this.fb.group({
      // Step 1 - Personal
      nomeCompleto: ['', Validators.required],
      cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      telefone: [''],
      email: ['', [Validators.required, Validators.email]],
      dataNascimento: ['', Validators.required],
      tipoConta: ['CORRENTE'],

      // Step 2 - Address
      cep: [''],
      rua: [''],
      numero: [''],
      complemento: [''],
      cidade: [''],
      estado: [''],
      bairro: [''],

      // Step 3 - Security
      senha: ['', Validators.required],
      confirmarSenha: [''],

      
    });
  }

  maskCpf(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '').slice(0, 11);
    // Format as 000.000.000-00
    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d+)/, '$1.$2');
    }
    input.value = value;
    // Store only digits in the form
    this.formCadastro.get('cpf')?.setValue(value.replace(/\D/g, ''), { emitEvent: false });
  }

  buscarCep() {
    const cep = this.formCadastro.get('cep')?.value?.replace(/\D/g, '');
    if (cep?.length === 8) {
      this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
        next: (data) => {
          if (!data.erro) {
            this.formCadastro.patchValue({
              rua: data.logradouro,
              bairro: data.bairro, 
              cidade: data.localidade,
              estado: data.uf,
            });
          }
        },
        error: () => {}
      });
    }
  }

  avancar() {
    // Validate per step before advancing
    if (this.currentStep === 1) {
      const fields = ['nomeCompleto', 'cpf', 'email'];
      fields.forEach(f => this.formCadastro.get(f)?.markAsTouched());
      const step1Valid = fields.every(f => this.formCadastro.get(f)?.valid);
      if (!step1Valid) return;
    }

    if (this.currentStep === 3) {
      this.formCadastro.get('senha')?.markAsTouched();
      if (this.formCadastro.get('senha')?.invalid) return;
      if (this.formCadastro.get('senha')?.value !== this.formCadastro.get('confirmarSenha')?.value) return;
    }

    if (this.currentStep < 4) this.currentStep++;
  }

  voltar() {
    if (this.currentStep > 1) this.currentStep--;
  }

  enviar() {
    if (!this.termosAceitos) {
      this.mensagem = 'Você precisa aceitar os termos para continuar.';
      return;
    }

    const payload = {
      nomeCompleto: this.formCadastro.get('nomeCompleto')?.value,
      cpf: this.formCadastro.get('cpf')?.value,
      dataNascimento: this.formCadastro.get('dataNascimento')?.value,
      email: this.formCadastro.get('email')?.value,
      telefone: this.formCadastro.get('telefone')?.value,
      senha: this.formCadastro.get('senha')?.value,
      endereco: {
        id: 0,  
        rua: this.formCadastro.get('rua')?.value,
        numero: Number(this.formCadastro.get('numero')?.value), // ← cast para number
        complemento: this.formCadastro.get('complemento')?.value,
        bairro: this.formCadastro.get('bairro')?.value,
        cidade: this.formCadastro.get('cidade')?.value,
        estado: this.formCadastro.get('estado')?.value,
        cep: this.formCadastro.get('cep')?.value,
      },
      tipoConta: this.formCadastro.get('tipoConta')?.value ?? 'CORRENTE',
      role: 'ROLE_CLIENTE',
    };

    this.http.post('/api/onboarding/proposta', payload).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => {
        this.mensagem = err?.error?.message || 'Erro ao criar conta. Tente novamente.';
      }
    });
  }
}