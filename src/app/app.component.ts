import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms'; // ✅ Importante
import { CommonModule } from '@angular/common'; // ✅ Para pipes e diretivas comuns

@Component({
  selector: 'app-root',
  standalone: true, // Certifique-se de que está como standalone
  imports: [RouterOutlet, FormsModule, CommonModule], // ✅ Adicione aqui
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'banco-heppay';
}
