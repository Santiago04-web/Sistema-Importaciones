import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pedido } from '../../services/pedido.service';

export interface InsightItem {
  type: 'stagnation' | 'margin' | 'freight' | 'cashflow' | 'info';
  title: string;
  description: string;
  badgeText: string;
  badgeClass: 'red' | 'yellow' | 'blue' | 'green';
  icon: string;
}

@Component({
  selector: 'app-ai-insights',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ai-card glass-card mb-4">
      <div class="ai-card-header">
        <div class="ai-title-badge">
          <span class="ai-sparkle-icon">🤖</span>
          <h3>AI Logistics & Financial Insights</h3>
        </div>
        <span class="ai-mode-tag">Análisis Empírico de Datos Reales</span>
      </div>

      <div class="ai-insights-grid" *ngIf="insights.length > 0">
        <div class="insight-box" *ngFor="let item of insights" [class]="'border-' + item.badgeClass">
          <div class="box-top">
            <span class="box-icon">{{ item.icon }}</span>
            <span class="insight-badge" [class]="'badge-' + item.badgeClass">{{ item.badgeText }}</span>
          </div>
          <h4 class="box-title">{{ item.title }}</h4>
          <p class="box-desc">{{ item.description }}</p>
        </div>
      </div>

      <div class="ai-empty" *ngIf="insights.length === 0">
        <span class="empty-icon">📊</span>
        <p>Sin datos históricos suficientes para generar alertas empíricas en este lote.</p>
      </div>
    </div>
  `,
  styles: [`
    .ai-card {
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%);
      border: 1px solid rgba(139, 92, 246, 0.25);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    .ai-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .ai-title-badge {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ai-sparkle-icon {
      font-size: 1.2rem;
    }
    .ai-title-badge h3 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: -0.01em;
    }
    .ai-mode-tag {
      font-size: 0.72rem;
      font-weight: 600;
      color: #a78bfa;
      background: rgba(139, 92, 246, 0.12);
      border: 1px solid rgba(139, 92, 246, 0.25);
      padding: 3px 10px;
      border-radius: 20px;
    }
    .ai-insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }
    .insight-box {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1rem;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .insight-box:hover {
      transform: translateY(-2px);
    }
    .border-red { border-left: 4px solid #ef4444; }
    .border-yellow { border-left: 4px solid #eab308; }
    .border-blue { border-left: 4px solid #3b82f6; }
    .border-green { border-left: 4px solid #10b981; }

    .box-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .box-icon {
      font-size: 1.1rem;
    }
    .insight-badge {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
    }
    .badge-red { color: #fca5a5; background: rgba(239, 68, 68, 0.2); }
    .badge-yellow { color: #fef08a; background: rgba(234, 179, 8, 0.2); }
    .badge-blue { color: #93c5fd; background: rgba(59, 130, 246, 0.2); }
    .badge-green { color: #6ee7b7; background: rgba(16, 185, 129, 0.2); }

    .box-title {
      margin: 0 0 4px 0;
      font-size: 0.9rem;
      font-weight: 700;
      color: #f1f5f9;
    }
    .box-desc {
      margin: 0;
      font-size: 0.8rem;
      color: #94a3b8;
      line-height: 1.4;
    }
    .ai-empty {
      text-align: center;
      padding: 1.5rem;
      color: #64748b;
    }
    .empty-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
  `]
})
export class AiInsightsComponent implements OnChanges {
  @Input() pedidos: Pedido[] = [];

  insights: InsightItem[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['pedidos']) {
      this.generateInsights();
    }
  }

  generateInsights() {
    this.insights = [];
    if (!this.pedidos || this.pedidos.length === 0) return;

    const now = new Date().getTime();

    // 1. Alertas de estancamiento (+10 días en la misma etapa)
    const estancados = this.pedidos.filter(p => {
      if (!p.historialEtapas || p.historialEtapas.length === 0) return false;
      const lastChange = new Date(p.historialEtapas[p.historialEtapas.length - 1].fechaCambio).getTime();
      const diffDays = (now - lastChange) / (1000 * 3600 * 24);
      return diffDays > 10 && p.etapa !== 5; // Ignorar recibidos
    });

    if (estancados.length > 0) {
      this.insights.push({
        type: 'stagnation',
        title: `${estancados.length} Pedido(s) Estancado(s) > 10 Días`,
        description: `Se detectaron ${estancados.length} importación(es) con más de 10 días en la misma etapa según el registro real de EtapaHistorial.`,
        badgeText: 'Alerta Operativa',
        badgeClass: 'red',
        icon: '🚨'
      });
    }

    // 2. Márgenes de ganancia bajos (< 8%)
    const margenBajo = this.pedidos.filter(p => {
      const tot = p.total || 0;
      const gan = p.ganancia || 0;
      if (tot <= 0) return false;
      const marginPct = (gan / tot) * 100;
      return marginPct < 8;
    });

    if (margenBajo.length > 0) {
      this.insights.push({
        type: 'margin',
        title: `${margenBajo.length} Importación(es) con Margen < 8%`,
        description: `Existen pedidos con rentabilidad estimada por debajo del 8% sobre el capital total invertido.`,
        badgeText: 'Margen Crítico',
        badgeClass: 'yellow',
        icon: '📉'
      });
    }

    // 3. Recomendaciones de Vencimiento de Saldo (FechaLimitePago en próximos 7 días)
    const saldoProximo = this.pedidos.filter(p => {
      if (!p.fechaLimitePago || (p.saldo || 0) <= 0) return false;
      const limit = new Date(p.fechaLimitePago).getTime();
      const diffDays = (limit - now) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    });

    if (saldoProximo.length > 0) {
      this.insights.push({
        type: 'cashflow',
        title: `${saldoProximo.length} Vencimiento(s) de Saldo Cercano(s)`,
        description: `Hay saldos pendientes por liquidar con fecha límite de pago registrada dentro de los próximos 7 días.`,
        badgeText: 'Flujo de Caja',
        badgeClass: 'blue',
        icon: '💡'
      });
    }

    // 4. Promedio Flete por CBM
    const totalMt3 = this.pedidos.reduce((acc, p) => acc + (p.mt3 || 0), 0);
    const totalFlete = this.pedidos.reduce((acc, p) => acc + (p.flete || 0), 0);
    if (totalMt3 > 0) {
      const avgPrecioMt3 = totalFlete / totalMt3;
      this.insights.push({
        type: 'freight',
        title: `Costo Promedio Flete: $${avgPrecioMt3.toLocaleString('en-US', { maximumFractionDigits: 0 })} COP / m³`,
        description: `Promedio consolidado del flete por metro cúbico sobre ${totalMt3.toFixed(1)} m³ CBM contratados en este lote.`,
        badgeText: 'Métrica Logística',
        badgeClass: 'green',
        icon: '📊'
      });
    }
  }
}
