import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout">
      
      <!-- FLOATING TRIGGER WHEN MANUALLY COLLAPSED -->
      <div class="expand-trigger" *ngIf="isNavCollapsed && authService.getToken()" (click)="expandNav()" title="Mostrar menú de navegación">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        <span class="trigger-text">LOGIGHO</span>
      </div>

      <!-- STICKY HEADER -->
      <header class="top-nav"
              [class.nav-hidden]="isNavCollapsed"
              [class.nav-scroll-hidden]="isNavScrollHidden && !isNavCollapsed"
              *ngIf="authService.getToken()">
        <a routerLink="/" class="nav-brand">
          <div class="brand-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div>
            <h1 class="brand-title">Logigho</h1>
            <p class="brand-sub">Sistemas de Importación</p>
          </div>
        </a>
        
        <div class="nav-actions">
          <!-- NAVIGATION LINKS -->
          <div class="tabs">
            <a routerLink="/dashboard" routerLinkActive="active" class="tab-link">Dashboard</a>
            <a routerLink="/kanban" routerLinkActive="active" class="tab-link">Tablero</a>
            <a routerLink="/table" routerLinkActive="active" class="tab-link">Lista</a>
            <a *ngIf="canEdit()" routerLink="/excel" routerLinkActive="active" class="tab-link">Subir Excel</a>
            <a *ngIf="isAdmin()" routerLink="/usuarios" routerLinkActive="active" class="tab-link">Usuarios</a>
            <a *ngIf="isAdmin()" routerLink="/actividad" routerLinkActive="active" class="tab-link">Actividad</a>
          </div>
          
          <!-- HIDE BUTTON -->
          <button class="collapse-btn" (click)="collapseNav()" title="Ocultar menú completamente">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
          
          <!-- LOGOUT BUTTON -->
          <button class="logout-btn" (click)="salir()" title="Cerrar Sesión">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Salir</span>
          </button>
        </div>
      </header>

      <!-- PAGE CONTENT -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #09090b;
    }
    
    /* ── Permanent solid sticky header ── */
    .top-nav {
      width: 100%;
      height: 56px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      background: #09090b;
      position: sticky;
      top: 0;
      z-index: 1000;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
      transform: translateY(0);
      opacity: 1;
    }
    
    /* ── Fully hidden state (only on manual collapse button click) ── */
    .top-nav.nav-hidden {
      transform: translateY(-100%);
      opacity: 0;
      pointer-events: none;
    }

    /* ── Auto-hide on scroll down ── */
    .top-nav.nav-scroll-hidden {
      transform: translateY(-100%);
      opacity: 0;
      pointer-events: none;
    }
    
    /* ── Floating trigger when collapsed ── */
    .expand-trigger {
      position: fixed;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      background: #18181b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-top: none;
      border-radius: 0 0 10px 10px;
      padding: 0.35rem 1.25rem;
      z-index: 2000;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .expand-trigger:hover {
      background: #27272a;
      border-color: rgba(59, 130, 246, 0.3);
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15);
      transform: translateX(-50%) translateY(2px);
    }
    
    .trigger-text {
      font-size: 0.65rem;
      font-weight: 800;
      color: #fafafa;
      letter-spacing: 0.05em;
    }
    
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      cursor: pointer;
    }
    
    .brand-logo {
      width: 34px;
      height: 34px;
      background: rgba(59, 130, 246, 0.08);
      border: 1px solid rgba(59, 130, 246, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }
    
    .brand-title {
      font-weight: 700;
      font-size: 1.05rem;
      letter-spacing: 0.05em;
      margin: 0;
      color: #fafafa;
      text-transform: uppercase;
    }
    
    .brand-sub {
      color: #71717a;
      font-size: 0.68rem;
      font-weight: 500;
      margin-top: 0.02rem;
      margin-bottom: 0;
    }
    
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    
    .tabs {
      display: flex;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      overflow: hidden;
      padding: 2px;
    }
    
    .tab-link {
      padding: 0.4rem 1rem;
      color: #a1a1aa;
      text-decoration: none;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 6px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      border: none;
    }
    
    .tab-link:hover {
      color: #fafafa;
      background: rgba(255, 255, 255, 0.04);
    }
    
    .tab-link.active {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255,255,255,0.05);
      color: #fafafa;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    }
    
    /* ── Collapse button ── */
    .collapse-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      color: #71717a;
      width: 30px;
      height: 30px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .collapse-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.12);
      color: #fafafa;
    }
    
    .logout-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.15);
      color: #f87171;
      padding: 0.4rem 0.9rem;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }
    
    .logout-btn:hover {
      background: #ef4444;
      border-color: #ef4444;
      color: #fff;
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.25);
    }
    
    .main-content {
      flex: 1;
      padding: 1.25rem 2rem;
      display: flex;
      flex-direction: column;
      min-height: calc(100vh - 56px);
    }

    @media (max-width: 900px) {
      .main-content {
        padding: 1rem 1rem;
      }
      .top-nav {
        padding: 0 1rem;
      }
      .tab-link {
        padding: 0.35rem 0.65rem;
        font-size: 0.75rem;
      }
    }
  `]
})
export class AppComponent {
  isNavCollapsed = false;
  isNavScrollHidden = false;
  private lastScrollY = 0;

  constructor(public authService: AuthService) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentY = window.scrollY;
    const delta = currentY - this.lastScrollY;
    // Hide when scrolling DOWN more than 8px, show when scrolling UP
    if (delta > 8 && currentY > 56) {
      this.isNavScrollHidden = true;
    } else if (delta < -4) {
      this.isNavScrollHidden = false;
    }
    this.lastScrollY = currentY;
  }

  isAdmin(): boolean {
    return this.authService.getRoles().includes('Admin');
  }

  canEdit(): boolean {
    return this.authService.canEdit();
  }

  collapseNav() {
    this.isNavCollapsed = true;
  }

  expandNav() {
    this.isNavCollapsed = false;
  }

  salir() {
    this.authService.logout().subscribe({
      next: () => {
        window.location.reload();
      },
      error: () => {
        window.location.reload();
      }
    });
  }
}
