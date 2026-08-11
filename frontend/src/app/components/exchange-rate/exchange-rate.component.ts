import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-exchange-rate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rate-card glass-card">
      <div class="rate-card-top">
        <div class="rate-badge">
          <span class="live-dot"></span>
          <span>TASA DE CAMBIO EN VIVO (CNY ➔ COP)</span>
        </div>
        <div class="market-status">
          <span>Fuente: {{ rateSource }} · Actualizado: {{ lastUpdated | date:'shortTime' }}</span>
        </div>
      </div>

      <div class="rate-main-row">
        <div class="rate-val-box">
          <span class="currency-pair">1 CNY (Yuan RMB) =</span>
          <div class="big-rate">
            <strong>{{ currentRate | number:'1.2-2' }}</strong>
            <span class="cop-unit">COP</span>
            <span class="rate-change" [class.positive]="isLive" [class.neutral]="!isLive">
              {{ isLive ? '● API Divisas Real en Vivo' : '● Valor Registrado' }}
            </span>
          </div>
        </div>

        <!-- QUICK CALCULATOR CONVERTER -->
        <div class="rate-calc-box">
          <label class="calc-lbl">🧮 Conversor Rápido RMB ➔ COP</label>
          <div class="calc-input-group">
            <input type="number" [(ngModel)]="rmbInput" (input)="onRmbChange()" class="calc-input" placeholder="¥ Yuanes">
            <span class="calc-equals">=</span>
            <div class="calc-result">
              <strong>$ {{ convertedCop | number:'1.0-0' }}</strong>
              <span class="result-unit">COP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rate-card {
      padding: 1.25rem 1.5rem;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(20, 20, 24, 0.8) 0%, rgba(15, 23, 42, 0.85) 100%);
      border: 1px solid rgba(59, 130, 246, 0.2);
      backdrop-filter: blur(12px);
      margin-bottom: 2rem;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    .rate-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .rate-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 4px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
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
    .market-status {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .rate-main-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .currency-pair {
      font-size: 0.8rem;
      color: #94a3b8;
      display: block;
      margin-bottom: 2px;
    }
    .big-rate {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .big-rate strong {
      font-size: 2.1rem;
      font-weight: 800;
      color: #3b82f6;
      letter-spacing: -0.02em;
    }
    .cop-unit {
      font-size: 1rem;
      font-weight: 700;
      color: #64748b;
    }
    .rate-change {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      margin-left: 6px;
    }
    .rate-change.positive {
      color: #10b981;
      background: rgba(16, 185, 129, 0.12);
    }
    .rate-change.neutral {
      color: #eab308;
      background: rgba(234, 179, 8, 0.12);
    }
    .rate-calc-box {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 0.75rem 1.25rem;
      min-width: 320px;
    }
    .calc-lbl {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .calc-input-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .calc-input {
      width: 110px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 6px 10px;
      color: #fff;
      font-size: 0.95rem;
      font-weight: 700;
      outline: none;
    }
    .calc-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
    }
    .calc-equals {
      color: #64748b;
      font-weight: bold;
    }
    .calc-result {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .calc-result strong {
      font-size: 1.1rem;
      font-weight: 800;
      color: #10b981;
    }
    .result-unit {
      font-size: 0.75rem;
      color: #64748b;
    }

    @media (max-width: 768px) {
      .rate-main-row {
        flex-direction: column;
        align-items: flex-start;
      }
      .rate-calc-box {
        width: 100%;
        min-width: 100%;
      }
    }
  `]
})
export class ExchangeRateComponent implements OnInit {
  currentRate = 560.50;
  rateSource = 'Cargando...';
  lastUpdated = new Date();
  isLive = true;
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
          this.rateSource = res.source || 'ExchangeRate-API Real-Time';
          this.lastUpdated = res.lastUpdated ? new Date(res.lastUpdated) : new Date();
          this.isLive = res.isLive !== false;
          this.onRmbChange();
        }
      },
      error: () => {
        this.rateSource = 'Banco de la República / Cache Local';
        this.isLive = false;
      }
    });
  }

  onRmbChange() {
    const val = Number(this.rmbInput) || 0;
    this.convertedCop = val * this.currentRate;
  }
}
