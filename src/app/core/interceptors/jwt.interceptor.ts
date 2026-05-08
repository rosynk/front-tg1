import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // 1. Logs de Auditoria de Saída
  console.log(`--- 🌐 [INSPEÇÃO HTTP] ---`);
  console.log(`📡 Requisição para: ${req.url}`);

  let authReq = req;

  // 2. Validador de Token para rotas privadas
  if (token) {
    console.log('🎫 [Interceptor] Token encontrado. Carimbando Header Authorization...');
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  } else if (!req.url.includes('/api/auth')) {
    console.warn('🚨 [Interceptor] Tentativa de acesso à API privada sem Token!');
  }

  // 3. Validador de Resposta (Ouvindo o Java)
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`❌ [Interceptor] Erro de Rede/API (${error.status}):`, error.message);

      // Se o Java rejeitar o token (401) ou a role (403)
      if (error.status === 401 || error.status === 403) {
        console.error('🚫 [Sessão Inválida] Limpando dados e expulsando para o Login.');
        authService.logout();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
