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
      if (response.token) {
        console.log('✅ Zalogowano pomyślnie, zapisuję token w localStorage');
        localStorage.setItem('accessToken', response.token); // Zapisywanie tokena
        localStorage.setItem('loggedInUser', response.name); // Zapisz nazwę użytkownika
        localStorage.setItem('userRole', response.role); // Zapisz rolę użytkownika
      } else {
        console.error('❌ Brak tokena w odpowiedzi z serwera');
      }
      console.log('Odpowiedź serwera:', response);

    // Pobranie globalnego trybu persystencji po zalogowaniu
    this.getGlobalPersistence();

    setTimeout(() => {
      const mode = (localStorage.getItem('persistenceMode') as 'LOCAL' | 'SESSION' | 'NONE') || 'LOCAL';
      this.storeToken(response.token, response.refreshToken || '', mode);
      this.authStatusSubject.next(true);
      this.currentUser = response.name;
    }, 100); // Opóźnienie, aby pobrać tryb z serwera
  });
  console.log(localStorage.getItem('accessToken'));
}

setGlobalPersistence(mode: 'LOCAL' | 'SESSION' | 'NONE'): void {
  const adminToken = localStorage.getItem('accessToken');
  if (!adminToken) {
    console.error('❌ Brak tokena administratora');
    return;
  }

  this.http.post<{ message: string }>(
    'http://localhost:5000/users/set-persistence',
    { mode },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  ).subscribe({
    next: (response) => {
      if (mode === 'NONE') {
        localStorage.clear();
        sessionStorage.clear();
      } else {
        localStorage.setItem('persistenceMode', mode);
        sessionStorage.setItem('persistenceMode', mode);
      }
      alert(response.message);
    },
    error: (err) => {
      console.error('❌ Błąd zmiany trybu persystencji:', err);
    }
  });
}


async getGlobalPersistence(): Promise<void> {
  try {
    const response = await this.http.get<{ mode: 'LOCAL' | 'SESSION' | 'NONE' }>(
      'http://localhost:5000/users/get-persistence'
    ).toPromise();

    if (response?.mode) {
      localStorage.setItem('persistenceMode', response.mode);
      sessionStorage.setItem('persistenceMode', response.mode);
    } else {
      console.warn('⚠️ Nie udało się pobrać trybu persystencji, ustawiam domyślny: LOCAL.');
      localStorage.setItem('persistenceMode', 'LOCAL');
    }
  } catch (error) {
    console.error('❌ Błąd podczas pobierania trybu persystencji:', error);
    localStorage.setItem('persistenceMode', 'LOCAL');
  }
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

  async initializeAuth(): Promise<void> {
    try {
      console.log('🔵 Rozpoczynanie inicjalizacji autoryzacji...');
      await this.getGlobalPersistence();
  
      const mode = (localStorage.getItem('persistenceMode') as 'LOCAL' | 'SESSION' | 'NONE') || 'LOCAL';
      console.log('🔵 Tryb persystencji:', mode);
  
      if (mode === 'NONE') {
        console.warn('⚠️ Tryb persystencji to NONE. Wylogowywanie...');
        this.logout();
        return;
      }
  
      const token = mode === 'LOCAL' ? localStorage.getItem('accessToken') : sessionStorage.getItem('accessToken');
      console.log('🔵 Token do weryfikacji:', token);
  
      if (token) {
        this.http.post<{ valid: boolean; name: string; role: string }>('http://localhost:5000/users/verify-token', { token })
          .subscribe({
            next: (response) => {
              console.log('✅ Weryfikacja tokena zakończona sukcesem:', response);
              if (response.valid) {
                this.authStatusSubject.next(true);
                this.currentUser = response.name;
                localStorage.setItem('userRole', response.role);
              } else {
                console.warn('⚠️ Token nie jest już ważny, wylogowywanie...');
                this.logout();
              }
            },
            error: (err) => {
              console.error('❌ Błąd podczas weryfikacji tokena:', err);
              this.logout();
            },
          });
      } else {
        console.warn('⚠️ Brak tokena w przechowywaniu, wylogowywanie...');
        this.logout();
      }
    } catch (error) {
      console.error('❌ Błąd podczas inicjalizacji autoryzacji:', error);
      this.logout();
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
