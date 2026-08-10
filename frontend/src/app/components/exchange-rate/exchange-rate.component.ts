import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-exchange-rate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rate-card glass-card">
      <div class="rate-card-top">
        <div class="rate-badge">
          <span class="live-dot"></span>
          <span>TASA DE CAMBIO CNY / COP EN VIVO</span>
        </div>
        <div class="market-status">
          <span>Mercado Abierto · Shanghai / Bogotá</span>
        </div>
      </div>

      <div class="rate-main-row">
        <div class="rate-val-box">
          <span class="currency-pair">1 CNY (Yuan Chino) =</span>
          <div class="big-rate">
            <strong>{{ currentRate | number:'1.2-2' }}</strong>
            <span class="cop-unit">COP</span>
            <span class="rate-change positive">▲ +0.45% (24h)</span>
          </div>
        </div>

        <!-- QUICK CALCULATOR CONVERTER -->
        <div class="rate-calc-box">
          <label class="calc-lbl">🧮 Conversor Rápido RMB $\rightarrow$ COP</label>
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
      color: #64748b;
    }
    .rate-main-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .currency-pair {
      font-size: 0.82rem;
      color: #94a3b8;
      display: block;
      margin-bottom: 4px;
    }
    .big-rate {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .big-rate strong {
      font-size: 2.2rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.03em;
    }
    .cop-unit {
      font-size: 1.1rem;
      font-weight: 700;
      color: #38bdf8;
    }
    .rate-change {
      font-size: 0.8rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      margin-left: 8px;
    }
    .rate-change.positive {
      color: #34d399;
      background: rgba(16, 185, 129, 0.12);
    }
    .rate-calc-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 10px 14px;
      border-radius: 12px;
      min-width: 320px;
    }
    .calc-lbl {
      font-size: 0.75rem;
      font-weight: 600;
      color: #cbd5e1;
      display: block;
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
export class ExchangeRateComponent {
  @Input() currentRate = 560.50; // COP per RMB
  rmbInput = 1000;
  convertedCop = 560500;

  onRmbChange() {
    const val = Number(this.rmbInput) || 0;
    this.convertedCop = val * this.currentRate;
  }
}
