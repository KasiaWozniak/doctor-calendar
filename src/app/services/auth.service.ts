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
    this.http.post<{ token: string; refreshToken?: string; name: string; role: string }>('http://localhost:5000/users/login', data)
      .subscribe((response) => {
        localStorage.setItem('loggedInUser', response.name); // Przechowujemy nazwę użytkownika
        localStorage.setItem('userRole', response.role); // Zapisujemy rolę użytkownika
    // Pobranie globalnego trybu persystencji po zalogowaniu
    this.getGlobalPersistence();

    setTimeout(() => {
      const mode = (localStorage.getItem('persistenceMode') as 'LOCAL' | 'SESSION' | 'NONE') || 'LOCAL';
      this.storeToken(response.token, response.refreshToken || '', mode);
      this.authStatusSubject.next(true);
      this.currentUser = response.name;
    }, 100); // Opóźnienie, aby pobrać tryb z serwera
  });
}

setGlobalPersistence(mode: 'LOCAL' | 'SESSION' | 'NONE'): void {
  const adminToken = localStorage.getItem('accessToken');
  this.http.post('http://localhost:5000/users/set-persistence', { mode, adminToken })
    .subscribe(() => {
      localStorage.setItem('persistenceMode', mode);
      alert(`Tryb persystencji zmieniony na: ${mode}`);
    });
}

  
getGlobalPersistence(): void {
  this.http.get<{ mode: 'LOCAL' | 'SESSION' | 'NONE' }>('http://localhost:5000/users/get-persistence')
    .subscribe((response) => {
      localStorage.setItem('persistenceMode', response.mode);
      sessionStorage.setItem('persistenceMode', response.mode);
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
    this.getGlobalPersistence(); // Pobranie trybu z serwera
  
    const mode = localStorage.getItem('persistenceMode') || 'LOCAL';
    const token = mode === 'LOCAL' ? localStorage.getItem('accessToken') : sessionStorage.getItem('accessToken');
  
    if (token) {
      this.http.post<{ valid: boolean; name: string }>('http://localhost:5000/users/verify-token', { token })
        .subscribe({
          next: (response) => {
            if (response.valid) {
              this.authStatusSubject.next(true);
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
    const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
    const mode = (localStorage.getItem('persistenceMode') as 'LOCAL' | 'SESSION' | 'NONE') || 'LOCAL';
  
    return this.http.post<{ accessToken: string }>(
      'http://localhost:5000/users/refresh-token',
      { refreshToken }
    ).pipe(
      map((response) => {
        this.storeToken(response.accessToken, refreshToken, mode);
        return response.accessToken;
      })
    );
  }
  
  
  
  storeToken(accessToken: string, refreshToken: string | null, mode: string): void {
    const validModes: Array<'LOCAL' | 'SESSION' | 'NONE'> = ['LOCAL', 'SESSION', 'NONE'];
    
    if (!validModes.includes(mode as any)) {
      console.warn(`Nieznany tryb persystencji: ${mode}, ustawiono domyślny LOCAL`);
      mode = 'LOCAL';
    }
  
    if (mode === 'LOCAL') {
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    } else if (mode === 'SESSION') {
      sessionStorage.setItem('accessToken', accessToken);
      if (refreshToken) sessionStorage.setItem('refreshToken', refreshToken);
    } else if (mode === 'NONE') {
      sessionStorage.setItem('accessToken', accessToken);
    }
  }
  
  
  
  setPersistence(mode: 'LOCAL' | 'SESSION' | 'NONE'): void {
    localStorage.setItem('persistenceMode', mode);
  
    if (mode === 'LOCAL') {
      localStorage.setItem('accessToken', sessionStorage.getItem('accessToken') || '');
      localStorage.setItem('refreshToken', sessionStorage.getItem('refreshToken') || '');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
    } else if (mode === 'SESSION') {
      sessionStorage.setItem('accessToken', localStorage.getItem('accessToken') || '');
      sessionStorage.setItem('refreshToken', localStorage.getItem('refreshToken') || '');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } else if (mode === 'NONE') {
      sessionStorage.setItem('accessToken', localStorage.getItem('accessToken') || '');
      localStorage.clear();
    }
  }
  
  
  
  
}
