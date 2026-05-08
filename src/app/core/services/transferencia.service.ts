import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ContaService } from './conta.service';
import { AuthService } from '../services/auth.service';

export interface Transferencia {
  id?: number;
  contaOrigem: number;
  contaDestino: number;
  valor: number;
  descricao: string;
  dataTransferencia?: string;
  cpfOrigem?: string;
  cpfDestino?: string;
  tipoTransacao?: string;
  dataHora?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransferenciaService {
  private apiUrl = 'http://localhost:8086/api/transferencias';

  constructor(
    private http: HttpClient,
    private contaService: ContaService,
    private authService: AuthService
  ) {}

  /**
   * Realiza a transferência.
   * Certifique-se de passar os valores convertidos para Number no componente.
   */
  realizarTransferencia(transferencia: Transferencia): Observable<Transferencia> {
    return this.http.post<Transferencia>(this.apiUrl, transferencia).pipe(
      tap(() => {
        // Sincronização: Busca o usuário atual e força a atualização da conta
        const usuario = this.authService.usuarioAtual;
        if (usuario && usuario.id) {
          // Conversão de segurança para garantir que o ID seja number
          const idParaBusca = Number(usuario.id);
          this.contaService.carregarDadosDaConta(idParaBusca);
        }
      })
    );
  }

  buscarPorId(id: number | string): Observable<Transferencia> {
    return this.http.get<Transferencia>(`${this.apiUrl}/${Number(id)}`);
  }

  buscarTodasDaConta(idConta: number | string): Observable<Transferencia[]> {
    return this.http.get<Transferencia[]>(`${this.apiUrl}/conta/${Number(idConta)}`);
  }

  buscarEnviadas(idConta: number | string): Observable<Transferencia[]> {
    return this.http.get<Transferencia[]>(`${this.apiUrl}/enviadas/conta/${Number(idConta)}`);
  }

  buscarRecebidas(idConta: number | string): Observable<Transferencia[]> {
    return this.http.get<Transferencia[]>(`${this.apiUrl}/recebidas/conta/${Number(idConta)}`);
  }

  exportarExtrato(idConta: number | string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exportar/conta/${Number(idConta)}`, {
      responseType: 'blob'
    });
  }
}
