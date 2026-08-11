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
    <div class="login-layout">

      <!-- LEFT BANNER SECTION -->
      <div class="left-banner">
        <div class="banner-grid-overlay"></div>
        <div class="banner-glow"></div>
        
        <div class="banner-content">
          <div class="brand-header">
            <div class="brand-symbol">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <span class="brand-text">LOGIGHO<span class="dot">.</span></span>
          </div>

          <div class="hero-box">
            <h1 class="hero-title">Gestión de Importaciones</h1>
            <p class="hero-subtitle">Plataforma Consolidada Logística & Contable</p>
          </div>
        </div>
      </div>

      <!-- RIGHT FORM SECTION -->
      <div class="right-section">
        <div class="form-card">
          
          <div class="mobile-brand" *ngIf="isMobile">
            <span class="brand-text">LOGIGHO<span class="dot">.</span></span>
          </div>

          <div class="form-header">
            <h2 class="form-title">Iniciar sesión</h2>
            <p class="form-subtitle">Ingresa tus credenciales para acceder</p>
          </div>

          <form (ngSubmit)="login()" class="login-form">
            <div class="form-group">
              <label class="field-label">Correo electrónico</label>
              <input type="email" 
                     [(ngModel)]="email" 
                     name="email" 
                     required 
                     placeholder="ej. usuario@ejemplo.com" 
                     class="clean-input">
            </div>

            <div class="form-group">
              <label class="field-label">Contraseña</label>
              <div class="password-input-wrap">
                <input [type]="showPassword ? 'text' : 'password'" 
                       [(ngModel)]="password" 
                       name="password" 
                       required 
                       placeholder="••••••••" 
                       class="clean-input pwd-field">
                <button type="button" class="eye-toggle" (click)="showPassword = !showPassword" [title]="showPassword ? 'Ocultar' : 'Mostrar'">
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div *ngIf="errorMsg" class="error-box">
              ⚠️ {{ errorMsg }}
            </div>

            <button type="submit" [disabled]="loading" class="primary-btn">
              <span *ngIf="!loading">Ingresar</span>
              <span *ngIf="loading" class="loading-state">
                <span class="btn-spinner"></span> Accediendo...
              </span>
            </button>
          </form>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .login-layout {
      min-height: 100vh;
      width: 100%;
      display: flex;
      background: #090d16;
      position: fixed;
      inset: 0;
      z-index: 9999;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
    }

    /* LEFT BANNER */
    .left-banner {
      flex: 1;
      max-width: 48%;
      background: linear-gradient(135deg, #030712 0%, #091533 50%, #020617 100%);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 4rem 4.5rem;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      overflow: hidden;
    }

    .banner-grid-overlay {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px);
      background-size: 32px 32px;
      opacity: 0.5;
      pointer-events: none;
    }

    .banner-glow {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(59, 130, 246, 0) 70%);
      top: -100px;
      left: -100px;
      pointer-events: none;
    }

    .banner-content {
      position: relative;
      z-index: 2;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .brand-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-symbol {
      width: 40px;
      height: 40px;
      background: #2563eb;
      border-radius: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.4);
    }

    .brand-text {
      font-size: 1.4rem;
      font-weight: 900;
      color: #f8fafc;
      letter-spacing: 0.08em;
    }

    .dot {
      color: #3b82f6;
    }

    .hero-box {
      margin: auto 0;
      max-width: 460px;
    }

    .hero-title {
      font-size: 2.75rem;
      font-weight: 800;
      color: #f8fafc;
      line-height: 1.15;
      margin-bottom: 0.85rem;
      letter-spacing: -0.03em;
    }

    .hero-subtitle {
      font-size: 1.05rem;
      color: #60a5fa;
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    /* RIGHT FORM SECTION */
    .right-section {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2.5rem;
      background: #090d16;
    }

    .form-card {
      width: 100%;
      max-width: 380px;
    }

    .mobile-brand {
      margin-bottom: 2rem;
      text-align: center;
    }

    .form-header {
      margin-bottom: 2.25rem;
    }

    .form-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #f8fafc;
      margin-bottom: 0.35rem;
      letter-spacing: -0.02em;
    }

    .form-subtitle {
      font-size: 0.88rem;
      color: #94a3b8;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.35rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #cbd5e1;
    }

    .clean-input {
      background: #0f172a !important;
      border: 1px solid rgba(255, 255, 255, 0.14) !important;
      border-radius: 10px !important;
      padding: 0.85rem 1rem !important;
      color: #f8fafc !important;
      font-size: 0.95rem !important;
      outline: none !important;
      transition: all 0.2s ease !important;
      width: 100% !important;
    }

    /* Fix Chrome Autofill White Background */
    .clean-input:-webkit-autofill,
    .clean-input:-webkit-autofill:hover, 
    .clean-input:-webkit-autofill:focus,
    .clean-input:-webkit-autofill:active {
      -webkit-text-fill-color: #f8fafc !important;
      -webkit-box-shadow: 0 0 0px 1000px #0f172a inset !important;
      transition: background-color 5000s ease-in-out 0s;
      border-color: rgba(59, 130, 246, 0.4) !important;
    }

    .clean-input:focus {
      border-color: #3b82f6 !important;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2) !important;
      background: #1e293b !important;
    }

    .password-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .pwd-field {
      padding-right: 2.85rem !important;
    }

    .eye-toggle {
      position: absolute;
      right: 12px;
      background: transparent;
      border: none;
      font-size: 1.05rem;
      cursor: pointer;
      padding: 4px;
      opacity: 0.7;
      transition: opacity 0.15s ease;
    }

    .eye-toggle:hover {
      opacity: 1;
    }

    .error-box {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 0.75rem 0.9rem;
      border-radius: 10px;
      font-size: 0.83rem;
    }

    .primary-btn {
      background: #2563eb;
      border: none;
      color: #ffffff;
      padding: 0.9rem;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.98rem;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 0.4rem;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
    }

    .primary-btn:hover:not(:disabled) {
      background: #1d4ed8;
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
    }

    .primary-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* RESPONSIVE */
    @media (max-width: 900px) {
      .left-banner { display: none; }
      .right-section { padding: 1.5rem; }
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
  isMobile = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkScreenSize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.checkScreenSize());
    }

    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      this.email = savedEmail;
    }
  }

  checkScreenSize() {
    if (typeof window !== 'undefined') {
      this.isMobile = window.innerWidth <= 900;
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
