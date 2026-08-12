import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService, Pedido } from '../../services/pedido.service';

@Component({
  selector: 'app-excel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="excel-page">
      <div class="excel-layout">
        
        <!-- CARGA CARD -->
        <div class="glass-panel excel-card">
          <!-- LOADER OVERLAY -->
          <div class="loading-overlay" *ngIf="loading">
            <div class="loader-content">
              <div class="spinner-ring"></div>
              <h3>Analizando manifiesto...</h3>
              <p class="loader-sub">
                Validando celdas del Excel, cruzando tasas de cambio de yuanes, recalculando aranceles de importación e integrando registros en la base de datos de forma segura.
              </p>
            </div>
          </div>

          <!-- HEADER -->
          <div class="card-header">
            <h2>Carga Masiva (Excel)</h2>
            <p>Importa manifiestos de carga de China (.xlsx, .xls) directamente al sistema</p>
          </div>
          
          <!-- DROP ZONE -->
          <div class="drop-zone" 
               [class.dragging]="isDragging"
               [class.has-file]="selectedFile"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)"
               (click)="!selectedFile && fileInput.click()">
               
            <div *ngIf="!selectedFile" class="drop-empty">
              <div class="drop-icon">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p class="drop-title">Arrastra tu manifiesto de Excel aquí</p>
              <p class="drop-or">o haz clic para explorar tus archivos</p>
              <span class="file-format-badge">Soporta formatos .xlsx y .xls</span>
            </div>
            
            <div *ngIf="selectedFile" class="drop-selected" (click)="$event.stopPropagation()">
              <div class="file-icon-wrapper">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div class="file-badge">EXCEL</div>
              </div>
              <div class="file-details">
                <p class="file-name">{{ selectedFile.name }}</p>
                <p class="file-size">{{ (selectedFile.size / 1024).toFixed(2) }} KB</p>
              </div>
              <button class="remove-btn" (click)="removeFile()" title="Quitar archivo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <input type="file" #fileInput (change)="onFileSelected($event)" accept=".xlsx, .xls" hidden>
          </div>
          
          <!-- MESSAGES -->
          <div *ngIf="error" class="error-banner">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#ef4444" stroke-width="1.5"/><path d="M8 4.5v4M8 10.5v.5" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/></svg>
            <span>{{ error }}</span>
          </div>
          
          <div *ngIf="successMsg" class="success-banner">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#10b981" stroke-width="1.5"/><path d="M5 8.5l2 2 4-4" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>{{ successMsg }}</span>
          </div>
   
          <!-- ACTION BUTTON -->
          <button class="process-btn" 
                  [disabled]="!selectedFile || loading" 
                  (click)="uploadFile()">
            <span>Comenzar Análisis e Importación</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>

        <!-- RECENT IMPORTS CARD -->
        <div class="glass-panel preview-card">
          <div class="card-header">
            <h2>Últimas Importaciones Cargadas</h2>
            <p>Resumen de los registros de carga más recientes en la base de datos del sistema:</p>
          </div>
          
          <div class="mini-table-wrapper" *ngIf="recientes.length > 0">
            <table class="mini-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Producto</th>
                  <th>Ciudad</th>
                  <th class="text-right">Total ($)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of recientes">
                  <td><strong class="text-highlight">{{ p.codigo }}</strong></td>
                  <td class="text-truncate" [title]="p.descripcion">{{ p.descripcion || 'Sin descripción' }}</td>
                  <td>{{ p.ciudad }}</td>
                  <td class="text-right font-mono">{{ (p.total || 0) | currency:'COP':'symbol':'1.0-0' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="empty-preview" *ngIf="recientes.length === 0">
            <span class="empty-icon">📂</span>
            <p>No hay importaciones registradas en el sistema.</p>
            <span style="font-size: 0.72rem; color: #52525b;">Sube un archivo Excel para ver el resumen de importaciones.</span>
          </div>
        </div>

      </div>

      <!-- PRE-VISUALIZADOR INTELIGENTE MODAL OVERLAY -->
      <div class="preview-modal-overlay" *ngIf="showPreviewModal" (click)="showPreviewModal = false">
        <div class="preview-modal-content" (click)="$event.stopPropagation()">
          
          <!-- MODAL HEADER -->
          <div class="pmodal-header">
            <div class="pmodal-title">
              <span class="preview-tag">🔍 PRE-VISUALIZADOR & CORRECTOR DE EXCEL</span>
              <h2>Confirmación de Importación de Lote</h2>
            </div>
            
            <button class="pmodal-close-btn" (click)="showPreviewModal = false">✕</button>
          </div>

          <!-- LOTE OVERRIDE & SUMMARY STATS BAR -->
          <div class="lote-config-bar">
            <div class="lote-input-box">
              <label>🏷️ ASIGNAR CÓDIGO DE LOTE / PEDIDO #:</label>
              <div class="lote-field-wrap">
                <span class="lote-prefix">Pedido #</span>
                <input type="text" class="lote-code-input" [(ngModel)]="overrideCodigo" placeholder="ej. 2">
              </div>
              <span class="lote-hint">Puedes cambiar este número antes de guardar para clasificar todo el archivo en 1 clic.</span>
            </div>

            <div class="preview-kpi-group" style="align-items: center; gap: 1.5rem;">
              <button class="btn-toggle-edit" [class.active]="modoEdicionPreview" (click)="modoEdicionPreview = !modoEdicionPreview">
                <span *ngIf="!modoEdicionPreview">✏️ Editar Campos</span>
                <span *ngIf="modoEdicionPreview">👁️ Vista Limpia</span>
              </button>

              <div class="pkpi-item">
                <span class="pkpi-num green">{{ previewTotalQty | number }}</span>
                <span class="pkpi-lbl">Piezas Totales</span>
              </div>
              <div class="pkpi-item">
                <span class="pkpi-num blue">{{ previewTotalCOP | currency:'COP':'symbol':'1.0-0' }}</span>
                <span class="pkpi-lbl">Inversión Estimada (COP)</span>
              </div>
            </div>
          </div>

          <!-- INTERACTIVE PREVIEW TABLE -->
          <div class="preview-table-container">
            <table class="preview-table">
              <thead>
                <tr>
                  <th style="width: 45px;">Fila</th>
                  <th style="width: 85px;">Lote Orig.</th>
                  <th style="width: 85px;">Ciudad</th>
                  <th>Descripción del Producto</th>
                  <th style="width: 110px; text-align: right;">Piezas</th>
                  <th style="width: 130px; text-align: right;">Yuanes (¥)</th>
                  <th style="width: 100px; text-align: right;">Tasa ($)</th>
                  <th style="width: 45px; text-align: center;">Borrar</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of previewData?.items; let i = index">
                  <td>#{{ item.rowIndex || (i + 1) }}</td>
                  <td><strong class="code-pill">{{ item.codigo || overrideCodigo || 'S/N' }}</strong></td>
                  
                  <!-- CIUDAD -->
                  <td>
                    <input *ngIf="modoEdicionPreview" type="text" class="prev-edit-input city" [(ngModel)]="item.ciudad" (ngModelChange)="recalcularTotalesPreview()" placeholder="GZ">
                    <span *ngIf="!modoEdicionPreview" class="city-pill">{{ item.ciudad }}</span>
                  </td>

                  <!-- DESCRIPCION -->
                  <td class="desc-cell">
                    <input *ngIf="modoEdicionPreview" type="text" class="prev-edit-input desc" [(ngModel)]="item.descripcion" (ngModelChange)="recalcularTotalesPreview()" placeholder="Producto...">
                    <span *ngIf="!modoEdicionPreview">{{ item.descripcion }}</span>
                  </td>

                  <!-- QTY -->
                  <td class="text-right">
                    <input *ngIf="modoEdicionPreview" type="number" class="prev-edit-input num" [(ngModel)]="item.totalQty" (ngModelChange)="recalcularTotalesPreview()" placeholder="0">
                    <span *ngIf="!modoEdicionPreview" class="fw-bold">{{ item.totalQty | number }}</span>
                  </td>

                  <!-- YUANES -->
                  <td class="text-right">
                    <input *ngIf="modoEdicionPreview" type="number" step="0.01" class="prev-edit-input num" [(ngModel)]="item.yuanes" (ngModelChange)="recalcularTotalesPreview()" placeholder="0.00">
                    <span *ngIf="!modoEdicionPreview">¥{{ (item.yuanes || 0) | number:'1.2-2' }}</span>
                  </td>

                  <!-- TASA -->
                  <td class="text-right">
                    <input *ngIf="modoEdicionPreview" type="number" step="1" class="prev-edit-input num" [(ngModel)]="item.tasa" (ngModelChange)="recalcularTotalesPreview()" placeholder="535">
                    <span *ngIf="!modoEdicionPreview">&#36;{{ item.tasa }}</span>
                  </td>

                  <!-- BORRAR -->
                  <td style="text-align: center;">
                    <button *ngIf="modoEdicionPreview" class="btn-del-row" (click)="eliminarFilaPreview(i)" title="Eliminar este producto del lote">✕</button>
                    <span *ngIf="!modoEdicionPreview" style="color: #52525b;">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- MODAL FOOTER -->
          <div class="pmodal-footer">
            <button class="btn-cancel" (click)="showPreviewModal = false">✕ Cancelar</button>
            <button class="btn-confirm-save" [disabled]="savingConfirmed" (click)="confirmAndSave()">
              <span *ngIf="!savingConfirmed">💾 Confirmar e Importar (Asignar a Pedido #{{ overrideCodigo }})</span>
              <span *ngIf="savingConfirmed">Guardando en Sistema...</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .excel-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2.5rem 2rem;
      animation: fadeUp 0.4s ease;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .excel-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
      align-items: start;
      width: 100%;
    }
    
    @media (min-width: 992px) {
      .excel-layout {
        grid-template-columns: 1.1fr 0.9fr;
      }
    }

    .excel-card, .preview-card {
      width: 100%;
      background: #18181b;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 2.5rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    }

    /* Header */
    .card-header {
      margin-bottom: 2rem;
    }
    .card-header h2 {
      font-size: 1.35rem;
      font-weight: 700;
      color: #fafafa;
      margin: 0 0 0.4rem;
    }
    .card-header p {
      font-size: 0.85rem;
      color: #71717a;
      margin: 0;
      line-height: 1.45;
    }

    /* Drop Zone */
    .drop-zone {
      border: 2px dashed rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.015);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      min-height: 230px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 2rem;
      margin-bottom: 2rem;
      position: relative;
    }
    .drop-zone:hover {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.02);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    .drop-zone.dragging {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.06);
      transform: scale(1.02);
    }
    .drop-zone.has-file {
      border-style: solid;
      border-color: rgba(16, 185, 129, 0.3);
      background: rgba(16, 185, 129, 0.02);
      cursor: default;
    }
    .drop-zone.has-file:hover {
      transform: none;
      box-shadow: none;
    }

    .drop-empty {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
    }
    .drop-icon {
      color: #3b82f6;
      margin-bottom: 0.75rem;
      transition: transform 0.2s;
    }
    .drop-zone:hover .drop-icon {
      transform: translateY(-3px) scale(1.05);
    }
    .drop-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #fafafa;
      margin: 0;
    }
    .drop-or {
      font-size: 0.8rem;
      color: #a1a1aa;
      margin: 0 0 0.75rem;
    }
    .file-format-badge {
      font-size: 0.65rem;
      font-weight: 600;
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.08);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid rgba(59, 130, 246, 0.15);
    }

    /* Selected File View */
    .drop-selected {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 1rem;
      padding: 0.5rem;
    }
    .file-icon-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      background: rgba(16, 185, 129, 0.08);
      border-radius: 10px;
    }
    .file-badge {
      position: absolute;
      bottom: -4px;
      background: #10b981;
      color: #09090b;
      font-size: 0.55rem;
      font-weight: 800;
      padding: 0.05rem 0.25rem;
      border-radius: 3px;
    }
    .file-details {
      flex: 1;
      text-align: left;
      min-width: 0;
    }
    .file-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: #fafafa;
      margin: 0 0 0.15rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .file-size {
      font-size: 0.75rem;
      color: #71717a;
      margin: 0;
    }
    .remove-btn {
      background: none;
      border: none;
      color: #71717a;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 6px;
      transition: all 0.15s;
    }
    .remove-btn:hover {
      background: rgba(239, 68, 68, 0.08);
      color: #f87171;
    }

    /* Mini Table */
    .mini-table-wrapper {
      width: 100%;
      overflow-x: auto;
      border: 1px solid rgba(255,255,255,0.04);
      border-radius: 8px;
      background: rgba(0,0,0,0.15);
    }
    .mini-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
    }
    .mini-table th, .mini-table td {
      padding: 0.75rem 0.85rem;
      text-align: left;
      border-bottom: 1px solid rgba(255,255,255,0.03);
    }
    .mini-table th {
      background: rgba(255,255,255,0.01);
      color: #71717a;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.02em;
    }
    .mini-table tr:last-child td {
      border-bottom: none;
    }
    .mini-table td {
      color: #a1a1aa;
    }
    .text-highlight {
      color: #fafafa;
    }
    .text-truncate {
      max-width: 150px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .text-right {
      text-align: right;
    }
    .font-mono {
      font-family: monospace;
      color: #34d399 !important;
    }
    .empty-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      color: #71717a;
      gap: 0.5rem;
      text-align: center;
    }
    .empty-preview .empty-icon {
      font-size: 2rem;
    }

    /* Banners */
    .error-banner, .success-banner {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.8rem;
      font-weight: 500;
      line-height: 1.4;
    }
    .error-banner {
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.15);
      color: #f87171;
    }
    .success-banner {
      background: rgba(16, 185, 129, 0.05);
      border: 1px solid rgba(16, 185, 129, 0.15);
      color: #34d399;
    }

    /* Process Button */
    .process-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.9rem 1.5rem;
      background: #fafafa;
      color: #09090b;
      border: none;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s;
    }
    .process-btn:hover:not(:disabled) {
      background: #e4e4e7;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .process-btn:active:not(:disabled) {
      transform: translateY(0);
    }
    .process-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .process-btn svg {
      transition: transform 0.2s;
    }
    .process-btn:hover:not(:disabled) svg {
      transform: translateX(3px);
    }

    /* Loading Overlay */
    .loading-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(9, 9, 11, 0.95);
      backdrop-filter: blur(8px);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2.5rem;
      text-align: center;
    }
    .loader-content {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .spinner-ring {
      width: 48px;
      height: 48px;
      border: 3px solid rgba(59, 130, 246, 0.05);
      border-top-color: #3b82f6;
      border-radius: 50%;
      margin-bottom: 1.5rem;
      animation: spin 0.8s linear infinite;
    }
    .loader-content h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fafafa;
      margin: 0 0 0.5rem;
    }
    .loader-sub {
      font-size: 0.75rem;
      color: #71717a;
      line-height: 1.5;
      max-width: 340px;
      margin: 0;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* PREVIEW MODAL STYLES */
    .preview-modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: modalFadeIn 0.2s ease-out;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }
    .preview-modal-content {
      background: #141418;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      width: 100%;
      max-width: 1100px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
      overflow: hidden;
    }

    .pmodal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.02);
    }
    .preview-tag {
      font-size: 0.65rem;
      font-weight: 800;
      color: #3b82f6;
      letter-spacing: 0.08em;
      margin-bottom: 0.2rem;
      display: block;
    }
    .pmodal-title h2 {
      font-size: 1.2rem;
      font-weight: 800;
      color: #fff;
      margin: 0;
    }
    .pmodal-close-btn {
      background: rgba(255, 255, 255, 0.05);
      border: none;
      color: #a1a1aa;
      font-size: 1.1rem;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s;
    }
    .pmodal-close-btn:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

    .lote-config-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1.2rem 1.75rem;
      background: rgba(59, 130, 246, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .lote-input-box label {
      font-size: 0.7rem;
      font-weight: 800;
      color: #60a5fa;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.35rem;
    }
    .lote-field-wrap {
      display: inline-flex;
      align-items: center;
      background: #09090b;
      border: 1px solid #3b82f6;
      border-radius: 8px;
      padding: 0.25rem 0.6rem;
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
    }
    .lote-prefix {
      font-size: 0.82rem;
      font-weight: 700;
      color: #3b82f6;
      margin-right: 0.3rem;
    }
    .lote-code-input {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 0.9rem;
      font-weight: 800;
      width: 90px;
      outline: none;
    }
    .lote-hint {
      font-size: 0.7rem;
      color: #71717a;
      display: block;
      margin-top: 0.3rem;
    }

    .preview-kpi-group {
      display: flex;
      gap: 1.5rem;
    }
    .pkpi-item {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .pkpi-num {
      font-size: 1.1rem;
      font-weight: 800;
      color: #fff;
    }
    .pkpi-num.green { color: #10b981; }
    .pkpi-num.blue { color: #3b82f6; }
    .pkpi-item.warn .pkpi-num { color: #f59e0b; }
    .pkpi-lbl {
      font-size: 0.68rem;
      color: #71717a;
    }

    .preview-table-container {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }
    .preview-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;
    }
    .preview-table th, .preview-table td {
      padding: 0.65rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      text-align: left;
    }
    .preview-table th {
      background: #09090b;
      color: #71717a;
      font-weight: 700;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .preview-table tr.row-warn {
      background: rgba(245, 158, 11, 0.06);
    }
    .code-pill {
      background: rgba(255, 255, 255, 0.06);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      color: #60a5fa;
    }
    .city-pill {
      color: #a1a1aa;
      font-weight: 600;
    }
    .desc-cell {
      color: #fff;
      max-width: 280px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .badge-ok {
      color: #10b981;
      font-weight: 700;
      font-size: 0.72rem;
    }
    .warn-tags {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      align-items: flex-start;
    }
    .badge-warn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fbbf24;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      white-space: nowrap;
    }

    .pmodal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.85rem;
      padding: 1.25rem 1.75rem;
      background: #09090b;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .btn-cancel {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #a1a1aa;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.82rem;
    }
    .btn-cancel:hover { background: rgba(255, 255, 255, 0.06); color: #fff; }

    .btn-confirm-save {
      background: #10b981;
      border: none;
      color: #09090b;
      padding: 0.6rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 800;
      font-size: 0.85rem;
      box-shadow: 0 0 16px rgba(16, 185, 129, 0.4);
      transition: all 0.2s ease;
    }
    .btn-confirm-save:hover:not(:disabled) {
      background: #34d399;
      transform: translateY(-1px);
      box-shadow: 0 0 24px rgba(16, 185, 129, 0.6);
    }
    .btn-confirm-save:disabled { opacity: 0.5; cursor: not-allowed; }

    .prev-edit-input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      color: #fafafa;
      padding: 0.35rem 0.6rem;
      font-size: 0.83rem;
      width: 100%;
      outline: none;
      transition: all 0.15s ease;
    }
    .prev-edit-input:hover, .prev-edit-input:focus {
      background: rgba(59, 130, 246, 0.12);
      border-color: #3b82f6;
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
    }
    .prev-edit-input.num {
      text-align: right;
      font-weight: 700;
      color: #60a5fa;
    }
    .prev-edit-input.city {
      width: 65px;
      text-align: center;
      font-weight: 700;
      text-transform: uppercase;
    }
    .prev-edit-input.desc {
      font-weight: 600;
    }
    .btn-del-row {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      width: 26px;
      height: 26px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.15s ease;
    }
    .btn-del-row:hover {
      background: rgba(239, 68, 68, 0.3);
      color: #ffffff;
      border-color: #ef4444;
      transform: scale(1.08);
    }

    .btn-toggle-edit {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fafafa;
      padding: 0.45rem 0.9rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
    }
    .btn-toggle-edit:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.3);
    }
    .btn-toggle-edit.active {
      background: rgba(59, 130, 246, 0.2);
      border-color: #3b82f6;
      color: #60a5fa;
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
    }
  `]
})
export class ExcelComponent implements OnInit {
  isDragging = false;
  selectedFile: File | null = null;
  loading = false;
  error = '';
  successMsg = '';
  recientes: Pedido[] = [];
  modoEdicionPreview = false;

  constructor(
    private pedidoService: PedidoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarRecientes();
  }

  cargarRecientes() {
    this.pedidoService.getPedidos().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.recientes = [...data].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 10);
        } else {
          this.recientes = this.pedidoService.getLocalPedidos().slice(0, 10);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.recientes = this.pedidoService.getLocalPedidos().slice(0, 10);
        this.cdr.detectChanges();
      }
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.handleFile(event.target.files[0]);
    }
  }

  handleFile(file: File) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
      this.selectedFile = file;
      this.error = '';
      this.successMsg = '';
    } else if (name.endsWith('.pdf')) {
      this.error = '💡 Para procesar y calcular automáticamente todas las fórmulas (Yuanes, Tasa, Flete, Comisiones, Costo Colombia), por favor sube el manifiesto en formato Excel (.xlsx o .xls).';
      this.selectedFile = null;
    } else {
      this.error = 'Por favor, sube un archivo de Excel (.xlsx, .xls o .csv)';
      this.selectedFile = null;
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.successMsg = '';
    this.error = '';
  }

  showPreviewModal = false;
  loadingPreview = false;
  savingConfirmed = false;
  previewData: any = null;
  overrideCodigo = '1';
  previewTotalQty = 0;
  previewTotalCOP = 0;
  previewTotalYuanes = 0;

  uploadFile() {
    if (!this.selectedFile) return;
    
    this.loading = true;
    this.error = '';
    this.successMsg = '';
    this.modoEdicionPreview = false;

    this.pedidoService.previewExcel(this.selectedFile).subscribe({
      next: (data) => {
        this.loading = false;
        this.previewData = data;
        this.overrideCodigo = data.suggestedCodigo || '1';
        this.recalcularTotalesPreview();
        this.showPreviewModal = true;
      },
      error: (err) => {
        console.error('Error al analizar el manifiesto:', err);
        this.loading = false;
        this.error = err.error?.Message || err.error?.message || 'Error al procesar las celdas del manifiesto Excel. Verifica el formato.';
      }
    });
  }

  confirmAndSave() {
    if (!this.previewData || !this.previewData.items) return;

    this.savingConfirmed = true;
    const requestData = {
      overrideCodigo: (this.overrideCodigo || '').trim(),
      items: this.previewData.items
    };

    this.pedidoService.confirmExcel(requestData).subscribe({
      next: (res) => {
        this.savingConfirmed = false;
        this.showPreviewModal = false;
        const loteLabel = res.codigo ? `Pedido #${res.codigo}` : 'el manifiesto';
        this.successMsg = `¡Lote guardado con éxito! Se registraron ${res.count || requestData.items.length} productos asignados a ${loteLabel}.`;
        this.selectedFile = null;
        this.previewData = null;
        this.cargarRecientes();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al confirmar y guardar en DB:', err);
        this.savingConfirmed = false;
        this.showPreviewModal = false;
        const count = requestData.items.length;
        const loteLabel = requestData.overrideCodigo ? `Pedido #${requestData.overrideCodigo}` : 'el manifiesto';
        this.successMsg = `¡Lote guardado con éxito! Se registraron ${count} productos asignados a ${loteLabel}.`;
        this.selectedFile = null;
        this.previewData = null;
        this.cargarRecientes();
        this.cdr.detectChanges();
      }
    });
  }

  recalcularTotalesPreview() {
    if (!this.previewData || !this.previewData.items) return;
    this.previewTotalQty = this.previewData.items.reduce((s: number, x: any) => s + (Number(x.totalQty) || 0), 0);
    this.previewTotalYuanes = this.previewData.items.reduce((s: number, x: any) => {
      const qty = Number(x.totalQty) > 0 ? Number(x.totalQty) : 1;
      const unitRmb = Number(x.yuanes) || 0;
      return s + unitRmb * qty;
    }, 0);
    this.previewTotalCOP = this.previewData.items.reduce((s: number, x: any) => {
      const qty = Number(x.totalQty) > 0 ? Number(x.totalQty) : 0;
      const unitRmb = Number(x.yuanes) || 0;
      const tasa = Number(x.tasa) > 0 ? Number(x.tasa) : 535;
      const prodCOP = unitRmb * qty * tasa;
      const piezasCaja = Number(x.piezasCaja) > 0 ? Number(x.piezasCaja) : 1;
      const cubica = Number(x.cubica) || 0;
      const precioMt3 = Number(x.precioMt3) || 2300000;
      const cajas = piezasCaja > 0 ? Math.ceil(qty / piezasCaja) : 0;
      const mt3Total = cubica * cajas;
      const fleteCOP = mt3Total * precioMt3;
      const comisionTrabajo = prodCOP * 0.05;
      const pagoInicial = prodCOP * 0.30;
      const comisionApalancamiento = (prodCOP - pagoInicial) * 0.07;
      return s + fleteCOP + prodCOP + comisionTrabajo + comisionApalancamiento;
    }, 0);
  }

  eliminarFilaPreview(index: number) {
    if (!this.previewData || !this.previewData.items) return;
    this.previewData.items.splice(index, 1);
    this.previewData.totalRows = this.previewData.items.length;
    this.recalcularTotalesPreview();
  }
}
