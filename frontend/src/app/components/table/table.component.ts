import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService, Pedido, calculateFinancials } from '../../services/pedido.service';
import { AuthService } from '../../services/auth.service';
import { PdfService } from '../../services/pdf.service';
import { SignalrService } from '../../services/signalr.service';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_ROOT = isLocal ? 'http://localhost:5174/api' : 'https://sistema-importaciones.onrender.com/api';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="table-container panel" [@fadeIn]>
      
      <!-- HEADER -->
      <div class="table-header-actions">
        <div>
          <h3>Lista de Importaciones</h3>
          <p class="header-sub">Gestión y control detallado de manifiestos y órdenes de importación.</p>
        </div>
        <div class="header-buttons">
          <button class="btn-ghost" (click)="exportarExcel()" title="Exportar tabla actual a Excel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar Excel
          </button>
          <button *ngIf="canEdit()" class="btn btn-primary" (click)="agregarFilaRapida()">
            + Nueva Fila
          </button>
        </div>
      </div>

      <!-- METRICS GRID -->
      <div class="metrics-grid" *ngIf="!loading">
        <div class="metric-card">
          <div class="metric-icon" style="background: rgba(59, 130, 246, 0.08); color: #3b82f6;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <div class="metric-info">
            <span class="metric-label">Cúbica Total</span>
            <h4 class="metric-value">{{ totalCubicaSum | number:'1.3-4' }} m³</h4>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon" style="background: rgba(16, 185, 129, 0.08); color: #10b981;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="metric-info">
            <span class="metric-label">Inversión Estimada</span>
            <h4 class="metric-value">{{ totalInversionCop | currency:'COP':'symbol-narrow':'1.0-0' }}</h4>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon" style="background: rgba(168, 85, 247, 0.08); color: #a855f7;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="metric-info">
            <span class="metric-label">Total Pedidos</span>
            <h4 class="metric-value">{{ totalImportacionesCount }} items</h4>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon" style="background: rgba(249, 115, 22, 0.08); color: #f97316;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div class="metric-info">
            <span class="metric-label">Tránsito / Aduana</span>
            <h4 class="metric-value">{{ pedidosCriticosCount }} alertas</h4>
          </div>
        </div>
      </div>

      <!-- FILTERS BAR -->
      <div class="table-filters-bar" *ngIf="!loading">
        <!-- Search bar -->
        <div class="search-wrapper">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" class="filter-control search-input" 
                 [(ngModel)]="filtros.busqueda" 
                 (ngModelChange)="aplicarFiltros()"
                 placeholder="Buscar por pedido, producto, referencia, ciudad, fecha (AAAA-MM-DD)...">
        </div>
        
        <!-- City Filter -->
        <div class="filter-group">
          <span class="filter-label">Ciudad:</span>
          <select class="filter-control select-filter" 
                  [(ngModel)]="filtros.ciudad" 
                  (change)="aplicarFiltros()">
            <option value="">Todas</option>
            <option value="GZ">Guangzhou (GZ)</option>
            <option value="YIWU">Yiwu (YIWU)</option>
          </select>
        </div>

        <!-- Stage Filter -->
        <div class="filter-group">
          <span class="filter-label">Etapa:</span>
          <select class="filter-control select-filter" 
                  [(ngModel)]="filtros.etapa" 
                  (change)="aplicarFiltros()">
            <option [ngValue]="null">Todas</option>
            <option [value]="0">Cotización</option>
            <option [value]="1">Confirmado</option>
            <option [value]="2">Pagado</option>
            <option [value]="3">En Tránsito</option>
            <option [value]="4">Aduana</option>
            <option [value]="5">Recibido</option>
          </select>
        </div>

        <!-- Monto Mínimo Filter -->
        <div class="filter-group">
          <span class="filter-label">Monto Mín:</span>
          <input type="number" class="filter-control num-filter" 
                 [(ngModel)]="filtros.montoMin" 
                 (ngModelChange)="aplicarFiltros()"
                 placeholder="COP">
        </div>

        <!-- Clear filters button -->
        <button class="btn-clear" 
                (click)="resetFiltros()" 
                *ngIf="filtros.busqueda || filtros.ciudad || filtros.etapa !== null || filtros.montoMin !== null">
          Limpiar Filtros
        </button>

        <!-- VISUAL VIEW MODE SWITCHES -->
        <div class="view-mode-toolbar">
          <button class="view-pill-btn" [class.active]="mostrarFotos" (click)="toggleMostrarFotos()" title="Mostrar u ocultar la columna de fotos">
            {{ mostrarFotos ? '🖼️ Fotos Visibles' : '📄 Modo Excel Limpio' }}
          </button>

          <button class="view-pill-btn" [class.active]="mostrarObservaciones" (click)="toggleMostrarObservaciones()" title="Mostrar u ocultar notas u observaciones de los productos">
            {{ mostrarObservaciones ? '📝 Obs. Visibles' : '📝 Obs. Ocultas' }}
          </button>

          <button class="view-pill-btn" [class.active]="agruparPorProducto" (click)="toggleAgruparPorProducto()" title="Agrupar productos repetidos en 1 sola tarjeta desplegable">
            {{ agruparPorProducto ? '📑 Agrupado por Producto' : '📋 Filas Individuales' }}
          </button>

          <button class="view-pill-btn catalog-btn" (click)="abrirGaleriaModal()" title="Abrir catálogo visual en cuadrícula">
            ✨ Catálogo Galería
          </button>
        </div>
      </div>

      <!-- BULK ACTION TOOLBAR -->
      <div class="bulk-toolbar" *ngIf="selectedIds.size > 0">
        <div class="bulk-info">
          <span class="bulk-count">{{ selectedIds.size }}</span> seleccionados
        </div>
        <div class="bulk-actions">
          <button class="btn-ghost" (click)="exportarSeleccionPdf()" title="Descargar PDF de seleccionados">
            📄 Reporte PDF
          </button>
          <button class="btn-ghost" *ngIf="canEdit()" (click)="batchUpdateTasa()">
            ⚡ Cambiar Tasa
          </button>
          <label class="btn-ghost" *ngIf="canEdit()" title="Subir 1 foto y aplicarla a todos los seleccionados" style="cursor: pointer; display: inline-flex; align-items: center; margin: 0;">
            📸 Foto Masiva
            <input type="file" (change)="batchUploadPhoto($event)" accept="image/*" style="display: none;">
          </label>
          <button class="btn-ghost" *ngIf="canEdit()" (click)="batchUpdateCodigo()">
            🏷️ Reasignar Lote / Pedido #
          </button>
          <select class="bulk-select" *ngIf="canEdit()" (change)="batchUpdateEtapa(+$any($event.target).value)">
            <option value="" disabled selected>📦 Cambiar Etapa...</option>
            <option [value]="0">Cotización</option>
            <option [value]="1">Confirmado</option>
            <option [value]="2">Pagado</option>
            <option [value]="3">En Tránsito</option>
            <option [value]="4">Aduana</option>
            <option [value]="5">Recibido</option>
          </select>
          <button class="btn-ghost" (click)="clearSelection()">Cancelar</button>
          <button class="btn-ghost btn-danger-ghost" *ngIf="canEdit()" (click)="eliminarSeleccionados()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Eliminar
          </button>
        </div>
      </div>

      <!-- LOADING SKELETON -->
      <div class="skeleton-container" *ngIf="loading">
        <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5,6]" [style.animation-delay]="(i * 0.08) + 's'">
          <div class="skeleton-cell sk-sm"></div>
          <div class="skeleton-cell sk-sm"></div>
          <div class="skeleton-cell sk-md"></div>
          <div class="skeleton-cell sk-lg"></div>
          <div class="skeleton-cell sk-md"></div>
          <div class="skeleton-cell sk-sm"></div>
          <div class="skeleton-cell sk-sm"></div>
        </div>
      </div>
      
      <!-- TABLE (MODO REGULAR FILAS INDIVIDUALES) -->
      <div class="table-responsive" *ngIf="!loading && !agruparPorProducto">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">
                <input type="checkbox" class="row-checkbox" [checked]="allSelected" (change)="toggleSelectAll()">
              </th>
              <th style="width: 100px;">Pedido</th>
              <th style="width: 120px;">Referencia</th>
              <th style="width: 80px; text-align: center;" *ngIf="mostrarFotos">Foto</th>
              <th style="width: 100px;">Ciudad</th>
              <th style="width: 120px;">Fecha</th>
              <th style="min-width: 220px;">Producto</th>
              <th style="width: 80px;">Qty</th>
              <th style="width: 90px;">Yuanes</th>
              <th style="width: 90px;">Tasa</th>
              <th style="width: 80px;">Cúbica</th>
              <th style="width: 100px;">Precio m³</th>
              <th style="width: 80px;">% EHUK</th>
              <th style="width: 130px;">Etapa</th>
              <th style="width: 140px; text-align: right;">Total ($)</th>
              <th style="width: 40px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let pedido of pedidosFiltrados; let i = index" 
                class="order-row" 
                [class.selected-row]="selectedIds.has(pedido.id!)"
                [style.animation-delay]="(i * 0.03) + 's'">

              <!-- CHECKBOX -->
              <td style="text-align: center;">
                <input type="checkbox" class="row-checkbox" [checked]="selectedIds.has(pedido.id!)" (change)="toggleSelect(pedido.id!)">
              </td>

              <!-- PEDIDO CODE -->
              <td>
                <input type="text" class="inline-edit-input fw-bold" 
                       [(ngModel)]="pedido.codigo" 
                       (ngModelChange)="onCellChange(pedido)"
                       (change)="actualizarPedido(pedido)"
                       placeholder="S/N">
              </td>

              <!-- REFERENCIA -->
              <td>
                <input type="text" class="inline-edit-input" 
                       [(ngModel)]="pedido.referencia" 
                       (ngModelChange)="onCellChange(pedido)"
                       (change)="actualizarPedido(pedido)"
                       placeholder="co-1">
              </td>

              <!-- PHOTO -->
              <td *ngIf="mostrarFotos">
                <div class="photo-cell">
                  <ng-container *ngIf="getEffectivePhotoUrl(pedido) as effectivePhoto; else categoryTpl">
                    <div class="thumb-container" [class.inherited-thumb]="!pedido.fotoUrl">
                      <img [src]="formatPhotoUrl(effectivePhoto)" class="table-thumb" (click)="openPreview(formatPhotoUrl(effectivePhoto))">
                      
                      <!-- Large hover popover preview -->
                      <div class="hover-preview-popover">
                        <img [src]="formatPhotoUrl(effectivePhoto)" alt="Vista Previa">
                      </div>
                      
                      <!-- Tiny blue edit badge in the corner -->
                      <label class="edit-photo-badge" [title]="pedido.fotoUrl ? 'Cambiar foto' : 'Subir foto propia para este pedido'">
                        📷
                        <input type="file" style="display: none" (change)="uploadPhoto($event, pedido.id)" accept="image/*">
                      </label>
                    </div>
                  </ng-container>
                  <ng-template #categoryTpl>
                    <label class="category-icon-btn" [title]="'Subir foto para ' + (pedido.descripcion || 'este producto')">
                      <span class="cat-emoji">{{ getCategoryIcon(pedido.descripcion) }}</span>
                      <span class="upload-hover-icon">📷</span>
                      <input type="file" style="display: none" (change)="uploadPhoto($event, pedido.id)" accept="image/*">
                    </label>
                  </ng-template>
                </div>
              </td>

              <!-- CIUDAD -->
              <td>
                <input type="text" class="inline-edit-input city-badge-input" 
                       [(ngModel)]="pedido.ciudad" 
                       (ngModelChange)="onCellChange(pedido)"
                       (change)="actualizarPedido(pedido)"
                       placeholder="GZ">
              </td>

              <!-- FECHA -->
              <td>
                <input type="date" class="inline-edit-input date-input" 
                       [ngModel]="formatDateForInput(pedido.fechaNegociacion)" 
                       (ngModelChange)="onDateChange(pedido, $event)"
                       (change)="actualizarPedido(pedido)">
              </td>

              <!-- DESCRIPCION & OBSERVACIONES -->
              <td style="min-width: 240px;">
                <div class="desc-cell-group">
                  <input type="text" class="inline-edit-input desc-input" 
                         [(ngModel)]="pedido.descripcion" 
                         (ngModelChange)="onCellChange(pedido)"
                         (change)="actualizarPedido(pedido)"
                         placeholder="Producto...">
                  
                  <div class="obs-subrow" *ngIf="mostrarObservaciones && (pedido.observaciones || editField === pedido.id + '-obs')">
                    <span class="obs-tag">Obs:</span>
                    <input type="text" class="inline-edit-input obs-input"
                           [(ngModel)]="pedido.observaciones"
                           (ngModelChange)="onCellChange(pedido)"
                           (change)="actualizarPedido(pedido)"
                           (blur)="editField = null"
                           placeholder="Observación...">
                  </div>
                  <span class="add-obs-btn" *ngIf="mostrarObservaciones && !pedido.observaciones && editField !== pedido.id + '-obs'" (click)="editField = pedido.id + '-obs'">
                    + Obs
                  </span>
                </div>
              </td>

              <!-- QTY -->
              <td>
                <input *ngIf="editField === pedido.id + '-qty'"
                       [id]="pedido.id + '-qty-input'"
                       type="number" class="inline-edit-input text-right" 
                       [(ngModel)]="pedido.totalQty" 
                       (ngModelChange)="onCellChange(pedido)"
                       (blur)="editField = null; actualizarPedido(pedido)"
                       (keydown.enter)="editField = null; actualizarPedido(pedido)"
                       placeholder="0">
                <span *ngIf="editField !== pedido.id + '-qty'"
                      class="inline-edit-display text-right"
                      (click)="startEdit(pedido.id + '-qty')">
                  {{ (pedido.totalQty || 0) | number }}
                </span>
              </td>

              <!-- YUANES -->
              <td>
                <input *ngIf="editField === pedido.id + '-yuanes'"
                       [id]="pedido.id + '-yuanes-input'"
                       type="number" step="0.01" class="inline-edit-input text-right" 
                       [(ngModel)]="pedido.yuanes" 
                       (ngModelChange)="onCellChange(pedido)"
                       (blur)="editField = null; actualizarPedido(pedido)"
                       (keydown.enter)="editField = null; actualizarPedido(pedido)"
                       placeholder="0.00">
                <span *ngIf="editField !== pedido.id + '-yuanes'"
                      class="inline-edit-display text-right"
                      (click)="startEdit(pedido.id + '-yuanes')">
                  ¥{{ (pedido.yuanes || 0) | number:'1.2-2' }}
                </span>
              </td>

              <!-- TASA -->
              <td>
                <input *ngIf="editField === pedido.id + '-tasa'"
                       [id]="pedido.id + '-tasa-input'"
                       type="number" step="0.01" class="inline-edit-input text-right" 
                       [(ngModel)]="pedido.tasa" 
                       (ngModelChange)="onCellChange(pedido)"
                       (blur)="editField = null; actualizarPedido(pedido)"
                       (keydown.enter)="editField = null; actualizarPedido(pedido)"
                       placeholder="535">
                <span *ngIf="editField !== pedido.id + '-tasa'"
                      class="inline-edit-display text-right"
                      (click)="startEdit(pedido.id + '-tasa')">
                  {{ (pedido.tasa || 0) | number }}
                </span>
              </td>

              <!-- CUBICA -->
              <td>
                <input *ngIf="editField === pedido.id + '-cubica'"
                       [id]="pedido.id + '-cubica-input'"
                       type="number" step="0.0001" class="inline-edit-input text-right" 
                       [(ngModel)]="pedido.cubica" 
                       (ngModelChange)="onCellChange(pedido)"
                       (blur)="editField = null; actualizarPedido(pedido)"
                       (keydown.enter)="editField = null; actualizarPedido(pedido)"
                       placeholder="0.000">
                <span *ngIf="editField !== pedido.id + '-cubica'"
                      class="inline-edit-display text-right"
                      (click)="startEdit(pedido.id + '-cubica')">
                  {{ (pedido.cubica || 0) | number:'1.3-4' }}
                </span>
              </td>

              <!-- PRECIO MT3 -->
              <td>
                <input *ngIf="editField === pedido.id + '-precioMt3'"
                       [id]="pedido.id + '-precioMt3-input'"
                       type="number" step="0.01" class="inline-edit-input text-right" 
                       [(ngModel)]="pedido.precioMt3" 
                       (ngModelChange)="onCellChange(pedido)"
                       (blur)="editField = null; actualizarPedido(pedido)"
                       (keydown.enter)="editField = null; actualizarPedido(pedido)"
                       placeholder="0.00">
                <span *ngIf="editField !== pedido.id + '-precioMt3'"
                      class="inline-edit-display text-right"
                      (click)="startEdit(pedido.id + '-precioMt3')">
                  {{ (pedido.precioMt3 || 0) | currency:'COP':'symbol-narrow':'1.0-0' }}
                </span>
              </td>

              <!-- PORCENTAJE EHUK -->
              <td>
                <input *ngIf="editField === pedido.id + '-porcentajeEhuk'"
                       [id]="pedido.id + '-porcentajeEhuk-input'"
                       type="number" step="0.01" class="inline-edit-input text-right" 
                       [(ngModel)]="pedido.porcentajeEhuk" 
                       (ngModelChange)="onCellChange(pedido)"
                       (blur)="editField = null; actualizarPedido(pedido)"
                       (keydown.enter)="editField = null; actualizarPedido(pedido)"
                       placeholder="0.10">
                <span *ngIf="editField !== pedido.id + '-porcentajeEhuk'"
                      class="inline-edit-display text-right"
                      (click)="startEdit(pedido.id + '-porcentajeEhuk')">
                  {{ (pedido.porcentajeEhuk || 0) | percent:'1.0-1' }}
                </span>
              </td>

              <!-- ETAPA -->
              <td>
                <select [class]="'inline-select etapa-select ' + getEtapaClass(pedido.etapa)"
                        [ngModel]="pedido.etapa" 
                        (ngModelChange)="onEtapaChange(pedido, $event)">
                  <option [ngValue]="0">Cotización</option>
                  <option [ngValue]="1">Confirmado</option>
                  <option [ngValue]="2">Pagado</option>
                  <option [ngValue]="3">En Tránsito</option>
                  <option [ngValue]="4">Aduana</option>
                  <option [ngValue]="5">Recibido</option>
                </select>
              </td>

              <!-- TOTAL (calculated) -->
              <td class="text-right text-highlight" style="padding-right: 1.5rem; font-variant-numeric: tabular-nums;">
                {{ (pedido.total || 0) | currency:'COP':'symbol-narrow':'1.0-0' }}
              </td>

              <!-- ACTIONS (PDF & DELETE) -->
              <td style="text-align: center;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
                  <button class="delete-row-btn" (click)="exportarPdf(pedido, $event)" title="Descargar PDF de esta importación" style="color: #3b82f6;">
                    📄
                  </button>
                  <button class="delete-row-btn" *ngIf="canEdit()" (click)="eliminarPedido($event, pedido.id)" title="Eliminar fila">
                    &times;
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="pedidosFiltrados.length === 0 && !loading">
              <td colspan="16" class="empty-state-cell">
                <div class="empty-icon">📋</div>
                <p>No hay importaciones en el sistema</p>
                <span>Haz clic en "+ Nueva Fila" o sube un archivo Excel para empezar</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MOBILE EXECUTIVE INVENTORY CARDS (Shown on Smartphones) -->
      <div class="mobile-inventory-feed" *ngIf="!loading && pedidosFiltrados.length > 0">
        <div class="mobile-card-item" *ngFor="let pedido of pedidosFiltrados">
          <div class="mobile-card-top">
            <div class="mobile-card-badge">
              <span class="m-code">{{ pedido.codigo || 'S/N' }}</span>
              <span class="m-ref" *ngIf="pedido.referencia">#{{ pedido.referencia }}</span>
            </div>
            <span [class]="'m-etapa ' + getEtapaClass(pedido.etapa)">
              {{ getEtapaLabel(pedido.etapa) }}
            </span>
          </div>

          <div class="mobile-card-body">
            <div class="m-thumb-box" *ngIf="pedido.fotoUrl">
              <img [src]="formatPhotoUrl(pedido.fotoUrl)" alt="Foto">
            </div>
            <div class="m-details">
              <h4 class="m-title">{{ pedido.descripcion || 'Producto de Importación' }}</h4>
              <p class="m-sub">{{ pedido.ciudad }} · {{ (pedido.totalQty || 0) | number }} uds · {{ pedido.abono ? '✅ Abono Pagado' : '⏳ Abono Pendiente' }}</p>
              <div class="m-prices">
                <span class="m-total">{{ (pedido.total || 0) | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                <span class="m-unit">Costo: {{ (pedido.costoFinal || 0) | currency:'COP':'symbol-narrow':'1.0-0' }}/ud</span>
              </div>
            </div>
          </div>

          <div class="mobile-card-actions">
            <button class="m-action-btn" (click)="exportarPdf(pedido)">📄 Descargar PDF</button>
          </div>
        </div>
      </div>


      <!-- CUSTOM CONFIRM MODAL -->
      <div class="confirm-modal-overlay" *ngIf="confirmModal.show" (click)="cancelConfirm()">
        <div class="confirm-modal-card" (click)="$event.stopPropagation()">
          <div class="modal-alert-icon" [style.color]="confirmModal.isWarning ? '#ef4444' : '#3b82f6'">
            <svg *ngIf="confirmModal.isWarning" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <svg *ngIf="!confirmModal.isWarning" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </div>
          <h3>{{ confirmModal.title }}</h3>
          <p>{{ confirmModal.message }}</p>
          <div class="modal-input-wrapper" *ngIf="confirmModal.isPrompt" style="width: 100%; margin: 1.25rem 0 0.5rem 0;">
            <input type="text" 
                   [(ngModel)]="confirmModal.promptValue" 
                   [placeholder]="confirmModal.promptPlaceholder || ''" 
                   class="filter-control modal-prompt-input" 
                   style="width: 100%; box-sizing: border-box; background: #09090b; border: 1px solid rgba(255,255,255,0.12); color: #fafafa; padding: 0.6rem 0.8rem; border-radius: 8px; font-size: 0.9rem;"
                   (keydown.enter)="executeConfirm()">
          </div>
          <div class="modal-actions">
            <button class="btn-modal btn-cancel" (click)="cancelConfirm()">{{ confirmModal.cancelText }}</button>
            <button class="btn-modal btn-confirm" [style.background]="confirmModal.isWarning ? '#ef4444' : '#3b82f6'" (click)="executeConfirm()">{{ confirmModal.confirmText }}</button>
          </div>
        </div>
      </div>

      <!-- CUSTOM ALERT MODAL -->
      <div class="confirm-modal-overlay" *ngIf="alertModal.show" (click)="alertModal.show = false">
        <div class="confirm-modal-card" (click)="$event.stopPropagation()">
          <div class="modal-alert-icon" style="color: #ef4444;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </div>
          <h3>{{ alertModal.title }}</h3>
          <p>{{ alertModal.message }}</p>
          <div class="modal-actions" style="justify-content: center;">
            <button class="btn-modal btn-confirm" style="background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.08);" (click)="alertModal.show = false">Entendido</button>
          </div>
        </div>
      </div>

      <!-- VISTA AGRUPADA POR PRODUCTO -->
      <div class="grouped-products-container" *ngIf="agruparPorProducto && !loading">

        <!-- STAGE ORDERING TOOLBAR -->
        <div class="grouped-header-toolbar glass-card">
          <div class="toolbar-left">
            <span class="tb-title">📑 Agrupación por Tipo de Producto</span>
            <span class="tb-sub">({{ gruposProductos.length }} categorías consolidadas)</span>
          </div>

          <div class="toolbar-right">
            <label class="sort-select-label">🔀 Ordenar etapas por:</label>
            <select [(ngModel)]="criterioOrdenEtapa" (change)="computeGrupos()" class="stage-order-select">
              <option value="ACTIVAS">🚚 Cargas Activas Primero (En Tránsito → Aduana → Pagado)</option>
              <option value="CICLO">📝 Ciclo de Compra Primero (Cotización → Confirmado → Pagado)</option>
              <option value="RECIBIDAS">📦 Mercancía Recibida Primero (Recibido → En Tránsito)</option>
            </select>
          </div>
        </div>

        <div class="group-card glass-card" *ngFor="let g of gruposProductos">
          <div class="group-header" (click)="g.expanded = !g.expanded">
            
            <div class="group-left">
              <div class="group-thumb-box" *ngIf="g.fotoUrl; else groupCatTpl">
                <img [src]="formatPhotoUrl(g.fotoUrl)" class="group-thumb">
              </div>
              <ng-template #groupCatTpl>
                <div class="group-thumb-box cat-placeholder">
                  <span>{{ getCategoryIcon(g.descripcion) }}</span>
                </div>
              </ng-template>

              <div class="group-title-box">
                <h3 class="group-title">{{ g.descripcion }}</h3>
                <span class="group-badge">{{ g.pedidos.length }} pedidos vinculados</span>
              </div>
            </div>

            <div class="group-metrics">
              <div class="g-metric">
                <span>Total Qty</span>
                <strong>{{ g.totalQty | number }} pzas</strong>
              </div>
              <div class="g-metric">
                <span>Total Yuanes</span>
                <strong class="text-yellow">¥{{ g.totalYuanes | number:'1.2-2' }}</strong>
              </div>
              <div class="g-metric">
                <span>Total COP</span>
                <strong class="text-green">$ {{ g.totalCop | number:'1.0-0' }}</strong>
              </div>
              <button class="expand-btn">
                {{ g.expanded ? '▲ Ocultar' : '▼ Ver ' + g.pedidos.length + ' Pedidos' }}
              </button>
            </div>

          </div>

          <!-- EXPANDED INNER TABLE FOR THIS PRODUCT -->
          <div class="group-detail-panel" *ngIf="g.expanded">

            <!-- STAGE FILTER CHIPS TOOLBAR -->
            <div class="group-stage-filter-bar">
              <span class="filter-bar-lbl">Filtrar por etapa:</span>
              <button class="stage-chip-btn" [class.active]="g.filterEtapa === 'TODOS'" (click)="g.filterEtapa = 'TODOS'">
                Todos ({{ g.pedidos.length }})
              </button>
              <button class="stage-chip-btn transito" *ngIf="g.stageCounts[3]" [class.active]="g.filterEtapa === '3'" (click)="g.filterEtapa = '3'">
                🚚 En Tránsito ({{ g.stageCounts[3] }})
              </button>
              <button class="stage-chip-btn aduana" *ngIf="g.stageCounts[4]" [class.active]="g.filterEtapa === '4'" (click)="g.filterEtapa = '4'">
                🛃 Aduana ({{ g.stageCounts[4] }})
              </button>
              <button class="stage-chip-btn pagado" *ngIf="g.stageCounts[2]" [class.active]="g.filterEtapa === '2'" (click)="g.filterEtapa = '2'">
                💳 Pagado ({{ g.stageCounts[2] }})
              </button>
              <button class="stage-chip-btn confirmado" *ngIf="g.stageCounts[1]" [class.active]="g.filterEtapa === '1'" (click)="g.filterEtapa = '1'">
                ✅ Confirmado ({{ g.stageCounts[1] }})
              </button>
              <button class="stage-chip-btn cotizacion" *ngIf="g.stageCounts[0]" [class.active]="g.filterEtapa === '0'" (click)="g.filterEtapa = '0'">
                📝 Cotización ({{ g.stageCounts[0] }})
              </button>
              <button class="stage-chip-btn recibido" *ngIf="g.stageCounts[5]" [class.active]="g.filterEtapa === '5'" (click)="g.filterEtapa = '5'">
                📦 Recibido ({{ g.stageCounts[5] }})
              </button>
            </div>

            <table class="table inner-group-table">
              <thead>
                <tr>
                  <th (click)="sortGroup(g, 'codigo')" class="sortable-th" title="Ordenar por Código/Pedido #">
                    Pedido # <span class="sort-icon" *ngIf="g.sortCol === 'codigo'">{{ g.sortAsc ? '▲' : '▼' }}</span>
                  </th>
                  <th (click)="sortGroup(g, 'referencia')" class="sortable-th" title="Ordenar por Referencia">
                    Referencia <span class="sort-icon" *ngIf="g.sortCol === 'referencia'">{{ g.sortAsc ? '▲' : '▼' }}</span>
                  </th>
                  <th (click)="sortGroup(g, 'ciudad')" class="sortable-th" title="Ordenar por Ciudad">
                    Ciudad <span class="sort-icon" *ngIf="g.sortCol === 'ciudad'">{{ g.sortAsc ? '▲' : '▼' }}</span>
                  </th>
                  <th (click)="sortGroup(g, 'totalQty')" class="sortable-th" title="Ordenar por Cantidad">
                    Qty <span class="sort-icon" *ngIf="g.sortCol === 'totalQty'">{{ g.sortAsc ? '▲' : '▼' }}</span>
                  </th>
                  <th (click)="sortGroup(g, 'yuanes')" class="sortable-th" title="Ordenar por Yuanes">
                    Yuanes <span class="sort-icon" *ngIf="g.sortCol === 'yuanes'">{{ g.sortAsc ? '▲' : '▼' }}</span>
                  </th>
                  <th (click)="sortGroup(g, 'tasa')" class="sortable-th" title="Ordenar por Tasa">
                    Tasa <span class="sort-icon" *ngIf="g.sortCol === 'tasa'">{{ g.sortAsc ? '▲' : '▼' }}</span>
                  </th>
                  <th (click)="sortGroup(g, 'etapa')" class="sortable-th" title="Ordenar por Etapa">
                    Etapa <span class="sort-icon" *ngIf="g.sortCol === 'etapa'">{{ g.sortAsc ? '▲' : '▼' }}</span>
                  </th>
                  <th (click)="sortGroup(g, 'total')" class="sortable-th" title="Ordenar por Total COP">
                    Total COP <span class="sort-icon" *ngIf="g.sortCol === 'total'">{{ g.sortAsc ? '▲' : '▼' }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let sub of getFilteredGroupPedidos(g)">
                  <td><strong>{{ sub.codigo || 'S/N' }}</strong></td>
                  <td>{{ sub.referencia }}</td>
                  <td><span class="badge-city">{{ sub.ciudad }}</span></td>
                  <td>{{ sub.fechaNegociacion | date:'dd/MM/yyyy' }}</td>
                  <td>{{ sub.totalQty | number }}</td>
                  <td>¥{{ sub.yuanes | number:'1.2-2' }}</td>
                  <td>{{ sub.tasa }}</td>
                  <td>
                    <select [class]="'inline-select etapa-select ' + getEtapaClass(sub.etapa)"
                            [ngModel]="sub.etapa" 
                            (ngModelChange)="onEtapaChange(sub, $event)">
                      <option [ngValue]="0">Cotización</option>
                      <option [ngValue]="1">Confirmado</option>
                      <option [ngValue]="2">Pagado</option>
                      <option [ngValue]="3">En Tránsito</option>
                      <option [ngValue]="4">Aduana</option>
                      <option [ngValue]="5">Recibido</option>
                    </select>
                  </td>
                  <td><strong class="text-green">$ {{ sub.total | number:'1.0-0' }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <!-- CATALOG GALLERY MODAL -->
      <div class="modal-overlay" *ngIf="galeriaModalOpen" (click)="galeriaModalOpen = false">
        <div class="modal-card glass-card catalog-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>✨ Catálogo de Productos Importados</h3>
              <p class="sub-hdr" style="font-size: 0.8rem; color: #a1a1aa; margin: 4px 0 0 0;">
                Catálogo consolidado de productos en inventario y cargas en curso
              </p>
            </div>
            <button class="btn-close" (click)="galeriaModalOpen = false">✕</button>
          </div>
          
          <div class="catalog-grid" *ngIf="gruposProductos.length > 0">
            <div class="catalog-card glass-card" *ngFor="let g of gruposProductos">
              <div class="cat-img-wrap">
                <img *ngIf="g.fotoUrl" [src]="formatPhotoUrl(g.fotoUrl)" class="cat-img">
                <div *ngIf="!g.fotoUrl" class="cat-no-img">
                  <span class="cat-no-img-icon">{{ getCategoryIcon(g.descripcion) }}</span>
                </div>
                <span class="cat-badge-qty">{{ g.totalQty | number }} unidades</span>
              </div>
              <div class="cat-body">
                <h4 class="cat-title">{{ g.descripcion }}</h4>
                <div class="cat-foot">
                  <span class="cat-pedidos-lbl">{{ g.pedidos.length }} pedidos</span>
                  <strong class="cat-price">$ {{ g.totalCop | number:'1.0-0' }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="cat-empty" *ngIf="gruposProductos.length === 0" style="text-align: center; padding: 3rem 1.5rem;">
            <span style="font-size: 2.8rem; display: block; margin-bottom: 0.75rem;">📦</span>
            <h4 style="color: #fafafa; font-size: 1.1rem; font-weight: 700; margin-bottom: 0.3rem;">Sin Productos Registrados</h4>
            <p style="color: #a1a1aa; font-size: 0.85rem; margin: 0;">Sube un archivo Excel de importación para poblar el catálogo de productos.</p>
          </div>
        </div>
      </div>

      <!-- LIGHTBOX PREVIEW -->
      <div class="lightbox-overlay" *ngIf="previewImage"
           (click)="closeLightbox()"
           (wheel)="onLightboxWheel($event)">
        <div class="lightbox-content" (click)="$event.stopPropagation()">

          <!-- TOP BAR -->
          <div class="lb-topbar">
            <span class="lb-zoom-label">{{ zoomPct }}%</span>
            <div class="lb-actions">
              <button class="lb-btn" (click)="zoomOut()" title="Alejar">−</button>
              <button class="lb-btn" (click)="zoomReset()" title="Restablecer">⊡</button>
              <button class="lb-btn" (click)="zoomIn()" title="Acercar">+</button>
              <button class="lb-btn lb-download" (click)="downloadImage()" title="Descargar imagen">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Descargar
              </button>
              <button class="lb-btn lb-close" (click)="closeLightbox()" title="Cerrar">✕</button>
            </div>
          </div>

          <!-- IMAGE -->
          <div class="lb-img-wrap"
               (mousedown)="startDrag($event)"
               (mousemove)="onDrag($event)"
               (mouseup)="endDrag()"
               (mouseleave)="endDrag()"
               [style.cursor]="zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default'">
            <img [src]="previewImage" alt="Foto del pedido"
                 [style.transform]="'scale(' + zoom + ') translate(' + panX + 'px,' + panY + 'px)'"
                 [style.transition]="dragging ? 'none' : 'transform 0.2s ease'"
                 (dragstart)="$event.preventDefault()"/>
          </div>

          <!-- HINT -->
          <div class="lb-hint">Rueda del mouse para zoom · Arrastrá para mover</div>
        </div>
      </div>

      <!-- SMART PHOTO AUTO-SYNC MODAL -->
      <div class="modal-overlay" *ngIf="syncFotoModal.show" (click)="syncFotoModal.show = false">
        <div class="sync-photo-modal-card" (click)="$event.stopPropagation()">
          
          <!-- HEADER -->
          <div class="sync-modal-header">
            <div class="sync-title-badge">
              <span class="sync-icon">✨</span>
              <h3>Sincronización Inteligente de Foto</h3>
            </div>
            <button class="sync-close-btn" (click)="syncFotoModal.show = false" title="Cerrar">✕</button>
          </div>

          <!-- BODY CONTENT -->
          <div class="sync-modal-body">
            <div class="sync-hero-card">
              <div class="sync-img-container">
                <img [src]="formatPhotoUrl(syncFotoModal.fotoUrl)" alt="Foto recién subida" class="sync-img-main">
                <span class="sync-img-badge">Nueva Foto</span>
              </div>
              <div class="sync-info-content">
                <h4 class="sync-prod-title">{{ syncFotoModal.descripcion }}</h4>
                <p class="sync-detect-desc">
                  Se detectaron <span class="highlight-count">{{ syncFotoModal.count }}</span> productos adicionales de esta categoría.
                </p>
                <div class="sync-question-pill">
                  ¿Deseas aplicar esta foto a {{ getPluralQuestion(syncFotoModal.descripcion) }}?
                </div>
              </div>
            </div>
          </div>

          <!-- FOOTER ACTIONS -->
          <div class="sync-modal-footer">
            <button class="sync-btn sync-btn-cancel" (click)="syncFotoModal.show = false">
              Solo a este pedido
            </button>
            <button class="sync-btn sync-btn-confirm" (click)="confirmBulkSyncByDesc()">
              🚀 {{ getPluralButtonText(syncFotoModal.descripcion, syncFotoModal.count + 1) }}
            </button>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .table-container {
      padding: 0;
      overflow: hidden;
      background: var(--panel-bg);
      animation: fadeUp 0.4s ease;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Metrics Grid styles */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      padding: 0 1.5rem 1rem;
      margin-bottom: 0.5rem;
    }
    .metric-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .metric-icon {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .metric-info {
      display: flex;
      flex-direction: column;
    }
    .metric-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      margin-bottom: 0.15rem;
    }
    .metric-value {
      font-size: 1.05rem;
      font-weight: 700;
      color: #fafafa;
      margin: 0;
      font-variant-numeric: tabular-nums;
    }

    /* Filters Bar styles */
    .table-filters-bar {
      background: rgba(255, 255, 255, 0.01);
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      padding: 0.85rem 1.5rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1rem;
    }
    .search-wrapper {
      position: relative;
      flex: 1;
      min-width: 260px;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #52525b;
      pointer-events: none;
    }
    .filter-control {
      background: #09090b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #fafafa;
      font-family: inherit;
      font-size: 0.8rem;
      padding: 0.45rem 0.75rem;
      border-radius: 6px;
      outline: none;
      transition: all 0.15s;
    }
    .filter-control:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }
    .search-input {
      width: 100%;
      padding-left: 2.25rem;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .filter-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #71717a;
    }
    .select-filter {
      cursor: pointer;
      min-width: 110px;
    }
    .num-filter {
      max-width: 110px;
    }
    .btn-clear {
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.15);
      color: #f87171;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0.45rem 0.75rem;
      border-radius: 6px;
      transition: all 0.15s;
    }
    .btn-clear:hover {
      background: rgba(239, 68, 68, 0.15);
      color: #fff;
    }
    
    /* Stage Pill Styles */
    .etapa-select {
      border-radius: 6px;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid transparent !important;
      text-align: center;
      width: 100%;
      min-width: 125px;
      cursor: pointer;
      display: inline-block;
      transition: all 0.15s;
    }
    .etapa-select.etapa-0 { background: rgba(113, 113, 122, 0.12) !important; color: #a1a1aa !important; }
    .etapa-select.etapa-1 { background: rgba(168, 85, 247, 0.12) !important; color: #c084fc !important; }
    .etapa-select.etapa-2 { background: rgba(16, 185, 129, 0.12) !important; color: #34d399 !important; }
    .etapa-select.etapa-3 { background: rgba(59, 130, 246, 0.12) !important; color: #60a5fa !important; }
    .etapa-select.etapa-4 { background: rgba(249, 115, 22, 0.12) !important; color: #fb923c !important; }
    .etapa-select.etapa-5 { background: rgba(16, 185, 129, 0.2) !important; color: #10b981 !important; }
    
    .etapa-select:hover {
      filter: brightness(1.15);
    }
    .etapa-select:focus {
      outline: none;
      border-color: #3b82f6 !important;
    }

    /* Header */
    .table-header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 1.5rem 1rem;
    }
    .table-header-actions h3 {
      margin: 0; font-size: 1.15rem; font-weight: 700; color: #fff;
    }
    .header-sub {
      font-size: 0.72rem; color: #52525b; margin: 0.2rem 0 0;
    }
    .header-buttons {
      display: flex; gap: 0.75rem; align-items: center;
    }
    .btn-ghost {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.08);
      color: #a1a1aa;
      padding: 0.45rem 1rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s;
    }
    .btn-ghost:hover {
      background: rgba(255,255,255,0.04);
      border-color: rgba(255,255,255,0.15);
      color: #fafafa;
    }
    .btn-danger-ghost {
      color: #71717a;
      border-color: rgba(239,68,68,0.15);
    }
    .btn-danger-ghost:hover {
      background: rgba(239,68,68,0.08);
      border-color: rgba(239,68,68,0.3);
      color: #f87171;
    }

    /* Bulk toolbar */
    .bulk-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem 1.5rem;
      background: rgba(59,130,246,0.06);
      border-top: 1px solid rgba(59,130,246,0.1);
      border-bottom: 1px solid rgba(59,130,246,0.1);
      animation: slideDown 0.2s ease;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .bulk-info {
      font-size: 0.8rem; color: #93c5fd; font-weight: 500;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .bulk-count {
      background: #3b82f6;
      color: #fff;
      padding: 0.1rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .bulk-actions { display: flex; gap: 0.5rem; }

    /* Skeleton loading */
    .skeleton-container { padding: 1rem 1.5rem 1.5rem; }
    .skeleton-row {
      display: flex; gap: 1rem; padding: 0.85rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      animation: skeletonFade 1.2s ease-in-out infinite;
    }
    .skeleton-cell {
      height: 14px; border-radius: 6px;
      background: linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    .sk-sm { width: 60px; }
    .sk-md { width: 100px; }
    .sk-lg { flex: 1; }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes skeletonFade {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    
    .table-responsive {
      overflow-x: auto;
      padding: 0 1.5rem 1.5rem;
    }
    
    .table {
      width: 100%;
      min-width: 1450px;
      border-collapse: separate;
      border-spacing: 0;
      text-align: left;
      font-size: 0.85rem;
    }
    
    .table th {
      color: var(--text-muted);
      font-weight: 700;
      padding: 1rem 0.5rem;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--panel-border);
      white-space: nowrap;
    }
    
    .table td {
      padding: 0.5rem 0.4rem;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      color: var(--text-main);
      vertical-align: middle;
    }
    
    .table tbody tr.order-row {
      transition: background 0.15s;
      animation: rowFadeIn 0.3s ease both;
      position: relative;
      z-index: 1;
    }
    @keyframes rowFadeIn {
      from { opacity: 0; transform: translateX(-8px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    .table tbody tr.order-row:hover {
      background: rgba(255, 255, 255, 0.015);
      z-index: 100; /* Forces the entire hovered row (and its child popover) to render on top of all other rows and columns */
    }
    .table tbody tr.selected-row {
      background: rgba(59, 130, 246, 0.04);
      position: relative;
      z-index: 1;
    }
    .table tbody tr.selected-row:hover {
      background: rgba(59, 130, 246, 0.07);
      z-index: 100;
    }
    
    .table tbody tr:last-child td {
      border-bottom: none;
    }
    
    .fw-bold { font-weight: 600; color: #fff; }
    
    .text-highlight {
      color: var(--success);
      font-weight: 700;
    }

    .text-right {
      text-align: right;
    }

    /* Checkbox */
    .row-checkbox {
      appearance: none;
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border: 1.5px solid rgba(255,255,255,0.25);
      border-radius: 4px;
      background: rgba(9,9,11,0.6);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      outline: none;
      position: relative;
    }
    .row-checkbox:hover {
      border-color: rgba(255,255,255,0.45);
      background: rgba(255,255,255,0.05);
    }
    .row-checkbox:checked {
      background: #3b82f6;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.2);
    }
    .row-checkbox:checked::after {
      content: '';
      width: 4px;
      height: 8px;
      border: solid #fff;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      display: block;
      margin-bottom: 2px;
    }
    
    /* Excel-style inline input styles */
    .inline-edit-input {
      background: transparent;
      border: 1px solid transparent;
      color: #fafafa;
      padding: 0.35rem 0.5rem;
      border-radius: 4px;
      width: 100%;
      font-family: inherit;
      font-size: 0.8rem;
      transition: all 0.15s;
    }
    .inline-edit-input:hover {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.08);
    }
    .inline-upload-label:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: #3b82f6;
      color: #fafafa;
    }

    .category-icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
    }
    .category-icon-btn:hover {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.35);
      transform: scale(1.08);
    }
    .cat-emoji {
      font-size: 1.05rem;
    }
    .upload-hover-icon {
      display: none;
      font-size: 0.8rem;
    }
    .category-icon-btn:hover .cat-emoji {
      display: none;
    }
    .category-icon-btn:hover .upload-hover-icon {
      display: inline;
    }
    .inline-edit-input:focus {
      outline: none;
      background: #09090b;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }

    .date-input {
      font-size: 0.75rem;
      color: #a1a1aa;
    }

    .desc-input {
      min-width: 200px;
      font-weight: 500;
      color: #e4e4e7;
    }

    .city-badge-input {
      color: #38bdf8;
      font-weight: 600;
    }

    .inline-select {
      background: transparent;
      border: 1px solid transparent;
      color: #a1a1aa;
      padding: 0.3rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      width: 100%;
      transition: all 0.15s;
    }
    .inline-select:hover {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.08);
    }
    .inline-select:focus {
      outline: none;
      background: #09090b;
      border-color: #3b82f6;
    }
    .inline-select option {
      background: #18181b;
      color: #fafafa;
    }

    /* Photo column styles */
    .photo-cell {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 62px;
      height: 62px;
      margin: 0 auto;
      transition: z-index 0.1s;
    }
    .photo-cell:hover {
      z-index: 1000; /* Stacks on top of neighboring cells to prevent date/city inputs from rendering over the hover popover */
    }
    .thumb-container {
      position: relative;
      display: inline-block;
    }
    .table-thumb {
      width: 56px;
      height: 56px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.08);
      cursor: zoom-in;
      display: block;
      transition: border-color 0.2s;
    }
    .thumb-container:hover .table-thumb {
      border-color: rgba(255,255,255,0.25);
    }
    
    /* Popover review card displayed instantly on hover */
    .hover-preview-popover {
      position: absolute;
      left: 70px;
      top: 50%;
      transform: translateY(-50%) scale(0.9);
      background: #18181b;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      padding: 0.35rem;
      box-shadow: 0 15px 35px rgba(0,0,0,0.7);
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      width: 350px;
      height: 350px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .hover-preview-popover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px;
    }
    .thumb-container:hover .hover-preview-popover {
      opacity: 1;
      transform: translateY(-50%) scale(1);
    }
    
    .desc-cell-group { display: flex; flex-direction: column; gap: 2px; width: 100%; }
    .obs-subrow { display: flex; align-items: center; gap: 4px; width: 100%; margin-top: 1px; }
    .obs-tag { font-size: 0.65rem; color: #38bdf8; font-weight: 700; background: rgba(56, 189, 248, 0.12); padding: 1px 4px; border-radius: 3px; flex-shrink: 0; }
    .obs-input { font-size: 0.74rem !important; color: #94a3b8 !important; padding: 2px 4px !important; }
    .add-obs-btn { font-size: 0.68rem; color: #52525b; cursor: pointer; opacity: 0.6; transition: opacity 0.2s; display: inline-block; margin-top: 1px; }
    .add-obs-btn:hover { opacity: 1; color: #60a5fa; }

    .edit-photo-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      background: #3b82f6;
      color: #fff;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      transition: all 0.2s;
      border: 1.5px solid #18181b;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      z-index: 10;
    }
    .thumb-container:hover .edit-photo-badge {
      opacity: 1;
      transform: scale(1.1);
    }
    .edit-photo-badge:hover {
      background: #2563eb;
      color: #fff;
    }
    
    /* View Mode Toolbar & Pills */
    .view-mode-toolbar {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
    }
    .view-pill-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #94a3b8;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.76rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .view-pill-btn:hover, .view-pill-btn.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    .view-pill-btn.catalog-btn {
      background: rgba(168, 85, 247, 0.15);
      border-color: rgba(168, 85, 247, 0.4);
      color: #c084fc;
    }
    .view-pill-btn.catalog-btn:hover {
      background: #a855f7;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
    }

    /* Grouped Products Styles */
    .grouped-products-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }
    .group-card {
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: 16px;
      overflow: hidden;
      transition: border-color 0.2s ease;
    }
    .group-card:hover {
      border-color: rgba(59, 130, 246, 0.5);
    }
    .group-header {
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
      background: rgba(255, 255, 255, 0.02);
    }
    .group-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .group-thumb-box {
      width: 52px; height: 52px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.15);
      flex-shrink: 0;
    }
    .group-thumb {
      width: 100%; height: 100%; object-fit: cover;
    }
    .group-thumb-box.cat-placeholder {
      background: rgba(59, 130, 246, 0.15);
      display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
    }
    .group-title-box { display: flex; flex-direction: column; gap: 2px; }
    .group-title { font-size: 1.1rem; font-weight: 800; color: #f8fafc; margin: 0; }
    .group-badge { font-size: 0.75rem; color: #60a5fa; font-weight: 600; }

    .group-metrics { display: flex; align-items: center; gap: 1.5rem; }
    .g-metric { display: flex; flex-direction: column; text-align: right; }
    .g-metric span { font-size: 0.68rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
    .g-metric strong { font-size: 0.95rem; color: #f8fafc; font-weight: 800; }
    .text-yellow { color: #facc15 !important; }
    .text-green { color: #4ade80 !important; }
    .expand-btn {
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
      color: #cbd5e1; padding: 6px 12px; border-radius: 8px; font-size: 0.78rem; font-weight: 700; cursor: pointer;
    }

    .group-detail-panel {
      border-top: 1px solid rgba(255,255,255,0.08);
      background: #020617;
      padding: 0.85rem;
      border-radius: 0 0 14px 14px;
    }

    /* Group Stage Filter Bar */
    .group-stage-filter-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 0.75rem;
      padding: 0.55rem 0.85rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .filter-bar-lbl {
      font-size: 0.7rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-right: 0.4rem;
    }
    .stage-chip-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .stage-chip-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      transform: translateY(-1px);
    }
    .stage-chip-btn.active {
      background: #3b82f6 !important;
      border-color: #60a5fa !important;
      color: #ffffff !important;
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
    }

    .stage-chip-btn.transito { border-color: rgba(59, 130, 246, 0.4); color: #60a5fa; }
    .stage-chip-btn.transito.active { background: #3b82f6 !important; color: #fff !important; }
    .stage-chip-btn.aduana { border-color: rgba(249, 115, 22, 0.4); color: #fb923c; }
    .stage-chip-btn.aduana.active { background: #f97316 !important; color: #fff !important; }
    .stage-chip-btn.pagado { border-color: rgba(16, 185, 129, 0.4); color: #34d399; }
    .stage-chip-btn.pagado.active { background: #10b981 !important; color: #fff !important; }
    .stage-chip-btn.confirmado { border-color: rgba(168, 85, 247, 0.4); color: #c084fc; }
    .stage-chip-btn.confirmado.active { background: #a855f7 !important; color: #fff !important; }
    .stage-chip-btn.cotizacion { border-color: rgba(148, 163, 184, 0.4); color: #cbd5e1; }
    .stage-chip-btn.cotizacion.active { background: #64748b !important; color: #fff !important; }
    .stage-chip-btn.recibido { border-color: rgba(20, 184, 166, 0.4); color: #2dd4bf; }
    .stage-chip-btn.recibido.active { background: #14b8a6 !important; color: #fff !important; }

    .inner-group-table { margin: 0; font-size: 0.82rem; border-collapse: separate; border-spacing: 0 4px; }
    .inner-group-table th { background: transparent; color: #94a3b8; font-size: 0.7rem; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 0.6rem 0.85rem; }
    .inner-group-table td { padding: 0.6rem 0.85rem; color: #cbd5e1; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .inner-group-table tbody tr { transition: background 0.2s; border-radius: 8px; }
    .inner-group-table tbody tr:hover { background: rgba(255, 255, 255, 0.04); }

    .badge-city { background: rgba(59, 130, 246, 0.15); color: #60a5fa; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.72rem; }
    
    /* VIBRANT HIGH-CONTRAST STAGE BADGES */
    .badge-etapa { padding: 3px 8px; border-radius: 6px; font-size: 0.73rem; font-weight: 800; letter-spacing: 0.02em; display: inline-block; }
    .badge-etapa.etapa-0 { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.3); }
    .badge-etapa.etapa-1 { background: rgba(168, 85, 247, 0.18); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.4); box-shadow: 0 0 8px rgba(168, 85, 247, 0.15); }
    .badge-etapa.etapa-2 { background: rgba(16, 185, 129, 0.18); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.4); box-shadow: 0 0 8px rgba(16, 185, 129, 0.15); }
    .badge-etapa.etapa-3 { background: rgba(59, 130, 246, 0.22); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.45); box-shadow: 0 0 10px rgba(59, 130, 246, 0.25); }
    .badge-etapa.etapa-4 { background: rgba(249, 115, 22, 0.22); color: #ffedd5; border: 1px solid rgba(249, 115, 22, 0.45); box-shadow: 0 0 10px rgba(249, 115, 22, 0.25); }
    .badge-etapa.etapa-5 { background: rgba(20, 184, 166, 0.22); color: #99f6e4; border: 1px solid rgba(20, 184, 166, 0.45); box-shadow: 0 0 10px rgba(20, 184, 166, 0.25); }

    /* Catalog Gallery Modal */
    .catalog-modal { max-width: 900px; width: 95%; max-height: 85vh; overflow-y: auto; background: #0f172a; border-radius: 20px; padding: 1.75rem; }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding-bottom: 1rem;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 800;
      color: #fafafa;
    }
    .btn-close {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #a1a1aa;
      font-size: 0.9rem;
      font-weight: 600;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .btn-close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fafafa;
    }
    .btn-close:active {
      transform: scale(0.92);
    }
    .catalog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem; margin-top: 1.25rem; }
    .catalog-card { background: #020617; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; }
    .cat-img-wrap { height: 160px; width: 100%; position: relative; background: #09090b; }
    .cat-img { width: 100%; height: 100%; object-fit: cover; }
    .cat-no-img { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(59, 130, 246, 0.1); }
    .cat-no-img-icon { font-size: 3rem; }
    .cat-badge-qty { position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.85); color: #fff; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(255,255,255,0.2); }
    .cat-body { padding: 0.85rem; }
    .cat-title { font-size: 0.95rem; font-weight: 800; color: #f8fafc; margin-bottom: 0.5rem; }
    .cat-foot { display: flex; justify-content: space-between; align-items: center; }
    .cat-pedidos-lbl { font-size: 0.72rem; color: #94a3b8; }
    .cat-price { font-size: 0.9rem; color: #4ade80; font-weight: 800; }

    /* Excel-style inline text display */
    .inline-edit-display {
      display: block;
      padding: 0.35rem 0.5rem;
      border: 1px solid transparent;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      color: #fafafa;
      text-align: right;
      transition: all 0.1s;
      min-height: 27px;
    }
    .inline-edit-display:hover {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.08);
    }
    
    .inline-upload-label {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 8px;
      border: 1px dashed rgba(255, 255, 255, 0.15);
      cursor: pointer;
      color: #71717a;
      transition: all 0.15s;
    }
    .inline-upload-label:hover {
      border-color: #3b82f6;
      color: #fff;
      background: rgba(59, 130, 246, 0.05);
    }

    /* Delete Row Button — hidden, use bulk selection instead */
    .delete-row-btn { display: none; }

    /* Empty state */
    .empty-state-cell {
      text-align: center;
      padding: 4rem 2rem !important;
    }
    .empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }

    /* ── Confirm / Alert Modal ── */
    .confirm-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
    }
    .confirm-modal-card {
      background: #18181b;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 18px;
      padding: 2rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 32px 80px rgba(0,0,0,0.7);
      animation: modalIn 0.2s ease;
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.94) translateY(8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-alert-icon { margin-bottom: 1rem; }
    .confirm-modal-card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fafafa;
      margin: 0 0 0.5rem;
    }
    .confirm-modal-card p {
      font-size: 0.85rem;
      color: #71717a;
      margin: 0 0 1.5rem;
      line-height: 1.6;
    }
    .modal-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }
    .btn-modal {
      padding: 0.65rem 1.5rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }
    .btn-modal.btn-cancel {
      background: rgba(255,255,255,0.06);
      color: #a1a1aa;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .btn-modal.btn-cancel:hover { background: rgba(255,255,255,0.1); color: #fafafa; }
    .btn-modal.btn-confirm { color: #fff; }
    .btn-modal.btn-confirm:hover { opacity: 0.88; }
    .empty-state-cell p {
      color: #a1a1aa;
      font-size: 0.95rem;
      font-weight: 500;
      margin: 0 0 0.3rem;
    }
    .empty-state-cell span {
      color: #52525b;
      font-size: 0.8rem;
    }

    /* ── ULTRA-PREMIUM SMART PHOTO SYNC MODAL ── */
    .sync-photo-modal-card {
      max-width: 520px;
      width: 92%;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(59, 130, 246, 0.35);
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(59, 130, 246, 0.15);
      border-radius: 20px;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      animation: modalPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalPopIn {
      from { opacity: 0; transform: scale(0.94) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .sync-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 1rem;
    }

    .sync-title-badge {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .sync-icon {
      font-size: 1.25rem;
      background: rgba(59, 130, 246, 0.15);
      padding: 6px 10px;
      border-radius: 10px;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .sync-title-badge h3 {
      font-size: 1.1rem;
      font-weight: 800;
      color: #f8fafc;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .sync-close-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #94a3b8;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .sync-close-btn:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.4);
      color: #ef4444;
      transform: rotate(90deg);
    }

    .sync-hero-card {
      display: flex;
      gap: 1.25rem;
      align-items: center;
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.25rem;
    }

    .sync-img-container {
      position: relative;
      width: 96px;
      height: 96px;
      flex-shrink: 0;
      border-radius: 14px;
      overflow: hidden;
      border: 2px solid rgba(59, 130, 246, 0.5);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    }

    .sync-img-main {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .sync-img-badge {
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(59, 130, 246, 0.9);
      color: #ffffff;
      font-size: 0.62rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
      text-transform: uppercase;
    }

    .sync-info-content {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .sync-prod-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
    }

    .sync-detect-desc {
      font-size: 0.85rem;
      color: #94a3b8;
      margin: 0;
      line-height: 1.4;
    }

    .highlight-count {
      color: #60a5fa;
      font-weight: 800;
      font-size: 0.95rem;
    }

    .sync-question-pill {
      font-size: 0.85rem;
      font-weight: 700;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 6px 12px;
      border-radius: 8px;
      margin-top: 4px;
    }

    .sync-modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .sync-btn {
      padding: 0.75rem 1.35rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .sync-btn-cancel {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
    }

    .sync-btn-cancel:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    .sync-btn-confirm {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
    }

    .sync-btn-confirm:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.6);
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
    }

    /* Lightbox Styles */
    /* ── Lightbox ── */
    .lightbox-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.92);
      backdrop-filter: blur(16px);
      z-index: 3000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.18s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .lightbox-content {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow: hidden;
    }
    /* Top bar */
    .lb-topbar {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.25rem;
      background: rgba(0,0,0,0.5);
      border-bottom: 1px solid rgba(255,255,255,0.07);
      flex-shrink: 0;
      z-index: 10;
    }
    .lb-zoom-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #a1a1aa;
      font-variant-numeric: tabular-nums;
    }
    .lb-actions { display: flex; gap: 0.5rem; align-items: center; }
    .lb-btn {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.9rem;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: #e4e4e7;
      font-size: 0.85rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s;
    }
    .lb-btn:hover { background: rgba(255,255,255,0.14); color: #fff; }
    .lb-download { color: #60a5fa; border-color: rgba(96,165,250,0.3); }
    .lb-download:hover { background: rgba(59,130,246,0.15); }
    .lb-close { color: #f87171; border-color: rgba(248,113,113,0.3); }
    .lb-close:hover { background: rgba(239,68,68,0.15); }
    /* Image wrapper */
    .lb-img-wrap {
      flex: 1;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      user-select: none;
    }
    .lb-img-wrap img {
      max-width: 90vw;
      max-height: 80vh;
      object-fit: contain;
      border-radius: 10px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.8);
      pointer-events: none;
    }
    .lb-hint {
      padding: 0.5rem;
      font-size: 0.72rem;
      color: #3f3f46;
      flex-shrink: 0;
    }

    /* Bulk Select Controls */
    .bulk-select {
      background: #09090b;
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #fafafa;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.78rem;
      cursor: pointer;
      outline: none;
    }
    .bulk-select option {
      background: #18181b;
      color: #fafafa;
    }

    /* Abono Pill Badge */
    .abono-badge-btn {
      border: none;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.7rem;
      cursor: pointer;
      letter-spacing: 0.03em;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .abono-badge-btn.abono-si {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.35);
    }
    .abono-badge-btn.abono-si:hover {
      background: #10b981;
      color: #fff;
    }
    .abono-badge-btn.abono-no {
      background: rgba(239, 68, 68, 0.12);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .abono-badge-btn.abono-no:hover {
      background: #ef4444;
      color: #fff;
    }

    /* Mobile Inventory Feed (Smartphones) */
    .mobile-inventory-feed {
      display: none;
      flex-direction: column;
      gap: 1rem;
      padding: 0.5rem 0;
    }

    .mobile-card-item {
      background: #141417;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }

    .mobile-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .mobile-card-badge {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .m-code { font-weight: 800; font-size: 0.9rem; color: #fff; }
    .m-ref { font-size: 0.75rem; color: #a1a1aa; background: rgba(255,255,255,0.06); padding: 0.1rem 0.4rem; border-radius: 4px; }

    .m-etapa {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.06);
    }

    .mobile-card-body {
      display: flex;
      gap: 0.85rem;
      align-items: center;
    }
    .m-thumb-box {
      width: 58px;
      height: 58px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      background: #000;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .m-thumb-box img { width: 100%; height: 100%; object-fit: cover; }

    .m-details { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
    .m-title { font-size: 0.88rem; font-weight: 700; color: #fff; margin: 0; }
    .m-sub { font-size: 0.75rem; color: #71717a; margin: 0; }

    .m-prices { display: flex; justify-content: space-between; align-items: center; margin-top: 0.3rem; }
    .m-total { font-weight: 800; font-size: 1rem; color: #3b82f6; }
    .m-unit { font-size: 0.72rem; color: #a1a1aa; }

    .mobile-card-actions {
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 0.6rem;
    }
    .m-action-btn {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.25);
      color: #60a5fa;
      padding: 0.35rem 0.85rem;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
    }

    .grouped-header-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.4rem;
      margin-bottom: 1.5rem;
      background: rgba(18, 18, 22, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      backdrop-filter: blur(16px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .tb-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #fafafa;
      letter-spacing: -0.01em;
    }
    .tb-sub {
      font-size: 0.85rem;
      color: #a1a1aa;
    }
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .sort-select-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #cbd5e1;
    }
    .stage-order-select {
      background: #18181b;
      color: #f4f4f5;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 9px;
      padding: 0.5rem 0.9rem;
      font-size: 0.86rem;
      font-weight: 600;
      cursor: pointer;
      outline: none;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    .stage-order-select:hover, .stage-order-select:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.25);
    }
    .stage-order-select option {
      background: #18181b;
      color: #ffffff;
      padding: 10px;
    }

    @media (max-width: 768px) {
      .table-responsive {
        padding: 0 0.5rem 0.5rem 0.5rem !important;
      }
      .mobile-inventory-feed { display: none !important; }
      .metrics-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class TableComponent implements OnInit {
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];
  previewImage: string | null = null;
  zoom = 1;
  panX = 0;
  panY = 0;
  dragging = false;
  dragStartX = 0;
  dragStartY = 0;

  get zoomPct() { return Math.round(this.zoom * 100); }

  closeLightbox() {
    this.previewImage = null;
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
  }

  zoomIn()    { this.zoom = Math.min(5, +(this.zoom + 0.25).toFixed(2)); }
  zoomOut()   { this.zoom = Math.max(0.25, +(this.zoom - 0.25).toFixed(2)); if (this.zoom <= 1) { this.panX = 0; this.panY = 0; } }
  zoomReset() { this.zoom = 1; this.panX = 0; this.panY = 0; }

  onLightboxWheel(e: WheelEvent) {
    e.preventDefault();
    e.deltaY < 0 ? this.zoomIn() : this.zoomOut();
  }

  startDrag(e: MouseEvent) {
    if (this.zoom <= 1) return;
    this.dragging = true;
    this.dragStartX = e.clientX - this.panX;
    this.dragStartY = e.clientY - this.panY;
  }
  onDrag(e: MouseEvent) {
    if (!this.dragging) return;
    this.panX = e.clientX - this.dragStartX;
    this.panY = e.clientY - this.dragStartY;
  }
  endDrag() { this.dragging = false; }

  downloadImage() {
    if (!this.previewImage) return;
    const a = document.createElement('a');
    a.href = this.previewImage;
    a.download = 'foto_pedido_' + Date.now() + '.jpg';
    a.target = '_blank';
    a.click();
  }
  loading = true;
  selectedIds = new Set<number>();
  editField: string | null = null;

  confirmModal = {
    show: false,
    title: '',
    message: '',
    isWarning: false,
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    isPrompt: false,
    promptValue: '',
    promptPlaceholder: '',
    onConfirm: () => {}
  };

  alertModal = {
    show: false,
    title: '',
    message: ''
  };

  filtros = {
    busqueda: '',
    ciudad: '',
    etapa: null as number | null,
    montoMin: null as number | null
  };

  get totalImportacionesCount(): number {
    return this.pedidosFiltrados.length;
  }

  get totalCubicaSum(): number {
    return this.pedidosFiltrados.reduce((sum, p) => sum + (p.cubica || 0), 0);
  }

  get totalInversionCop(): number {
    return this.pedidosFiltrados.reduce((sum, p) => sum + (p.total || 0), 0);
  }

  get pedidosCriticosCount(): number {
    return this.pedidosFiltrados.filter(p => Number(p.etapa) === 3 || Number(p.etapa) === 4).length;
  }

  getEtapaClass(etapa: any): string {
    const et = Number(etapa);
    return 'etapa-' + (isNaN(et) ? '0' : et);
  }

  getEtapaLabel(etapa: any): string {
    const et = Number(etapa);
    switch (et) {
      case 0: return 'Cotización';
      case 1: return 'Confirmado';
      case 2: return 'Pagado';
      case 3: return 'En Tránsito';
      case 4: return 'Aduana';
      case 5: return 'Recibido';
      default: return 'Desconocido';
    }
  }

  get allSelected(): boolean {
    return this.pedidosFiltrados.length > 0 && this.pedidosFiltrados.every(p => this.selectedIds.has(p.id!));
  }

  constructor(
    private pedidoService: PedidoService, 
    public authService: AuthService, 
    private pdfService: PdfService,
    private signalrService: SignalrService
  ) {}

  ngOnInit() {
    this.cargarPedidos();
    this.signalrService.pedidoCreado$.subscribe(() => this.cargarPedidos());
    this.signalrService.pedidoActualizado$.subscribe(() => this.cargarPedidos());
    this.signalrService.pedidoEliminado$.subscribe(() => this.cargarPedidos());
  }
  
  cargarPedidos() {
    this.loading = true;
    this.pedidoService.getPedidos().subscribe({
      next: (data) => {
        this.pedidos = (data || []).map(p => calculateFinancials(p));
        this.aplicarFiltros();
        setTimeout(() => this.loading = false, 400);
      },
      error: () => this.loading = false
    });
  }

  canEdit(): boolean {
    return this.authService.canEdit();
  }

  startEdit(fieldId: string) {
    if (!this.canEdit()) return;
    this.editField = fieldId;
    setTimeout(() => {
      const input = document.getElementById(fieldId + '-input') as HTMLInputElement;
      if (input) {
        input.focus();
        if (typeof input.select === 'function') {
          input.select();
        }
      }
    }, 50);
  }

  showConfirm(title: string, message: string, onConfirm: () => void, isWarning = false, confirmText = 'Aceptar') {
    this.confirmModal = {
      show: true,
      title,
      message,
      isWarning,
      confirmText,
      cancelText: 'Cancelar',
      isPrompt: false,
      promptValue: '',
      promptPlaceholder: '',
      onConfirm
    };
  }

  showPrompt(title: string, message: string, defaultValue: string, placeholder: string, onConfirm: (val: string) => void) {
    this.confirmModal = {
      show: true,
      title,
      message,
      isWarning: false,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      isPrompt: true,
      promptValue: defaultValue,
      promptPlaceholder: placeholder,
      onConfirm: () => {
        onConfirm(this.confirmModal.promptValue);
      }
    };
    setTimeout(() => {
      const input = document.querySelector('.modal-prompt-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  }

  showAlert(title: string, message: string) {
    this.alertModal = {
      show: true,
      title,
      message
    };
  }

  executeConfirm() {
    this.confirmModal.show = false;
    if (this.confirmModal.onConfirm) {
      this.confirmModal.onConfirm();
    }
  }

  cancelConfirm() {
    this.confirmModal.show = false;
  }

  agregarFilaRapida() {
    this.agregarFila();
  }

  agregarFila() {
    const primerCodigo = this.pedidos.length > 0 ? (this.pedidos[0].codigo || '1') : '1';
    const nuevo: Pedido = {
      id: Date.now(),
      codigo: primerCodigo,
      ciudad: 'GZ',
      fechaNegociacion: new Date(),
      descripcion: 'Nuevo Producto',
      observaciones: '',
      referencia: '',
      totalQty: 100,
      yuanes: 10,
      piezasCaja: 1,
      cubica: 0.05,
      tasa: 535,
      precioMt3: 2300000,
      porcentajeEhuk: 0.10,
      etapa: 1
    } as Pedido;

    this.pedidoService.createPedido(nuevo).subscribe({
      next: (created) => {
        const row = created || nuevo;
        if (!this.pedidos.some(p => p.id === row.id)) {
          this.pedidos.unshift(row);
        }
        this.aplicarFiltros();
      },
      error: () => {
        if (!this.pedidos.some(p => p.id === nuevo.id)) {
          this.pedidos.unshift(nuevo);
        }
        this.aplicarFiltros();
      }
    });
  }

  mostrarFotos = false;
  agruparPorProducto = false;
  galeriaModalOpen = false;
  gruposProductos: any[] = [];

  formatPhotoUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const base = isLocal ? 'http://localhost:5174' : 'https://sistema-importaciones.onrender.com';
    return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
  }

  getEffectivePhotoUrl(pedido: Pedido): string | null {
    if (pedido.fotoUrl) return pedido.fotoUrl;
    if (!pedido.descripcion || !pedido.descripcion.trim()) return null;

    const desc = pedido.descripcion.trim().toLowerCase();
    const master = this.pedidos.find(p => p.fotoUrl && p.descripcion && p.descripcion.trim().toLowerCase() === desc);
    return master ? master.fotoUrl! : null;
  }

  getPluralQuestion(desc: string): string {
    const d = (desc || '').toLowerCase();
    const isMasculine = /buzo|pantalon|jeans|hoodie|sueter|reloj|zapato|tenis|bolso|cargador|celular/.test(d);
    const prefix = isMasculine ? 'todos los' : 'todas las';
    return `${prefix} "${desc}"`;
  }

  getPluralButtonText(desc: string, totalCount: number): string {
    const d = (desc || '').toLowerCase();
    const isMasculine = /buzo|pantalon|jeans|hoodie|sueter|reloj|zapato|tenis|bolso|cargador|celular/.test(d);
    const prefix = isMasculine ? 'todos los' : 'todas las';
    return `Aplicar a ${prefix} ${totalCount} "${desc}"`;
  }

  mostrarObservaciones = false;

  toggleMostrarFotos() {
    this.mostrarFotos = !this.mostrarFotos;
  }

  toggleMostrarObservaciones() {
    this.mostrarObservaciones = !this.mostrarObservaciones;
  }

  toggleAgruparPorProducto() {
    this.agruparPorProducto = !this.agruparPorProducto;
    if (this.agruparPorProducto) {
      this.computeGrupos();
    }
  }

  abrirGaleriaModal() {
    this.computeGrupos(true);
    this.galeriaModalOpen = true;
  }

  criterioOrdenEtapa: 'ACTIVAS' | 'CICLO' | 'RECIBIDAS' = 'ACTIVAS';

  computeGrupos(forceAll = false) {
    const listToGroup = (forceAll || this.pedidosFiltrados.length === 0) ? this.pedidos : this.pedidosFiltrados;
    const map = new Map<string, Pedido[]>();
    
    listToGroup.forEach(p => {
      const key = (p.descripcion || 'Sin Descripción').trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });

    const getStageOrder = (etapa: any) => {
      const e = Number(etapa) || 0;
      if (this.criterioOrdenEtapa === 'CICLO') {
        switch(e) {
          case 0: return 1; // Cotización
          case 1: return 2; // Confirmado
          case 2: return 3; // Pagado
          case 3: return 4; // En Tránsito
          case 4: return 5; // Aduana
          case 5: return 6; // Recibido
          default: return 99;
        }
      } else if (this.criterioOrdenEtapa === 'RECIBIDAS') {
        switch(e) {
          case 5: return 1; // Recibido
          case 3: return 2; // En Tránsito
          case 4: return 3; // Aduana
          case 2: return 4; // Pagado
          case 1: return 5; // Confirmado
          case 0: return 6; // Cotización
          default: return 99;
        }
      } else {
        // ACTIVAS (default)
        switch(e) {
          case 3: return 1; // En Tránsito (prioridad activa)
          case 4: return 2; // Aduana
          case 2: return 3; // Pagado
          case 1: return 4; // Confirmado
          case 0: return 5; // Cotización
          case 5: return 6; // Recibido
          default: return 99;
        }
      }
    };

    this.gruposProductos = Array.from(map.entries()).map(([desc, items]) => {
      // Sort items by stage priority so identical stages stay grouped together ("pegados")
      const sortedItems = [...items].sort((a, b) => getStageOrder(a.etapa) - getStageOrder(b.etapa) || (a.id || 0) - (b.id || 0));

      const firstWithPhoto = sortedItems.find(p => p.fotoUrl);
      const totalQty = sortedItems.reduce((s, x) => s + (x.totalQty || 0), 0);
      const totalYuanes = sortedItems.reduce((s, x) => s + (x.yuanes || 0), 0);
      const totalCop = sortedItems.reduce((s, x) => s + (x.total || 0), 0);

      const stageCounts: { [key: number]: number } = {};
      sortedItems.forEach(x => {
        const et = Number(x.etapa) || 0;
        stageCounts[et] = (stageCounts[et] || 0) + 1;
      });

      return {
        descripcion: desc,
        fotoUrl: firstWithPhoto?.fotoUrl,
        totalQty,
        totalYuanes,
        totalCop,
        pedidos: sortedItems,
        stageCounts,
        filterEtapa: 'TODOS',
        expanded: false
      };
    });
  }

  sortGroup(g: any, col: string) {
    if (g.sortCol === col) {
      g.sortAsc = !g.sortAsc;
    } else {
      g.sortCol = col;
      g.sortAsc = true;
    }
  }

  getFilteredGroupPedidos(g: any): Pedido[] {
    let list = g.pedidos || [];
    if (g && g.filterEtapa && g.filterEtapa !== 'TODOS') {
      list = list.filter((p: Pedido) => String(p.etapa) === String(g.filterEtapa));
    }
    if (g && g.sortCol) {
      const col = g.sortCol;
      const dir = g.sortAsc ? 1 : -1;
      list = [...list].sort((a: any, b: any) => {
        let valA = a[col] ?? '';
        let valB = b[col] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * dir;
        }
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return 0;
      });
    }
    return list;
  }

  private saveDebounceTimer: any;

  onCellChange(pedido: Pedido) {
    const updated = calculateFinancials(pedido);
    Object.assign(pedido, updated);
    this.aplicarFiltros();
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.actualizarPedido(pedido);
    }, 350);
  }

  onEtapaChange(pedido: Pedido, newEtapa: any) {
    pedido.etapa = Number(newEtapa);
    this.actualizarPedido(pedido);
  }

  actualizarPedido(pedido: Pedido) {
    if (!this.canEdit()) return;
    if (!pedido.id) return;
    
    pedido.etapa = Number(pedido.etapa);

    this.pedidoService.updatePedido(pedido.id, pedido).subscribe({
      next: (updated) => {
        if (updated) {
          Object.assign(pedido, updated);
        }
        this.computeGrupos();
        this.aplicarFiltros();
      },
      error: (err) => console.error("Error auto-saving cell:", err)
    });
  }

  eliminarPedido(event: Event, id: number | undefined) {
    event.stopPropagation();
    if (!id) return;
    
    this.showConfirm(
      "¿Eliminar importación?",
      "¿Estás seguro de que deseas eliminar permanentemente este registro de importación de la base de datos?",
      () => {
        this.pedidoService.deletePedido(id).subscribe({
          next: () => {
            this.pedidos = this.pedidos.filter(p => p.id !== id);
            this.selectedIds.delete(id);
            this.aplicarFiltros();
          },
          error: (err) => {
            console.error("Error deleting:", err);
            this.showAlert("Error al eliminar", "No se pudo eliminar el registro. Verifica tu conexión.");
          }
        });
      },
      true,
      "Eliminar"
    );
  }

  // Multi-select
  toggleSelect(id: number) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleSelectAll() {
    if (this.allSelected) {
      this.clearSelection();
    } else {
      this.pedidosFiltrados.forEach(p => { if (p.id) this.selectedIds.add(p.id); });
    }
  }

  clearSelection() {
    this.selectedIds.clear();
  }

  eliminarSeleccionados() {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    this.showConfirm(
      "¿Eliminar seleccionados?",
      `¿Estás seguro de que deseas eliminar permanentemente las ${ids.length} importaciones seleccionadas de la base de datos?`,
      () => {
        this.pedidoService.deleteBatch(ids).subscribe({
          next: () => {
            this.pedidos = this.pedidos.filter(p => !this.selectedIds.has(p.id!));
            this.selectedIds.clear();
            this.aplicarFiltros();
          },
          error: (err) => {
            console.error("Error batch deleting:", err);
            this.showAlert("Error al eliminar", "No se pudo completar la eliminación masiva.");
          }
        });
      },
      true,
      "Eliminar"
    );
  }

  exportarPdf(pedido: Pedido, event?: Event) {
    if (event) event.stopPropagation();
    this.pdfService.exportSinglePedidoPdf(pedido);
  }

  exportarSeleccionPdf() {
    const ids = Array.from(this.selectedIds);
    const seleccionados = this.pedidos.filter(p => ids.includes(p.id!));
    seleccionados.forEach(p => this.pdfService.exportSinglePedidoPdf(p));
  }

  batchUpdateTasa() {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;
    
    this.showPrompt(
      "⚡ Cambiar Tasa COP/RMB",
      `Ingresa la nueva tasa de cambio para los ${ids.length} pedidos seleccionados:`,
      "535",
      "ej. 535",
      (val) => {
        if (!val || !val.trim()) return;
        const nuevaTasa = parseFloat(val);
        if (isNaN(nuevaTasa) || nuevaTasa <= 0) return;

        this.pedidoService.updateBatch({ ids, tasa: nuevaTasa }).subscribe({
          next: () => {
            this.cargarPedidos();
            this.clearSelection();
            this.showAlert("Actualización Masiva", `Se actualizó la Tasa a $${nuevaTasa} para ${ids.length} pedidos.`);
          },
          error: (err) => console.error("Error batch updating tasa:", err)
        });
      }
    );
  }

  batchUpdateCodigo() {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    this.showPrompt(
      "🏷️ Reasignar Lote / Pedido #",
      `Ingresa el nuevo número de Pedido / Lote para los ${ids.length} ítems seleccionados:`,
      "2",
      "ej. 2",
      (val) => {
        if (!val || !val.trim()) return;
        const nuevoCodigo = val.trim();

        this.pedidoService.updateBatch({ ids, codigo: nuevoCodigo }).subscribe({
          next: () => {
            this.cargarPedidos();
            this.clearSelection();
            this.showAlert("Lote Reasignado", `Se reasignaron ${ids.length} ítems al Pedido #${nuevoCodigo}.`);
          },
          error: (err) => console.error("Error batch updating codigo:", err)
        });
      }
    );
  }

  batchUpdateEtapa(etapa: number) {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;
    this.pedidoService.updateBatch({ ids, etapa }).subscribe({
      next: () => {
        this.cargarPedidos();
        this.clearSelection();
      },
      error: (err) => console.error("Error batch updating etapa:", err)
    });
  }

  batchUpdateAbono(abono: boolean) {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;
    this.pedidoService.updateBatch({ ids, abono }).subscribe({
      next: () => {
        this.cargarPedidos();
        this.clearSelection();
      },
      error: (err) => console.error("Error batch updating abono:", err)
    });
  }

  borrarTodo() {
    this.showConfirm(
      "⚠️ ¿Borrar TODA la base de datos?",
      "Esta acción es destructiva e irreversible. Se eliminarán absolutamente TODOS los registros de importación y métricas de forma permanente de la base de datos.",
      () => {
        this.pedidoService.deleteAll().subscribe({
          next: () => {
            this.pedidos = [];
            this.selectedIds.clear();
            this.aplicarFiltros();
          },
          error: (err) => {
            console.error("Error deleting all:", err);
            this.showAlert("Error al borrar todo", "No se pudieron eliminar los registros.");
          }
        });
      },
      true,
      "Sí, borrar todo"
    );
  }

  syncFotoModal = {
    show: false,
    fotoUrl: '',
    descripcion: '',
    count: 0,
    sourceId: 0
  };

  uploadPhoto(event: any, id: number | undefined) {
    if (!id) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Downscale to max 800px to keep base64 string size small
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          const match = this.pedidos.find(p => p.id === id);
          if (match) {
            match.fotoUrl = compressedDataUrl;
            this.actualizarPedido(match);

            if (match.descripcion && match.descripcion.trim()) {
              const sameDescItems = this.pedidos.filter(p => p.id !== id && p.descripcion && p.descripcion.trim().toLowerCase() === match.descripcion.trim().toLowerCase());
              if (sameDescItems.length > 0) {
                this.syncFotoModal = {
                  show: true,
                  fotoUrl: compressedDataUrl,
                  descripcion: match.descripcion.trim(),
                  count: sameDescItems.length,
                  sourceId: id
                };
              }
            }
          }
          
          // Convert base64 data URL to Blob to upload to the server
          const byteString = atob(compressedDataUrl.split(',')[1]);
          const mimeString = compressedDataUrl.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const compressedBlob = new Blob([ab], { type: mimeString });
          const compressedFile = new File([compressedBlob], file.name, { type: mimeString });

          this.pedidoService.uploadPedidoImage(id, compressedFile).subscribe({
            next: (res) => {
              if (res && res.fotoUrl) {
                const match = this.pedidos.find(p => p.id === id);
                if (match) match.fotoUrl = res.fotoUrl;
              }
            },
            error: () => {}
          });
        }
      };
      img.src = e.target.result as string;
    };
    reader.readAsDataURL(file);
  }

  confirmBulkSyncByDesc() {
    if (!this.syncFotoModal.fotoUrl || !this.syncFotoModal.descripcion) return;

    const descToSync = this.syncFotoModal.descripcion.toLowerCase();
    let count = 0;
    this.pedidos.forEach(p => {
      if (p.descripcion && p.descripcion.trim().toLowerCase() === descToSync) {
        p.fotoUrl = this.syncFotoModal.fotoUrl;
        this.actualizarPedido(p);
        count++;
      }
    });
    this.syncFotoModal.show = false;
    this.showAlert("Sincronización Completa", `Se aplicó la foto a ${count} productos "${this.syncFotoModal.descripcion}".`);

    this.pedidoService.bulkSyncFoto({
      fotoUrl: this.syncFotoModal.fotoUrl,
      descripcion: this.syncFotoModal.descripcion
    }).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  batchUploadPhoto(event: any) {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const dataUrl = e.target.result as string;
      ids.forEach(id => {
        const match = this.pedidos.find(p => p.id === id);
        if (match) {
          match.fotoUrl = dataUrl;
          this.actualizarPedido(match);
        }
      });
      this.selectedIds.clear();
      this.showAlert("Foto Aplicada", `Se aplicó la foto a ${ids.length} filas seleccionadas.`);
    };
    reader.readAsDataURL(file);
  }

  formatDateForInput(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }

  onDateChange(pedido: Pedido, value: string) {
    if (value) {
      pedido.fechaNegociacion = new Date(value);
    }
  }

  openPreview(url: string) {
    this.previewImage = url;
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    if (this.previewImage) {
      this.previewImage = null;
    }
    if (this.galeriaModalOpen) {
      this.galeriaModalOpen = false;
    }
    if (this.confirmModal.show) {
      this.cancelConfirm();
    }
    if (this.alertModal.show) {
      this.alertModal.show = false;
    }
  }

  resetFiltros() {
    this.filtros = {
      busqueda: '',
      ciudad: '',
      etapa: null,
      montoMin: null
    };
    this.aplicarFiltros();
  }

  exportarExcel() {
    const token = this.authService.getToken() || '';
    const url = `${API_ROOT}/pedidos/export/excel`;

    fetch(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al exportar');
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Logigho_Importaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => this.showAlert('Error', 'No se pudo generar el archivo Excel.'));
  }

  getCategoryIcon(descripcion: string): string {
    const d = (descripcion || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/camisa|camiseta|ropa|buzo|polo|sueter|pantalon|jeans|hoodie|chaqueta/.test(d)) return '👕';
    if (/reloj|watch|smartwatch/.test(d)) return '⌚';
    if (/maquillaje|cosmetico|skincare|labial|sombra|crema/.test(d)) return '💄';
    if (/tenis|zapato|calzado|sneaker|bota|sandalia/.test(d)) return '👟';
    if (/bolso|maleta|cartera|mochila|morral/.test(d)) return '👜';
    if (/celular|iphone|cable|audifono|gadget|electronica|laptop|cargador/.test(d)) return '🎧';
    return '📦';
  }

  compartirWhatsApp(pedido: Pedido) {
    this.pedidoService.compartirWhatsApp(pedido);
  }

  aplicarFiltros() {
    this.pedidosFiltrados = this.pedidos.filter(p => {
      const q = (this.filtros.busqueda || '').toLowerCase().trim();
      const qNorm = q.replace(/[\s\-_]/g, '');

      const codigoNorm = (p.codigo || '').toLowerCase().replace(/[\s\-_]/g, '');
      const refNorm = (p.referencia || '').toLowerCase().replace(/[\s\-_]/g, '');
      const descNorm = (p.descripcion || '').toLowerCase().replace(/[\s\-_]/g, '');
      const obsNorm = (p.observaciones || '').toLowerCase().replace(/[\s\-_]/g, '');
      const ciudadNorm = (p.ciudad || '').toLowerCase().replace(/[\s\-_]/g, '');
      
      const fechaStr = p.fechaNegociacion ? new Date(p.fechaNegociacion).toLocaleDateString().toLowerCase() : '';
      const fechaIso = p.fechaNegociacion ? new Date(p.fechaNegociacion).toISOString().split('T')[0].toLowerCase() : '';

      const matchSearch = !q || 
                          (p.codigo || '').toLowerCase().includes(q) || 
                          (p.referencia || '').toLowerCase().includes(q) || 
                          (p.descripcion || '').toLowerCase().includes(q) || 
                          (p.observaciones || '').toLowerCase().includes(q) || 
                          (p.ciudad || '').toLowerCase().includes(q) || 
                          fechaStr.includes(q) || 
                          fechaIso.includes(q) ||
                          (qNorm.length > 0 && (
                            codigoNorm.includes(qNorm) ||
                            refNorm.includes(qNorm) ||
                            descNorm.includes(qNorm) ||
                            obsNorm.includes(qNorm) ||
                            ciudadNorm.includes(qNorm)
                          ));

      const matchCiudad = !this.filtros.ciudad || (p.ciudad || '').toLowerCase().includes(this.filtros.ciudad.toLowerCase());
      const matchEtapa = this.filtros.etapa === null || Number(p.etapa) === Number(this.filtros.etapa);
      const matchMonto = this.filtros.montoMin === null || (p.total || 0) >= this.filtros.montoMin;
      
      return matchSearch && matchCiudad && matchEtapa && matchMonto;
    });
  }
}
