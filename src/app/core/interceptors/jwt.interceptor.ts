import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  console.log(`--- 🌐 [INSPEÇÃO HTTP] ---`);
  console.log(`📡 Requisição para: ${req.url}`);

  let authReq = req;

  if (token) {
    console.log('🎫 [Interceptor] Token encontrado. Carimbando Header Authorization...');
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  } else if (!req.url.includes('/api/auth')) {
    console.warn('🚨 [Interceptor] Tentativa de acesso à API privada sem Token!');
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`❌ [Interceptor] Erro de Rede/API (${error.status}):`, error.message);

      // Rotas públicas — deixa o erro passar para o component tratar e exibir mensagem
      const isRotaPublica =
        req.url.includes('/api/auth') ||
        req.url.includes('/api/onboarding');

      if ((error.status === 401 || error.status === 403) && !isRotaPublica) {
        // Só faz logout em rotas privadas (token expirado, sem permissão, etc.)
        console.error('🚫 [Sessão Inválida] Limpando dados e redirecionando para o Login.');
        authService.logout();
        router.navigate(['/login']);
      }

      // Sempre repassa o erro — o component decide o que mostrar pro usuário
      return throwError(() => error);
    })
  );
};