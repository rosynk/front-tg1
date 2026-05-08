import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PixService {
  private readonly API_CHAVES = 'http://localhost:8086/api/chaves-pix';
  private readonly API_OPERACAO = 'http://localhost:8086/api/pix'; // ✅ Rota do PixController

  constructor(private http: HttpClient) {}

  // Renomeado para coincidir com a chamada do Componente
  realizarTransferencia(dados: any): Observable<any> {
    return this.http.post<any>(`${this.API_OPERACAO}/transferir`, dados);
  }

  getContaInfo(): Observable<any> {
    return this.http.get<any>(`${this.API_OPERACAO}/conta`);
  }

  listarChaves(): Observable<any> {
    return this.http.get(`${this.API_CHAVES}/chaves`);
  }

  cadastrarChavePix(dados: any): Observable<any> {
    return this.http.post(this.API_CHAVES, dados);
  }

  excluirChave(id: number): Observable<any> {
    return this.http.delete(`${this.API_CHAVES}/${id}`);
  }
}
