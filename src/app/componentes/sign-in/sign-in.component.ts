import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent implements OnInit {

  currentStep = 1;
  totalSteps = 5;
  showPassword = false;
  termosAceitos = false;
  mensagem = '';
  erroDocumentos = false;

  formCadastro!: FormGroup;

  // ── Arquivos de documento ──────────────────────────────────────────────────
  arquivos: {
    selfie: File | null;
    rgFrente: File | null;
    rgVerso: File | null;
    comprovante: File | null;
  } = {
    selfie: null,
    rgFrente: null,
    rgVerso: null,
    comprovante: null,
  };

  // ── Referências aos inputs de arquivo (usados pelo triggerUpload) ──────────
  @ViewChild('selfieInput') selfieInput!: ElementRef<HTMLInputElement>;
  @ViewChild('rgFrenteInput') rgFrenteInput!: ElementRef<HTMLInputElement>;
  @ViewChild('rgVersoInput') rgVersoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('comprovanteInput') comprovanteInput!: ElementRef<HTMLInputElement>;

  // ── Getters de força de senha ──────────────────────────────────────────────
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

  // ── Máscara CPF ────────────────────────────────────────────────────────────
  maskCpf(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '').slice(0, 11);
    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d+)/, '$1.$2');
    }
    input.value = value;
    this.formCadastro.get('cpf')?.setValue(value.replace(/\D/g, ''), { emitEvent: false });
  }

  // ── Busca CEP via ViaCEP ───────────────────────────────────────────────────
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

  // ── Upload de documentos ───────────────────────────────────────────────────
  triggerUpload(campo: 'selfie' | 'rgFrente' | 'rgVerso' | 'comprovante') {
    const map = {
      selfie: this.selfieInput,
      rgFrente: this.rgFrenteInput,
      rgVerso: this.rgVersoInput,
      comprovante: this.comprovanteInput,
    };
    map[campo]?.nativeElement.click();
  }

  onFileSelect(event: Event, campo: 'selfie' | 'rgFrente' | 'rgVerso' | 'comprovante') {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.arquivos[campo] = input.files[0];
      this.erroDocumentos = false;
    }
  }

  // ── Navegação entre steps ──────────────────────────────────────────────────
  avancar() {
    // Validação Step 1 — dados pessoais
    if (this.currentStep === 1) {
      const fields = ['nomeCompleto', 'cpf', 'email', 'dataNascimento'];
      fields.forEach(f => this.formCadastro.get(f)?.markAsTouched());
      const step1Valid = fields.every(f => this.formCadastro.get(f)?.valid);
      if (!step1Valid) return;
    }

    // Validação Step 3 — senha
    if (this.currentStep === 3) {
      this.formCadastro.get('senha')?.markAsTouched();
      if (this.formCadastro.get('senha')?.invalid) return;
      if (this.formCadastro.get('senha')?.value !== this.formCadastro.get('confirmarSenha')?.value) return;
    }

    // Validação Step 4 — documentos obrigatórios
    if (this.currentStep === 4) {
      const { selfie, rgFrente, rgVerso, comprovante } = this.arquivos;
      if (!selfie || !rgFrente || !rgVerso || !comprovante) {
        this.erroDocumentos = true;
        return;
      }
      this.erroDocumentos = false;
    }

    if (this.currentStep < this.totalSteps) this.currentStep++;
  }

  voltar() {
    if (this.currentStep > 1) this.currentStep--;
  }

  // ── Envio final como multipart/form-data ──────────────────────────────────
  enviar() {
    if (!this.termosAceitos) {
      this.mensagem = 'Você precisa aceitar os termos para continuar.';
      return;
    }

    // Objeto JSON que vai como a part "dados"
    const dados = {
      nomeCompleto: this.formCadastro.get('nomeCompleto')?.value,
      cpf: this.formCadastro.get('cpf')?.value,
      dataNascimento: this.formCadastro.get('dataNascimento')?.value,
      email: this.formCadastro.get('email')?.value,
      telefone: this.formCadastro.get('telefone')?.value,
      senha: this.formCadastro.get('senha')?.value,
      endereco: {
        id: 0,
        rua: this.formCadastro.get('rua')?.value,
        numero: Number(this.formCadastro.get('numero')?.value),
        complemento: this.formCadastro.get('complemento')?.value,
        bairro: this.formCadastro.get('bairro')?.value,
        cidade: this.formCadastro.get('cidade')?.value,
        estado: this.formCadastro.get('estado')?.value,
        cep: this.formCadastro.get('cep')?.value,
      },
      tipoConta: this.formCadastro.get('tipoConta')?.value ?? 'CORRENTE',
      role: 'ROLE_CLIENTE',
    };

    // Monta FormData espelhando exatamente os @RequestPart do PropostaController
    const formData = new FormData();

    // "dados" precisa ser um Blob com application/json para o Spring identificar a part corretamente
    formData.append('dados', new Blob([JSON.stringify(dados)], { type: 'application/json' }));

    // Arquivos físicos — os nomes das parts devem ser idênticos aos do @RequestPart no backend
    formData.append('selfie', this.arquivos.selfie!);
    formData.append('rgFrente', this.arquivos.rgFrente!);
    formData.append('rgVerso', this.arquivos.rgVerso!);
    formData.append('comprovante', this.arquivos.comprovante!);

    // NÃO setar Content-Type manualmente — o HttpClient gera o boundary correto automaticamente
    this.http.post('/api/onboarding/proposta', formData).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => {
        this.mensagem = err?.error?.message || 'Erro ao criar conta. Tente novamente.';
      }
    });
  }
}