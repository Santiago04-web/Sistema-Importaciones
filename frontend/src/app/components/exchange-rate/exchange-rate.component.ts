import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-exchange-rate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rate-mini-bar">
      <div class="mini-left">
        <span class="live-dot"></span>
        <span class="mini-lbl">CNY ➔ COP:</span>
        <strong class="mini-rate">$ {{ currentRate | number:'1.2-2' }} COP</strong>
        <span class="mini-source">· {{ rateSource }}</span>
      </div>

      <div class="mini-right">
        <button class="mini-toggle-btn" (click)="showCalc = !showCalc" title="Abrir conversor rápido RMB a COP">
          🧮 {{ showCalc ? 'Cerrar Conversor' : 'Conversor Rápido RMB' }}
        </button>

        <!-- DISCREET POPUP CONVERTER -->
        <div class="mini-popover glass-card" *ngIf="showCalc">
          <span class="pop-title">🧮 Conversor Rápido RMB ➔ COP</span>
          <div class="pop-inputs">
            <div class="pop-field">
              <label>¥ RMB</label>
              <input type="number" [(ngModel)]="rmbInput" (input)="onRmbChange()" class="pop-input">
            </div>
            <span class="pop-equals">=</span>
            <div class="pop-res">
              <label>COP</label>
              <strong>$ {{ convertedCop | number:'1.0-0' }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rate-mini-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 10px;
      padding: 6px 14px;
      margin-bottom: 1.25rem;
      backdrop-filter: blur(8px);
      position: relative;
    }
    .mini-left {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
    }
    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
      animation: pulseDot 1.4s infinite;
    }
    @keyframes pulseDot {
      0% { opacity: 0.5; transform: scale(0.9); }
      50% { opacity: 1; transform: scale(1.3); }
      100% { opacity: 0.5; transform: scale(0.9); }
    }
    .mini-lbl {
      color: #94a3b8;
      font-weight: 600;
    }
    .mini-rate {
      color: #3b82f6;
      font-weight: 800;
      font-size: 0.9rem;
    }
    .mini-source {
      color: #64748b;
      font-size: 0.72rem;
    }
    .mini-right {
      position: relative;
    }
    .mini-toggle-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .mini-toggle-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }
    .mini-popover {
      position: absolute;
      top: 36px;
      right: 0;
      width: 260px;
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 12px;
      padding: 10px 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      z-index: 100;
    }
    .pop-title {
      display: block;
      font-size: 0.72rem;
      font-weight: 700;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .pop-inputs {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pop-field {
      flex: 1;
    }
    .pop-field label, .pop-res label {
      display: block;
      font-size: 0.65rem;
      color: #64748b;
    }
    .pop-input {
      width: 100%;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 4px 6px;
      color: #fff;
      font-size: 0.85rem;
      font-weight: 700;
      outline: none;
    }
    .pop-equals {
      color: #64748b;
      font-size: 0.8rem;
    }
    .pop-res strong {
      color: #10b981;
      font-size: 0.9rem;
      font-weight: 800;
    }

    @media (max-width: 600px) {
      .rate-mini-bar {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }
      .mini-source { display: none; }
    }
  `]
})
export class ExchangeRateComponent implements OnInit {
  currentRate = 560.50;
  rateSource = 'Cargando...';
  lastUpdated = new Date();
  isLive = true;
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
          this.rateSource = res.source || 'Live API';
          this.lastUpdated = res.lastUpdated ? new Date(res.lastUpdated) : new Date();
          this.isLive = res.isLive !== false;
          this.onRmbChange();
        }
      },
      error: () => {
        this.rateSource = 'Cache Local';
        this.isLive = false;
      }
    });
  }

  onRmbChange() {
    const val = Number(this.rmbInput) || 0;
    this.convertedCop = val * this.currentRate;
  }
}
