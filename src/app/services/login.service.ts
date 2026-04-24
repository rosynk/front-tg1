import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private readonly baseUrl = '/api/login';

  constructor(private http: HttpClient) { }

  loginAdministrador(payload: { email: string; senha: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/loginADM`, payload);
  }

  loginCliente(payload: { senha: string; numero_conta: number; agencia: string }): Observable<any> {
    // O backend espera dois bodies, o que não é suportado; normalmente juntaríamos.
    // Aqui enviamos um objeto combinado que o backend pode ajustar para aceitar.
    return this.http.post(`${this.baseUrl}/loginCliente`, payload);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, {});
  }
}
