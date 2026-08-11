import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pedido } from '../../services/pedido.service';

@Component({
  selector: 'app-qr-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="pedido" (click)="close()">
      <div class="qr-card glass-card" (click)="$event.stopPropagation()">
        <div class="qr-header">
          <h3>📱 Ficha QR de Importación</h3>
          <button class="close-btn" (click)="close()">✕</button>
        </div>

        <div class="qr-body">
          <div class="qr-frame">
            <!-- DYNAMIC SVG QR CODE MOCKUP -->
            <svg width="180" height="180" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" fill="#ffffff" rx="8"/>
              <!-- Corner markers -->
              <rect x="8" y="8" width="26" height="26" fill="#0f172a" rx="4"/>
              <rect x="12" y="12" width="18" height="18" fill="#ffffff" rx="2"/>
              <rect x="15" y="15" width="12" height="12" fill="#3b82f6" rx="1"/>

              <rect x="66" y="8" width="26" height="26" fill="#0f172a" rx="4"/>
              <rect x="70" y="12" width="18" height="18" fill="#ffffff" rx="2"/>
              <rect x="73" y="15" width="12" height="12" fill="#3b82f6" rx="1"/>

              <rect x="8" y="66" width="26" height="26" fill="#0f172a" rx="4"/>
              <rect x="12" y="70" width="18" height="18" fill="#ffffff" rx="2"/>
              <rect x="15" y="73" width="12" height="12" fill="#3b82f6" rx="1"/>

              <!-- Random QR pattern dots -->
              <rect x="40" y="10" width="6" height="6" fill="#0f172a"/>
              <rect x="50" y="16" width="8" height="6" fill="#0f172a"/>
              <rect x="42" y="26" width="14" height="6" fill="#0f172a"/>
              <rect x="10" y="42" width="16" height="6" fill="#0f172a"/>
              <rect x="30" y="40" width="10" height="10" fill="#3b82f6"/>
              <rect x="45" y="45" width="12" height="12" fill="#0f172a"/>
              <rect x="62" y="40" width="14" height="8" fill="#0f172a"/>
              <rect x="80" y="45" width="10" height="10" fill="#0f172a"/>
              <rect x="40" y="65" width="8" height="12" fill="#0f172a"/>
              <rect x="52" y="75" width="16" height="8" fill="#3b82f6"/>
              <rect x="72" y="68" width="14" height="14" fill="#0f172a"/>
            </svg>
          </div>

          <div class="qr-info">
            <strong class="qr-code">LOTE: {{ pedido.referencia || pedido.codigo }}</strong>
            <span class="qr-desc">{{ pedido.descripcion }}</span>
            <span class="qr-sub">Escanea desde tu móvil para rastreo directo</span>
          </div>
        </div>

        <div class="qr-footer">
          <button class="action-btn" (click)="close()">Cerrar Código QR</button>
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
    .qr-card {
      width: 100%;
      max-width: 420px;
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 20px;
      padding: 1.5rem;
      text-align: center;
    }
    .qr-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .qr-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #f8fafc;
    }
    .close-btn {
      background: rgba(255,255,255,0.08);
      border: none;
      color: #94a3b8;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
    }
    .qr-frame {
      background: #fff;
      display: inline-block;
      padding: 1rem;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
      margin-bottom: 1rem;
    }
    .qr-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .qr-code {
      font-size: 1.1rem;
      color: #3b82f6;
    }
    .qr-desc {
      font-size: 0.85rem;
      color: #cbd5e1;
    }
    .qr-sub {
      font-size: 0.75rem;
      color: #64748b;
    }
    .qr-footer {
      margin-top: 1.5rem;
    }
    .action-btn {
      width: 100%;
      background: #3b82f6;
      border: none;
      color: #fff;
      font-weight: 700;
      padding: 0.6rem;
      border-radius: 8px;
      cursor: pointer;
    }
  `]
})
export class QrModalComponent {
  @Input() pedido: Pedido | null = null;
  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
}
