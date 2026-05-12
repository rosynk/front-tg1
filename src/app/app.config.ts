import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // Removido withFetch para teste

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // 1. Detecção de mudanças otimizada
    provideZoneChangeDetection({ eventCoalescing: true }),

    // 2. Configuração de Rotas
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions()
    ),

    // 3. Configuração do Cliente HTTP (Ajustada)
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    )
  ]
};
