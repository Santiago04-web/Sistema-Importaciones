import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-exchange-rate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="navbar-rate-pill" title="Tasa oficial de cambio CNY/COP en vivo">
      <span class="rate-dot"></span>
      <span class="rate-lbl">CNY ➔ COP:</span>
      <strong class="rate-val">$ {{ currentRate | number:'1.2-2' }}</strong>

      <button class="pill-calc-btn" (click)="showCalc = !showCalc" title="Conversor rápido RMB a COP">
        🧮 {{ showCalc ? '✕' : 'RMB' }}
      </button>

      <!-- DISCREET POPUP CONVERTER -->
      <div class="rate-popover glass-card" *ngIf="showCalc">
        <div class="pop-header">🧮 Conversor Rápido RMB ➔ COP</div>
        <div class="pop-body">
          <div class="pop-col">
            <label>¥ Yuanes (RMB)</label>
            <input type="number" [(ngModel)]="rmbInput" (input)="onRmbChange()" class="pop-inp">
          </div>
          <span class="pop-eq">=</span>
          <div class="pop-col">
            <label>Pesos (COP)</label>
            <strong class="pop-cop">$ {{ convertedCop | number:'1.0-0' }}</strong>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .navbar-rate-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(59, 130, 246, 0.08);
      border: 1px solid rgba(59, 130, 246, 0.25);
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.76rem;
      position: relative;
    }
    .rate-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #3b82f6;
      box-shadow: 0 0 6px #3b82f6;
    }
    .rate-lbl {
      color: #94a3b8;
      font-weight: 600;
    }
    .rate-val {
      color: #60a5fa;
      font-weight: 800;
    }
    .pill-calc-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #e2e8f0;
      border-radius: 12px;
      padding: 1px 7px;
      font-size: 0.7rem;
      font-weight: 700;
      cursor: pointer;
      margin-left: 2px;
      transition: background 0.15s;
    }
    .pill-calc-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
    }
    .rate-popover {
      position: absolute;
      top: 32px;
      left: 0;
      width: 250px;
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.35);
      border-radius: 12px;
      padding: 10px 12px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7);
      z-index: 999;
    }
    .pop-header {
      font-size: 0.72rem;
      font-weight: 700;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .pop-body {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pop-col {
      flex: 1;
    }
    .pop-col label {
      display: block;
      font-size: 0.65rem;
      color: #64748b;
    }
    .pop-inp {
      width: 100%;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 4px 6px;
      color: #fff;
      font-size: 0.82rem;
      font-weight: 700;
      outline: none;
    }
    .pop-eq {
      color: #64748b;
      font-size: 0.8rem;
    }
    .pop-cop {
      color: #10b981;
      font-size: 0.88rem;
      font-weight: 800;
    }
  `]
})
export class ExchangeRateComponent implements OnInit {
  currentRate = 560.50;
  showCalc = false;
  rmbInput = 1000;
  convertedCop = 560500;

  constructor(private pedidoService: PedidoService) {}

  ngOnInit() {
    this.fetchLiveRate();
  }

  fetchLiveRate() {
    this.pedidoService.getCnyCopRate().subscribe({
      next: (res: any) => {
        if (res && res.rateCnyCop) {
          this.currentRate = res.rateCnyCop;
          this.onRmbChange();
        }
      },
      error: () => {}
    });
  }

  onRmbChange() {
    const val = Number(this.rmbInput) || 0;
    this.convertedCop = val * this.currentRate;
  }
}
