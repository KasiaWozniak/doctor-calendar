import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    console.log('🔵 Przechwytywanie żądania:', req.url, 'Token:', accessToken);
  
    const clonedRequest = accessToken
      ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
      : req;
  
    return next.handle(clonedRequest).pipe(
      catchError((error) => {
        console.error('❌ Błąd HTTP:', error);
        if (error.status === 401) {
          console.log('🔄 Odświeżanie tokena...');
          return this.authService.refreshAccessToken().pipe(
            switchMap((newToken) => {
              console.log('✅ Odświeżony token:', newToken);
              const newClonedRequest = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next.handle(newClonedRequest);
            }),
            catchError((refreshError) => {
              console.error('❌ Błąd odświeżania tokena:', refreshError);
              this.authService.logout();
              return throwError(refreshError);
            })
          );
        }
        return throwError(error);
      })
    );
  }
  
}
