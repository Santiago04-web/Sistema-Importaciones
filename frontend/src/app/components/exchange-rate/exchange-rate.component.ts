import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-exchange-rate',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="navbar-rate-pill" title="Tasa oficial de cambio CNY/COP en vivo">
      <span class="rate-dot"></span>
      <span class="rate-lbl">CNY ➔ COP:</span>
      <strong class="rate-val">$ {{ currentRate | number:'1.2-2' }}</strong>
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
  `]
})
export class ExchangeRateComponent implements OnInit {
  currentRate = 560.50;

  constructor(private pedidoService: PedidoService) {}

  ngOnInit() {
    this.fetchLiveRate();
  }

  fetchLiveRate() {
    this.pedidoService.getCnyCopRate().subscribe({
      next: (res: any) => {
        if (res && res.rateCnyCop) {
          this.currentRate = res.rateCnyCop;
        }
      },
      error: () => {}
    });
  }
}
