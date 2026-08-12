import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_ROOT = isLocal ? 'http://localhost:5174/api' : 'https://sistema-importaciones.onrender.com/api';

import { LanguageService } from '../../services/language.service';

export interface Contenedor {
  id?: number;
  numeroContenedor: string;
  fechaZarpe?: string;
  fechaEstimadaLlegada?: string;
  naviera: string;
  estado: string;
  notas?: string;
  pedidos?: any[];
}

@Component({
  selector: 'app-contenedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="contenedores-page">
      
      <div class="page-header">
        <div>
          <h2 class="page-title">🚢 {{ langService.t('nav_contenedores') }}</h2>
          <p class="page-sub">Agrupación de pedidos por número de contenedor y seguimiento marítimo</p>
        </div>
        <button class="btn-new" (click)="openModal()">+ Nuevo Embarque</button>
      </div>

      <div class="containers-list">
        <div class="container-card glass-card" *ngFor="let c of contenedores">
          <div class="card-header">
            <div class="num-box">
              <span class="ship-icon">🚢</span>
              <div>
                <h3 class="cont-num">{{ c.numeroContenedor }}</h3>
                <span class="naviera-tag">Naviera: {{ c.naviera || 'Por asignar' }}</span>
              </div>
            </div>
            <span class="status-pill" [class]="c.estado.toLowerCase()">{{ c.estado }}</span>
          </div>

          <div class="card-dates">
            <div class="date-item">
              <span class="d-lbl">Fecha Zarpe:</span>
              <span class="d-val">{{ c.fechaZarpe ? (c.fechaZarpe | date:'dd/MM/yyyy') : 'Pendiente' }}</span>
            </div>
            <div class="date-item">
              <span class="d-lbl">ETA Estimada:</span>
              <span class="d-val highlight">{{ c.fechaEstimadaLlegada ? (c.fechaEstimadaLlegada | date:'dd/MM/yyyy') : 'Pendiente' }}</span>
            </div>
          </div>

          <div class="orders-group">
            <h4 class="grp-title">📦 Pedidos asignados a este contenedor ({{ c.pedidos?.length || 0 }}):</h4>
            <div class="orders-chips">
              <span class="ord-chip" *ngFor="let p of c.pedidos">
                <strong>{{ p.codigo }}</strong> - {{ p.descripcion }}
              </span>
              <span *ngIf="!c.pedidos || c.pedidos.length === 0" class="no-orders">
                Sin pedidos asignados a este embarque.
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL -->
      <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
        <div class="modal-card glass-card" (click)="$event.stopPropagation()">
          <h3>Nuevo Embarque / Contenedor</h3>
          
          <div class="form-group">
            <label>Número de Contenedor (BL)</label>
            <input type="text" [(ngModel)]="formData.numeroContenedor" placeholder="ej. MAEU1234567" class="form-input">
          </div>

          <div class="form-group">
            <label>Naviera</label>
            <input type="text" [(ngModel)]="formData.naviera" placeholder="Maersk, Cosco, Evergreen..." class="form-input">
          </div>

          <div class="form-group">
            <label>Estado del Embarque</label>
            <select [(ngModel)]="formData.estado" class="form-input">
              <option value="EnPuerto">En Puerto</option>
              <option value="EnMar">En Navegación / Mar</option>
              <option value="EnAduana">En Aduana Destino</option>
              <option value="Entregado">Entregado</option>
            </select>
          </div>

          <div class="form-group">
            <label>Fecha de Zarpe</label>
            <input type="date" [(ngModel)]="formData.fechaZarpe" class="form-input">
          </div>

          <div class="form-group">
            <label>Fecha Estimada de Llegada (ETA)</label>
            <input type="date" [(ngModel)]="formData.fechaEstimadaLlegada" class="form-input">
          </div>

          <div class="modal-btns">
            <button class="btn-sec" (click)="showModal = false">Cancelar</button>
            <button class="btn-pri" (click)="guardar()">Crear Embarque</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .contenedores-page {
      padding: 1.5rem 2rem;
      color: #f8fafc;
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
      color: #f8fafc;
    }
    .page-sub {
      color: #cbd5e1;
      font-size: 0.85rem;
    }
    .btn-new {
      background: #3b82f6;
      color: #fff;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }
    .containers-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .container-card {
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: 14px;
      padding: 1.25rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .num-box {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ship-icon {
      font-size: 1.8rem;
    }
    .cont-num {
      font-size: 1.2rem;
      font-weight: 800;
      color: #38bdf8;
    }
    .naviera-tag {
      font-size: 0.78rem;
      color: #cbd5e1;
    }
    .status-pill {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .status-pill.enpuerto { background: rgba(234, 179, 8, 0.15); color: #facc15; }
    .status-pill.enmar { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .status-pill.enaduana { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
    .status-pill.entregado { background: rgba(34, 197, 94, 0.15); color: #4ade80; }

    .card-dates {
      display: flex;
      gap: 2rem;
      padding: 0.75rem 0;
      border-top: 1px solid rgba(255,255,255,0.06);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 1rem;
    }
    .date-item {
      font-size: 0.82rem;
    }
    .d-lbl { color: #94a3b8; margin-right: 6px; }
    .d-val { color: #f8fafc; font-weight: 600; }
    .d-val.highlight { color: #38bdf8; font-weight: 700; }

    .grp-title {
      font-size: 0.82rem;
      color: #cbd5e1;
      margin-bottom: 0.5rem;
    }
    .orders-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .ord-chip {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.78rem;
      color: #e2e8f0;
    }
    .no-orders {
      font-size: 0.78rem;
      color: #94a3b8;
      font-style: italic;
    }

    /* MODAL */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    .modal-card {
      width: 90%;
      max-width: 460px;
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.35);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .form-group label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #cbd5e1;
    }
    .form-input {
      background: #020617;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      color: #f8fafc;
      outline: none;
    }
    .modal-btns {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 0.5rem;
    }
    .btn-sec {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      padding: 6px 14px;
      border-radius: 8px;
      cursor: pointer;
    }
    .btn-pri {
      background: #3b82f6;
      color: #fff;
      border: none;
      padding: 6px 16px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }
  `]
})
export class ContenedoresComponent implements OnInit {
  contenedores: Contenedor[] = [];
  showModal = false;
  formData: Contenedor = { numeroContenedor: '', naviera: '', estado: 'EnPuerto' };

  constructor(
    private http: HttpClient,
    public langService: LanguageService
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.http.get<Contenedor[]>(`${API_ROOT}/contenedores`).subscribe({
      next: (data) => this.contenedores = data || []
    });
  }

  openModal() {
    this.formData = { numeroContenedor: '', naviera: '', estado: 'EnPuerto' };
    this.showModal = true;
  }

  guardar() {
    if (!this.formData.numeroContenedor) return;

    this.http.post(`${API_ROOT}/contenedores`, this.formData).subscribe({
      next: () => {
        this.showModal = false;
        this.cargar();
      }
    });
  }
}
