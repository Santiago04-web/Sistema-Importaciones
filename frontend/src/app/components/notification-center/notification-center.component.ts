import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SignalrService } from '../../services/signalr.service';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: Date;
  read: boolean;
  type: 'create' | 'update' | 'delete' | 'warning';
}

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-wrap">
      <button class="bell-btn" (click)="toggleDropdown($event)" title="Centro de Notificaciones">
        <span class="bell-icon">🔔</span>
        <span class="unread-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
      </button>

      <!-- DROPDOWN POPOVER -->
      <div class="notif-popover glass-card" *ngIf="isOpen" (click)="$event.stopPropagation()">
        <div class="popover-header">
          <div class="header-title">
            <h4>Notificaciones</h4>
            <span class="badge-count" *ngIf="unreadCount > 0">{{ unreadCount }} nuevas</span>
          </div>
          <button class="mark-read-btn" (click)="markAllAsRead()" *ngIf="notifications.length > 0">
            ✓ Marcar leídas
          </button>
        </div>

        <div class="popover-body" *ngIf="notifications.length > 0">
          <div class="notif-item" 
               *ngFor="let item of notifications" 
               [class.unread]="!item.read"
               (click)="item.read = true">
            
            <span class="notif-icon" [ngSwitch]="item.type">
              <span *ngSwitchCase="'create'">✨</span>
              <span *ngSwitchCase="'update'">🔄</span>
              <span *ngSwitchCase="'delete'">🗑️</span>
              <span *ngSwitchDefault>⚠️</span>
            </span>

            <div class="notif-content">
              <strong class="notif-title">{{ item.title }}</strong>
              <p class="notif-msg">{{ item.message }}</p>
              <span class="notif-time">{{ item.time | date:'shortTime' }}</span>
            </div>
          </div>
        </div>

        <div class="popover-empty" *ngIf="notifications.length === 0">
          <span class="empty-bell">🔔</span>
          <p>No tienes notificaciones pendientes.</p>
        </div>

        <div class="popover-footer" *ngIf="notifications.length > 0">
          <button class="clear-btn" (click)="clearAll()">Limpiar Historial</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-wrap {
      position: relative;
      display: inline-block;
    }
    .bell-btn {
      position: relative;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .bell-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    .bell-icon {
      font-size: 1.1rem;
    }
    .unread-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: #ef4444;
      color: #fff;
      font-size: 0.68rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 10px;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
      animation: pulseBadge 1.5s infinite;
    }
    @keyframes pulseBadge {
      0% { transform: scale(1); }
      50% { transform: scale(1.15); }
      100% { transform: scale(1); }
    }
    .notif-popover {
      position: absolute;
      top: 50px;
      right: 0;
      width: 340px;
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 16px;
      box-shadow: 0 15px 40px rgba(0,0,0,0.5);
      z-index: 1000;
      overflow: hidden;
    }
    .popover-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(15, 23, 42, 0.8);
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-title h4 {
      margin: 0;
      font-size: 0.95rem;
      color: #f8fafc;
    }
    .badge-count {
      font-size: 0.7rem;
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.15);
      padding: 2px 6px;
      border-radius: 10px;
    }
    .mark-read-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 0.72rem;
      cursor: pointer;
    }
    .mark-read-btn:hover {
      color: #38bdf8;
    }
    .popover-body {
      max-height: 320px;
      overflow-y: auto;
    }
    .notif-item {
      display: flex;
      gap: 10px;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .notif-item:hover {
      background: rgba(255, 255, 255, 0.03);
    }
    .notif-item.unread {
      background: rgba(59, 130, 246, 0.08);
    }
    .notif-icon {
      font-size: 1.1rem;
    }
    .notif-content {
      flex: 1;
    }
    .notif-title {
      display: block;
      font-size: 0.82rem;
      color: #f1f5f9;
      margin-bottom: 2px;
    }
    .notif-msg {
      margin: 0 0 4px 0;
      font-size: 0.75rem;
      color: #94a3b8;
      line-height: 1.3;
    }
    .notif-time {
      font-size: 0.68rem;
      color: #64748b;
    }
    .popover-empty {
      padding: 2rem;
      text-align: center;
      color: #64748b;
    }
    .empty-bell {
      font-size: 1.8rem;
      display: block;
      margin-bottom: 0.5rem;
    }
    .popover-footer {
      padding: 0.5rem;
      text-align: center;
      background: rgba(0, 0, 0, 0.3);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .clear-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 0.72rem;
      cursor: pointer;
    }
  `]
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  isOpen = false;
  notifications: NotificationItem[] = [];
  private subs: Subscription[] = [];

  constructor(private signalrService: SignalrService) {}

  ngOnInit() {
    this.subs.push(
      this.signalrService.pedidoCreado$.subscribe(p => {
        this.addNotification({
          id: Guid(),
          title: 'Nuevo Pedido Creado',
          message: `Se registró el pedido #${p.referencia || p.codigo} (${p.ciudad})`,
          time: new Date(),
          read: false,
          type: 'create'
        });
      }),

      this.signalrService.pedidoActualizado$.subscribe(p => {
        this.addNotification({
          id: Guid(),
          title: 'Pedido Actualizado',
          message: `El pedido #${p.referencia || p.codigo} fue modificado por otro usuario en tiempo real.`,
          time: new Date(),
          read: false,
          type: 'update'
        });
      }),

      this.signalrService.pedidoEliminado$.subscribe(id => {
        this.addNotification({
          id: Guid(),
          title: 'Pedido Eliminado',
          message: `El pedido #${id} fue removido del sistema.`,
          time: new Date(),
          read: false,
          type: 'delete'
        });
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick() {
    this.isOpen = false;
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  addNotification(item: NotificationItem) {
    this.notifications.unshift(item);
    if (this.notifications.length > 20) {
      this.notifications.pop();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
  }

  clearAll() {
    this.notifications = [];
  }
}

function Guid(): string {
  return Math.random().toString(36).substring(2, 9);
}
