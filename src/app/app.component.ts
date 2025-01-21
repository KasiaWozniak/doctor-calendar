import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="app-container">
      <div class="navigation-buttons">
        <button (click)="navigateTo('absence')">Definiowanie absencji</button>
        <button (click)="navigateTo('availability')">Definiowanie dostępności</button>
        <button (click)="navigateTo('calendar')">Kalendarz</button>
      </div>
      <button class="cart-button" (click)="navigateTo('cart')">
        <img src="assets/images/koszyk.png" alt="Koszyk" />
      </button>
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  constructor(private router: Router) {}

  navigateTo(route: string) {
    this.router.navigate([`/${route}`]);
  }
 }
