import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VisibilidadeValoresService {
  mostrarValores = true;

  alternar(): void {
    this.mostrarValores = !this.mostrarValores;
  }

  mostrar(): void {
    this.mostrarValores = true;
  }

  ocultar(): void {
    this.mostrarValores = false;
  }
}