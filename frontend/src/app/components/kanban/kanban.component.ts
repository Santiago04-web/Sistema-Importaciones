import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { PedidoService, Pedido } from '../../services/pedido.service';

interface ColumnaEtapa {
  id: number;
  nombre: string;
  pedidos: Pedido[];
}

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  template: `
    <div class="container mt-4">
      <h2 class="mb-4">Tablero Kanban</h2>
      
      <div class="kanban-board d-flex gap-4">
        <div class="kanban-column glass-panel" *ngFor="let col of columnas">
          <div class="column-header d-flex justify-between items-center mb-4">
            <h4>{{ col.nombre }}</h4>
            <span class="badge" [ngClass]="getBadgeClass(col.id)">{{ col.pedidos.length }}</span>
          </div>
          
          <div class="column-content"
               cdkDropList
               [cdkDropListData]="col.pedidos"
               (cdkDropListDropped)="drop($event, col.id)">
            
            <div class="kanban-card glass-panel mb-4" *ngFor="let pedido of col.pedidos" cdkDrag>
              <div class="card-header d-flex justify-between items-center mb-2">
                <span class="fw-bold">{{ pedido.codigo || 'S/N' }}</span>
                <span class="text-secondary">{{ pedido.fechaNegociacion | date:'shortDate' }}</span>
              </div>
              <div class="card-body">
                <p class="mb-1 text-sm"><i class="fas fa-city mr-2"></i> {{ pedido.ciudad }}</p>
                <p class="mb-1 text-sm"><i class="fas fa-box mr-2"></i> Qty: {{ pedido.totalQty }}</p>
                <div class="mt-2 text-right">
                  <span class="text-primary fw-bold">{{ (pedido.total || 0) | currency:'USD' }}</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kanban-board {
      overflow-x: auto;
      padding-bottom: 1rem;
      min-height: 70vh;
    }
    .kanban-column {
      min-width: 300px;
      width: 300px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
    }
    .column-content {
      flex: 1;
      min-height: 100px;
    }
    .kanban-card {
      padding: 1rem;
      cursor: grab;
      border: 1px solid rgba(255,255,255,0.05);
      background: rgba(30, 41, 59, 0.9);
    }
    .kanban-card:active {
      cursor: grabbing;
    }
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: var(--radius-md);
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      opacity: 0.9;
    }
    .cdk-drag-placeholder {
      opacity: 0.3;
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .text-sm { font-size: 0.875rem; }
    .fw-bold { font-weight: 600; }
  `]
})
export class KanbanComponent implements OnInit {
  columnas: ColumnaEtapa[] = [
    { id: 0, nombre: 'Cotización', pedidos: [] },
    { id: 1, nombre: 'Confirmado', pedidos: [] },
    { id: 2, nombre: 'Pagado', pedidos: [] },
    { id: 3, nombre: 'En Tránsito', pedidos: [] },
    { id: 4, nombre: 'Aduana', pedidos: [] },
    { id: 5, nombre: 'Recibido', pedidos: [] }
  ];

  constructor(private pedidoService: PedidoService) {}

  ngOnInit() {
    this.cargarPedidos();
  }

  cargarPedidos() {
    this.pedidoService.getPedidos().subscribe(pedidos => {
      // Limpiar columnas
      this.columnas.forEach(c => c.pedidos = []);
      // Distribuir
      pedidos.forEach(p => {
        const col = this.columnas.find(c => c.id === p.etapa);
        if (col) col.pedidos.push(p);
      });
    });
  }

  drop(event: CdkDragDrop<Pedido[]>, newEtapaId: number) {
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

  getBadgeClass(etapa: number): string {
    const clases = ['badge-cotizacion', 'badge-confirmado', 'badge-pagado', 'badge-entransito', 'badge-aduana', 'badge-recibido'];
    return clases[etapa] || '';
  }
}
