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
    const data = { email, password };
    this.http.post<{ token: string; refreshToken: string; name: string }>('http://localhost:5000/users/login', data)
      .subscribe((response) => {
        localStorage.setItem('loggedInUser', response.name); // Zapis nazwy użytkownika
        const mode = localStorage.getItem('persistenceMode') || 'LOCAL';
        if (mode === 'LOCAL') {
          localStorage.setItem('accessToken', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
        } else if (mode === 'SESSION') {
          sessionStorage.setItem('accessToken', response.token);
          sessionStorage.setItem('refreshToken', response.refreshToken);
        }
        this.authStatusSubject.next(true);
        this.currentUser = response.name;
      });
  }
  
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.authStatusSubject.next(false);
    this.currentUser = '';
  }

  getLoggedInUser(): string {
    return localStorage.getItem('loggedInUser') || sessionStorage.getItem('loggedInUser') || '';
  }
  

  initializeAuth(): void {
    const mode = localStorage.getItem('persistenceMode') || 'LOCAL';
    const token = mode === 'LOCAL' ? localStorage.getItem('accessToken') : sessionStorage.getItem('accessToken');
  
    if (token) {
      this.http.post<{ valid: boolean; name: string }>('http://localhost:5000/users/verify-token', { token })
        .subscribe({
          next: (response) => {
            if (response.valid) {
              this.authStatusSubject.next(true);
              localStorage.setItem('loggedInUser', response.name); // Zapis nazwy użytkownika
              this.currentUser = response.name;
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
        localStorage.setItem('accessToken', localStorage.getItem('accessToken') || '');
        localStorage.setItem('refreshToken', localStorage.getItem('refreshToken') || '');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        break;
  
      case 'SESSION':
        sessionStorage.setItem('accessToken', localStorage.getItem('accessToken') || '');
        sessionStorage.setItem('refreshToken', localStorage.getItem('refreshToken') || '');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        break;
  
      case 'NONE':
        localStorage.clear();
        sessionStorage.clear();
        break;
    }
    localStorage.setItem('persistenceMode', mode);
  }
  
}
