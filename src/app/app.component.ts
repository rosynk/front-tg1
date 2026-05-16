// app.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedDataService } from './core/services/shared-data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  constructor(public shared: SharedDataService) {}

  ngOnInit() {
    this.shared.carregarConta();
  }
}