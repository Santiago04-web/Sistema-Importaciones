import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-flete-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="calc-card glass-card" (click)="$event.stopPropagation()">
        
        <div class="calc-header">
          <div class="header-left">
            <span class="tool-badge">🧮 SIMULADOR INDEPENDIENTE</span>
            <h2>Calculadora de Flete & Comisiones</h2>
            <span class="header-sub">Simulación financiera ejecutada con la matemática central del backend</span>
          </div>
          <button class="close-btn" (click)="close()">✕</button>
        </div>

        <div class="calc-grid">
          <!-- INPUT FORM -->
          <div class="calc-inputs-col">
            <h4 class="section-title">Valores de Entrada</h4>

            <div class="form-row">
              <label>Yuanes por Unidad (RMB)</label>
              <input type="number" [(ngModel)]="input.yuanes" (input)="calcular()" class="form-control">
            </div>

            <div class="form-row">
              <label>Tasa RMB ➔ COP</label>
              <input type="number" [(ngModel)]="input.tasa" (input)="calcular()" class="form-control">
            </div>

            <div class="form-row">
              <label>Cantidad Total de Unidades</label>
              <input type="number" [(ngModel)]="input.totalQty" (input)="calcular()" class="form-control">
            </div>

            <div class="form-row">
              <label>Piezas por Caja</label>
              <input type="number" [(ngModel)]="input.piezasCaja" (input)="calcular()" class="form-control">
            </div>

            <div class="form-row">
              <label>Cúbica por Caja (m³)</label>
              <input type="number" [(ngModel)]="input.cubica" (input)="calcular()" class="form-control">
            </div>

            <div class="form-row">
              <label>Precio Flete por m³ (COP)</label>
              <input type="number" [(ngModel)]="input.precioMt3" (input)="calcular()" class="form-control">
            </div>

            <div class="form-row">
              <label>Porcentaje Margen Venta EHUK</label>
              <input type="number" step="0.01" [(ngModel)]="input.porcentajeEhuk" (input)="calcular()" class="form-control">
            </div>
          </div>

          <!-- RESULT BREAKDOWN -->
          <div class="calc-results-col" *ngIf="res">
            <h4 class="section-title">Resultados Calculados</h4>

            <div class="res-box highlight-box mb-3">
              <span class="res-lbl">COSTO TOTAL PROYECTADO</span>
              <strong class="res-big green-txt">$ {{ res.total | number:'1.0-0' }} COP</strong>
            </div>

            <div class="res-list">
              <div class="res-row">
                <span>Mercancía (Producto):</span>
                <strong>$ {{ res.producto | number:'1.0-0' }} COP</strong>
              </div>
              <div class="res-row">
                <span>Flete Total ({{ res.mt3 | number:'1.2-2' }} m³):</span>
                <strong>$ {{ res.flete | number:'1.0-0' }} COP</strong>
              </div>
              <div class="res-row">
                <span>Comisión Trabajo (5%):</span>
                <strong>$ {{ res.comisionTrabajo | number:'1.0-0' }} COP</strong>
              </div>
              <div class="res-row">
                <span>Pago Inicial (30%):</span>
                <strong>$ {{ res.pagoInicial | number:'1.0-0' }} COP</strong>
              </div>
              <div class="res-row">
                <span>Comisión Apalancamiento (7%):</span>
                <strong>$ {{ res.comisionApalancamiento | number:'1.0-0' }} COP</strong>
              </div>
              <div class="res-row">
                <span>Saldo Pendiente:</span>
                <strong class="orange-txt">$ {{ res.saldo | number:'1.0-0' }} COP</strong>
              </div>

              <div class="res-divider"></div>

              <div class="res-row">
                <span>Costo Unitario Final:</span>
                <strong>$ {{ res.costoFinal | number:'1.0-0' }} COP</strong>
              </div>
              <div class="res-row">
                <span>Precio Venta Sugerido / u:</span>
                <strong class="blue-txt">$ {{ res.costoVenta | number:'1.0-0' }} COP</strong>
              </div>
              <div class="res-row">
                <span>Ganancia Proyectada:</span>
                <strong class="green-txt">$ {{ res.ganancia | number:'1.0-0' }} COP</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="calc-footer">
          <button class="action-btn" (click)="close()">Cerrar Calculadora</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1.5rem;
    }
    .calc-card {
      width: 100%;
      max-width: 860px;
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 20px;
      padding: 1.5rem;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6);
      max-height: 90vh;
      overflow-y: auto;
    }
    .calc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 1rem;
    }
    .tool-badge {
      font-size: 0.72rem;
      font-weight: 800;
      color: #10b981;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 3px 10px;
      border-radius: 20px;
      display: inline-block;
      margin-bottom: 4px;
    }
    .header-left h2 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 800;
      color: #f8fafc;
    }
    .header-sub {
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .close-btn {
      background: rgba(255,255,255,0.08);
      border: none;
      color: #94a3b8;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
    }
    .calc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .section-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #38bdf8;
      margin: 0 0 1rem 0;
    }
    .form-row {
      margin-bottom: 0.75rem;
    }
    .form-row label {
      display: block;
      font-size: 0.75rem;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .form-control {
      width: 100%;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 6px 10px;
      color: #fff;
      font-size: 0.9rem;
      font-weight: 600;
      outline: none;
    }
    .form-control:focus {
      border-color: #3b82f6;
    }
    .res-box {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
    }
    .res-lbl {
      display: block;
      font-size: 0.7rem;
      font-weight: 700;
      color: #94a3b8;
    }
    .res-big {
      font-size: 1.4rem;
      font-weight: 800;
    }
    .res-list {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1rem;
    }
    .res-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      font-size: 0.82rem;
      color: #cbd5e1;
    }
    .res-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 8px 0;
    }
    .green-txt { color: #10b981; }
    .orange-txt { color: #f97316; }
    .blue-txt { color: #3b82f6; }
    .calc-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }
    .action-btn {
      background: #3b82f6;
      border: none;
      color: #fff;
      font-weight: 700;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .calc-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FleteCalculatorComponent {
  @Output() closed = new EventEmitter<void>();

  input = {
    yuanes: 45,
    tasa: 560.50,
    totalQty: 2000,
    piezasCaja: 50,
    cubica: 0.12,
    precioMt3: 2300000,
    porcentajeEhuk: 0.12
  };

  res: any = null;

  constructor(private pedidoService: PedidoService) {
    this.calcular();
  }

  close() {
    this.closed.emit();
  }

  calcular() {
    this.pedidoService.simularPedido(this.input).subscribe({
      next: (data) => {
        this.res = data;
      }
    });
  }
}
