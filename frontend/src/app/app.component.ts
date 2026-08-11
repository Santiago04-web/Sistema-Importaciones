import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SignalrService } from './services/signalr.service';
import { PedidoService, Pedido } from './services/pedido.service';
import { NotificationCenterComponent } from './components/notification-center/notification-center.component';
import { CommandPaletteComponent } from './components/command-palette/command-palette.component';
import { FleteCalculatorComponent } from './components/flete-calculator/flete-calculator.component';
import { ExchangeRateComponent } from './components/exchange-rate/exchange-rate.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive, 
    NotificationCenterComponent,
    CommandPaletteComponent,
    FleteCalculatorComponent,
    ExchangeRateComponent
  ],
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
        
        <div class="nav-brand-group">
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

          <!-- SIGNALR LIVE STATUS BADGE (SOLO EN VIVO) -->
          <span class="live-signal-badge connected" *ngIf="signalrService.isConnected$ | async" title="Conexión en tiempo real activa">
            <span class="live-dot"></span>
            ● EN VIVO
          </span>

          <!-- TASA DE CAMBIO CNY EN VIVO (PILL NAVBAR) -->
          <app-exchange-rate></app-exchange-rate>
        </div>
        
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

          <!-- COMMAND PALETTE TRIGGER -->
          <button class="cmd-trigger-btn" (click)="openCmdPalette()" title="Buscador global (Ctrl + K)">
            🔍 <kbd>Ctrl+K</kbd>
          </button>

          <!-- FREIGHT CALCULATOR TRIGGER -->
          <button class="calc-trigger-btn" (click)="showCalculator = true" title="Simulador de Fletes & Comisiones">
            🧮 Simular Flete
          </button>

          <!-- NOTIFICATION CENTER -->
          <app-notification-center></app-notification-center>
          
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

      <!-- GLOBAL COMMAND PALETTE MODAL -->
      <app-command-palette #cmdPalette [pedidos]="allPedidos" (selectPedido)="onPedidoSelected($event)"></app-command-palette>

      <!-- FREIGHT CALCULATOR SIMULATOR MODAL -->
      <app-flete-calculator *ngIf="showCalculator" (closed)="showCalculator = false"></app-flete-calculator>
      
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #09090b;
    }
    
    .top-nav {
      width: 100%;
      height: 56px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      background: #09090b;
      position: sticky;
      top: 0;
      z-index: 1000;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
      transform: translateY(0);
      opacity: 1;
    }
    .nav-hidden {
      display: none !important;
    }
    .nav-scroll-hidden {
      transform: translateY(-100%);
      opacity: 0;
      pointer-events: none;
    }
    .expand-trigger {
      position: fixed;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      background: #09090b;
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-top: none;
      border-radius: 0 0 8px 8px;
      padding: 4px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      z-index: 1001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .trigger-text {
      font-size: 0.65rem;
      font-weight: 800;
      color: #3b82f6;
      letter-spacing: 0.05em;
    }
    .nav-brand-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    .brand-logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .brand-title {
      font-size: 1rem;
      font-weight: 800;
      color: #f8fafc;
      margin: 0;
      line-height: 1;
    }
    .brand-sub {
      font-size: 0.65rem;
      color: #64748b;
      margin: 0;
    }
    .live-signal-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.68rem;
      font-weight: 800;
      color: #eab308;
      background: rgba(234, 179, 8, 0.1);
      border: 1px solid rgba(234, 179, 8, 0.25);
      padding: 2px 8px;
      border-radius: 12px;
    }
    .live-signal-badge.connected {
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.25);
    }
    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .tabs {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.03);
      padding: 3px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .tab-link {
      padding: 0.4rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: #94a3b8;
      text-decoration: none;
      border-radius: 6px;
      transition: all 0.15s ease;
    }
    .tab-link:hover {
      color: #f1f5f9;
      background: rgba(255, 255, 255, 0.05);
    }
    .tab-link.active {
      color: #fff;
      background: #3b82f6;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }
    .cmd-trigger-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .cmd-trigger-btn kbd {
      background: rgba(255, 255, 255, 0.1);
      color: #60a5fa;
      padding: 1px 4px;
      border-radius: 4px;
      font-size: 0.65rem;
    }
    .calc-trigger-btn {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #10b981;
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
    }
    .collapse-btn, .logout-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      border-radius: 8px;
      padding: 0.35rem 0.75rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
    }
    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.3);
    }
    .main-content {
      flex: 1;
      padding: 1.5rem;
    }

    @media (max-width: 768px) {
      .top-nav {
        padding: 0 0.75rem;
      }
      .calc-trigger-btn, .cmd-trigger-btn kbd {
        display: none;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  isNavCollapsed = false;
  isNavScrollHidden = false;
  showCalculator = false;
  allPedidos: Pedido[] = [];
  private lastScrollY = 0;

  @ViewChild('cmdPalette') cmdPalette!: CommandPaletteComponent;

  constructor(
    public authService: AuthService,
    public signalrService: SignalrService,
    private pedidoService: PedidoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadPedidos();
  }

  loadPedidos() {
    if (this.authService.getToken()) {
      this.pedidoService.getPedidos().subscribe({
        next: (data) => {
          this.allPedidos = data || [];
        }
      });
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentY = window.scrollY;
    const delta = currentY - this.lastScrollY;
    if (delta > 8 && currentY > 56) {
      this.isNavScrollHidden = true;
    } else if (delta < -4) {
      this.isNavScrollHidden = false;
    }
    this.lastScrollY = currentY;
  }

  openCmdPalette() {
    if (this.cmdPalette) {
      this.cmdPalette.toggle();
    }
  }

  onPedidoSelected(pedido: Pedido) {
    this.router.navigate(['/kanban']);
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
