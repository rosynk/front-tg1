import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Interface para tipar a resposta do Backend (Opcional, mas resolve erros de 'any')
 */
export interface TokenResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  // URL base do seu backend Spring Boot (ajuste a porta se necessário)
  private readonly API = 'http://localhost:8086/api/auth';

  constructor(private http: HttpClient) { }

  /**
   * Método para o login padrão
   */
  login(payload: any): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.API}/login`, payload);
  }

  /**
   * Método específico para login de clientes (exigido pelo seu componente)
   * Resolve o erro: Property 'loginCliente' does not exist on type 'LoginService'
   */
  loginCliente(payload: any): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.API}/loginCliente`, payload);
  }

  /**
   * Solicitação de código para recuperação de senha
   */
  solicitarRecuperacao(email: string): Observable<any> {
    return this.http.post(`${this.API}/recuperar-senha`, { email });
  }

  /**
   * Redefinição final da senha com o código recebido
   */
  redefinirSenha(dados: any): Observable<any> {
    return this.http.post(`${this.API}/redefinir-senha`, dados);
  }

  getDadosConta(): Observable<any> {
  // Ajuste a URL conforme o seu endpoint no Spring Boot
  return this.http.get<any>(`${this.API}/conta/detalhes`);
}

// 1. Método para buscar os dados JSON (para os botões 30, 60, 90)
// Atualize a assinatura para aceitar dois argumentos do tipo string
getDadosExtrato(inicio: string, fim: string): Observable<any> {
  // Ajusta a URL removendo o sufixo /api/auth se necessário, para bater no endpoint /api/extrato
  const baseUrl = this.API.replace('/api/auth', '');
  const url = `${baseUrl}/api/extrato?inicio=${inicio}&fim=${fim}`;

  return this.http.get(url);
}

// Faça o mesmo para o PDF para manter a coerência com a imagem eeeeeee_26.png
downloadExtratoPdf(inicio: string, fim: string): Observable<Blob> {
  const baseUrl = this.API.replace('/api/auth', '');
  const url = `${baseUrl}/api/extrato/exportar-pdf?inicio=${inicio}&fim=${fim}`;

  return this.http.get(url, { responseType: 'blob' });
}

 getExtratoPorPeriodo(inicio: string, fim: string): Observable<any> {
  return this.http.get(`${this.API}/extrato?inicio=${inicio}&fim=${fim}`);
}

// E para o PDF
downloadExtratoPdfPeriodo(inicio: string, fim: string): Observable<Blob> {
  return this.http.get(`${this.API}/extrato/pdf?inicio=${inicio}&fim=${fim}`, {
    responseType: 'blob'
  });
}
}
