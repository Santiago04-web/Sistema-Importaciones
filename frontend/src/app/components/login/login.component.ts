import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LanguageService, Language } from '../../services/language.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      
      <!-- TOP RIGHT SINGLE LANG SELECTOR -->
      <div class="lang-selector-top">
        <button class="lang-pill-btn" [class.active]="langService.currentLang() === 'es'" (click)="setLang('es')">🇪🇸 ES</button>
        <button class="lang-pill-btn" [class.active]="langService.currentLang() === 'en'" (click)="setLang('en')">🇬🇧 EN</button>
        <button class="lang-pill-btn" [class.active]="langService.currentLang() === 'zh'" (click)="setLang('zh')">🇨🇳 中文</button>
      </div>

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
            <h1 class="brand-name">Logigho</h1>
            <h2 class="title">{{ langService.t('login_title') }}</h2>
            <p class="subtitle">{{ langService.t('login_sub') }}</p>
          </div>

          <form (ngSubmit)="login()" class="login-form">
            <div class="form-group">
              <label class="input-label">{{ langService.t('login_email') }}</label>
              <input type="email" [(ngModel)]="email" name="email" required placeholder="smenendez554@gmail.com" class="form-input">
            </div>

            <div class="form-group">
              <label class="input-label">{{ langService.t('login_password') }}</label>
              <div class="password-wrapper">
                <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" name="password" required placeholder="Santiago0417#Admin" class="form-input pwd-input">
                <button type="button" class="toggle-pwd-btn" (click)="showPassword = !showPassword" [title]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div class="form-options">
              <label class="remember-me">
                <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" class="custom-checkbox">
                <span>{{ langService.t('login_remember') }}</span>
              </label>
              <a href="javascript:void(0)" (click)="showForgotModal = true" class="forgot-link">
                {{ langService.t('login_forgot') }}
              </a>
            </div>

            <div *ngIf="errorMsg" class="error-banner">
              ⚠️ {{ errorMsg }}
            </div>

            <button type="submit" [disabled]="loading" class="submit-btn">
              <span *ngIf="!loading">{{ langService.t('login_btn') }} ➔</span>
              <span *ngIf="loading">Autenticando...</span>
            </button>
          </form>

        </div>
      </div>

      <!-- FORGOT PASSWORD MODAL -->
      <div class="modal-overlay" *ngIf="showForgotModal">
        <div class="modal-card glass-card">
          <h3>🔒 {{ langService.t('forgot_modal_title') }}</h3>
          <p>{{ langService.t('forgot_modal_msg') }}</p>
          <div class="admin-contact">
            <code>smenendez554&#64;gmail.com</code>
          </div>
          <button (click)="showForgotModal = false" class="close-modal-btn">Entendido</button>
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
    
    .lang-selector-top {
      position: absolute;
      top: 1.5rem;
      right: 2rem;
      display: flex;
      gap: 6px;
      z-index: 10;
    }
    .lang-pill-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #94a3b8;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .lang-pill-btn.active, .lang-pill-btn:hover {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
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
      margin-top: 0.25rem;
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
    .forgot-link {
      color: #60a5fa;
      text-decoration: none;
      font-weight: 600;
    }
    .forgot-link:hover {
      text-decoration: underline;
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

    /* MODAL */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    }
    .modal-card {
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.35);
      padding: 1.75rem;
      border-radius: 16px;
      max-width: 400px;
      text-align: center;
      color: #f8fafc;
    }
    .admin-contact {
      margin: 1.25rem 0;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.6rem;
      border-radius: 8px;
      color: #60a5fa;
    }
    .close-modal-btn {
      background: #3b82f6;
      border: none;
      color: #fff;
      padding: 0.5rem 1.4rem;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = true;
  loading = false;
  errorMsg = '';
  showForgotModal = false;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public langService: LanguageService
  ) {}

  setLang(lang: Language) {
    this.langService.setLanguage(lang);
  }

  login() {
    this.loading = true;
    this.errorMsg = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Credenciales incorrectas.';
      }
    });
  }
}
