import { Component, OnInit, OnDestroy, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService, Pedido } from '../../services/pedido.service';

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
                 placeholder="Escribe código (cp, co, bs, ct), producto, ciudad o valor (Ctrl + K)..." 
                 class="cmd-input">
          <kbd class="cmd-esc-tag">ESC</kbd>
        </div>

        <div class="cmd-results" *ngIf="filteredList.length > 0">
          <div class="cmd-section-title" *ngIf="query">
            Resultados para "{{ query }}" ({{ filteredList.length }})
          </div>
          <div class="cmd-section-title" *ngIf="!query">
            ⚡ Importaciones Disponibles ({{ _pedidos.length }})
          </div>

          <div class="cmd-item" 
               *ngFor="let item of filteredList; let i = index" 
               [class.active]="i === selectedIndex"
               (click)="selectItem(item)"
               (mouseenter)="selectedIndex = i">
            
            <div class="cmd-item-left">
              <span class="cmd-code-pill">{{ item.referencia || item.codigo || 'S/N' }}</span>
              <div class="cmd-item-info">
                <strong class="cmd-item-desc">{{ item.descripcion || 'Sin Descripción' }}</strong>
                <span class="cmd-item-sub">📍 {{ item.ciudad }} · Qty {{ item.totalQty | number }} · Lote: {{ item.codigo }}</span>
              </div>
            </div>

            <div class="cmd-item-right">
              <span class="cmd-item-price">$ {{ (item.total || 0) | number:'1.0-0' }} COP</span>
              <span class="cmd-stage-tag">{{ getEtapaName(item.etapa) }}</span>
            </div>
          </div>
        </div>

        <!-- SMART EMPTY SUGGESTIONS STATE -->
        <div class="cmd-empty" *ngIf="filteredList.length === 0">
          <div class="empty-msg">
            <span class="empty-icon">🔍</span>
            <p>No se encontraron resultados para <strong>"{{ query }}"</strong></p>
          </div>
          <div class="sug-box">
            <span class="sug-title">💡 Sugerencias rápidas de búsqueda:</span>
            <div class="sug-chips">
              <button class="chip-btn" (click)="setQuery('cp')">🏷️ cp-3 (Filtro cp)</button>
              <button class="chip-btn" (click)="setQuery('co')">🏷️ co-1 (Filtro co)</button>
              <button class="chip-btn" (click)="setQuery('ct')">🏷️ ct-1 (Filtro ct)</button>
              <button class="chip-btn" (click)="setQuery('bs')">🏷️ bs-1 (Filtro bs)</button>
              <button class="chip-btn" (click)="setQuery('Camiseta')">👕 Camisetas</button>
              <button class="chip-btn" (click)="setQuery('Buzo')">🧥 Buzos</button>
              <button class="chip-btn" (click)="setQuery('GZ')">📍 Guangzhou (GZ)</button>
            </div>
          </div>
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
      background: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding-top: 6vh;
      animation: fadeIn 0.15s ease;
    }
    .cmd-dialog {
      width: 92%;
      max-width: 700px;
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.35);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,0.7);
    }
    .cmd-search-bar {
      display: flex;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      gap: 12px;
      background: rgba(15, 23, 42, 0.95);
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
      max-height: 420px;
      overflow-y: auto;
      padding: 0.5rem 0.75rem;
    }
    .cmd-section-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.4rem 0.6rem 0.2rem 0.6rem;
    }
    .cmd-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.15s ease;
      margin-bottom: 4px;
      border: 1px solid transparent;
    }
    .cmd-item:hover, .cmd-item.active {
      background: rgba(59, 130, 246, 0.18);
      border-color: rgba(59, 130, 246, 0.4);
    }
    .cmd-item-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cmd-code-pill {
      font-size: 0.75rem;
      font-weight: 800;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.14);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 3px 8px;
      border-radius: 6px;
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
      color: #94a3b8;
      font-size: 0.75rem;
    }
    .cmd-item-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }
    .cmd-item-price {
      color: #10b981;
      font-weight: 700;
      font-size: 0.88rem;
    }
    .cmd-stage-tag {
      font-size: 0.68rem;
      color: #cbd5e1;
      background: rgba(255, 255, 255, 0.08);
      padding: 1px 6px;
      border-radius: 4px;
    }

    /* EMPTY STATE & SUGGESTIONS */
    .cmd-empty {
      padding: 1.5rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }
    .empty-msg {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #94a3b8;
      font-size: 0.9rem;
    }
    .empty-icon {
      font-size: 1.5rem;
    }
    .sug-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1rem;
    }
    .sug-title {
      display: block;
      font-size: 0.78rem;
      font-weight: 700;
      color: #fbbf24;
      margin-bottom: 0.75rem;
    }
    .sug-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .chip-btn {
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #60a5fa;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .chip-btn:hover {
      background: rgba(59, 130, 246, 0.3);
      color: #fff;
      transform: translateY(-1px);
    }

    .cmd-footer {
      padding: 0.6rem 1.25rem;
      background: rgba(15, 23, 42, 0.98);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
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
  _pedidos: Pedido[] = [];
  
  @Input() set pedidos(val: Pedido[]) {
    if (val && val.length > 0) {
      this._pedidos = val;
      this.onSearchChange();
    }
  }
  
  @Output() selectPedido = new EventEmitter<Pedido>();

  isOpen = false;
  query = '';
  filteredList: Pedido[] = [];
  selectedIndex = 0;

  constructor(private pedidoService: PedidoService) {}

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
    this.refreshData();
  }

  ngOnDestroy() {}

  refreshData() {
    this.pedidoService.getPedidos().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this._pedidos = data;
          this.onSearchChange();
        }
      }
    });
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.query = '';
      this.refreshData();
    }
  }

  close() {
    this.isOpen = false;
  }

  normalize(str: string): string {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  normalizeClean(str: string): string {
    return this.normalize(str).replace(/[^a-z0-9]/g, '');
  }

  onSearchChange() {
    const raw = this.normalize(this.query);
    const cleanRaw = this.normalizeClean(this.query);

    if (!raw) {
      this.filteredList = this._pedidos.slice(0, 12);
      this.selectedIndex = 0;
      return;
    }

    const tokens = raw.split(/\s+/).filter(t => t.length > 0);

    this.filteredList = this._pedidos.filter(p => {
      const fullText = this.normalize(
        `${p.codigo} ${p.referencia} ${p.descripcion} ${p.ciudad} ${p.observaciones} ${this.getEtapaName(p.etapa)} ${p.total} ${p.saldo} ${p.totalQty} ${p.yuanes} ${p.tasa}`
      );
      const cleanFullText = this.normalizeClean(
        `${p.codigo} ${p.referencia} ${p.descripcion} ${p.ciudad} ${p.observaciones}`
      );

      // Match 1: Token match (all query words present anywhere)
      const matchesTokens = tokens.every(t => fullText.includes(t));
      
      // Match 2: Hyphen-insensitive prefix/substring match (e.g. 'cp' matches 'cp-3' or 'CP 3')
      const matchesClean = cleanRaw.length >= 1 && cleanFullText.includes(cleanRaw);

      return matchesTokens || matchesClean;
    }).slice(0, 15);

    this.selectedIndex = 0;
  }

  setQuery(q: string) {
    this.query = q;
    this.onSearchChange();
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
