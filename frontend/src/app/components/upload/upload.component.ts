import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PedidoService, Pedido } from '../../services/pedido.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="form-container">
      <div class="dark-card">
        <h2>Nueva Importación Manual</h2>
        
        <form (ngSubmit)="guardar()" class="mt-4">
          <div class="form-group">
            <label>Código de Pedido</label>
            <input type="text" class="form-control" placeholder="Ej: P-2026-08" [(ngModel)]="formulario.codigo" name="codigo" required>
          </div>
          
          <div class="row-2">
            <div class="form-group flex-1">
              <label>Ciudad de Origen</label>
              <input type="text" class="form-control" placeholder="Ej: YIWU" [(ngModel)]="formulario.ciudad" name="ciudad" required>
            </div>
            <div class="form-group flex-1">
              <label>Fecha de Negociación</label>
              <input type="date" class="form-control" [(ngModel)]="formulario.fecha" name="fecha" required>
            </div>
          </div>
          
          <div class="form-group">
            <label>Descripción (品名)</label>
            <input type="text" class="form-control" placeholder="Ej: Calzado deportivo" [(ngModel)]="formulario.descripcion" name="descripcion">
          </div>
          
          <div class="form-group">
            <label>Observaciones (要求)</label>
            <textarea class="form-control" rows="3" placeholder="Observaciones adicionales..." [(ngModel)]="formulario.observaciones" name="observaciones"></textarea>
          </div>
          
          <div class="row-2">
            <div class="form-group flex-1">
              <label>Total Inversión ($)</label>
              <input type="number" class="form-control" placeholder="0.00" [(ngModel)]="formulario.total" name="total">
            </div>
            <div class="form-group flex-1">
              <label>Etapa Inicial</label>
              <select class="form-control" [(ngModel)]="formulario.etapa" name="etapa">
                <option value="0">Cotización</option>
                <option value="1">Confirmado</option>
                <option value="2">Pagado</option>
                <option value="3">En Tránsito</option>
                <option value="4">Aduana</option>
                <option value="5">Recibido</option>
              </select>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-outline" routerLink="/table">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Registro</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 3rem 2rem;
      min-height: calc(100vh - 80px);
      background: #09090b;
    }
    
    .dark-card {
      background: #18181b;
      border-radius: 10px;
      padding: 2.5rem 3rem;
      width: 100%;
      max-width: 600px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    .dark-card h2 {
      color: #fafafa;
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 2rem;
      letter-spacing: -0.02em;
    }
    
    .row-2 {
      display: flex;
      gap: 1.5rem;
    }
    
    .flex-1 {
      flex: 1;
    }
    
    .form-group {
      margin-bottom: 1.5rem;
      display: flex;
      flex-direction: column;
    }
    
    .form-group label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #a1a1aa;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .form-control {
      background: #09090b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 0.75rem 1rem;
      color: #fafafa;
      font-family: inherit;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    
    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2.5rem;
    }
    
    select.form-control {
      cursor: pointer;
    }
    option {
      background: #18181b;
      color: #fafafa;
    }
  `]
})
export class UploadComponent {
  formulario: any = {
    codigo: '',
    ciudad: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    observaciones: '',
    total: null,
    etapa: '0'
  };

  constructor(private pedidoService: PedidoService, private router: Router) {}

  guardar() {
    const p = {
      codigo: this.formulario.codigo || 'S/N',
      ciudad: this.formulario.ciudad || 'No city',
      fechaNegociacion: new Date(this.formulario.fecha),
      descripcion: this.formulario.descripcion,
      observaciones: this.formulario.observaciones,
      total: this.formulario.total || 0,
      etapa: parseInt(this.formulario.etapa),
      totalQty: 0,
      yuanes: 0,
      piezasCaja: 0,
      cubica: 0,
      tasa: 0,
      precioMt3: 0,
      porcentajeEhuk: 0
    } as Pedido;
    
    this.pedidoService.createPedido(p).subscribe({
      next: () => {
        this.router.navigate(['/table']);
      },
      error: (err) => {
        console.error('Error saving manual order:', err);
        alert('Error al guardar la importación.');
      }
    });
  }
}
