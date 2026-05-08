import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces sincronizadas com o seu ExtratoResponseDto e ExtratoDto do Java
export interface ExtratoDto {
 id?: number;
  valor: number;
  dataHora: string; // Adicione esta linha se estiver faltando
  tipo: string;
  detalhe?: string;
  nomeContraparte?: string;
  cpfDestino?: string;

}

export interface ExtratoResponse {
  nomeTitular: string;
  saldoAtual: number;
  transacoes: ExtratoDto[];
}

@Injectable({
  providedIn: 'root'
})
export class ExtratoService {

  // Caminho base para o seu novo Controller de Extrato
  private readonly API = 'http://localhost:8086/api/extrato';

  constructor(private http: HttpClient) {}

  /**
   * Obtém o extrato do usuário logado (Perfil Cliente)
   */
  obterExtrato(inicio: string, fim: string): Observable<ExtratoResponse> {
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fim', fim);

    return this.http.get<ExtratoResponse>(this.API, { params });
  }

  /**
   * Exporta o arquivo PDF do extrato
   */
  exportarPdf(inicio: string, fim: string): Observable<Blob> {
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fim', fim);

    return this.http.get(`${this.API}/exportar-pdf`, {
      params,
      responseType: 'blob'
    });
  }

  // --- MÉTODOS PARA O ADMINISTRADOR ---

  /**
   * [ADM] Consulta extrato padrão (últimos 30 dias) de qualquer conta por ID
   */
  obterExtratoAdmin(idConta: number): Observable<ExtratoResponse> {
    return this.http.get<ExtratoResponse>(`${this.API}/admin/${idConta}`);
  }

  /**
   * [ADM] Consulta extrato de qualquer conta com filtro de data
   */
  obterExtratoAdminFiltrado(idConta: number, inicio: string, fim: string): Observable<ExtratoResponse> {
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fim', fim);

    return this.http.get<ExtratoResponse>(`${this.API}/admin/${idConta}/filtro`, { params });
  }
}
