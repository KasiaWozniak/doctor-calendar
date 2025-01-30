import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  template: `
    <div class="app-container">
  <div *ngIf="isAdmin"> 
  <label for="persistence">Tryb persystencji:</label>
  <select id="persistence" (change)="setPersistence($event)">
    <option value="LOCAL">Local</option>
    <option value="SESSION">Session</option>
    <option value="NONE">None</option>
  </select>
</div>

  <!-- Przyciski nawigacyjne -->
  <div class="navigation-buttons">
    <button *ngIf="!isAuthenticated" (click)="navigateTo('register')">Rejestracja</button>
    <button *ngIf="!isAuthenticated" (click)="navigateTo('login')">Logowanie</button>
    <button *ngIf="isAuthenticated" (click)="logout()">Wylogowanie</button>
    <button *ngIf="isAuthenticated" (click)="navigateTo('absence')">Definiowanie absencji</button>
    <button *ngIf="isAuthenticated" (click)="navigateTo('availability')">Definiowanie dostępności</button>
    <button *ngIf="isAuthenticated" (click)="navigateTo('calendar')">Kalendarz</button>
    <span *ngIf="isAuthenticated">Zalogowany jako: {{ loggedInUser }}</span>
  </div>

  <!-- Koszyk -->
  <button *ngIf="isAuthenticated" class="cart-button" (click)="navigateTo('cart')">
    <img src="assets/images/koszyk.png" alt="Koszyk" />
  </button>

  <!-- Router Outlet -->
  <router-outlet></router-outlet>
</div>

  `,
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  isAuthenticated = false;
  loggedInUser: string | null = null; // Przechowuje nazwę użytkownika
  isAdmin: boolean = false; // Dodane sprawdzanie, czy użytkownik to admin
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.initializeAuth();
    this.authService.authStatus.subscribe((status) => {
      this.isAuthenticated = status;
      this.loggedInUser = localStorage.getItem('loggedInUser');
  
      // Pobieranie roli użytkownika poprawnie
      this.isAdmin = localStorage.getItem('userRole') === 'admin' && status;
    });
  }
  

  navigateTo(route: string) {
    this.router.navigate([`/${route}`]);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  
  setPersistence(event: Event): void {
    const mode = (event.target as HTMLSelectElement).value as 'LOCAL' | 'SESSION' | 'NONE';
    this.authService.setGlobalPersistence(mode);
  }
  
}