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
    <div class="login-container d-flex justify-center items-center">
      <div class="glass-panel login-card">
        <h2 class="text-center mb-4">Ingreso</h2>
        <div *ngIf="error" class="alert-danger mb-4">{{ error }}</div>
        
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Usuario</label>
            <input type="text" class="form-control" [(ngModel)]="credentials.username" name="username" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Contraseña</label>
            <input type="password" class="form-control" [(ngModel)]="credentials.password" name="password" required>
          </div>
          
          <button type="submit" class="btn btn-primary w-full mt-4" [disabled]="loading">
            {{ loading ? 'Ingresando...' : 'Entrar' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      width: 100%;
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 2.5rem 2rem;
    }
    .alert-danger {
      color: var(--danger);
      background: rgba(239, 68, 68, 0.1);
      padding: 0.75rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
  `]
})
export class LoginComponent {
  credentials = { username: '', password: '' };
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    
    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = 'Credenciales inválidas o error en el servidor.';
        this.loading = false;
      }
    });
  }
}
