import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService, Pedido } from '../../services/pedido.service';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-4">
      <div class="glass-panel p-4">
        <div class="d-flex justify-between items-center mb-4">
          <h2>Tabla de Pedidos</h2>
        </div>

        <div class="filters-bar d-flex gap-4 mb-4">
          <input type="text" class="form-control" placeholder="Buscar por ciudad..." [(ngModel)]="filtros.ciudad" (input)="aplicarFiltros()">
          
          <select class="form-control" [(ngModel)]="filtros.etapa" (change)="aplicarFiltros()">
            <option [ngValue]="null">Todas las etapas</option>
            <option [ngValue]="0">Cotización</option>
            <option [ngValue]="1">Confirmado</option>
            <option [ngValue]="2">Pagado</option>
            <option [ngValue]="3">En Tránsito</option>
            <option [ngValue]="4">Aduana</option>
            <option [ngValue]="5">Recibido</option>
          </select>
          
          <input type="number" class="form-control" placeholder="Monto mínimo..." [(ngModel)]="filtros.montoMin" (input)="aplicarFiltros()">
        </div>

        <div class="table-responsive">
          <table class="table w-full">
            <thead>
              <tr>
                <th>Código</th>
                <th>Ciudad</th>
                <th>Fecha</th>
                <th>Qty</th>
                <th>Etapa</th>
                <th>Total</th>
                <th>Margen</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let pedido of pedidosFiltrados">
                <td>{{ pedido.codigo }}</td>
                <td>{{ pedido.ciudad }}</td>
                <td>{{ pedido.fechaNegociacion | date:'shortDate' }}</td>
                <td>{{ pedido.totalQty }}</td>
                <td>
                  <span class="badge" [ngClass]="getBadgeClass(pedido.etapa)">
                    {{ getEtapaName(pedido.etapa) }}
                  </span>
                </td>
                <td>{{ (pedido.total || 0) | currency:'USD' }}</td>
                <td [ngClass]="{'text-success': (pedido.ganancia || 0) > 0, 'text-danger': (pedido.ganancia || 0) <= 0}">
                  {{ (pedido.ganancia || 0) | currency:'USD' }}
                </td>
              </tr>
              <tr *ngIf="pedidosFiltrados.length === 0">
                <td colspan="7" class="text-center py-4 text-secondary">No se encontraron resultados</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .p-4 { padding: 1.5rem; }
    .py-4 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
    .table-responsive { overflow-x: auto; }
    .table { border-collapse: collapse; text-align: left; }
    .table th, .table td { padding: 1rem; border-bottom: 1px solid var(--card-border); }
    .table th { color: var(--text-secondary); font-weight: 500; }
    .table tr:hover { background-color: rgba(255,255,255,0.02); }
    .text-success { color: var(--success); }
    .text-danger { color: var(--danger); }
    .filters-bar .form-control { width: 250px; }
  `]
})
export class TableComponent implements OnInit {
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];
  
  filtros = {
    ciudad: '',
    etapa: null as number | null,
    montoMin: null as number | null
  };

  constructor(private pedidoService: PedidoService) {}

  ngOnInit() {
    this.pedidoService.getPedidos().subscribe(data => {
      this.pedidos = data;
      this.aplicarFiltros();
    });
  }

  aplicarFiltros() {
    this.pedidosFiltrados = this.pedidos.filter(p => {
      const matchCiudad = !this.filtros.ciudad || p.ciudad.toLowerCase().includes(this.filtros.ciudad.toLowerCase());
      const matchEtapa = this.filtros.etapa === null || p.etapa === this.filtros.etapa;
      const matchMonto = this.filtros.montoMin === null || (p.total || 0) >= this.filtros.montoMin;
      return matchCiudad && matchEtapa && matchMonto;
    });
  }

  getEtapaName(etapa: number): string {
    const nombres = ['Cotización', 'Confirmado', 'Pagado', 'En Tránsito', 'Aduana', 'Recibido'];
    return nombres[etapa] || 'Unknown';
  }

  getBadgeClass(etapa: number): string {
    const clases = ['badge-cotizacion', 'badge-confirmado', 'badge-pagado', 'badge-entransito', 'badge-aduana', 'badge-recibido'];
    return clases[etapa] || '';
  }
}
