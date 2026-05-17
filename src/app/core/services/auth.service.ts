import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

// Interface do Usuário alinhada com o seu projeto Bizi Banco
export interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  telefone?: string; 
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8086/api/auth';

  // Subject que mantém o estado do usuário na memória da aplicação
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Ao iniciar o serviço, tenta recuperar a sessão do navegador
    if (isPlatformBrowser(this.platformId)) {
      this.loadUser();
    }
  }

  buscarDadosPerfil(): Observable<User> {
  return this.http.get<User>(`${this.apiUrl}/me`).pipe(
    tap(user => {
      // Atualiza o Subject. Todas as telas (Pix, TED) que "ouvem" o currentUser$
      // serão atualizadas automaticamente com "Jose da Paixao"
      this.currentUserSubject.next(user);
    })
  );
}

  /**
   * Getter para facilitar o acesso síncrono ao usuário no AuthGuard
   */
  public get usuarioAtual(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Realiza o login enviando CPF e Senha para o backend Java
   */
  login(cpf: string, senha: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { cpf, senha }).pipe(
      tap(res => {
        if (res && res.token) {
          console.log('✅ [AuthService] Sucesso! Iniciando sessão.');
          this.setSession(res.token);
        }
      })
    );
  }

  /**
   * Salva o token e processa os dados do usuário
   */
  private setSession(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', token);
      this.decodeAndSetUser(token);
    }
  }

  /**
   * Decodifica o JWT e preenche o Subject com os dados do usuário
   */
  private decodeAndSetUser(token: string): void {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('JWT malformatado');

      // Decodifica o payload (parte central do JWT)
      const payload = JSON.parse(atob(parts[1]));

      const user: User = {
        id: String(payload.cpf || payload.sub),
        email: payload.sub,
        nome: payload.nome || 'Usuário Bizi',
        role: payload.role || 'USER',
        telefone: payload.telefone || null 
      };

      this.currentUserSubject.next(user);

      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('⚠️ Falha ao processar token:', error);
      this.logout();
    }
  }

  /**
   * Carrega o usuário do localStorage (útil após refresh F5)
   */
  private loadUser(): void {
    const token = this.getToken();
    if (token && !this.tokenExpirado(token)) {
      this.decodeAndSetUser(token);
    }
  }

  /**
   * Valida se o token JWT ainda é válido temporalmente
   */
  public tokenExpirado(token: string): boolean {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationDate = payload.exp * 1000; // Converte para milissegundos
      return Date.now() > expirationDate;
    } catch {
      return true;
    }
  }

  /**
   * Método de "reidratação" exigido pelo seu AuthGuard
   */
  public reidratarUsuario(): boolean {
    const token = this.getToken();
    if (token && !this.tokenExpirado(token)) {
      this.decodeAndSetUser(token);
      return true;
    }
    return false;
  }

  public getToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null;
  }

  /**
   * Verifica se o usuário está logado e com token válido
   */
  public isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token || this.tokenExpirado(token)) {
      return false;
    }
    // Se o token é válido mas o Subject está vazio, reidrata
    if (!this.currentUserSubject.value) {
      this.decodeAndSetUser(token);
    }
    return !!this.currentUserSubject.value;
  }

  /**
   * Limpa a sessão e limpa os dados do navegador
   */
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.currentUserSubject.next(null);
  }
}
