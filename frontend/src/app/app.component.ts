import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout" *ngIf="authService.currentUser$ | async as user; else loginView">
      <nav class="sidebar glass-panel">
        <div class="brand d-flex items-center gap-2 mb-4 p-4">
          <div class="brand-icon">
            <i class="fas fa-ship"></i>
          </div>
          <h3 style="margin:0">Import-Web</h3>
        </div>
        
        <ul class="nav-list">
          <li>
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
              <i class="fas fa-chart-pie mr-2"></i> Dashboard
            </a>
          </li>
          <li>
            <a routerLink="/kanban" routerLinkActive="active" class="nav-link">
              <i class="fas fa-columns mr-2"></i> Kanban
            </a>
          </li>
          <li>
            <a routerLink="/table" routerLinkActive="active" class="nav-link">
              <i class="fas fa-table mr-2"></i> Lista de Pedidos
            </a>
          </li>
          <li>
            <a routerLink="/upload" routerLinkActive="active" class="nav-link">
              <i class="fas fa-file-upload mr-2"></i> Cargar Excel
            </a>
          </li>
        </ul>
        
        <div class="mt-4 p-4">
          <button class="btn btn-outline w-full" (click)="authService.logout()">
            <i class="fas fa-sign-out-alt mr-2"></i> Cerrar Sesión
          </button>
        </div>
      </nav>
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>

    <ng-template #loginView>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: 260px;
      padding: 1.5rem 0;
      display: flex;
      flex-direction: column;
      border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
      border-left: none;
    }
    .main-content {
      flex: 1;
      padding: 2rem;
      height: 100vh;
      overflow-y: auto;
    }
    .nav-list {
      list-style: none;
      flex: 1;
    }
    .nav-link {
      display: flex;
      align-items: center;
      padding: 1rem 2rem;
      color: var(--text-secondary);
      text-decoration: none;
      transition: var(--transition);
      font-weight: 500;
    }
    .nav-link:hover, .nav-link.active {
      color: var(--primary-color);
      background: rgba(79, 70, 229, 0.1);
      border-right: 3px solid var(--primary-color);
    }
    .brand-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .mr-2 { margin-right: 0.5rem; }
  `]
})
export class AppComponent {
  constructor(public authService: AuthService) {}
}

