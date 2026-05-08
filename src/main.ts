import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config'; // Importa a configuração correta

// Aqui é onde a mágica acontece: usamos o appConfig que já tem o Interceptor
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
