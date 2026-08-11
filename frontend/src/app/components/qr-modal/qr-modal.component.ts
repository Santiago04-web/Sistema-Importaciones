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
          <div class="header-title">
            <span class="qr-icon-badge">📱</span>
            <h3>Ficha QR de Importación</h3>
          </div>
          <button class="modal-close-btn" (click)="close()" title="Cerrar">✕</button>
        </div>

        <div class="qr-body">
          <!-- REAL SCANNABLE QR CODE IMAGE -->
          <div class="qr-frame">
            <img [src]="getQrImageUrl(pedido)" 
                 alt="Código QR Real de Rastreo" 
                 class="qr-img" 
                 width="220" 
                 height="220">
          </div>

          <div class="qr-info">
            <span class="qr-ref-tag">LOTE / REF: {{ pedido.referencia || pedido.codigo }}</span>
            <h4 class="qr-prod-title">{{ pedido.descripcion }}</h4>
            <span class="qr-sub">Escanea desde cualquier teléfono para verificar información del embarque</span>
          </div>
        </div>

        <div class="qr-footer">
          <button class="action-btn download-btn" (click)="downloadQrImage(pedido)">
            ⬇️ Descargar Código QR
          </button>
          <button class="action-btn close-action-btn" (click)="close()">
            Cerrar
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1.5rem;
    }

    .qr-card {
      width: 100%;
      max-width: 400px;
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.35);
      border-radius: 24px;
      padding: 1.75rem;
      text-align: center;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.9);
      animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalPop {
      from { opacity: 0; transform: scale(0.92) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .qr-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.35rem;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .qr-icon-badge {
      font-size: 1.2rem;
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .qr-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 800;
      color: #f8fafc;
    }

    .qr-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.1rem;
    }

    .qr-frame {
      background: #ffffff;
      padding: 1rem;
      border-radius: 20px;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(59, 130, 246, 0.2);
    }

    .qr-img {
      display: block;
      border-radius: 8px;
    }

    .qr-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .qr-ref-tag {
      font-size: 0.82rem;
      font-weight: 800;
      color: #60a5fa;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.25);
      padding: 3px 12px;
      border-radius: 20px;
      letter-spacing: 0.04em;
    }

    .qr-prod-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: #f8fafc;
      margin: 4px 0 0;
    }

    .qr-sub {
      font-size: 0.78rem;
      color: #94a3b8;
      max-width: 280px;
      line-height: 1.4;
    }

    .qr-footer {
      margin-top: 1.5rem;
      display: flex;
      gap: 10px;
    }

    .action-btn {
      flex: 1;
      padding: 0.75rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .download-btn {
      background: #2563eb;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
    }

    .download-btn:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }

    .close-action-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
    }

    .close-action-btn:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
    }
  `]
})
export class QrModalComponent {
  @Input() pedido: Pedido | null = null;
  @Output() closeEvent = new EventEmitter<void>();

  close() {
    this.closeEvent.emit();
  }

  getQrImageUrl(pedido: Pedido): string {
    const trackingData = `LOGIGHO IMPORTACIONES\n-------------------\nREF: ${pedido.referencia || pedido.codigo}\nPRODUCTO: ${pedido.descripcion}\nCANTIDAD: ${pedido.totalQty || 0} uds\nORIGEN: ${pedido.ciudad || 'GZ'}\nTOTAL COP: $${Math.round(pedido.total || 0).toLocaleString('es-CO')}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(trackingData)}&color=0f172a&bgcolor=ffffff`;
  }

  downloadQrImage(pedido: Pedido) {
    const url = this.getQrImageUrl(pedido);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_${pedido.referencia || pedido.codigo || 'importacion'}.png`;
    a.target = '_blank';
    a.click();
  }
}
