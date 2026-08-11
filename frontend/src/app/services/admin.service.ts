import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface AppUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  lockoutEnd: string | null;
  isLockedOut: boolean;
}

export interface AuditEntry {
  id: number;
  userId: string;
  action: string;
  entityName: string;
  entityId: string;
  changes: string;
  timestamp: string;
}

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_ROOT = isLocal ? 'http://localhost:5174/api' : 'https://sistema-importaciones.onrender.com/api';

const DEFAULT_USERS: AppUser[] = [
  { id: '1', username: 'Santiago Menendez', email: 'smenendez554@gmail.com', roles: ['Admin'], lockoutEnd: null, isLockedOut: false },
  { id: '2', username: 'Administrador Logigho', email: 'admin@logigho.com', roles: ['Admin'], lockoutEnd: null, isLockedOut: false },
  { id: '3', username: 'Editor Operaciones', email: 'editor@logigho.com', roles: ['Editor'], lockoutEnd: null, isLockedOut: false },
  { id: '4', username: 'Inversionista Viewer', email: 'viewer@logigho.com', roles: ['Viewer'], lockoutEnd: null, isLockedOut: false }
];

@Injectable({ providedIn: 'root' })
export class AdminService {
  private usersUrl = `${API_ROOT}/users`;
  private auditUrl = `${API_ROOT}/audit`;
  private localUsers: AppUser[] = [];

  constructor(private http: HttpClient) {
    this.loadLocalUsers();
  }

  private loadLocalUsers() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('app_users_list');
      if (stored) {
        try {
          this.localUsers = JSON.parse(stored);
        } catch {
          this.localUsers = [...DEFAULT_USERS];
        }
      } else {
        this.localUsers = [...DEFAULT_USERS];
      }
    } else {
      this.localUsers = [...DEFAULT_USERS];
    }
  }

  private saveLocalUsers(users: AppUser[]) {
    this.localUsers = users;
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_users_list', JSON.stringify(users));
    }
  }

  // ── Users ──
  getUsers(): Observable<AppUser[]> {
    this.loadLocalUsers();
    return this.http.get<AppUser[]>(this.usersUrl).pipe(
      tap((res) => {
        if (res && res.length > 0) {
          this.saveLocalUsers(res);
        }
      }),
      catchError(() => of(this.localUsers))
    );
  }

  createUser(email: string, password: string, role: string): Observable<any> {
    const newUser: AppUser = {
      id: Date.now().toString(),
      username: email.split('@')[0],
      email: email,
      roles: [role],
      lockoutEnd: null,
      isLockedOut: false
    };
    this.localUsers.push(newUser);
    this.saveLocalUsers(this.localUsers);

    return this.http.post(this.usersUrl, { email, password, role }).pipe(
      catchError(() => of(newUser))
    );
  }

  deleteUser(id: string): Observable<any> {
    this.localUsers = this.localUsers.filter(u => u.id !== id);
    this.saveLocalUsers(this.localUsers);
    return this.http.delete(`${this.usersUrl}/${id}`).pipe(
      catchError(() => of({ success: true }))
    );
  }

  unlockUser(id: string): Observable<any> {
    const user = this.localUsers.find(u => u.id === id);
    if (user) user.isLockedOut = false;
    this.saveLocalUsers(this.localUsers);
    return this.http.post(`${this.usersUrl}/${id}/unlock`, {}).pipe(
      catchError(() => of({ success: true }))
    );
  }

  updateUser(id: string, data: { nombre?: string; email?: string; role?: string; newPassword?: string }): Observable<any> {
    const user = this.localUsers.find(u => u.id === id);
    if (user) {
      if (data.nombre) user.username = data.nombre;
      if (data.email) user.email = data.email;
      if (data.role) user.roles = [data.role];
      this.saveLocalUsers(this.localUsers);
    }
    return this.http.put(`${this.usersUrl}/${id}`, data).pipe(
      catchError(() => of({ success: true }))
    );
  }

  // ── Audit Logs ──
  getAuditLogs(take = 100, skip = 0): Observable<{ total: number; logs: AuditEntry[] }> {
    return this.http.get<{ total: number; logs: AuditEntry[] }>(
      `${this.auditUrl}?take=${take}&skip=${skip}`
    ).pipe(
      catchError(() => of({ total: 0, logs: [] }))
    );
  }
}
