import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { SharedDataService, Transacao } from './core/services/shared-data.service';
import { AuthService } from './core/services/auth.service';
import { VisibilidadeValoresService } from './core/services/visibilidade-valores.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  mostrarLayout = false;
  mostrarModalLogout = false;

  sparklinePoints = '';
  sparklinePath = '';
  sparklineCircles: { cx: number; cy: number; ultimo: boolean }[] = [];
  sparkMenor = 0;
  sparkMaior = 0;
  sparkVariacao = 0;
  sparkLabels: string[] = [];

  constructor(
    public shared: SharedDataService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    public visibilidadeValores: VisibilidadeValoresService
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        let rota = this.activatedRoute.firstChild;
        while (rota?.firstChild) rota = rota.firstChild;

        const rotaPublica = rota?.snapshot.data?.['public'] === true;
        const semLayout   = rota?.snapshot.data?.['semLayout'] === true;
        this.mostrarLayout = !rotaPublica && !semLayout;

        if (this.mostrarLayout) {
          this.shared.carregarConta();
        }
      });

    // Sempre que as transações ou conta mudarem, recalcula o gráfico
    this.shared.transacoes$.subscribe(transacoes => {
      if (transacoes.length > 0) {
        this.calcularSparkline(transacoes);
      }
    });
  }

  confirmarLogout(): void { this.mostrarModalLogout = true; }
  cancelarLogout(): void  { this.mostrarModalLogout = false; }

  efetuarLogout(): void {
    this.mostrarModalLogout = false;
    this.authService.logout();
    this.router.navigate(['/welcome']);
  }

  private calcularSparkline(transacoes: Transacao[]): void {
    const hoje = new Date();
    const dias: { label: string; saldo: number }[] = [];
    const saldoAtual = this.shared.conta?.saldo ?? 0;

    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoje);
      dia.setDate(hoje.getDate() - i);
      dia.setHours(23, 59, 59, 999);

      // Parte do saldo atual e "desfaz" as transações futuras a esse dia
      const saldoNoDia = transacoes
        .filter(tx => new Date(tx.dataHora) > dia)
        .reduce((acc, tx) => acc - tx.valor, saldoAtual);

      const label = i === 0
        ? 'Hoje'
        : ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dia.getDay()];

      dias.push({ label, saldo: saldoNoDia });
    }

    this.sparkLabels = dias.map(d => d.label);

    const saldos = dias.map(d => d.saldo);
    const min = Math.min(...saldos);
    const max = Math.max(...saldos);
    const range = max - min || 1;

    const WIDTH   = 260;
    const HEIGHT  = 100;
    const PADDING = 10;
    const stepX   = WIDTH / (dias.length - 1);

    const toY = (val: number) =>
      PADDING + (1 - (val - min) / range) * (HEIGHT - PADDING * 2);

    const pontos = dias.map((d, i) => ({
      cx: Math.round(i * stepX),
      cy: Math.round(toY(d.saldo)),
      ultimo: i === dias.length - 1
    }));

    this.sparklinePoints = pontos.map(p => `${p.cx},${p.cy}`).join(' ');
    this.sparklinePath   =
      `M${pontos.map(p => `${p.cx},${p.cy}`).join(' L')} ` +
      `L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;
    this.sparklineCircles = pontos;

    this.sparkMenor   = min;
    this.sparkMaior   = max;
    const primeiro    = saldos[0];
    const ultimo      = saldos[saldos.length - 1];
    this.sparkVariacao = primeiro !== 0
      ? ((ultimo - primeiro) / Math.abs(primeiro)) * 100
      : 0;
  }
}