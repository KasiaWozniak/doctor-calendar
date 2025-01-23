import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authStatusSubject = new BehaviorSubject<boolean>(false);
  authStatus = this.authStatusSubject.asObservable();
  private currentUser = '';

  register(user: { name: string; email: string; password: string }): void {
    localStorage.setItem('user', JSON.stringify(user));
    alert('Rejestracja zakończona pomyślnie!');
  }

  login(email: string, password: string): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.email === email && user.password === password) {
      this.currentUser = user.name;
      this.authStatusSubject.next(true);
      return true;
    }
    return false;
  }

  logout(): void {
    this.authStatusSubject.next(false);
    this.currentUser = '';
  }

  getLoggedInUser(): string {
    return this.currentUser;
  }
}
