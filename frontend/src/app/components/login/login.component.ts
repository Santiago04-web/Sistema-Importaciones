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

      <!-- AMBIENT BACKGROUND GLOWS & TECH GRID -->
      <div class="bg-grid-overlay"></div>
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>

      <div class="login-card-wrapper">
        <div class="login-card glass-card">
          
          <!-- BRAND & SECURITY HEADER -->
          <div class="login-header">
            <div class="brand-logo-icon">
              <div class="logo-pulse-ring"></div>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="cube-icon">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>

            <div class="security-level-pill">
              <span class="pulse-dot"></span> 🛡️ Servidor Seguro Operativo
            </div>

            <h1 class="brand-name">LOGIGHO</h1>
            <h2 class="title">Iniciar Sesión</h2>
            <p class="subtitle">Plataforma Consolidada de Gestión de Importaciones</p>
          </div>

          <!-- FORM -->
          <form (ngSubmit)="login()" class="login-form">
            <div class="form-group">
              <label class="input-label">
                <span>✉️ CORREO ELECTRÓNICO / USUARIO</span>
              </label>
              <div class="input-container">
                <input type="email" [(ngModel)]="email" name="email" required placeholder="ej. smenendez554@gmail.com" class="form-input">
              </div>
            </div>

            <div class="form-group">
              <label class="input-label">
                <span>🔒 CONTRASEÑA DE ACCESO</span>
              </label>
              <div class="input-container password-wrapper">
                <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" name="password" required placeholder="••••••••" class="form-input pwd-input">
                <button type="button" class="toggle-pwd-btn" (click)="showPassword = !showPassword" [title]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div *ngIf="errorMsg" class="error-banner">
              <span class="err-icon">⚠️</span>
              <span>{{ errorMsg }}</span>
            </div>

            <!-- BOTÓN PRINCIPAL DE INGRESAR -->
            <button type="submit" [disabled]="loading" class="submit-btn">
              <span *ngIf="!loading" class="btn-text">
                Ingresar al Sistema
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
              <span *ngIf="loading" class="btn-loading">
                <span class="spinner"></span> Autenticando acceso seguro...
              </span>
            </button>
          </form>

          <!-- SECURITY BADGE FOOTER -->
          <div class="security-footer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Conexión Cifrada AES-256 | Tokens JWT Revocables</span>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      width: 100%;
      background: #070a12;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 9999;
      padding: 1.5rem;
      overflow: hidden;
    }

    /* Ambient Background Effects */
    .bg-grid-overlay {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px);
      background-size: 32px 32px;
      opacity: 0.6;
      pointer-events: none;
    }

    .glow-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      pointer-events: none;
      opacity: 0.4;
      animation: orbFloat 10s ease-in-out infinite alternate;
    }
    .orb-1 {
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, #3b82f6 0%, rgba(59, 130, 246, 0) 70%);
      top: -100px;
      left: -100px;
    }
    .orb-2 {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, #6366f1 0%, rgba(99, 102, 241, 0) 70%);
      bottom: -120px;
      right: -120px;
      animation-delay: -5s;
    }

    @keyframes orbFloat {
      0%   { transform: translate(0, 0) scale(1); }
      100% { transform: translate(30px, 30px) scale(1.1); }
    }

    .login-card-wrapper {
      width: 100%;
      max-width: 440px;
      position: relative;
      z-index: 2;
    }

    .login-card {
      background: rgba(15, 23, 42, 0.82);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(59, 130, 246, 0.35);
      border-radius: 24px;
      padding: 2.5rem 2.25rem;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.95), 0 0 40px rgba(59, 130, 246, 0.12);
      animation: loginCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes loginCardIn {
      from { opacity: 0; transform: scale(0.95) translateY(16px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .login-header {
      text-align: center;
      margin-bottom: 1.85rem;
    }

    .brand-logo-icon {
      width: 62px;
      height: 62px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2));
      border: 1px solid rgba(59, 130, 246, 0.4);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 0.85rem;
      color: #60a5fa;
      position: relative;
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);
    }

    .logo-pulse-ring {
      position: absolute;
      inset: -4px;
      border-radius: 22px;
      border: 1px solid rgba(59, 130, 246, 0.3);
      animation: pulseRing 2.5s infinite;
    }

    @keyframes pulseRing {
      0%   { transform: scale(1); opacity: 0.8; }
      50%  { transform: scale(1.08); opacity: 0.2; }
      100% { transform: scale(1); opacity: 0.8; }
    }

    .security-level-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
      margin-bottom: 0.6rem;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
      animation: dotBlink 1.5s infinite;
    }

    @keyframes dotBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .brand-name {
      font-size: 0.9rem;
      font-weight: 900;
      letter-spacing: 0.18em;
      background: linear-gradient(135deg, #60a5fa, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-transform: uppercase;
      margin-bottom: 0.2rem;
    }

    .title {
      font-size: 1.65rem;
      font-weight: 800;
      color: #f8fafc;
      margin-bottom: 0.3rem;
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-size: 0.82rem;
      color: #94a3b8;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .input-label {
      font-size: 0.75rem;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 0.05em;
    }

    .input-container {
      position: relative;
      width: 100%;
    }

    .form-input {
      background: #0b1329 !important;
      border: 1px solid rgba(255, 255, 255, 0.16) !important;
      border-radius: 12px !important;
      padding: 0.85rem 1rem !important;
      color: #f8fafc !important;
      font-size: 0.95rem !important;
      outline: none !important;
      transition: all 0.2s ease !important;
      width: 100% !important;
    }

    /* Fix Chrome / Browser Autofill White Box Issue */
    .form-input:-webkit-autofill,
    .form-input:-webkit-autofill:hover, 
    .form-input:-webkit-autofill:focus,
    .form-input:-webkit-autofill:active {
      -webkit-text-fill-color: #f8fafc !important;
      -webkit-box-shadow: 0 0 0px 1000px #0b1329 inset !important;
      transition: background-color 5000s ease-in-out 0s;
      border-color: rgba(59, 130, 246, 0.5) !important;
    }

    .form-input:focus {
      border-color: #3b82f6 !important;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25) !important;
      background: #0f172a !important;
    }

    .password-wrapper {
      display: flex;
      align-items: center;
    }

    .pwd-input {
      padding-right: 2.85rem !important;
    }

    .toggle-pwd-btn {
      position: absolute;
      right: 12px;
      background: transparent;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.7;
      transition: opacity 0.15s ease, transform 0.15s ease;
    }

    .toggle-pwd-btn:hover {
      opacity: 1;
      transform: scale(1.1);
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fca5a5;
      padding: 0.75rem 0.9rem;
      border-radius: 12px;
      font-size: 0.82rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .submit-btn {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: 1px solid rgba(59, 130, 246, 0.5);
      color: #ffffff;
      padding: 0.95rem;
      border-radius: 12px;
      font-weight: 800;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      margin-top: 0.3rem;
      box-shadow: 0 10px 25px rgba(59, 130, 246, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 14px 30px rgba(59, 130, 246, 0.5);
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
    }

    .submit-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .submit-btn:disabled {
      opacity: 0.75;
      cursor: not-allowed;
    }

    .btn-text {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-loading {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2.5px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .security-footer {
      margin-top: 1.75rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 0.73rem;
      color: #64748b;
      font-weight: 600;
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
    if (!this.email || !this.password) {
      this.errorMsg = 'Por favor ingresa tu correo y contraseña.';
      return;
    }

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
