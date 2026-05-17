import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { SharedDataService } from './core/services/shared-data.service';
import { AuthService } from './core/services/auth.service';

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

  constructor(
    public shared: SharedDataService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        let rota = this.activatedRoute.firstChild;

        while (rota?.firstChild) {
          rota = rota.firstChild;
        }

        const rotaPublica = rota?.snapshot.data?.['public'] === true;
        const semLayout = rota?.snapshot.data?.['semLayout'] === true;

        this.mostrarLayout = !rotaPublica && !semLayout;

        if (this.mostrarLayout) {
          this.shared.carregarConta();
        }
      });
  }

  confirmarLogout(): void {
    this.mostrarModalLogout = true;
  }

  cancelarLogout(): void {
    this.mostrarModalLogout = false;
  }

  efetuarLogout(): void {
    this.mostrarModalLogout = false;
    this.authService.logout();
    this.router.navigate(['/welcome']);
  }
}