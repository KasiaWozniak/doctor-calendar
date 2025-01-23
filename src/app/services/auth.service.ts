import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authStatusSubject = new BehaviorSubject<boolean>(false);
  authStatus = this.authStatusSubject.asObservable();
  private currentUser = '';

  constructor(private http: HttpClient) {}

  register(user: { name: string; email: string; password: string }): void {
    this.http.post('http://localhost:5000/users/register', user).subscribe(() => {
      alert('Rejestracja zakończona pomyślnie!');
    });
  }

  login(email: string, password: string): void {
    const data = { email, password }; // Zakładamy zapytanie do backendu
    this.http.post<{ token: string; refreshToken: string; name: string }>('http://localhost:5000/users/login', data)
      .subscribe((response) => {
        localStorage.setItem('accessToken', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('loggedInUser', response.name); // Przechowujemy imię użytkownika w localStorage
        this.authStatusSubject.next(true);
        this.currentUser = response.name; // Ustawiamy imię w AuthService
      }, (error) => {
        console.error('Błąd logowania:', error);
        alert('Nieprawidłowy email lub hasło');
      });
  }
  
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.authStatusSubject.next(false);
    this.currentUser = '';
  }

  getLoggedInUser(): string {
    return this.currentUser;
  }

  initializeAuth(): void {
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.http.post<{ valid: boolean; name: string }>('http://localhost:5000/users/verify-token', { token })
        .subscribe({
          next: (response) => {
            if (response.valid) {
              this.authStatusSubject.next(true);
              this.currentUser = response.name; // Poprawna aktualizacja imienia
              localStorage.setItem('loggedInUser', response.name); // Zapisujemy imię w localStorage
            } else {
              this.logout();
            }
          },
          error: () => this.logout(),
        });
    }
  }
  
  
  refreshAccessToken(): Observable<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<{ accessToken: string }>(
      'http://localhost:5000/users/refresh-token',
      { refreshToken }
    ).pipe(
      map((response) => {
        localStorage.setItem('accessToken', response.accessToken);
        return response.accessToken;
      })
    );
  }

  setPersistence(mode: 'LOCAL' | 'SESSION' | 'NONE'): void {
    switch (mode) {
      case 'LOCAL':
        localStorage.setItem('persistence', 'LOCAL');
        break;
      case 'SESSION':
        sessionStorage.setItem('persistence', 'SESSION');
        break;
      case 'NONE':
        localStorage.clear();
        sessionStorage.clear();
        break;
    }
  }
}
