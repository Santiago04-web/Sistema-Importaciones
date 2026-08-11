import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export interface Proveedor {
  id?: number;
  nombre: string;
  ciudadChina: string;
  categoria: string;
  contactoEmail?: string;
  contactoTelefono?: string;
  weChatId?: string;
  calificacion: number;
  notas?: string;
  pedidos?: any[];
}

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="proveedores-console">
      
      <!-- HEADER CONSOLE TITLE -->
      <div class="console-header">
        <div>
          <h2 class="title">Proveedores</h2>
          <p class="subtitle">Gestión de proveedores y directorio de contactos</p>
        </div>
        <button class="btn-primary-add" (click)="openModal()">
          <span>+ Agregar Proveedor</span>
        </button>
      </div>

      <!-- KPI METRICS SUMMARY GRID -->
      <div class="kpi-grid">
        <div class="kpi-card glass-card">
          <div class="kpi-icon-box blue">🏬</div>
          <div class="kpi-info">
            <span class="kpi-label">Total Proveedores</span>
            <strong class="kpi-value">{{ proveedores.length }}</strong>
            <span class="kpi-sub">Proveedores activos</span>
          </div>
        </div>

        <div class="kpi-card glass-card">
          <div class="kpi-icon-box green">💰</div>
          <div class="kpi-info">
            <span class="kpi-label">Inversión Total</span>
            <strong class="kpi-value">$ {{ formatNum(totalSpentAll) }}</strong>
            <span class="kpi-sub">Total en pedidos</span>
          </div>
        </div>

        <div class="kpi-card glass-card">
          <div class="kpi-icon-box purple">📦</div>
          <div class="kpi-info">
            <span class="kpi-label">Total Pedidos</span>
            <strong class="kpi-value">{{ totalOrdersCount }}</strong>
            <span class="kpi-sub">{{ totalQtyAll | number }} unidades</span>
          </div>
        </div>

        <div class="kpi-card glass-card">
          <div class="kpi-icon-box yellow">⭐</div>
          <div class="kpi-info">
            <span class="kpi-label">Calificación</span>
            <strong class="kpi-value">{{ avgRating | number:'1.1-1' }} / 5.0</strong>
            <span class="kpi-sub">Promedio general</span>
          </div>
        </div>
      </div>

      <!-- FILTER TOOLBAR & SEARCH -->
      <div class="filter-toolbar glass-card">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" [(ngModel)]="searchQuery" (input)="filterProveedores()" 
                 placeholder="Buscar por proveedor, ciudad, WeChat, teléfono..." class="search-input">
        </div>

        <div class="city-filters">
          <button class="city-chip" [class.active]="selectedCity === 'ALL'" (click)="setCity('ALL')">Todas</button>
          <button class="city-chip" [class.active]="selectedCity === 'Guangzhou'" (click)="setCity('Guangzhou')">Guangzhou</button>
          <button class="city-chip" [class.active]="selectedCity === 'Yiwu'" (click)="setCity('Yiwu')">Yiwu</button>
          <button class="city-chip" [class.active]="selectedCity === 'Shenzhen'" (click)="setCity('Shenzhen')">Shenzhen</button>
          <button class="city-chip" [class.active]="selectedCity === 'Ningbo'" (click)="setCity('Ningbo')">Ningbo</button>
          <button class="city-chip" [class.active]="selectedCity === 'Foshan'" (click)="setCity('Foshan')">Foshan</button>
        </div>

        <div class="view-toggle">
          <button class="toggle-btn" [class.active]="viewMode === 'cards'" (click)="viewMode = 'cards'">Tarjetas</button>
          <button class="toggle-btn" [class.active]="viewMode === 'table'" (click)="viewMode = 'table'">Tabla</button>
        </div>
      </div>

      <!-- VIEW MODE 1: CARDS GRID -->
      <div class="suppliers-cards-grid" *ngIf="viewMode === 'cards' && filteredProveedores.length > 0">
        <div class="supplier-card glass-card" *ngFor="let p of filteredProveedores">
          
          <div class="card-top-bar">
            <div class="city-tag">
              <span>{{ p.ciudadChina || 'Guangzhou' }}</span>
            </div>
            <div class="stars-box" [title]="'Calificación: ' + p.calificacion + ' estrellas'">
              <span *ngFor="let s of [1,2,3,4,5]" class="star" [class.filled]="s <= p.calificacion">★</span>
            </div>
          </div>

          <div class="card-main-info">
            <div class="cat-pill">
              <span>{{ p.categoria || 'General' }}</span>
            </div>
            <h3 class="supp-title">{{ p.nombre }}</h3>
          </div>

          <!-- METRICS -->
          <div class="supp-metrics">
            <div class="metric-item">
              <span class="m-lbl">Pedidos</span>
              <strong class="m-val">{{ p.pedidos?.length || 0 }}</strong>
            </div>
            <div class="metric-item">
              <span class="m-lbl">Invertido</span>
              <strong class="m-val highlight">$ {{ formatNum(getProveedorTotal(p)) }}</strong>
            </div>
            <div class="metric-item">
              <span class="m-lbl">Unidades</span>
              <strong class="m-val">{{ getProveedorQty(p) | number }}</strong>
            </div>
          </div>

          <!-- CONTACT INFO -->
          <div class="contact-box">
            <div class="contact-row" *ngIf="p.weChatId">
              <span class="c-lbl">WeChat:</span>
              <strong class="c-val text-green">{{ p.weChatId }}</strong>
            </div>
            <div class="contact-row" *ngIf="p.contactoTelefono">
              <span class="c-lbl">Teléfono:</span>
              <a [href]="'https://wa.me/' + p.contactoTelefono" target="_blank" class="c-val link-blue">{{ p.contactoTelefono }}</a>
            </div>
            <div class="contact-row" *ngIf="p.contactoEmail">
              <span class="c-lbl">Email:</span>
              <span class="c-val">{{ p.contactoEmail }}</span>
            </div>
            <p *ngIf="p.notas" class="supp-notes">"{{ p.notas }}"</p>
          </div>

          <!-- ACTIONS FOOTER -->
          <div class="card-actions-footer">
            <button class="action-btn edit" (click)="editProveedor(p)">Editar</button>
            <button class="action-btn delete" (click)="deleteProveedor(p)">Eliminar</button>
          </div>

        </div>
      </div>

      <!-- VIEW MODE 2: COMPARATIVE TABLE -->
      <div class="table-container glass-card" *ngIf="viewMode === 'table' && filteredProveedores.length > 0">
        <table class="comp-table">
          <thead>
            <tr>
              <th>PROVEEDOR</th>
              <th>CIUDAD</th>
              <th>CATEGORÍA</th>
              <th>PEDIDOS</th>
              <th>INVERSIÓN TOTAL</th>
              <th>UNIDADES</th>
              <th>CALIFICACIÓN</th>
              <th>WECHAT / TELÉFONO</th>
              <th class="text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filteredProveedores">
              <td>
                <strong class="tbl-name">{{ p.nombre }}</strong>
              </td>
              <td>
                <span class="tbl-city">{{ p.ciudadChina }}</span>
              </td>
              <td>
                <span class="cat-pill sm">{{ p.categoria }}</span>
              </td>
              <td><strong>{{ p.pedidos?.length || 0 }}</strong></td>
              <td><strong class="text-green">$ {{ formatNum(getProveedorTotal(p)) }}</strong></td>
              <td>{{ getProveedorQty(p) | number }} pzas</td>
              <td>
                <span class="tbl-stars">
                  <span *ngFor="let s of [1,2,3,4,5]" class="star" [class.filled]="s <= p.calificacion">★</span>
                </span>
              </td>
              <td>
                <div class="tbl-contact">
                  <span *ngIf="p.weChatId" class="text-green">WeChat: {{ p.weChatId }}</span>
                  <span *ngIf="p.contactoTelefono" class="text-blue">Tel: {{ p.contactoTelefono }}</span>
                </div>
              </td>
              <td class="text-right">
                <button class="tbl-btn edit" (click)="editProveedor(p)">✏️</button>
                <button class="tbl-btn del" (click)="deleteProveedor(p)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- EMPTY STATE -->
      <div class="empty-state glass-card" *ngIf="filteredProveedores.length === 0">
        <div class="empty-icon">🏬</div>
        <h3>No se encontraron proveedores</h3>
        <p>Prueba con otros términos de búsqueda o agrega un nuevo proveedor.</p>
        <button class="btn-primary-add" (click)="openModal()">+ Agregar Proveedor</button>
      </div>

      <!-- MODAL FORM CREATE / EDIT -->
      <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
        <div class="modal-card glass-card" (click)="$event.stopPropagation()">
          
          <div class="modal-header">
            <h3>{{ editingId ? 'Editar Proveedor' : 'Agregar Proveedor' }}</h3>
            <button class="btn-close" (click)="showModal = false">✕</button>
          </div>

          <div class="form-grid">
            
            <div class="form-group full">
              <label>Nombre del Proveedor *</label>
              <input type="text" [(ngModel)]="formData.nombre" placeholder="ej. Guangzhou Xingwang Garment Co., Ltd." class="form-input">
            </div>

            <div class="form-group">
              <label>Ciudad</label>
              <select [(ngModel)]="formData.ciudadChina" class="form-input">
                <option value="Guangzhou">Guangzhou</option>
                <option value="Yiwu">Yiwu</option>
                <option value="Shenzhen">Shenzhen</option>
                <option value="Ningbo">Ningbo</option>
                <option value="Foshan">Foshan</option>
                <option value="Dongguan">Dongguan</option>
              </select>
            </div>

            <div class="form-group">
              <label>Categoría</label>
              <select [(ngModel)]="formData.categoria" class="form-input">
                <option value="Ropa">Ropa / Textiles</option>
                <option value="Relojes">Relojes / Joyería</option>
                <option value="Maquillaje">Cosméticos / Maquillaje</option>
                <option value="Calzado">Calzado / Zapatos</option>
                <option value="Bolsos">Bolsos / Accesorios</option>
                <option value="Electrónica">Electrónica</option>
                <option value="General">General / Varios</option>
              </select>
            </div>

            <div class="form-group">
              <label>WeChat ID</label>
              <input type="text" [(ngModel)]="formData.weChatId" placeholder="ej. wxid_gz_textile88" class="form-input">
            </div>

            <div class="form-group">
              <label>Teléfono / WhatsApp</label>
              <input type="text" [(ngModel)]="formData.contactoTelefono" placeholder="+86 138 0013 8000" class="form-input">
            </div>

            <div class="form-group full">
              <label>Correo Electrónico</label>
              <input type="email" [(ngModel)]="formData.contactoEmail" placeholder="supplier@export-china.com" class="form-input">
            </div>

            <div class="form-group full">
              <label>Calificación (1 a 5 estrellas)</label>
              <div class="rating-picker">
                <span *ngFor="let star of [1,2,3,4,5]" 
                      class="pick-star" 
                      [class.active]="star <= formData.calificacion"
                      (click)="formData.calificacion = star">★</span>
                <span class="rating-lbl">{{ formData.calificacion }} / 5 Estrellas</span>
              </div>
            </div>

            <div class="form-group full">
              <label>Notas</label>
              <textarea [(ngModel)]="formData.notas" rows="3" placeholder="Observaciones adicionales..." class="form-input"></textarea>
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="showModal = false">Cancelar</button>
            <button class="btn-save" (click)="guardar()">Guardar Fabricante</button>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .proveedores-console {
      max-width: 1440px;
      margin: 0 auto;
      padding: 1rem 1.5rem 3rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* HEADER */
    .console-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.68rem;
      font-weight: 800;
      color: #3b82f6;
      margin-bottom: 6px;
    }
    .live-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; box-shadow: 0 0 8px #3b82f6;
    }
    .title {
      font-size: 1.6rem; font-weight: 800; color: #f8fafc; margin-bottom: 2px;
    }
    .subtitle {
      font-size: 0.85rem; color: #cbd5e1;
    }
    .btn-primary-add {
      background: #3b82f6;
      color: #ffffff;
      border: none;
      padding: 0.65rem 1.35rem;
      border-radius: 10px;
      font-weight: 800;
      font-size: 0.9rem;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.35);
      transition: all 0.2s ease;
    }
    .btn-primary-add:hover {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
    }

    /* KPI GRID */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.25rem;
    }
    .kpi-card {
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .kpi-icon-box {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.35rem; flex-shrink: 0;
    }
    .kpi-icon-box.blue { background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); }
    .kpi-icon-box.green { background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); }
    .kpi-icon-box.purple { background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); }
    .kpi-icon-box.yellow { background: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.3); }
    
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .kpi-value { font-size: 1.35rem; font-weight: 800; color: #f8fafc; margin: 2px 0; }
    .kpi-sub { font-size: 0.72rem; color: #cbd5e1; }

    /* TOOLBAR */
    .filter-toolbar {
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: 16px;
      padding: 0.85rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .search-box {
      position: relative;
      flex: 1;
      min-width: 280px;
    }
    .search-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 0.9rem;
    }
    .search-input {
      width: 100%;
      background: #020617;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      padding: 0.55rem 0.85rem 0.55rem 2.2rem;
      color: #f8fafc;
      font-size: 0.88rem;
      outline: none;
    }
    .search-input:focus { border-color: #3b82f6; }

    .city-filters {
      display: flex; gap: 6px; flex-wrap: wrap;
    }
    .city-chip {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .city-chip.active, .city-chip:hover {
      background: #3b82f6; color: #fff; border-color: #3b82f6;
    }

    .view-toggle { display: flex; gap: 4px; background: rgba(0,0,0,0.3); padding: 3px; border-radius: 8px; }
    .toggle-btn {
      background: transparent; border: none; color: #94a3b8; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer;
    }
    .toggle-btn.active { background: #3b82f6; color: #fff; }

    /* CARDS GRID */
    .suppliers-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .supplier-card {
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .supplier-card:hover {
      transform: translateY(-4px);
      border-color: rgba(59, 130, 246, 0.5);
    }
    .card-top-bar {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;
    }
    .city-tag {
      display: flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 700; color: #cbd5e1;
      background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 6px;
    }
    .stars-box { display: flex; gap: 2px; }
    .star { color: #475569; font-size: 0.95rem; }
    .star.filled { color: #facc15; }

    .supp-title { font-size: 1.15rem; font-weight: 800; color: #f8fafc; margin-top: 4px; margin-bottom: 0.75rem; }
    .cat-pill {
      display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: 700;
      color: #60a5fa; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 2px 8px; border-radius: 6px;
    }
    .cat-pill.sm { font-size: 0.7rem; padding: 1px 6px; }

    .supp-metrics {
      display: flex; justify-content: space-between; background: #020617; border-radius: 10px; padding: 0.65rem 0.85rem; margin: 0.75rem 0;
    }
    .metric-item { display: flex; flex-direction: column; }
    .m-lbl { font-size: 0.68rem; color: #94a3b8; font-weight: 700; }
    .m-val { font-size: 0.88rem; color: #f8fafc; font-weight: 800; }
    .m-val.highlight { color: #10b981; }

    .contact-box {
      display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; padding: 0.5rem 0;
    }
    .contact-row { display: flex; align-items: center; gap: 6px; }
    .c-icon { font-size: 0.9rem; }
    .c-lbl { color: #94a3b8; }
    .c-val { font-weight: 600; color: #f8fafc; }
    .text-green { color: #4ade80 !important; }
    .text-blue { color: #60a5fa !important; }
    .link-blue { color: #60a5fa; text-decoration: none; }
    .link-blue:hover { text-decoration: underline; }
    .supp-notes { color: #94a3b8; font-style: italic; font-size: 0.75rem; margin-top: 4px; }

    .card-actions-footer {
      display: flex; gap: 8px; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.08);
    }
    .action-btn {
      flex: 1; padding: 6px; border-radius: 8px; font-size: 0.78rem; font-weight: 700; cursor: pointer; border: none;
    }
    .action-btn.edit { background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; }
    .action-btn.delete { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; }

    /* TABLE */
    .table-container { background: #0f172a; border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 16px; overflow-x: auto; }
    .comp-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .comp-table th { background: rgba(255,255,255,0.03); color: #94a3b8; padding: 0.85rem 1rem; text-align: left; font-size: 0.72rem; font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .comp-table td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: #cbd5e1; }
    .tbl-name { color: #f8fafc; font-weight: 800; font-size: 0.9rem; }
    .tbl-city { color: #cbd5e1; font-size: 0.8rem; }
    .tbl-stars .star { font-size: 0.8rem; }
    .tbl-contact { display: flex; flex-direction: column; font-size: 0.75rem; gap: 2px; }
    .text-right { text-align: right; }
    .tbl-btn { background: transparent; border: none; cursor: pointer; font-size: 0.9rem; margin-left: 6px; opacity: 0.8; }
    .tbl-btn:hover { opacity: 1; }

    /* EMPTY STATE */
    .empty-state { text-align: center; padding: 3rem 1.5rem; color: #cbd5e1; }
    .empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }

    /* MODAL */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 99999; }
    .modal-card { width: 92%; max-width: 540px; background: #0f172a; border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 20px; padding: 1.75rem; box-shadow: 0 25px 60px rgba(0,0,0,0.8); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .modal-header h3 { font-size: 1.25rem; font-weight: 800; color: #f8fafc; }
    .btn-close { background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; }
    
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group.full { grid-column: span 2; }
    .form-group label { font-size: 0.75rem; font-weight: 700; color: #cbd5e1; }
    .form-input { background: #020617; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 0.6rem 0.85rem; color: #f8fafc; outline: none; font-size: 0.88rem; }
    .form-input:focus { border-color: #3b82f6; }

    .rating-picker { display: flex; align-items: center; gap: 8px; background: #020617; padding: 0.4rem 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); }
    .pick-star { font-size: 1.3rem; color: #475569; cursor: pointer; transition: transform 0.1s; }
    .pick-star.active, .pick-star:hover { color: #facc15; transform: scale(1.2); }
    .rating-lbl { font-size: 0.78rem; color: #cbd5e1; font-weight: 700; margin-left: 8px; }

    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 1.25rem; }
    .btn-cancel { background: transparent; border: 1px solid rgba(255, 255, 255, 0.15); color: #cbd5e1; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-save { background: #3b82f6; color: #fff; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 800; cursor: pointer; }
  `]
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  filteredProveedores: Proveedor[] = [];
  
  searchQuery = '';
  selectedCity = 'ALL';
  viewMode: 'cards' | 'table' = 'cards';

  totalSpentAll = 0;
  totalOrdersCount = 0;
  totalQtyAll = 0;
  avgRating = 5.0;

  showModal = false;
  editingId: number | null = null;
  formData: Proveedor = { nombre: '', ciudadChina: 'Guangzhou', categoria: 'Ropa', calificacion: 5 };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.http.get<Proveedor[]>('http://localhost:5174/api/proveedores').subscribe({
      next: (data) => {
        this.proveedores = data || [];
        this.computeStats();
        this.filterProveedores();
      }
    });
  }

  computeStats() {
    this.totalSpentAll = 0;
    this.totalOrdersCount = 0;
    this.totalQtyAll = 0;
    let sumRating = 0;

    this.proveedores.forEach(p => {
      sumRating += p.calificacion || 5;
      if (p.pedidos) {
        this.totalOrdersCount += p.pedidos.length;
        p.pedidos.forEach(ord => {
          this.totalSpentAll += ord.total || 0;
          this.totalQtyAll += ord.totalQty || 0;
        });
      }
    });

    this.avgRating = this.proveedores.length > 0 ? (sumRating / this.proveedores.length) : 5.0;
  }

  filterProveedores() {
    const q = (this.searchQuery || '').trim().toLowerCase();
    
    this.filteredProveedores = this.proveedores.filter(p => {
      const matchCity = this.selectedCity === 'ALL' || p.ciudadChina === this.selectedCity;
      const matchQuery = !q || 
        p.nombre.toLowerCase().includes(q) ||
        p.ciudadChina.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        (p.weChatId && p.weChatId.toLowerCase().includes(q)) ||
        (p.contactoTelefono && p.contactoTelefono.toLowerCase().includes(q));

      return matchCity && matchQuery;
    });
  }

  setCity(city: string) {
    this.selectedCity = city;
    this.filterProveedores();
  }

  getProveedorTotal(p: Proveedor): number {
    if (!p.pedidos) return 0;
    return p.pedidos.reduce((s, ord) => s + (ord.total || 0), 0);
  }

  getProveedorQty(p: Proveedor): number {
    if (!p.pedidos) return 0;
    return p.pedidos.reduce((s, ord) => s + (ord.totalQty || 0), 0);
  }

  getCategoryIcon(cat: string): string {
    const c = (cat || '').toLowerCase();
    if (c.includes('ropa') || c.includes('textil')) return '👕';
    if (c.includes('reloj') || c.includes('joy')) return '⌚';
    if (c.includes('maquillaje') || c.includes('cosmet')) return '💄';
    if (c.includes('calzado') || c.includes('zapato')) return '👟';
    if (c.includes('bolso') || c.includes('malet')) return '👜';
    if (c.includes('electr') || c.includes('celular')) return '🎧';
    return '📦';
  }

  openModal() {
    this.editingId = null;
    this.formData = { nombre: '', ciudadChina: 'Guangzhou', categoria: 'Ropa', calificacion: 5 };
    this.showModal = true;
  }

  editProveedor(p: Proveedor) {
    this.editingId = p.id || null;
    this.formData = { ...p };
    this.showModal = true;
  }

  deleteProveedor(p: Proveedor) {
    if (!p.id) return;
    if (confirm(`¿Estás seguro de eliminar al fabricante "${p.nombre}"?`)) {
      this.http.delete(`http://localhost:5174/api/proveedores/${p.id}`).subscribe({
        next: () => this.cargar()
      });
    }
  }

  guardar() {
    if (!this.formData.nombre) return;

    if (this.editingId) {
      this.http.put(`http://localhost:5174/api/proveedores/${this.editingId}`, this.formData).subscribe({
        next: () => {
          this.showModal = false;
          this.cargar();
        }
      });
    } else {
      this.http.post('http://localhost:5174/api/proveedores', this.formData).subscribe({
        next: () => {
          this.showModal = false;
          this.cargar();
        }
      });
    }
  }

  formatNum(n: number): string {
    return (n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
}
