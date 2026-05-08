import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

/**
 * Guardian com Inspeção de Tokens e Roles corrigido para Bizi Bank
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      const token = authService.getToken();
      const requiredRoles = route.data['roles'] as Array<string>;

      console.log('--- 🛡️ INSPEÇÃO DO GUARDIAN ---');
      console.log('📍 Rota Alvo:', state.url);

      // 1. Verificação de Autenticação Básica
      if (!token) {
        console.error('🛑 [Guard] Acesso Bloqueado: Usuário não possui Token.');
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }

      // 2. Recuperação do Usuário (Plano B usando o getter usuarioAtual)
      let currentUser = user;
      if (!currentUser && token) {
        console.warn('⚠️ [Guard] Usuário nulo no Subject, tentando reidratar...');

        // Acessamos o getter 'usuarioAtual' que definimos no AuthService
        currentUser = authService.usuarioAtual;
      }

      console.log('👤 Dados do Usuário no Sistema:', currentUser);

      // 3. Validação de Permissões (Roles)
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }

      // Verifica se a Role do usuário (ex: ADMIN, USER) está na lista da rota
      const hasRole = currentUser && currentUser.role && requiredRoles.includes(currentUser.role);

      if (hasRole) {
        return true;
      }

      // 4. Tratamento de Erro de Permissão (LGPD & Segurança)
      console.error('🚫 [Guard] Acesso Negado: Role incompatível.');

      if (currentUser) {
        router.navigate(['/dashboard']);
      } else {
        router.navigate(['/login']);
      }

      return false;
    })
  );
};
