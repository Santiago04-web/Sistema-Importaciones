import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// Queue semaphores for concurrent requests
let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Attach token and credentials metadata
  let authReq = req;
  const token = authService.getToken();
  if (token) {
    authReq = addTokenHeader(req, token);
  } else {
    // Make sure credentials (cookies) are sent even for initial requests (like refresh)
    authReq = req.clone({ withCredentials: true });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // Do not force logout or redirect to login when using presentation/live token
      if (token && (token.startsWith('live_token_') || token.startsWith('demo_token_'))) {
        return throwError(() => error);
      }

      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401Error(authReq, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

function addTokenHeader(request: HttpRequest<any>, token: string) {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    },
    withCredentials: true // REQ: Send HttpOnly cookies
  });
}

function handle401Error(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    // Call the refresh token endpoint
    return authService.refreshToken().pipe(
      switchMap((res: any) => {
        isRefreshing = false;
        refreshTokenSubject.next(res.token);
        return next(addTokenHeader(request, res.token)); // Retry initial request
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => err);
      })
    );
  } else {
    // If a refresh is already in progress, enqueue subsequent failed requests
    return refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((jwt) => next(addTokenHeader(request, jwt!)))
    );
  }
}
