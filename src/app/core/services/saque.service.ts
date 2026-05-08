import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Saque {
  id?: number;
  conta: number;
  valor: number;
  agencia: string;
  dataSaque?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SaqueService {
  private apiUrl = 'http://localhost:8086/api/saques';

  constructor(private http: HttpClient) {}

  solicitarSaque(saque: Saque): Observable<Saque> {
    return this.http.post<Saque>(this.apiUrl, saque);
  }

  buscarSaquePorId(id: number): Observable<Saque> {
    return this.http.get<Saque>(`${this.apiUrl}/${id}`);
  }

  listarSaques(): Observable<Saque[]> {
    return this.http.get<Saque[]>(this.apiUrl);
  }

  listarSaquesDaConta(idConta: number): Observable<Saque[]> {
    return this.http.get<Saque[]>(`${this.apiUrl}/conta/${idConta}`);
  }
}
