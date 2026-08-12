import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { PedidoService, Pedido } from '../../services/pedido.service';
import { AuthService } from '../../services/auth.service';
import { PdfService } from '../../services/pdf.service';
import { SignalrService } from '../../services/signalr.service';
import { CourierTrackingComponent } from '../courier-tracking/courier-tracking.component';
import { QrModalComponent } from '../qr-modal/qr-modal.component';

interface ColumnaEtapa {
  id: number;
  nombre: string;
  color: string;
  pedidos: Pedido[];
}

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, CourierTrackingComponent, QrModalComponent],
  template: `
    <div class="kanban-wrapper">
      
      <!-- TOP BAR METRICS -->
      <div class="kanban-top-bar mb-3">
        <div class="metrics-row">
          <div class="metric-box">
            <div class="metric-info">
              <span class="metric-label">ACTIVAS</span>
              <span class="metric-val">{{ countActivas() }}</span>
            </div>
          </div>
          <div class="metric-box">
            <div class="metric-info">
              <span class="metric-label">VALOR EN CURSO</span>
              <span class="metric-val">{{ calcValorEnCurso() | currency:'COP':'symbol':'1.0-0' }}</span>
            </div>
          </div>
          <div class="metric-box">
            <div class="metric-info">
              <span class="metric-label">TOTAL PEDIDOS</span>
              <span class="metric-val">{{ countTotal() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- SECONDARY TOOLBAR: SEARCH & COMPACT TOGGLE -->
      <div class="kanban-action-bar mb-3" *ngIf="showActionBar">
        <div class="search-input-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" [(ngModel)]="searchQuery" placeholder="🔍 Buscar por código, producto o ciudad..." class="kanban-search-input">
          <button *ngIf="searchQuery" (click)="searchQuery = ''" class="clear-search-btn">✕</button>
        </div>

        <div class="toolbar-right">
          <div class="view-mode-toggle">
            <button class="mode-btn" [class.active]="!isCompact" (click)="isCompact = false">📄 Vista Normal</button>
            <button class="mode-btn" [class.active]="isCompact" (click)="isCompact = true">⚡ Vista Compacta</button>
            <button class="mode-btn" [class.active]="ocultarVacias" (click)="ocultarVacias = !ocultarVacias">
              {{ ocultarVacias ? '🚫 Ocultar Vacías: ON' : '👁️ Mostrar Vacías' }}
            </button>
          </div>

          <div class="scroll-controls">
            <button class="scroll-arrow-btn" (click)="scrollBoard(-320)" title="Desplazar a la izquierda">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button class="scroll-arrow-btn" (click)="scrollBoard(320)" title="Desplazar a la derecha">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>

          <button class="hide-toolbar-btn" (click)="toggleActionBar(false)" title="Ocultar barra de herramientas">
            ▲ Ocultar
          </button>
        </div>
      </div>

      <!-- SHOW BAR TRIGGER WHEN HIDDEN -->
      <div class="show-bar-trigger" *ngIf="!showActionBar">
        <button class="show-bar-btn" (click)="toggleActionBar(true)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span>Mostrar Filtros / Búsqueda</span>
        </button>
      </div>
      
      <!-- KANBAN BOARD CONTAINER -->
      <div class="kanban-container" #boardContainer cdkDropListGroup (wheel)="onWheelScroll($event)">
        <div class="kanban-column" *ngFor="let col of getColumnasVisibles()">
          
          <!-- COLUMN HEADER -->
          <div class="column-header">
            <div class="header-title-group">
              <span class="status-dot" [style.background]="col.color"></span>
              <h3 class="column-title">{{ col.nombre }}</h3>
            </div>
            <span class="badge">{{ getFilteredList(col.pedidos).length }}</span>
          </div>
          
          <!-- COLUMN LIST -->
          <div class="kanban-list"
               cdkDropList
               [cdkDropListData]="col.pedidos"
               (cdkDropListDropped)="drop($event, col.id)">
               
            <div class="empty-text" *ngIf="getFilteredList(col.pedidos).length === 0">
              {{ searchQuery ? 'Sin coincidencias' : 'Sin pedidos' }}
            </div>
               
            <div class="kanban-card" 
                 [class.compact-card]="isCompact"
                 *ngFor="let pedido of getFilteredList(col.pedidos)" 
                 (click)="openDetail(pedido)"
                 cdkDrag>
              
              <!-- NORMAL VIEW -->
              <ng-container *ngIf="!isCompact">
                <div class="card-header-row">
                  <div class="code-ref-group">
                    <span class="ref-pill" *ngIf="pedido.referencia">{{ pedido.referencia }}</span>
                    <span class="codigo" *ngIf="!pedido.referencia">{{ pedido.codigo || 'S/N' }}</span>
                  </div>
                  <span class="fecha">{{ pedido.fechaNegociacion | date:'dd MMM' }}</span>
                </div>
                
                <div class="card-body-row">
                  <div class="pedido-desc" *ngIf="pedido.descripcion">
                    {{ truncateDesc(pedido.descripcion) }}
                  </div>
                </div>

                <div class="card-footer-row">
                  <div class="tags-group">
                    <span class="city-tag">
                      <span class="dot" [style.background]="col.color"></span>
                      {{ pedido.ciudad || 'N/A' }}
                    </span>
                    <span class="qty-tag">Qty {{ pedido.totalQty || 0 }}</span>
                  </div>
                  <span class="total-amount">{{ (pedido.total || 0) | currency:'COP':'symbol':'1.0-0' }}</span>
                </div>
              </ng-container>

              <!-- COMPACT VIEW -->
              <ng-container *ngIf="isCompact">
                <div class="compact-row">
                  <span class="ref-pill-sm" *ngIf="pedido.referencia">{{ pedido.referencia }}</span>
                  <span class="codigo-sm" *ngIf="!pedido.referencia">{{ pedido.codigo || 'S/N' }}</span>
                  <span class="desc-sm">{{ truncateDesc(pedido.descripcion || pedido.ciudad || '') }}</span>
                  <span class="total-sm">{{ (pedido.total || 0) | currency:'COP':'symbol':'1.0-0' }}</span>
                </div>
              </ng-container>

            </div>
          </div>

        </div>
      </div>

      <!-- DETALLE RÁPIDO MODAL -->
      <div class="detail-modal-overlay" *ngIf="selectedPedido" (click)="selectedPedido = null">
        <div class="detail-modal-card" (click)="$event.stopPropagation()">
          
          <div class="modal-head">
            <div class="modal-title-group">
              <span class="modal-badge-code">{{ selectedPedido.referencia || selectedPedido.codigo || 'S/N' }}</span>
              <h2>{{ formatTitleCase(selectedPedido.descripcion) || 'Sin descripción' }}</h2>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <button class="ws-modal-btn" (click)="compartirWhatsApp(selectedPedido)" title="Enviar resumen por WhatsApp">
                📲 WhatsApp
              </button>
              <button class="pdf-modal-btn" (click)="descargarPdf(selectedPedido)" title="Descargar PDF de esta importación">
                📄 PDF
              </button>
              <button class="modal-close-btn" (click)="selectedPedido = null">✕</button>
            </div>
          </div>

          <div class="modal-body-grid">
            <div class="modal-photo-box" *ngIf="selectedPedido.fotoUrl && !hasPhotoError">
              <img [src]="formatPhotoUrl(selectedPedido.fotoUrl)" (error)="hasPhotoError = true" alt="Foto del pedido">
            </div>

            <!-- DETAILS GRID -->
            <div class="details-info-grid">
              <div class="info-item">
                <span class="info-lbl">Referencia</span>
                <span class="info-val highlight">{{ selectedPedido.referencia || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-lbl">Ciudad Origen</span>
                <span class="info-val">{{ selectedPedido.ciudad || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-lbl">Fecha Negociación</span>
                <span class="info-val">{{ selectedPedido.fechaNegociacion | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="info-item">
                <span class="info-lbl">Cantidad (Qty)</span>
                <span class="info-val">{{ selectedPedido.totalQty | number }} unidades</span>
              </div>
              <div class="info-item">
                <span class="info-lbl">Precio Yuanes</span>
                <span class="info-val">¥ {{ selectedPedido.yuanes | number:'1.2-4' }}</span>
              </div>
              <div class="info-item">
                <span class="info-lbl">Tasa de Cambio</span>
                <span class="info-val">$ {{ selectedPedido.tasa | number:'1.0-2' }}</span>
              </div>
              <div class="info-item">
                <span class="info-lbl">Cúbica (m³)</span>
                <span class="info-val">{{ selectedPedido.cubica | number:'1.3-3' }} m³</span>
              </div>
              <div class="info-item">
                <span class="info-lbl">Precio por m³</span>
                <span class="info-val">$ {{ selectedPedido.precioMt3 | number:'1.0-0' }}</span>
              </div>
            </div>

            <!-- FINANCIAL SUMMARY -->
            <div class="financial-summary-card">
              <div class="fin-row">
                <span>Producto ($)</span>
                <strong>{{ (selectedPedido.producto || 0) | currency:'COP':'symbol':'1.0-0' }}</strong>
              </div>
              <div class="fin-row">
                <span>Flete / Logística ($)</span>
                <strong>{{ (selectedPedido.flete || 0) | currency:'COP':'symbol':'1.0-0' }}</strong>
              </div>
              <div class="fin-row total-fin">
                <span>TOTAL PEDIDO</span>
                <strong>{{ (selectedPedido.total || 0) | currency:'COP':'symbol':'1.0-0' }}</strong>
              </div>
            </div>

            <!-- REGISTRO Y HISTORIAL DE PAGOS PARCIALES -->
            <div class="pagos-parciales-box">
              <div class="pagos-head">
                <span class="pagos-title">💰 Historial de Pagos / Abonos Parciales</span>
                <span class="pagos-total-tag">Total Abonado: $ {{ ((selectedPedido.totalPagosParciales || 0) + (selectedPedido.pagoInicial || 0)) | number:'1.0-0' }} COP</span>
              </div>

              <div class="pagos-list" *ngIf="selectedPedido.pagosParciales && selectedPedido.pagosParciales.length > 0">
                <div class="pago-item" *ngFor="let p of selectedPedido.pagosParciales">
                  <div class="pago-info">
                    <strong>$ {{ p.monto | number:'1.0-0' }} COP</strong>
                    <span class="pago-note" *ngIf="p.nota">{{ p.nota }}</span>
                    <span class="pago-date">{{ p.fechaPago | date:'short' }}</span>
                  </div>
                  <button class="del-pago-btn" (click)="eliminarPagoParcial(p.id!)" *ngIf="authService.canEdit()" title="Eliminar este abono">✕</button>
                </div>
              </div>

              <div class="add-pago-form" *ngIf="authService.canEdit()">
                <input type="number" [(ngModel)]="nuevoPagoMonto" placeholder="Monto $ COP" class="pago-input-num">
                <input type="text" [(ngModel)]="nuevoPagoNota" placeholder="Nota / Ref (Ej: Transferencia Bancolombia)" class="pago-input-txt">
                <button class="add-pago-btn" (click)="agregarPagoParcial()">+ Registrar Abono</button>
              </div>
            </div>

            <div class="observaciones-box" *ngIf="selectedPedido.observaciones">
              <span class="info-lbl">Observaciones</span>
              <p>{{ selectedPedido.observaciones }}</p>
            </div>
          </div>

    </div>
  `,
  styles: [`
    .kanban-wrapper {
      display: flex;
      flex-direction: column;
      flex: 1;
      height: calc(100vh - 140px);
      width: 100%;
    }
    
    .kanban-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .metrics-row {
      display: flex;
      gap: 1rem;
      flex: 1;
      min-width: 280px;
    }
    
    .metric-box {
      flex: 1;
      padding: 0.85rem 1.15rem;
      background: #121215;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      min-width: 120px;
    }
    
    .metric-info {
      display: flex;
      flex-direction: column;
    }
    
    .metric-label {
      color: #71717a;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      margin-bottom: 0.2rem;
    }
    
    .metric-val {
      font-size: 1.25rem;
      font-weight: 700;
      color: #fafafa;
      line-height: 1.1;
    }

    /* Scroll Controls */
    .scroll-controls {
      display: flex;
      gap: 0.4rem;
      align-self: center;
    }
    
    .scroll-arrow-btn {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: #121215;
      border: 1px solid rgba(255, 255, 255, 0.06);
      color: #a1a1aa;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    
    .scroll-arrow-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.15);
      color: #fafafa;
    }
    
    /* Board Layout - Adaptive fluid columns fitting widescreen cleanly */
    .kanban-container {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      flex: 1;
      align-items: stretch;
      width: 100%;
    }

    .kanban-column {
      flex: 0 0 320px;
      min-width: 300px;
      max-width: 360px;
      display: flex;
      flex-direction: column;
      background: #0e0e11;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      height: 100%;
      overflow: hidden;
    }
    
    .column-header {
      position: sticky;
      top: 0;
      z-index: 5;
      padding: 0.9rem 1.1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #121216;
    }

    .header-title-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .column-title {
      font-weight: 700;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      margin: 0;
      color: #d4d4d8;
    }
    
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    
    .badge {
      background: rgba(255, 255, 255, 0.05);
      color: #a1a1aa;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
    }
    
    .kanban-list {
      padding: 0.75rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      flex: 1;
    }
    
    /* Scrollbar inside list */
    .kanban-list::-webkit-scrollbar {
      width: 4px;
    }
    .kanban-list::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
    }
    .kanban-list::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .empty-text {
      text-align: center;
      color: #3f3f46;
      font-size: 0.75rem;
      margin: 2rem 0;
      font-style: italic;
    }
    
    /* Clean Minimalist Card Design */
    .kanban-card {
      background: #16161a;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 0.85rem 1rem;
      cursor: grab;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .kanban-card:hover {
      background: #1c1c22;
      border-color: rgba(255, 255, 255, 0.14);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    
    .kanban-card:active {
      cursor: grabbing;
    }
    
    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .codigo {
      font-weight: 700;
      color: #fafafa;
      font-size: 0.88rem;
      letter-spacing: 0.01em;
    }
    
    .fecha {
      font-size: 0.7rem;
      color: #52525b;
      font-weight: 500;
    }
    
    .pedido-desc {
      font-size: 0.75rem;
      color: #a1a1aa;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-top: 0.1rem;
    }
    
    .card-footer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.35rem;
      padding-top: 0.45rem;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
    }

    .tags-group {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .city-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: rgba(255, 255, 255, 0.04);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.68rem;
      font-weight: 600;
      color: #a1a1aa;
    }
    
    .city-tag .dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
    }
    
    .qty-tag {
      font-size: 0.68rem;
      color: #52525b;
      font-weight: 600;
    }
    
    .total-amount {
      font-weight: 700;
      color: #fafafa;
      font-size: 0.92rem;
      font-variant-numeric: tabular-nums;
    }
    
    /* CDK Drag & Drop Drag States */
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 10px;
      background: #1c1c22 !important;
      border: 1px solid rgba(59, 130, 246, 0.4) !important;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
      opacity: 0.96;
      pointer-events: none;
      transform: scale(1.03) rotate(1.5deg);
      cursor: grabbing !important;
    }
    
    .cdk-drag-placeholder {
      background: rgba(255, 255, 255, 0.02) !important;
      border: 1.5px dashed rgba(255, 255, 255, 0.1) !important;
      border-radius: 10px;
      min-height: 80px;
      margin-bottom: 0.65rem;
    }
    
    /* Action Bar (Search & Mode Toggle) */
    .kanban-action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 0.6rem 1rem;
    }
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .search-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
      flex: 1;
      max-width: 450px;
    }
    .search-input-wrap svg {
      position: absolute;
      left: 0.85rem;
      pointer-events: none;
    }
    .kanban-search-input {
      background: #121215;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 0.5rem 2.2rem 0.5rem 2.4rem;
      color: #fafafa;
      font-size: 0.83rem;
      width: 100%;
      transition: all 0.2s;
    }
    .kanban-search-input:focus {
      outline: none;
      border-color: #3b82f6;
      background: #18181c;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }
    .clear-search-btn {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      color: #71717a;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .view-mode-toggle {
      display: flex;
      background: #121215;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 3px;
    }
    .mode-btn {
      background: none;
      border: none;
      color: #a1a1aa;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .mode-btn:hover {
      color: #fafafa;
      background: rgba(255, 255, 255, 0.05);
    }
    .mode-btn.active {
      background: #3b82f6 !important;
      color: #ffffff !important;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
    }
    .mode-btn.active:hover {
      background: #2563eb !important;
    }
    .mode-btn:active, 
    .hide-toolbar-btn:active, 
    .scroll-arrow-btn:active, 
    .show-bar-btn:active {
      transform: scale(0.95);
    }
    .hide-toolbar-btn {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      color: #71717a;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.35rem 0.65rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .hide-toolbar-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fafafa;
    }
    .show-bar-trigger {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1.5rem;
      margin-top: 0.5rem;
      flex-shrink: 0;
    }
    .show-bar-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: #121215;
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 8px;
      color: #38bdf8;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.35rem 0.8rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .show-bar-btn:hover {
      background: rgba(59, 130, 246, 0.15);
      border-color: #3b82f6;
    }

    /* Compact Card Mode */
    .kanban-card.compact-card {
      padding: 0.5rem 0.75rem;
      gap: 0;
    }
    .compact-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      width: 100%;
    }
    .codigo-sm {
      font-size: 0.78rem;
      font-weight: 700;
      color: #38bdf8;
      flex-shrink: 0;
    }
    .code-ref-group {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }
    .ref-pill {
      font-size: 0.72rem;
      font-weight: 800;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
      letter-spacing: 0.02em;
    }
    .ref-pill-sm {
      font-size: 0.7rem;
      font-weight: 800;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.15);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      flex-shrink: 0;
    }
    .card-body-row {
      display: flex;
      gap: 0.6rem;
      align-items: center;
    }
    .thumb-mini {
      width: 34px;
      height: 34px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .thumb-mini img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Quick Detail Modal */
    .detail-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: fadeIn 0.2s ease;
    }
    .detail-modal-card {
      background: #121215;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      width: 100%;
      max-width: 580px;
      padding: 1.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .modal-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding-bottom: 0.85rem;
    }
    .modal-title-group h2 {
      margin: 0.3rem 0 0 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #fafafa;
    }
    .modal-badge-code {
      display: inline-block;
      font-size: 0.78rem;
      font-weight: 800;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      letter-spacing: 0.03em;
    }
    .modal-close-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #94a3b8;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      margin-left: 0.5rem;
      flex-shrink: 0;
    }
    .modal-close-btn:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.4);
      color: #ef4444;
      transform: rotate(90deg) scale(1.05);
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.3);
    }
    .pdf-modal-btn {
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #60a5fa;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .pdf-modal-btn:hover {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #fff;
    }
    .modal-body-grid {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .modal-photo-box img {
      width: 100%;
      max-height: 180px;
      object-fit: cover;
      border-radius: 8px;
    }
    .details-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.85rem 1rem;
    }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .info-lbl {
      font-size: 0.7rem;
      font-weight: 700;
      color: #71717a;
      text-transform: uppercase;
    }
    .info-val {
      font-size: 0.88rem;
      color: #e4e4e7;
      font-weight: 600;
    }
    .info-val.highlight { color: #38bdf8; }
    .financial-summary-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .fin-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.82rem;
      color: #a1a1aa;
    }
    .fin-row.total-fin {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 0.4rem;
      margin-top: 0.2rem;
      font-weight: 700;
      color: #fafafa;
      font-size: 0.95rem;
    }
    .observaciones-box p {
      margin: 0.2rem 0 0 0;
      font-size: 0.82rem;
      color: #a1a1aa;
    }
    .total-sm {
      font-size: 0.78rem;
      font-weight: 700;
      color: #fafafa;
      flex-shrink: 0;
    }

    .ws-modal-btn {
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.35);
      color: #4ade80;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .ws-modal-btn:hover {
      background: rgba(34, 197, 94, 0.3);
      color: #fff;
    }
    .pagos-parciales-box {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .pagos-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pagos-title {
      font-size: 0.78rem;
      font-weight: 700;
      color: #fbbf24;
    }
    .pagos-total-tag {
      font-size: 0.72rem;
      font-weight: 700;
      color: #34d399;
    }
    .pagos-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      max-height: 120px;
      overflow-y: auto;
    }
    .pago-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0, 0, 0, 0.3);
      padding: 0.35rem 0.6rem;
      border-radius: 6px;
      font-size: 0.78rem;
    }
    .pago-info {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .pago-info strong { color: #10b981; }
    .pago-note { color: #94a3b8; font-size: 0.72rem; }
    .pago-date { color: #64748b; font-size: 0.68rem; }
    .del-pago-btn {
      background: none;
      border: none;
      color: #ef4444;
      cursor: pointer;
      font-size: 0.75rem;
    }
    .add-pago-form {
      display: flex;
      gap: 6px;
      margin-top: 4px;
    }
    .pago-input-num {
      width: 110px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 4px 8px;
      color: #fff;
      font-size: 0.78rem;
    }
    .pago-input-txt {
      flex: 1;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 4px 8px;
      color: #fff;
      font-size: 0.78rem;
    }
    .add-pago-btn {
      background: rgba(245, 158, 11, 0.2);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fbbf24;
      font-weight: 700;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 0.75rem;
      cursor: pointer;
    }
  `]
})
export class KanbanComponent implements OnInit {
  @ViewChild('boardContainer') boardContainer!: ElementRef;

