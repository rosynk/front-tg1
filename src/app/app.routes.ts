import { Routes } from '@angular/router';
import { WelcomeComponent } from './componentes/welcome/welcome.component';
import { LoginComponent } from './componentes/login/login.component';
import { SignInComponent } from './componentes/sign-in/sign-in.component';
import { DashboardComponent } from './componentes/dashboard/dashboard.component';
import { TransferenciaComponent } from './componentes/transferenciaTed/transferencia.component';
import { ExtratoComponent } from './componentes/extrato/extrato.component'; // ✅ Importado corretamente
import { authGuard } from './core/guards/auth.guard';
import { TransferenciaPixComponent } from './componentes/transferencia-pix/transferencia-pix.component';

export const routes: Routes = [
  // 1. Redirecionamento Inicial
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },

  // 2. Rotas Públicas
  { path: 'welcome', component: WelcomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'sign-in', component: SignInComponent },

  // 3. Rotas Protegidas (Dashboard, Transferência e Extrato)
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    title: 'Dashboard - Bizi Bank',
    data: { roles: ['ROLE_CLIENTE', 'ROLE_ADMIN'] }
  },

  {
    path: 'transferencia',
    component: TransferenciaComponent,
    canActivate: [authGuard],
    title: 'Transferência - Bizi Bank',
    data: { roles: ['ROLE_CLIENTE', 'ROLE_ADMIN'], animation: 'TransferPage' }
  },

  {
    path: 'extrato',
    component: ExtratoComponent,
    canActivate: [authGuard],
    title: 'Extrato - Bizi Bank',
    data: { roles: ['ROLE_CLIENTE', 'ROLE_ADMIN'] } // Adicionei as roles para manter o padrão
  },


  {
    path: 'transferencia-pix',
    component: TransferenciaPixComponent ,
    canActivate: [authGuard],
    title: 'Extrato - Bizi Bank',
    data: { roles: ['ROLE_CLIENTE', 'ROLE_ADMIN'] } // Adicionei as roles para manter o padrão
  },

  // 4. Rota de Wildcard (DEVE SER SEMPRE A ÚLTIMA)
  { path: '**', redirectTo: '/welcome' }
];
