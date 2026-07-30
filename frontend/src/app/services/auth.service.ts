import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5174/api/auth';
  
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
