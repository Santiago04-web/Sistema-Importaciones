import { Component, OnInit, OnDestroy, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pedido } from '../../services/pedido.service';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cmd-overlay" *ngIf="isOpen" (click)="close()">
      <div class="cmd-dialog glass-card" (click)="$event.stopPropagation()">
        
        <div class="cmd-search-bar">
          <span class="cmd-search-icon">🔍</span>
          <input type="text" 
                 #searchInput
                 [(ngModel)]="query" 
                 (input)="onSearchChange()" 
                 (keydown)="onKeyDown($event)"
                 placeholder="Buscar por código, descripción, ciudad, referencia o valor (Ctrl + K)..." 
                 class="cmd-input">
          <kbd class="cmd-esc-tag">ESC</kbd>
        </div>

        <div class="cmd-results" *ngIf="filteredList.length > 0">
          <div class="cmd-item" 
               *ngFor="let item of filteredList; let i = index" 
               [class.active]="i === selectedIndex"
               (click)="selectItem(item)"
               (mouseenter)="selectedIndex = i">
            
            <div class="cmd-item-left">
              <span class="cmd-code-pill">{{ item.referencia || item.codigo || 'S/N' }}</span>
              <div class="cmd-item-info">
                <strong class="cmd-item-desc">{{ item.descripcion || 'Sin Descripción' }}</strong>
                <span class="cmd-item-sub">📍 {{ item.ciudad }} · Qty {{ item.totalQty | number }}</span>
              </div>
            </div>

            <div class="cmd-item-right">
              <span class="cmd-item-price">$ {{ (item.total || 0) | number:'1.0-0' }} COP</span>
              <span class="cmd-stage-tag">{{ getEtapaName(item.etapa) }}</span>
            </div>
          </div>
        </div>

        <div class="cmd-empty" *ngIf="filteredList.length === 0 && query">
          <span>🔍 No se encontraron importaciones coincidentes con "{{ query }}"</span>
        </div>

        <div class="cmd-footer">
          <span>Navegar <kbd>↑</kbd> <kbd>↓</kbd> · Seleccionar <kbd>↵</kbd> · Cerrar <kbd>ESC</kbd></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cmd-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding-top: 5vh;
      animation: fadeIn 0.15s ease;
    }
    .cmd-dialog {
      width: 90%;
      max-width: 680px;
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    }
    .cmd-search-bar {
      display: flex;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      gap: 12px;
    }
    .cmd-search-icon {
      font-size: 1.2rem;
    }
    .cmd-input {
      flex: 1;
      background: transparent;
      border: none;
      color: #f8fafc;
      font-size: 1.05rem;
      font-weight: 500;
      outline: none;
    }
    .cmd-input::placeholder {
      color: #64748b;
    }
    .cmd-esc-tag {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #94a3b8;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
    }
    .cmd-results {
      max-height: 380px;
      overflow-y: auto;
      padding: 0.5rem;
    }
    .cmd-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.15s ease;
      margin-bottom: 2px;
    }
    .cmd-item.active {
      background: rgba(59, 130, 246, 0.2);
    }
    .cmd-item-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cmd-code-pill {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .cmd-item-info {
      display: flex;
      flex-direction: column;
    }
    .cmd-item-desc {
      color: #f1f5f9;
      font-size: 0.9rem;
      font-weight: 600;
    }
    .cmd-item-sub {
      color: #64748b;
      font-size: 0.75rem;
    }
    .cmd-item-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .cmd-item-price {
      color: #10b981;
      font-weight: 700;
      font-size: 0.9rem;
    }
    .cmd-stage-tag {
      font-size: 0.7rem;
      color: #94a3b8;
    }
    .cmd-empty {
      padding: 2rem;
      text-align: center;
      color: #64748b;
    }
    .cmd-footer {
      padding: 0.6rem 1.25rem;
      background: rgba(0, 0, 0, 0.3);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 0.72rem;
      color: #64748b;
      text-align: right;
    }
    .cmd-footer kbd {
      background: rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 1px 4px;
      border-radius: 3px;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
  @Input() pedidos: Pedido[] = [];
  @Output() selectPedido = new EventEmitter<Pedido>();

  isOpen = false;
  query = '';
  filteredList: Pedido[] = [];
  selectedIndex = 0;

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.toggle();
    } else if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  ngOnInit() {
    this.filteredList = this.pedidos.slice(0, 8);
  }

  ngOnDestroy() {}

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.query = '';
      this.filteredList = this.pedidos.slice(0, 8);
      this.selectedIndex = 0;
    }
  }

  close() {
    this.isOpen = false;
  }

  onSearchChange() {
    const q = this.query.trim().toLowerCase();
    if (!q) {
      this.filteredList = this.pedidos.slice(0, 8);
    } else {
      this.filteredList = this.pedidos.filter(p => 
        (p.codigo || '').toLowerCase().includes(q) ||
        (p.referencia || '').toLowerCase().includes(q) ||
        (p.descripcion || '').toLowerCase().includes(q) ||
        (p.ciudad || '').toLowerCase().includes(q) ||
        (p.total || 0).toString().includes(q)
      ).slice(0, 10);
    }
    this.selectedIndex = 0;
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.filteredList.length > 0) {
        this.selectedIndex = (this.selectedIndex + 1) % this.filteredList.length;
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.filteredList.length > 0) {
        this.selectedIndex = (this.selectedIndex - 1 + this.filteredList.length) % this.filteredList.length;
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.filteredList[this.selectedIndex]) {
        this.selectItem(this.filteredList[this.selectedIndex]);
      }
    }
  }

  selectItem(item: Pedido) {
    this.selectPedido.emit(item);
    this.close();
  }

  getEtapaName(etapa: number): string {
    const names = ['Cotización', 'Confirmado', 'Pagado', 'En Tránsito', 'Aduana', 'Recibido'];
    return names[etapa] || 'Cotización';
  }
}
