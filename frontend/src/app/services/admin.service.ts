import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class AdminService {
  private usersUrl = 'http://localhost:5174/api/users';
  private auditUrl = 'http://localhost:5174/api/audit';

  constructor(private http: HttpClient) {}

  // ── Users ──
  getUsers(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(this.usersUrl);
  }

  createUser(email: string, password: string, role: string): Observable<any> {
    return this.http.post(this.usersUrl, { email, password, role });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.usersUrl}/${id}`);
  }

  unlockUser(id: string): Observable<any> {
    return this.http.post(`${this.usersUrl}/${id}/unlock`, {});
  }

  updateUser(id: string, data: { nombre?: string; email?: string; role?: string; newPassword?: string }): Observable<any> {
    return this.http.put(`${this.usersUrl}/${id}`, data);
  }

  // ── Audit Logs ──
  getAuditLogs(take = 100, skip = 0): Observable<{ total: number; logs: AuditEntry[] }> {
    return this.http.get<{ total: number; logs: AuditEntry[] }>(
      `${this.auditUrl}?take=${take}&skip=${skip}`
    );
  }
}
