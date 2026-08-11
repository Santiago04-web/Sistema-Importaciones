import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pedido } from '../../services/pedido.service';

@Component({
  selector: 'app-courier-tracking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="pedido" (click)="close()">
      <div class="tracking-card glass-card" (click)="$event.stopPropagation()">
        
        <div class="tracking-header">
          <div class="header-left">
            <span class="courier-badge">🚚 RASTREO TIPO COURIER</span>
            <h2>Importación #{{ pedido.referencia || pedido.codigo || 'S/N' }}</h2>
            <span class="header-sub">📍 {{ pedido.ciudad }} · {{ pedido.descripcion }}</span>
          </div>
          <button class="close-btn" (click)="close()">✕</button>
        </div>

        <div class="tracking-body">
          <!-- TIMELINE STEPPER -->
          <div class="stepper-wrapper">
            <div class="stepper-line-bg">
              <div class="stepper-line-fill" [style.width.%]="getProgressPct()"></div>
            </div>

            <div class="step-item" 
                 *ngFor="let stage of stages; let i = index" 
                 [class.completed]="i < pedido.etapa"
                 [class.active]="i === pedido.etapa">
              
              <div class="step-circle">
                <span *ngIf="i < pedido.etapa">✓</span>
                <span *ngIf="i === pedido.etapa" class="active-pulse">●</span>
                <span *ngIf="i > pedido.etapa">{{ i + 1 }}</span>
              </div>

              <div class="step-label">
                <strong>{{ stage.nombre }}</strong>
                <span class="step-date" *ngIf="getStageDate(i)">
                  {{ getStageDate(i) | date:'dd MMM yyyy, HH:mm' }}
                </span>
                <span class="step-pending" *ngIf="!getStageDate(i)">Pendiente</span>
              </div>
            </div>
          </div>

          <!-- SUMMARY METRICS BOX -->
          <div class="tracking-metrics-box">
            <div class="metric-item">
              <span class="m-lbl">Etapa Actual</span>
              <strong class="m-val blue-txt">{{ getStageName(pedido.etapa) }}</strong>
            </div>
            <div class="metric-item">
              <span class="m-lbl">Días Acumulados en Etapa</span>
              <strong class="m-val orange-txt">{{ getDaysInCurrentStage() }} Días</strong>
            </div>
            <div class="metric-item">
              <span class="m-lbl">Fecha Negociación</span>
              <strong class="m-val">{{ pedido.fechaNegociacion | date:'mediumDate' }}</strong>
            </div>
            <div class="metric-item">
              <span class="m-lbl">Fecha Límite Pago Saldo</span>
              <strong class="m-val" [class.red-txt]="isOverdue()">
                {{ pedido.fechaLimitePago ? (pedido.fechaLimitePago | date:'mediumDate') : 'Sin Fecha Límite' }}
              </strong>
            </div>
          </div>
        </div>

        <div class="tracking-footer">
          <button class="action-btn" (click)="close()">Cerrar Ficha de Rastreo</button>
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
    .tracking-card {
      width: 100%;
      max-width: 820px;
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 20px;
      padding: 1.5rem;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6);
    }
    .tracking-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 1rem;
    }
    .courier-badge {
      font-size: 0.72rem;
      font-weight: 800;
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.25);
      padding: 3px 10px;
      border-radius: 20px;
      display: inline-block;
      margin-bottom: 4px;
    }
    .header-left h2 {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 800;
      color: #f8fafc;
    }
    .header-sub {
      font-size: 0.82rem;
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
      font-size: 1.1rem;
    }
    .stepper-wrapper {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin: 2.5rem 0;
    }
    .stepper-line-bg {
      position: absolute;
      top: 18px;
      left: 20px;
      right: 20px;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      z-index: 1;
    }
    .stepper-line-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #10b981);
      transition: width 0.4s ease;
    }
    .step-item {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      width: 110px;
    }
    .step-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #1e293b;
      border: 2px solid #475569;
      color: #94a3b8;
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: 700;
      font-size: 0.9rem;
      margin-bottom: 8px;
      transition: all 0.3s ease;
    }
    .step-item.completed .step-circle {
      background: #10b981;
      border-color: #10b981;
      color: #fff;
    }
    .step-item.active .step-circle {
      background: #3b82f6;
      border-color: #60a5fa;
      color: #fff;
      box-shadow: 0 0 16px rgba(59, 130, 246, 0.6);
    }
    .active-pulse {
      animation: pulsePulse 1.2s infinite;
    }
    @keyframes pulsePulse {
      0% { transform: scale(0.8); opacity: 0.6; }
      50% { transform: scale(1.4); opacity: 1; }
      100% { transform: scale(0.8); opacity: 0.6; }
    }
    .step-label strong {
      display: block;
      font-size: 0.8rem;
      color: #f1f5f9;
    }
    .step-date {
      font-size: 0.68rem;
      color: #10b981;
    }
    .step-pending {
      font-size: 0.68rem;
      color: #64748b;
    }
    .tracking-metrics-box {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 1rem;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1rem;
      margin-top: 1.5rem;
    }
    .metric-item {
      display: flex;
      flex-direction: column;
    }
    .m-lbl {
      font-size: 0.72rem;
      color: #64748b;
      margin-bottom: 2px;
    }
    .m-val {
      font-size: 0.95rem;
      font-weight: 700;
      color: #f8fafc;
    }
    .blue-txt { color: #3b82f6; }
    .orange-txt { color: #f97316; }
    .red-txt { color: #ef4444; }
    .tracking-footer {
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
      .stepper-wrapper {
        flex-direction: column;
        align-items: flex-start;
        gap: 1.5rem;
      }
      .stepper-line-bg { display: none; }
      .step-item {
        flex-direction: row;
        width: 100%;
        text-align: left;
        gap: 12px;
      }
      .step-label { text-align: left; }
    }
  `]
})
export class CourierTrackingComponent {
  @Input() pedido: Pedido | null = null;
  @Output() closed = new EventEmitter<void>();

  stages = [
    { nombre: 'Cotización' },
    { nombre: 'Confirmado' },
    { nombre: 'Pagado' },
    { nombre: 'En Tránsito' },
    { nombre: 'Aduana' },
    { nombre: 'Recibido' }
  ];

  close() {
    this.closed.emit();
  }

  getStageName(etapa: number): string {
    return this.stages[etapa]?.nombre || 'Cotización';
  }

  getProgressPct(): number {
    if (!this.pedido) return 0;
    return (this.pedido.etapa / 5) * 100;
  }

  getStageDate(stageIndex: number): string | null {
    if (!this.pedido || !this.pedido.historialEtapas) return null;
    const item = this.pedido.historialEtapas.find(h => h.etapa === stageIndex);
    return item ? item.fechaCambio : null;
  }

  getDaysInCurrentStage(): number {
    if (!this.pedido || !this.pedido.historialEtapas || this.pedido.historialEtapas.length === 0) return 0;
    const currentEtapaItem = this.pedido.historialEtapas
      .filter(h => h.etapa === this.pedido?.etapa)
      .sort((a, b) => new Date(b.fechaCambio).getTime() - new Date(a.fechaCambio).getTime())[0];

    if (!currentEtapaItem) return 0;
    const start = new Date(currentEtapaItem.fechaCambio).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / (1000 * 3600 * 24));
  }

  isOverdue(): boolean {
    if (!this.pedido || !this.pedido.fechaLimitePago) return false;
    const limit = new Date(this.pedido.fechaLimitePago).getTime();
    return limit < new Date().getTime() && (this.pedido.saldo || 0) > 0;
  }
}
