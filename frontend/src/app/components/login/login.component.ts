import { Component } from '@angular/core';
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

      <!-- Left branding panel -->
      <div class="login-brand">
        <div class="brand-content">
          <div class="brand-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <h1>Logigho</h1>
          <p class="brand-subtitle">Control de Carga & Importación</p>
          <p class="brand-tagline">
            Accede al centro de control unificado. Monitorea contenedores, liquida fletes y gestiona aduanas en tiempo real.
          </p>
        </div>
        <div class="brand-footer">
          © 2026 Logigho Importaciones. Todos los derechos reservados.
        </div>
      </div>

      <!-- Right login form -->
      <div class="login-form-side">
        <div class="login-card">
          <div class="card-header">
            <h2>Iniciar Sesión</h2>
            <p>Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <div *ngIf="error" class="error-banner">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#ef4444" stroke-width="1.5"/>
              <path d="M8 4.5v4M8 10.5v.5" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>{{ error }}</span>
          </div>

          <form (ngSubmit)="onSubmit()" class="login-form">
            <div class="input-group">
              <label>Usuario / Correo</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input type="text" [(ngModel)]="credentials.username" name="username"
                  placeholder="Tu usuario o correo" required autocomplete="username">
              </div>
            </div>

            <div class="input-group">
              <label>Contraseña</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="credentials.password" name="password"
                  placeholder="Tu contraseña" required autocomplete="current-password">
                <button type="button" class="toggle-pw" (click)="showPassword = !showPassword">
                  <svg *ngIf="!showPassword" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg *ngIf="showPassword" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
            </div>

            <button type="submit" class="login-btn" [disabled]="loading">
              <span>{{ loading ? 'Autenticando...' : 'Acceder al Sistema' }}</span>
              <div class="btn-spinner" *ngIf="loading"></div>
              <svg *ngIf="!loading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </form>

          <p class="card-footer">Acceso encriptado SSL · Solo personal autorizado</p>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ── Full-page reset ── */
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
    }

    .login-page {
      display: flex;
      min-height: 100vh;
      width: 100%;
      background: #09090b;
    }

    /* ── Left branding panel ── */
    .login-brand {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 4rem 3rem;
      position: relative;
      z-index: 1;
      border-right: 1px solid rgba(255, 255, 255, 0.04);
    }

    .brand-content {
      text-align: center;
      max-width: 380px;
    }

    .brand-logo {
      width: 64px;
      height: 64px;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.25);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
      margin-bottom: 1.5rem;
      box-shadow: 0 0 30px rgba(59, 130, 246, 0.15);
    }

    .login-brand h1 {
      font-size: 2.5rem;
      font-weight: 900;
      color: #fafafa;
      margin: 0;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .brand-subtitle {
      color: #3b82f6;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      margin: 0.5rem 0 1.5rem;
    }

    .brand-tagline {
      color: #71717a;
      font-size: 0.88rem;
      line-height: 1.65;
      margin: 0;
    }

    .brand-footer {
      position: absolute;
      bottom: 2rem;
      color: #3f3f46;
      font-size: 0.65rem;
      text-align: center;
    }

    /* ── Right form panel ── */
    .login-form-side {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4rem 3rem;
      position: relative;
      z-index: 1;
    }

    /* Glassmorphism card */
    .login-card {
      width: 100%;
      max-width: 390px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 20px;
      padding: 2.5rem 2rem;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.04) inset,
        0 24px 64px rgba(0, 0, 0, 0.5);
    }

    .card-header {
      margin-bottom: 2rem;
    }
    .card-header h2 {
      font-size: 1.65rem;
      font-weight: 800;
      color: #fafafa;
      margin: 0 0 0.4rem;
      letter-spacing: -0.02em;
    }
    .card-header p {
      color: #71717a;
      font-size: 0.8rem;
      margin: 0;
    }

    /* Error Banner */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.75rem 1rem;
      background: rgba(239, 68, 68, 0.07);
      border: 1px solid rgba(239, 68, 68, 0.18);
      border-radius: 10px;
      margin-bottom: 1.5rem;
      color: #f87171;
      font-size: 0.78rem;
      font-weight: 600;
    }

    /* Inputs */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .input-group label {
      font-size: 0.67rem;
      font-weight: 700;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-icon {
      position: absolute;
      left: 13px;
      color: #52525b;
      pointer-events: none;
      transition: color 0.15s;
    }
    .input-wrapper:focus-within .input-icon {
      color: #3b82f6;
    }
    .input-wrapper input {
      width: 100%;
      padding: 0.75rem 2.75rem 0.75rem 2.5rem;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 10px;
      color: #fafafa;
      font-size: 0.87rem;
      font-family: inherit;
      transition: all 0.2s;
      outline: none;
      box-sizing: border-box;
    }
    .input-wrapper input::placeholder { color: #3f3f46; }
    .input-wrapper input:hover { border-color: rgba(255, 255, 255, 0.12); }
    .input-wrapper input:focus {
      border-color: rgba(59, 130, 246, 0.5);
      background: rgba(59, 130, 246, 0.04);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    /* Override browser autofill yellow/blue */
    .input-wrapper input:-webkit-autofill,
    .input-wrapper input:-webkit-autofill:hover,
    .input-wrapper input:-webkit-autofill:focus {
      -webkit-text-fill-color: #fafafa !important;
      -webkit-box-shadow: 0 0 0 1000px #131316 inset !important;
      transition: background-color 9999s;
    }

    /* Eye toggle */
    .toggle-pw {
      position: absolute;
      right: 11px;
      background: none;
      border: none;
      color: #52525b;
      cursor: pointer;
      padding: 3px;
      display: flex;
      align-items: center;
      transition: color 0.15s;
    }
    .toggle-pw:hover { color: #a1a1aa; }

    /* Submit button */
    .login-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.55rem;
      width: 100%;
      padding: 0.82rem 1.5rem;
      margin-top: 0.4rem;
      background: #ffffff;
      color: #09090b;
      border: none;
      border-radius: 10px;
      font-size: 0.87rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s;
    }
    .login-btn:hover:not(:disabled) {
      background: #f4f4f5;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(255, 255, 255, 0.12);
    }
    .login-btn:active:not(:disabled) { transform: translateY(0); }
    .login-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    .btn-spinner {
      width: 15px; height: 15px;
      border: 2px solid rgba(9,9,11,0.2);
      border-top-color: #09090b;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .card-footer {
      margin-top: 1.75rem;
      text-align: center;
      color: #3f3f46;
      font-size: 0.65rem;
    }

    /* ── Responsive ── */
    @media (max-width: 860px) {
      .login-page { flex-direction: column; }
      .login-brand {
        padding: 3rem 2rem 2rem;
        border-right: none;
        border-bottom: 1px solid rgba(255,255,255,0.04);
      }
      .login-brand h1 { font-size: 2rem; }
      .brand-footer { display: none; }
      .login-form-side { padding: 2.5rem 1.5rem; }
    }
  `]
})
export class LoginComponent {
  credentials = { username: '', password: '' };
  loading = false;
  error = '';
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.authService.login(this.credentials).subscribe({
      next: () => { this.router.navigate(['/dashboard']); },
      error: (err) => {
        const msg = err.error?.message || err.error?.Message || '';
        // Don't show raw technical token errors to the user
        if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('refresh')) {
          this.error = 'Usuario o contraseña incorrectos.';
        } else {
          this.error = msg || 'Usuario o contraseña incorrectos.';
        }
        this.loading = false;
      }
    });
  }
}
