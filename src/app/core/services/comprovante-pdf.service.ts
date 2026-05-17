import { Injectable } from '@angular/core';

export interface ComprovanteData {
  tipo: 'PIX' | 'TED' | 'DOC';
  valor: number;
  remetente: {
    nome: string;
    agencia: string;
    conta: string;
    tipoConta?: string;
  };
  destinatario: {
    nome: string;
    agencia?: string;
    conta?: string;
    chave?: string;
  };
  dataHora: Date;
  idTransacao?: string;
}

@Injectable({ providedIn: 'root' })
export class ComprovantePdfService {

  gerarComprovante(dados: ComprovanteData): void {
    // Importa o jsPDF dinamicamente (deve estar instalado: npm install jspdf)
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const w = doc.internal.pageSize.getWidth();

      const PRETO    = '#0f1117';
      const CINZA    = '#8b93a5';
      const BORDA    = '#e2e4e9';
      const FUNDO    = '#f8fafc';
      const VERDE    = '#16a34a';
      const AZUL     = '#2563eb';

      const valorFormatado = dados.valor.toLocaleString('pt-BR', {
        style: 'currency', currency: 'BRL'
      });

      const dataFormatada = dados.dataHora.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });

      const idComprovante = dados.idTransacao ||
        Math.random().toString(36).substring(2, 12).toUpperCase();

      let y = 0;

      // ── Cabeçalho verde ──────────────────────────────────────────
      doc.setFillColor(15, 17, 23);
      doc.rect(0, 0, w, 38, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('Bizi Bank', 14, 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(180, 185, 200);
      doc.text('Comprovante de transação', 14, 23);

      // Badge do tipo
      const tipoLabel = dados.tipo;
      const badgeColor = dados.tipo === 'PIX' ? [22, 163, 74] : [37, 99, 235];
      doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
      doc.roundedRect(w - 36, 10, 22, 9, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(tipoLabel, w - 25, 16, { align: 'center' });

      y = 50;

      // ── Valor em destaque ─────────────────────────────────────────
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 228, 233);
      doc.roundedRect(14, y, w - 28, 28, 4, 4, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(139, 147, 165);
      doc.text('VALOR TRANSFERIDO', w / 2, y + 8, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(15, 17, 23);
      doc.text(valorFormatado, w / 2, y + 20, { align: 'center' });

      y += 36;

      // ── Linha divisória ───────────────────────────────────────────
      const linha = () => {
        doc.setDrawColor(226, 228, 233);
        doc.setLineWidth(0.3);
        doc.line(14, y, w - 14, y);
        y += 6;
      };

      // ── Seção genérica ─────────────────────────────────────────────
      const secao = (titulo: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(139, 147, 165);
        doc.text(titulo.toUpperCase(), 14, y);
        y += 7;
      };

      const campo = (label: string, valor: string, destaque = false) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(139, 147, 165);
        doc.text(label, 14, y);

        doc.setFont(destaque ? 'helvetica' : 'helvetica', destaque ? 'bold' : 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 17, 23);
        doc.text(valor, w - 14, y, { align: 'right' });
        y += 7;
      };

      // ── Remetente ─────────────────────────────────────────────────
      secao('De (Remetente)');
      campo('Nome', dados.remetente.nome, true);
      campo('Agência', dados.remetente.agencia);
      campo('Conta', dados.remetente.conta);
      if (dados.remetente.tipoConta) campo('Tipo', dados.remetente.tipoConta);

      y += 2;
      linha();

      // ── Destinatário ──────────────────────────────────────────────
      secao('Para (Destinatário)');
      campo('Nome', dados.destinatario.nome, true);
      if (dados.destinatario.agencia) campo('Agência', dados.destinatario.agencia);
      if (dados.destinatario.conta)   campo('Conta', dados.destinatario.conta);
      if (dados.destinatario.chave)   campo('Chave Pix', dados.destinatario.chave);

      y += 2;
      linha();

      // ── Detalhes da operação ──────────────────────────────────────
      secao('Detalhes da operação');
      campo('Tipo', dados.tipo);
      campo('Data e hora', dataFormatada);
      campo('ID do comprovante', idComprovante);

      y += 4;

      // ── Rodapé ────────────────────────────────────────────────────
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 228, 233);
      doc.roundedRect(14, y, w - 28, 18, 3, 3, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(139, 147, 165);
      doc.text(
        'Este comprovante é válido como documento de confirmação de transação.',
        w / 2, y + 7, { align: 'center' }
      );
      doc.text(
        'Bizi Bank · Instituição Financeira Digital · © 2026',
        w / 2, y + 13, { align: 'center' }
      );

      // ── Download ──────────────────────────────────────────────────
      const nomeArquivo = `comprovante_${dados.tipo.toLowerCase()}_${idComprovante}.pdf`;
      doc.save(nomeArquivo);
    });
  }
}