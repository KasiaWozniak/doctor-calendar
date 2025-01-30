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
    const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
  
    return next.handle(cloned).pipe(
      catchError((error) => {
        if (error.status === 401) {
          return this.authService.refreshAccessToken().pipe(
            switchMap((newToken) => {
              const newCloned = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next.handle(newCloned);
            })
          );
        }
        return throwError(error);
      })
    );
  }
  
}
