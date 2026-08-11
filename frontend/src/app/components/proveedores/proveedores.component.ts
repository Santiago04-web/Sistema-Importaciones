import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../services/language.service';

export interface Proveedor {
  id?: number;
  nombre: string;
  ciudadChina: string;
  contactoEmail?: string;
  contactoTelefono?: string;
  notas?: string;
  pedidos?: any[];
}

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="proveedores-page">
      
      <div class="page-header">
        <div>
          <h2 class="page-title">🏬 {{ langService.t('nav_proveedores') }}</h2>
          <p class="page-sub">Gestión de fabricantes en China y comparación de precios/tiempos</p>
        </div>
        <button class="btn-new" (click)="openModal()">+ Agregar Proveedor</button>
      </div>

      <div class="suppliers-grid">
        <div class="supplier-card glass-card" *ngFor="let p of proveedores">
          <div class="card-top">
            <span class="supp-city">📍 {{ p.ciudadChina }}</span>
            <span class="supp-badge">{{ (p.pedidos?.length || 0) }} Pedidos</span>
          </div>

          <h3 class="supp-name">{{ p.nombre }}</h3>
          
          <div class="supp-details">
            <p *ngIf="p.contactoEmail">📧 {{ p.contactoEmail }}</p>
            <p *ngIf="p.contactoTelefono">📱 {{ p.contactoTelefono }}</p>
            <p *ngIf="p.notas" class="supp-notes">📝 {{ p.notas }}</p>
          </div>

          <div class="card-actions">
            <button class="btn-action" (click)="editProveedor(p)">✏️ Editar</button>
          </div>
        </div>
      </div>

      <!-- CREATE/EDIT MODAL -->
      <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
        <div class="modal-card glass-card" (click)="$event.stopPropagation()">
          <h3>{{ editingId ? 'Editar Proveedor' : 'Nuevo Proveedor' }}</h3>
          
          <div class="form-group">
            <label>Nombre del Fabricante / Proveedor</label>
            <input type="text" [(ngModel)]="formData.nombre" placeholder="ej. Guangzhou Textile Ltd." class="form-input">
          </div>

          <div class="form-group">
            <label>Ciudad en China</label>
            <input type="text" [(ngModel)]="formData.ciudadChina" placeholder="Guangzhou, Yiwu, Shenzhen..." class="form-input">
          </div>

          <div class="form-group">
            <label>Email de Contacto</label>
            <input type="email" [(ngModel)]="formData.contactoEmail" placeholder="vendor@china.com" class="form-input">
          </div>

          <div class="form-group">
            <label>Teléfono / WeChat</label>
            <input type="text" [(ngModel)]="formData.contactoTelefono" placeholder="+86 138..." class="form-input">
          </div>

          <div class="form-group">
            <label>Notas</label>
            <textarea [(ngModel)]="formData.notas" rows="3" class="form-input"></textarea>
          </div>

          <div class="modal-btns">
            <button class="btn-sec" (click)="showModal = false">Cancelar</button>
            <button class="btn-pri" (click)="guardar()">Guardar</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .proveedores-page {
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
    .suppliers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .supplier-card {
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #cbd5e1;
      margin-bottom: 0.75rem;
    }
    .supp-badge {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
    }
    .supp-name {
      font-size: 1.1rem;
      font-weight: 800;
      color: #f8fafc;
      margin-bottom: 0.5rem;
    }
    .supp-details p {
      font-size: 0.82rem;
      color: #cbd5e1;
      margin-bottom: 4px;
    }
    .supp-notes {
      color: #94a3b8 !important;
      font-style: italic;
    }
    .card-actions {
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .btn-action {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.78rem;
      cursor: pointer;
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
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  showModal = false;
  editingId: number | null = null;
  formData: Proveedor = { nombre: '', ciudadChina: 'Guangzhou' };

  constructor(
    private http: HttpClient,
    public langService: LanguageService
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.http.get<Proveedor[]>('http://localhost:5174/api/proveedores').subscribe({
      next: (data) => this.proveedores = data || []
    });
  }

  openModal() {
    this.editingId = null;
    this.formData = { nombre: '', ciudadChina: 'Guangzhou' };
    this.showModal = true;
  }

  editProveedor(p: Proveedor) {
    this.editingId = p.id || null;
    this.formData = { ...p };
    this.showModal = true;
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
}
