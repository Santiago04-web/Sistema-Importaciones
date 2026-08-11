import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError, of } from 'rxjs';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_ROOT = isLocal ? 'http://localhost:5174/api' : 'https://sistema-importaciones.onrender.com/api';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${API_ROOT}/auth`;
  
  // Store short-lived JWT in-memory (mitigates XSS token extraction)
  private accessToken: string | null = null;
  
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const profileStr = localStorage.getItem('user_profile');
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        this.currentUserSubject.next(profile);
      } catch {
        this.clearSession();
      }
    }
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap((res: any) => {
        if (res.token) {
          this.accessToken = res.token;
          const profile = { username: res.username, roles: res.roles };
          localStorage.setItem('user_profile', JSON.stringify(profile));
          this.currentUserSubject.next(profile);
        }
      }),
      catchError((err) => {
        // Fallback for Vercel / Remote Demo mode when backend HTTP is not reachable or credentials mismatch
        const email = (credentials?.email || credentials?.username || '').trim().toLowerCase();
        const pass = credentials?.password || '';

        let roles: string[] = [];
        let username = '';

        if ((email === 'admin@logigho.com' || email === 'smenendez554@gmail.com') && pass === 'Santiago0417#Admin') {
          roles = ['Admin'];
          username = email;
        } else if (email === 'editor@logigho.com' && pass === 'Santiago0417#Editor') {
          roles = ['Editor'];
          username = 'editor@logigho.com';
        } else if (email === 'viewer@logigho.com' && pass === 'Santiago0417#Viewer') {
          roles = ['Viewer'];
          username = 'viewer@logigho.com';
        }

        if (roles.length > 0) {
          const profile = { username, roles };
          this.accessToken = 'demo_token_' + Date.now();
          localStorage.setItem('user_profile', JSON.stringify(profile));
          this.currentUserSubject.next(profile);
          return of({ token: this.accessToken, username, roles });
        }

        return throwError(() => err);
      })
    );
  }

  refreshToken(): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap((res: any) => {
        if (res.token) {
          this.accessToken = res.token;
        }
      }),
      catchError((err) => {
        // If refresh fails (session expired/invalid cookie), log out immediately
        this.clearSession();
        return throwError(() => err);
      })
    );
  }

  logout() {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.clearSession();
      }),
      catchError((err) => {
        this.clearSession();
        return throwError(() => err);
      })
    );
  }

  private clearSession() {
    this.accessToken = null;
    localStorage.removeItem('user_profile');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return this.accessToken;
  }

  getRoles(): string[] {
    const profileStr = localStorage.getItem('user_profile');
    if (profileStr) {
      try {
        return JSON.parse(profileStr).roles || [];
      } catch {
        return [];
      }
    }
    return [];
  }

  isViewer(): boolean {
    const roles = this.getRoles();
    return roles.includes('Viewer') && !roles.includes('Admin') && !roles.includes('Editor');
  }

  canEdit(): boolean {
    const roles = this.getRoles();
    return roles.includes('Admin') || roles.includes('Editor');
  }
}
