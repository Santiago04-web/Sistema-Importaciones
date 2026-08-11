import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">

      <div class="login-card-wrapper">
        <div class="login-card glass-card">
          
          <div class="login-header">
            <div class="brand-logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <h1 class="brand-name">LOGIGHO</h1>
            <h2 class="title">Iniciar Sesión</h2>
            <p class="subtitle">Acceso Seguro de Gestión de Importaciones</p>
          </div>

          <form (ngSubmit)="login()" class="login-form">
            <div class="form-group">
              <label class="input-label">CORREO ELECTRÓNICO</label>
              <input type="email" [(ngModel)]="email" name="email" required placeholder="smenendez554@gmail.com" class="form-input">
            </div>

            <div class="form-group">
              <label class="input-label">CONTRASEÑA</label>
              <div class="password-wrapper">
                <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" name="password" required placeholder="••••••••" class="form-input pwd-input">
                <button type="button" class="toggle-pwd-btn" (click)="showPassword = !showPassword" [title]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div *ngIf="errorMsg" class="error-banner">
              ⚠️ {{ errorMsg }}
            </div>

            <!-- BOTÓN PRINCIPAL DE INGRESAR -->
            <button type="submit" [disabled]="loading" class="submit-btn">
              <span *ngIf="!loading">Ingresar al Sistema ➔</span>
              <span *ngIf="loading">Autenticando...</span>
            </button>
          </form>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      width: 100%;
      background: #09090b;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 9999;
      padding: 1.5rem;
    }

    .login-card-wrapper {
      width: 100%;
      max-width: 440px;
    }
    .login-card {
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.35);
      border-radius: 20px;
      padding: 2.25rem 2rem;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
    }
    
    .login-header {
      text-align: center;
      margin-bottom: 1.75rem;
    }
    .brand-logo-icon {
      width: 54px;
      height: 54px;
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 0.75rem;
    }
    .brand-name {
      font-size: 0.85rem;
      font-weight: 800;
      color: #3b82f6;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 0.25rem;
    }
    .title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #f8fafc;
      margin-bottom: 0.35rem;
    }
    .subtitle {
      font-size: 0.82rem;
      color: #94a3b8;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .input-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .form-input {
      background: #020617;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      padding: 0.75rem 1rem;
      color: #f8fafc;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s ease;
      width: 100%;
    }
    .form-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
    }
    
    .password-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .pwd-input {
      padding-right: 2.75rem;
    }
    .toggle-pwd-btn {
      position: absolute;
      right: 10px;
      background: transparent;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.8;
      transition: opacity 0.15s ease;
    }
    .toggle-pwd-btn:hover {
      opacity: 1;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      margin-top: 0.1rem;
    }
    .remember-me {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #cbd5e1;
      cursor: pointer;
      user-select: none;
    }
    .custom-checkbox {
      accent-color: #3b82f6;
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fca5a5;
      padding: 0.65rem 0.85rem;
      border-radius: 10px;
      font-size: 0.82rem;
    }

    .submit-btn {
      background: #3b82f6;
      border: none;
      color: #ffffff;
      padding: 0.85rem;
      border-radius: 10px;
      font-weight: 800;
      font-size: 0.98rem;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 0.5rem;
    }
    .submit-btn:hover {
      background: #2563eb;
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }
  `]
})
export class LoginComponent implements OnInit {
  email = 'smenendez554@gmail.com';
  password = '';
  rememberMe = true;
  loading = false;
  errorMsg = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      this.email = savedEmail;
    }
  }

  login() {
    this.loading = true;
    this.errorMsg = '';

    if (this.rememberMe) {
      localStorage.setItem('remembered_email', this.email);
    }

    this.authService.login({ username: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Credenciales inválidas o contraseña incorrecta.';
      }
    });
  }
}
