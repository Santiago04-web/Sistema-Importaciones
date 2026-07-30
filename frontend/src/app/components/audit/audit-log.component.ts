import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AuditEntry } from '../../services/admin.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="audit-page">
      
      <!-- PAGE HEADER -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Registro de Actividad</h2>
          <p class="page-subtitle">Historial completo de cambios en el sistema</p>
        </div>
        <div class="header-stats">
          <div class="stat-chip">
            <span class="stat-num">{{ total }}</span>
            <span class="stat-label">eventos totales</span>
          </div>
        </div>
      </div>
      
      <!-- TIMELINE -->
      <div class="timeline">
        
        <!-- Date group separator -->
        <ng-container *ngFor="let group of groupedLogs">
          <div class="date-separator">
            <span class="date-label">{{ group.dateLabel }}</span>
          </div>
          
          <div class="timeline-item" *ngFor="let log of group.entries">
            <div class="tl-icon" [class]="getActionClass(log.action)">
              <span [innerHTML]="getActionIcon(log.action)"></span>
            </div>
            <div class="tl-content">
              <div class="tl-header">
                <span class="tl-user">{{ log.userId }}</span>
                <span class="tl-action-badge" [class]="getActionClass(log.action)">
                  {{ getActionLabel(log.action) }}
                </span>
                <span class="tl-entity">{{ log.entityName }} #{{ log.entityId }}</span>
              </div>
              <div class="tl-changes" *ngIf="log.changes && log.changes !== '{}'">
                <div class="changes-toggle" (click)="log._expanded = !log._expanded">
                  {{ log._expanded ? '▾ Ocultar detalles' : '▸ Ver detalles' }}
                </div>
                <div class="changes-body" *ngIf="log._expanded">
                  <div class="change-row" *ngFor="let ch of parseChanges(log.changes)">
                    <span class="ch-field">{{ ch.field }}</span>
                    <ng-container *ngIf="ch.original !== undefined; else singleVal">
                      <span class="ch-old">{{ ch.original }}</span>
                      <span class="ch-arrow">→</span>
                      <span class="ch-new">{{ ch.current }}</span>
                    </ng-container>
                    <ng-template #singleVal>
                      <span class="ch-new">{{ ch.value }}</span>
                    </ng-template>
                  </div>
                </div>
              </div>
              <span class="tl-time">{{ formatTime(log.timestamp) }}</span>
            </div>
          </div>
        </ng-container>
        
        <!-- Load more -->
        <div class="load-more" *ngIf="logs.length < total">
          <button class="btn-load-more" (click)="loadMore()" [disabled]="loadingMore">
            {{ loadingMore ? 'Cargando...' : 'Cargar más' }}
          </button>
        </div>
        
        <div class="empty-state" *ngIf="logs.length === 0 && !loading">
          <p>No hay actividad registrada todavía.</p>
        </div>
        
        <div class="loading-state" *ngIf="loading">Cargando registro...</div>
      </div>
      
    </div>
  `,
  styles: [`
    .audit-page {
      max-width: 780px;
      margin: 0 auto;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #fafafa;
      margin: 0;
      letter-spacing: -0.01em;
    }
    
    .page-subtitle {
      font-size: 0.82rem;
      color: #71717a;
      margin: 0.2rem 0 0;
    }
    
    .header-stats {
      display: flex;
      gap: 0.75rem;
    }
    
    .stat-chip {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: #121215;
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 0.4rem 0.85rem;
      border-radius: 8px;
    }
    
    .stat-num {
      font-size: 1.05rem;
      font-weight: 800;
      color: #fafafa;
    }
    
    .stat-label {
      font-size: 0.72rem;
      color: #71717a;
      font-weight: 600;
    }
    
    /* ── Timeline ── */
    .timeline {
      position: relative;
      padding-left: 2.5rem;
    }
    
    .timeline::before {
      content: '';
      position: absolute;
      left: 14px;
      top: 0;
      bottom: 0;
      width: 1.5px;
      background: rgba(255, 255, 255, 0.06);
    }
    
    .date-separator {
      position: relative;
      margin: 1.5rem 0 0.85rem -2.5rem;
      padding-left: 2.5rem;
    }
    
    .date-separator:first-child {
      margin-top: 0;
    }
    
    .date-label {
      display: inline-block;
      background: #09090b;
      padding: 0.2rem 0.65rem;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 700;
      color: #a1a1aa;
      letter-spacing: 0.03em;
      position: relative;
      z-index: 1;
    }
    
    .timeline-item {
      position: relative;
      display: flex;
      gap: 0.85rem;
      margin-bottom: 0.15rem;
      padding: 0.75rem 0;
    }
    
    .tl-icon {
      position: absolute;
      left: -2.5rem;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      z-index: 1;
      flex-shrink: 0;
    }
    
    .tl-icon.action-added {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: #34d399;
    }
    
    .tl-icon.action-modified {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.2);
      color: #60a5fa;
    }
    
    .tl-icon.action-deleted {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #f87171;
    }
    
    .tl-content {
      flex: 1;
      background: #121215;
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 10px;
      padding: 0.75rem 1rem;
      transition: border-color 0.2s;
    }
    
    .tl-content:hover {
      border-color: rgba(255, 255, 255, 0.1);
    }
    
    .tl-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    .tl-user {
      font-weight: 700;
      color: #e4e4e7;
      font-size: 0.82rem;
    }
    
    .tl-action-badge {
      display: inline-block;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    
    .tl-action-badge.action-added {
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
    }
    
    .tl-action-badge.action-modified {
      background: rgba(59, 130, 246, 0.12);
      color: #60a5fa;
    }
    
    .tl-action-badge.action-deleted {
      background: rgba(239, 68, 68, 0.12);
      color: #f87171;
    }
    
    .tl-entity {
      font-size: 0.78rem;
      color: #71717a;
      font-weight: 500;
    }
    
    .tl-time {
      display: block;
      font-size: 0.7rem;
      color: #52525b;
      margin-top: 0.35rem;
    }
    
    /* ── Changes expansion ── */
    .tl-changes {
      margin-top: 0.5rem;
    }
    
    .changes-toggle {
      font-size: 0.72rem;
      color: #71717a;
      cursor: pointer;
      font-weight: 600;
      transition: color 0.15s;
    }
    
    .changes-toggle:hover {
      color: #a1a1aa;
    }
    
    .changes-body {
      margin-top: 0.45rem;
      padding: 0.6rem 0.75rem;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.04);
    }
    
    .change-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.72rem;
      margin-bottom: 0.3rem;
      flex-wrap: wrap;
    }
    
    .change-row:last-child {
      margin-bottom: 0;
    }
    
    .ch-field {
      font-weight: 700;
      color: #a1a1aa;
      min-width: 80px;
    }
    
    .ch-old {
      color: #f87171;
      text-decoration: line-through;
      opacity: 0.7;
    }
    
    .ch-arrow {
      color: #52525b;
    }
    
    .ch-new {
      color: #34d399;
      font-weight: 600;
    }
    
    /* ── Load More ── */
    .load-more {
      text-align: center;
      margin-top: 1.5rem;
      position: relative;
      z-index: 1;
    }
    
    .btn-load-more {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #a1a1aa;
      padding: 0.5rem 1.5rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }
    
    .btn-load-more:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.08);
      color: #fafafa;
    }
    
    .btn-load-more:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .empty-state, .loading-state {
      text-align: center;
      color: #52525b;
      font-size: 0.82rem;
      padding: 2.5rem 0;
      position: relative;
      z-index: 1;
    }
  `]
})
export class AuditLogComponent implements OnInit {
  logs: (AuditEntry & { _expanded?: boolean })[] = [];
  groupedLogs: { dateLabel: string; entries: (AuditEntry & { _expanded?: boolean })[] }[] = [];
  total = 0;
  loading = true;
  loadingMore = false;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.loading = true;
    this.adminService.getAuditLogs(50, 0).subscribe({
      next: (res) => {
        this.logs = res.logs;
        this.total = res.total;
        this.groupByDate();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadMore() {
    this.loadingMore = true;
    this.adminService.getAuditLogs(50, this.logs.length).subscribe({
      next: (res) => {
        this.logs = [...this.logs, ...res.logs];
        this.total = res.total;
        this.groupByDate();
        this.loadingMore = false;
      },
      error: () => { this.loadingMore = false; }
    });
  }

  groupByDate() {
    const map = new Map<string, (AuditEntry & { _expanded?: boolean })[]>();
    for (const log of this.logs) {
      const d = new Date(log.timestamp);
      const key = d.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(log);
    }
    this.groupedLogs = Array.from(map.entries()).map(([dateLabel, entries]) => ({ dateLabel, entries }));
  }

  getActionClass(action: string): string {
    if (action === 'Added') return 'action-added';
    if (action === 'Modified') return 'action-modified';
    if (action === 'Deleted') return 'action-deleted';
    return 'action-modified';
  }

  getActionLabel(action: string): string {
    if (action === 'Added') return 'Creó';
    if (action === 'Modified') return 'Editó';
    if (action === 'Deleted') return 'Eliminó';
    return action;
  }

  getActionIcon(action: string): string {
    if (action === 'Added') return '+';
    if (action === 'Modified') return '✎';
    if (action === 'Deleted') return '×';
    return '•';
  }

  formatTime(timestamp: string): string {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  parseChanges(changes: string): any[] {
    try {
      const obj = JSON.parse(changes);
      return Object.entries(obj).map(([field, val]: [string, any]) => {
        if (val && typeof val === 'object' && 'Original' in val) {
          return { field, original: val.Original, current: val.Current };
        }
        return { field, value: val };
      });
    } catch {
      return [];
    }
  }
}