  searchQuery = '';
  isCompact = false;
  showActionBar = false;
  selectedPedido: Pedido | null = null;
  hasPhotoError = false;
  nuevoPagoMonto: number = 0;
  nuevoPagoNota: string = '';

  compartirWhatsApp(pedido: Pedido) {
    this.pedidoService.compartirWhatsApp(pedido);
  }

  formatPhotoUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const base = isLocal ? 'http://localhost:5174' : 'https://sistema-importaciones.onrender.com';
    return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
  }


  agregarPagoParcial() {
    if (!this.selectedPedido || !this.selectedPedido.id || this.nuevoPagoMonto <= 0) return;
    this.pedidoService.addPagoParcial(this.selectedPedido.id, {
      monto: this.nuevoPagoMonto,
      nota: this.nuevoPagoNota
    }).subscribe({
      next: (res) => {
        if (this.selectedPedido) {
          if (!this.selectedPedido.pagosParciales) this.selectedPedido.pagosParciales = [];
          this.selectedPedido.pagosParciales.push(res);
          const totalPagos = this.selectedPedido.pagosParciales.reduce((a, b) => a + b.monto, 0);
          this.selectedPedido.totalPagosParciales = totalPagos;
          this.selectedPedido.saldo = Math.max(0, (this.selectedPedido.total || 0) - (this.selectedPedido.pagoInicial || 0) - totalPagos);
        }
        this.nuevoPagoMonto = 0;
        this.nuevoPagoNota = '';
        this.cargarPedidos();
      }
    });
  }

  eliminarPagoParcial(pagoId: number) {
    if (!this.selectedPedido || !this.selectedPedido.id) return;
    this.pedidoService.deletePagoParcial(this.selectedPedido.id, pagoId).subscribe({
      next: () => {
        if (this.selectedPedido && this.selectedPedido.pagosParciales) {
          this.selectedPedido.pagosParciales = this.selectedPedido.pagosParciales.filter(p => p.id !== pagoId);
          const totalPagos = this.selectedPedido.pagosParciales.reduce((a, b) => a + b.monto, 0);
          this.selectedPedido.totalPagosParciales = totalPagos;
          this.selectedPedido.saldo = Math.max(0, (this.selectedPedido.total || 0) - (this.selectedPedido.pagoInicial || 0) - totalPagos);
        }
        this.cargarPedidos();
      }
    });
  }

  openDetail(pedido: Pedido) {
    this.selectedPedido = pedido;
    this.hasPhotoError = false;
  }

  @HostListener('window:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    this.selectedPedido = null;
  }

  columnas: ColumnaEtapa[] = [
    { id: 0, nombre: 'COTIZACIÓN', color: '#71717a', pedidos: [] },
    { id: 1, nombre: 'PEDIDO CONFIRMADO', color: '#14b8a6', pedidos: [] },
    { id: 2, nombre: 'PAGADO', color: '#f59e0b', pedidos: [] },
    { id: 3, nombre: 'EN TRÁNSITO', color: '#3b82f6', pedidos: [] },
    { id: 4, nombre: 'ADUANA', color: '#ec4899', pedidos: [] },
    { id: 5, nombre: 'RECIBIDO', color: '#10b981', pedidos: [] }
  ];

  ocultarVacias = false;

  getColumnasVisibles(): ColumnaEtapa[] {
    if (this.ocultarVacias) {
      const activeCols = this.columnas.filter(col => this.getFilteredList(col.pedidos).length > 0);
      return activeCols.length > 0 ? activeCols : this.columnas;
    }
    return this.columnas;
  }

  constructor(
    private pedidoService: PedidoService, 
    public authService: AuthService, 
    private pdfService: PdfService,
    private signalrService: SignalrService
  ) {}

  ngOnInit() {
    const saved = localStorage.getItem('kanban_showActionBar');
    this.showActionBar = saved === 'true';

    this.cargarPedidos();
    this.signalrService.pedidoCreado$.subscribe(() => this.cargarPedidos());
    this.signalrService.pedidoActualizado$.subscribe(() => this.cargarPedidos());
    this.signalrService.pedidoEliminado$.subscribe(() => this.cargarPedidos());
  }

  toggleActionBar(val: boolean) {
    this.showActionBar = val;
    localStorage.setItem('kanban_showActionBar', String(val));
  }

  descargarPdf(pedido: Pedido, event?: Event) {
    if (event) event.stopPropagation();
    this.pdfService.exportSinglePedidoPdf(pedido);
  }

  scrollBoard(offset: number) {
    if (this.boardContainer) {
      this.boardContainer.nativeElement.scrollBy({
        left: offset,
        behavior: 'smooth'
      });
    }
  }

  onWheelScroll(event: WheelEvent) {
    const target = event.target as HTMLElement;
    if (!target) return;

    const kanbanList = target.closest('.kanban-list');
    if (kanbanList && kanbanList.scrollHeight > kanbanList.clientHeight) {
      return;
    }

    if (event.deltaY !== 0) {
      event.preventDefault();
      this.boardContainer.nativeElement.scrollLeft += event.deltaY * 1.2;
    }
  }

  cargarPedidos() {
    this.pedidoService.getPedidos().subscribe({
      next: (pedidos) => {
        this.columnas.forEach(c => c.pedidos = []);
        pedidos.forEach(p => {
          const col = this.columnas.find(c => c.id === p.etapa);
          if (col) col.pedidos.push(p);
        });
      },
      error: (err) => {
        console.error('Error fetching pedidos', err);
      }
    });
  }

  drop(event: CdkDragDrop<Pedido[]>, newEtapaId: number) {
    if (!this.authService.canEdit()) return;
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      
      const movedItem = event.container.data[event.currentIndex];
      if(movedItem.id) {
        movedItem.etapa = newEtapaId;
        this.pedidoService.updatePedido(movedItem.id, movedItem).subscribe();
      }
    }
  }

  formatTitleCase(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
      .join(' ');
  }

  truncateDesc(desc: string): string {
    if (!desc) return '';
    const formatted = this.formatTitleCase(desc);
    return formatted.length > 50 ? formatted.substring(0, 50) + '...' : formatted;
  }

  countActivas() {
    return this.columnas.filter(c => c.id < 5).reduce((acc, c) => acc + c.pedidos.length, 0);
  }

  calcValorEnCurso() {
    return this.columnas.filter(c => c.id < 5).reduce((acc, c) => {
      return acc + c.pedidos.reduce((sum, p) => sum + (p.total || 0), 0);
    }, 0);
  }

  countTotal() {
    return this.columnas.reduce((acc, c) => acc + c.pedidos.length, 0);
  }

  getFilteredList(list: Pedido[]): Pedido[] {
    if (!this.searchQuery.trim()) return list;
    const q = this.searchQuery.toLowerCase().trim();
    return list.filter(p =>
      (p.codigo || '').toLowerCase().includes(q) ||
      (p.descripcion || '').toLowerCase().includes(q) ||
      (p.ciudad || '').toLowerCase().includes(q)
    );
  }
}
