import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AppUser } from '../../services/admin.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-page">

      <!-- PAGE HEADER -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Gestión de Usuarios</h2>
          <p class="page-subtitle">Creá cuentas para tu equipo y proveedores</p>
        </div>
        <button class="btn-create" (click)="openCreateForm()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Usuario
        </button>
      </div>

      <!-- CREATE USER FORM -->
      <div class="create-form" *ngIf="showForm">
        <div class="form-card">
          <h3 class="form-title">Crear cuenta nueva</h3>

          <div class="form-row">
            <div class="input-group">
              <label>Nombre para mostrar</label>
              <input type="text" [(ngModel)]="newNombre" placeholder="Ej: Santiago" autocomplete="off"/>
            </div>
            <div class="input-group">
              <label>Correo electrónico</label>
              <input type="email" [(ngModel)]="newEmail" placeholder="ejemplo@correo.com" autocomplete="off"/>
            </div>
            <div class="input-group">
              <label>Contraseña</label>
              <div class="password-field">
                <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="newPassword" placeholder="Mín. 12 caracteres" autocomplete="new-password"/>
                <button class="toggle-pw" (click)="showPassword = !showPassword" type="button">
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>
            <div class="input-group">
              <label>Rol</label>
              <select [(ngModel)]="newRole">
                <option value="Viewer">Viewer (Solo lectura)</option>
                <option value="Editor">Editor (Lectura y escritura)</option>
                <option value="Admin">Admin (Control total)</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-cancel" (click)="showForm = false">Cancelar</button>
            <button class="btn-save" (click)="createUser()" [disabled]="creating">
              {{ creating ? 'Creando...' : 'Crear Usuario' }}
            </button>
          </div>

          <div class="form-message success" *ngIf="successMsg">✓ {{ successMsg }}</div>
          <div class="form-message error" *ngIf="errorMsg">✕ {{ errorMsg }}</div>
        </div>
      </div>

      <!-- USERS TABLE -->
      <div class="users-table-wrap">
        <table class="users-table" *ngIf="users.length > 0">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users" [class.locked]="u.isLockedOut">
              <td class="user-cell">
                <div class="avatar" [style.background]="getAvatarColor(u.username)">
                  {{ u.username.charAt(0).toUpperCase() }}
                </div>
                <span class="username">{{ u.username }}</span>
              </td>
              <td class="email-cell">{{ u.email || '—' }}</td>
              <td>
                <span class="role-badge" [class]="'role-' + (u.roles[0] || 'viewer').toLowerCase()">
                  {{ u.roles[0] || 'Viewer' }}
                </span>
              </td>
              <td>
                <span class="status-pill" [class.locked]="u.isLockedOut">
                  {{ u.isLockedOut ? '🔒 Bloqueado' : '✓ Activo' }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="action-btn edit" (click)="openEditModal(u)" title="Editar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="action-btn unlock" *ngIf="u.isLockedOut" (click)="unlockUser(u)" title="Desbloquear">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                </button>
                <button class="action-btn delete" (click)="deleteUser(u)" title="Eliminar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty-state" *ngIf="users.length === 0 && !loading">
          <p>No hay usuarios registrados.</p>
        </div>
        <div class="loading-state" *ngIf="loading">Cargando usuarios...</div>
      </div>

      <!-- ══════════════════════════════
           EDIT MODAL
           ══════════════════════════════ -->
      <div class="modal-overlay" *ngIf="editingUser" (click)="closeEditModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">

          <div class="modal-header">
            <div class="modal-avatar" [style.background]="getAvatarColor(editingUser.username)">
              {{ editingUser.username.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h3>Editar usuario</h3>
              <p>{{ editingUser.username }}</p>
            </div>
            <button class="modal-close" (click)="closeEditModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="edit-grid">
              <div class="input-group">
                <label>Nombre para mostrar</label>
                <input type="text" [(ngModel)]="editNombre" placeholder="Nombre visible en el sistema"/>
              </div>
              <div class="input-group">
                <label>Correo electrónico</label>
                <input type="email" [(ngModel)]="editEmail" placeholder="correo@ejemplo.com"/>
              </div>
              <div class="input-group">
                <label>Rol</label>
                <select [(ngModel)]="editRole">
                  <option value="Viewer">Viewer (Solo lectura)</option>
                  <option value="Editor">Editor (Lectura y escritura)</option>
                  <option value="Admin">Admin (Control total)</option>
                </select>
              </div>
              <div class="input-group">
                <label>Nueva contraseña <span class="optional">(dejar vacío para no cambiar)</span></label>
                <div class="password-field">
                  <input [type]="showEditPassword ? 'text' : 'password'" [(ngModel)]="editPassword" placeholder="Dejar vacío = sin cambio" autocomplete="new-password"/>
                  <button class="toggle-pw" (click)="showEditPassword = !showEditPassword" type="button">
                    {{ showEditPassword ? '🙈' : '👁️' }}
                  </button>
                </div>
              </div>
            </div>

            <div class="form-message success" *ngIf="editSuccessMsg">✓ {{ editSuccessMsg }}</div>
            <div class="form-message error" *ngIf="editErrorMsg">✕ {{ editErrorMsg }}</div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeEditModal()">Cancelar</button>
            <button class="btn-save" (click)="saveEdit()" [disabled]="saving">
              <svg *ngIf="!saving" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              {{ saving ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .users-page {
      padding: 2rem;
      max-width: 1100px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #fafafa;
      margin: 0 0 0.25rem;
    }
    .page-subtitle {
      color: #71717a;
      font-size: 0.8rem;
      margin: 0;
    }
    .btn-create {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      background: #3b82f6;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-create:hover { background: #2563eb; transform: translateY(-1px); }

    /* ── Create form ── */
    .create-form { margin-bottom: 1.5rem; }
    .form-card {
      background: #18181b;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 14px;
      padding: 1.75rem;
    }
    .form-title {
      font-size: 1rem;
      font-weight: 700;
      color: #fafafa;
      margin: 0 0 1.25rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .input-group label {
      font-size: 0.68rem;
      font-weight: 700;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }
    .optional {
      font-weight: 400;
      text-transform: none;
      letter-spacing: 0;
      color: #52525b;
    }
    .input-group input, .input-group select {
      padding: 0.65rem 0.9rem;
      background: #09090b;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 8px;
      color: #fafafa;
      font-size: 0.85rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }
    .input-group input:focus, .input-group select:focus { border-color: #3b82f6; }
    .input-group input::placeholder { color: #3f3f46; }
    .input-group select option { background: #18181b; }

    .password-field { position: relative; display: flex; align-items: center; }
    .password-field input { width: 100%; padding-right: 2.5rem; }
    .toggle-pw {
      position: absolute; right: 10px;
      background: none; border: none; cursor: pointer;
      font-size: 0.85rem; padding: 2px;
    }

    .form-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }
    .btn-cancel {
      padding: 0.6rem 1.2rem;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: #a1a1aa;
      font-size: 0.85rem;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-cancel:hover { border-color: rgba(255,255,255,0.2); color: #fafafa; }
    .btn-save {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 1.4rem;
      background: #ffffff;
      color: #09090b;
      border: none;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-save:hover:not(:disabled) { background: #f4f4f5; }
    .btn-save:disabled { opacity: 0.45; cursor: not-allowed; }

    .form-message {
      margin-top: 1rem;
      padding: 0.6rem 0.9rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .form-message.success { background: rgba(16,185,129,0.1); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.2); }
    .form-message.error   { background: rgba(239,68,68,0.1);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.2); }

    /* ── Table ── */
    .users-table-wrap {
      background: #18181b;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px;
      overflow: hidden;
    }
    .users-table { width: 100%; border-collapse: collapse; }
    .users-table th {
      padding: 0.75rem 1.25rem;
      text-align: left;
      font-size: 0.65rem;
      font-weight: 700;
      color: #52525b;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .users-table td {
      padding: 0.9rem 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      font-size: 0.85rem;
      color: #d4d4d8;
    }
    .users-table tr:last-child td { border-bottom: none; }
    .users-table tr:hover td { background: rgba(255,255,255,0.02); }
    .users-table tr.locked td { opacity: 0.6; }

    .user-cell { display: flex; align-items: center; gap: 0.75rem; }
    .avatar {
      width: 32px; height: 32px;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; color: #fff;
      flex-shrink: 0;
    }
    .username { font-weight: 600; color: #fafafa; }
    .email-cell { color: #71717a; font-size: 0.8rem; }

    .role-badge {
      padding: 0.2rem 0.65rem;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .role-admin  { background: rgba(239,68,68,0.15);   color: #fca5a5; border: 1px solid rgba(239,68,68,0.25); }
    .role-editor { background: rgba(59,130,246,0.15);  color: #93c5fd; border: 1px solid rgba(59,130,246,0.25); }
    .role-viewer { background: rgba(161,161,170,0.15); color: #a1a1aa; border: 1px solid rgba(161,161,170,0.2); }

    .status-pill {
      font-size: 0.78rem;
      font-weight: 600;
      color: #6ee7b7;
    }
    .status-pill.locked { color: #fca5a5; }

    .actions-cell { display: flex; gap: 0.4rem; align-items: center; }
    .action-btn {
      width: 30px; height: 30px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 7px;
      cursor: pointer;
      color: #71717a;
      transition: all 0.15s;
    }
    .action-btn.edit:hover   { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.3); color: #93c5fd; }
    .action-btn.unlock:hover { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.25); color: #6ee7b7; }
    .action-btn.delete:hover { background: rgba(239,68,68,0.12);  border-color: rgba(239,68,68,0.25); color: #fca5a5; }

    .empty-state, .loading-state {
      padding: 3rem;
      text-align: center;
      color: #52525b;
      font-size: 0.85rem;
    }

    /* ══════════════════
       EDIT MODAL
       ══════════════════ */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-card {
      background: #18181b;
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 18px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 32px 80px rgba(0,0,0,0.6);
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem 1.75rem;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .modal-avatar {
      width: 42px; height: 42px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; font-weight: 800; color: #fff;
      flex-shrink: 0;
    }
    .modal-header h3 {
      font-size: 1rem;
      font-weight: 700;
      color: #fafafa;
      margin: 0 0 0.15rem;
    }
    .modal-header p {
      font-size: 0.78rem;
      color: #71717a;
      margin: 0;
    }
    .modal-close {
      margin-left: auto;
      background: none;
      border: none;
      color: #52525b;
      cursor: pointer;
      padding: 4px;
      transition: color 0.15s;
      display: flex;
    }
    .modal-close:hover { color: #fafafa; }

    .modal-body { padding: 1.75rem; }

    .edit-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 500px) {
      .edit-grid { grid-template-columns: 1fr; }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.25rem 1.75rem;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
  `]
})
export class UsersComponent implements OnInit {
  users: AppUser[] = [];
  loading = true;

  // Create form
  showForm = false;
  showPassword = false;
  creating = false;
  newNombre = '';
  newEmail = '';
  newPassword = '';
  newRole = 'Viewer';
  successMsg = '';
  errorMsg = '';

  // Edit modal
  editingUser: AppUser | null = null;
  editNombre = '';
  editEmail = '';
  editRole = '';
  editPassword = '';
  showEditPassword = false;
  saving = false;
  editSuccessMsg = '';
  editErrorMsg = '';

  constructor(private adminService: AdminService) {}

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (users) => { this.users = users; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openCreateForm() {
    this.showForm = !this.showForm;
    this.successMsg = '';
    this.errorMsg = '';
  }

  createUser() {
    this.successMsg = '';
    this.errorMsg = '';
    if (!this.newEmail || !this.newPassword) {
      this.errorMsg = 'Completá el correo y la contraseña.';
      return;
    }
    this.creating = true;
    this.adminService.createUser(this.newEmail, this.newPassword, this.newRole).subscribe({
      next: (res: any) => {
        this.successMsg = `Usuario "${res.username}" creado con rol ${res.role}.`;
        this.newNombre = ''; this.newEmail = ''; this.newPassword = ''; this.newRole = 'Viewer';
        this.creating = false;
        this.loadUsers();
      },
      error: (err: any) => {
        this.errorMsg = err.error?.message || 'Error al crear el usuario.';
        this.creating = false;
      }
    });
  }

  // ── Edit modal ──
  openEditModal(user: AppUser) {
    this.editingUser = user;
    this.editNombre = user.username;
    this.editEmail = user.email;
    this.editRole = user.roles[0] || 'Viewer';
    this.editPassword = '';
    this.editSuccessMsg = '';
    this.editErrorMsg = '';
    this.showEditPassword = false;
  }

  closeEditModal() {
    this.editingUser = null;
  }

  saveEdit() {
    if (!this.editingUser) return;
    this.editSuccessMsg = '';
    this.editErrorMsg = '';
    this.saving = true;

    const payload: any = {
      nombre: this.editNombre,
      email: this.editEmail,
      role: this.editRole
    };
    if (this.editPassword.trim()) {
      payload.newPassword = this.editPassword;
    }

    this.adminService.updateUser(this.editingUser.id, payload).subscribe({
      next: (res: any) => {
        this.editSuccessMsg = 'Cambios guardados correctamente.';
        this.saving = false;
        this.loadUsers();
        setTimeout(() => this.closeEditModal(), 1200);
      },
      error: (err: any) => {
        this.editErrorMsg = err.error?.message || 'Error al guardar los cambios.';
        this.saving = false;
      }
    });
  }

  deleteUser(user: AppUser) {
    if (!confirm(`¿Eliminar al usuario "${user.username}"?`)) return;
    this.adminService.deleteUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: (err: any) => alert(err.error?.message || 'Error al eliminar.')
    });
  }

  unlockUser(user: AppUser) {
    this.adminService.unlockUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: (err: any) => alert(err.error?.message || 'Error al desbloquear.')
    });
  }

  getAvatarColor(name: string): string {
    const colors = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
}
