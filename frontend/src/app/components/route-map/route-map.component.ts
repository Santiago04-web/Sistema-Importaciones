import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface RouteVessel {
  id: string;
  name: string;
  lote: string;
  origin: string;
  destination: string;
  cbm: number;
  etaDays: number;
  status: string;
  progressPct: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-route-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="route-map-card glass-card">
      <div class="map-header">
        <div class="header-title-wrap">
          <div class="live-pulse-badge">
            <span class="pulse-dot"></span>
            <span>MONITOREO DE RUTA MARÍTIMA EN VIVO</span>
          </div>
          <h3>Ruta China (Guangzhou / Yiwu) 🚢 Colombia (Buenaventura)</h3>
          <p class="map-sub">Rastreo de embarques en tránsito por el Océano Pacífico</p>
        </div>

        <div class="map-kpis">
          <div class="map-kpi-pill">
            <span class="pill-lbl">Barcos Activos</span>
            <strong class="pill-val">3 Buques</strong>
          </div>
          <div class="map-kpi-pill">
            <span class="pill-lbl">Tránsito Promedio</span>
            <strong class="pill-val">32 Días</strong>
          </div>
          <div class="map-kpi-pill green">
            <span class="pill-lbl">Estado Canal</span>
            <strong class="pill-val green-txt">✓ Operativo</strong>
          </div>
        </div>
      </div>

      <!-- MAP CONTAINER -->
      <div class="svg-map-wrapper">
        <svg viewBox="0 0 1000 500" class="world-map-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.9" />
              <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.9" />
              <stop offset="100%" stop-color="#10b981" stop-opacity="0.9" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <!-- CONTINENT SHAPES -->
          <g class="land-masses" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="0.75">
            <path d="M 680,80 L 850,70 L 920,130 L 890,220 L 830,240 L 780,210 L 760,260 L 730,250 L 700,200 L 650,190 L 640,130 Z" />
            <path d="M 740,140 Q 820,130 840,180 T 780,230 T 720,200 Z" fill="rgba(59, 130, 246, 0.12)" stroke="rgba(59, 130, 246, 0.3)" />
            <path d="M 820,320 L 910,310 L 930,390 L 840,400 Z" />
            <path d="M 80,60 L 280,50 L 320,140 L 260,200 L 180,180 L 120,130 Z" />
            <path d="M 230,210 L 310,210 L 340,300 L 290,420 L 220,330 Z" fill="rgba(16, 185, 129, 0.08)" stroke="rgba(16, 185, 129, 0.25)" />
            <path d="M 240,210 L 275,210 L 270,245 L 238,240 Z" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" stroke-width="1.2" />
          </g>

          <!-- GEODESIC PACIFIC ROUTE ARCS -->
          <path id="routeGZ" d="M 780,195 Q 520,330 250,225" 
                fill="none" stroke="url(#routeGradient)" stroke-width="2.5" 
                stroke-dasharray="6,4" class="animated-route-line" filter="url(#glow)" />

          <path id="routeYIWU" d="M 805,185 Q 530,300 250,225" 
                fill="none" stroke="rgba(245, 158, 11, 0.6)" stroke-width="2" 
                stroke-dasharray="4,4" class="animated-route-line-alt" />

          <!-- ORIGIN NODES (CHINA) -->
          <g class="city-node origin" transform="translate(780, 195)" (click)="selectVessel(vessels[0])">
            <circle r="12" fill="rgba(59, 130, 246, 0.2)" class="node-pulse" />
            <circle r="5" fill="#3b82f6" stroke="#fff" stroke-width="1.5" />
            <text x="10" y="-8" fill="#60a5fa" font-size="11" font-weight="700">Guangzhou (GZ)</text>
          </g>

          <g class="city-node origin" transform="translate(805, 185)" (click)="selectVessel(vessels[1])">
            <circle r="10" fill="rgba(245, 158, 11, 0.2)" class="node-pulse" />
            <circle r="4.5" fill="#f59e0b" stroke="#fff" stroke-width="1.5" />
            <text x="8" y="14" fill="#fbbf24" font-size="11" font-weight="700">Yiwu (CN)</text>
          </g>

          <!-- DESTINATION NODE (COLOMBIA) -->
          <g class="city-node destination" transform="translate(250, 225)">
            <circle r="14" fill="rgba(16, 185, 129, 0.25)" class="node-pulse-green" />
            <circle r="6" fill="#10b981" stroke="#fff" stroke-width="2" />
            <text x="-105" y="4" fill="#34d399" font-size="11" font-weight="800">🇨🇴 Buenaventura</text>
          </g>

          <!-- ANIMATED VESSELS ON PACIFIC -->
          <g *ngFor="let v of vessels" 
             [attr.transform]="'translate(' + v.x + ',' + v.y + ')'" 
             class="vessel-marker" 
             (click)="selectVessel(v)">
            <circle r="16" fill="rgba(56, 189, 248, 0.2)" class="ship-radar" />
            <g transform="translate(-10, -10)">
              <rect x="2" y="10" width="16" height="6" rx="2" fill="#38bdf8" />
              <polygon points="18,10 22,13 18,16" fill="#38bdf8" />
              <rect x="6" y="5" width="4" height="5" fill="#fff" />
              <rect x="11" y="7" width="3" height="3" fill="#60a5fa" />
            </g>

            <g transform="translate(0, -22)">
              <rect x="-45" y="-12" width="90" height="18" rx="9" fill="#0f172a" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
              <text x="0" y="1" text-anchor="middle" fill="#fff" font-size="9" font-weight="700">
                🚢 {{ v.name }}
              </text>
            </g>
          </g>
        </svg>

        <!-- LIVE SHIP DETAIL MODAL -->
        <div class="active-vessel-card" *ngIf="selectedVessel">
          <div class="vessel-card-header">
            <div class="vessel-title">
              <span class="vessel-icon">🚢</span>
              <div>
                <h4>{{ selectedVessel.name }}</h4>
                <span class="vessel-lote">Pedido #{{ selectedVessel.lote }}</span>
              </div>
            </div>
            <button class="close-card-btn" (click)="selectedVessel = null">✕</button>
          </div>

          <div class="vessel-stats-grid">
            <div class="v-stat">
              <span class="v-lbl">Origen ➔ Destino</span>
              <strong class="v-val">{{ selectedVessel.origin }} ➔ {{ selectedVessel.destination }}</strong>
            </div>
            <div class="v-stat">
              <span class="v-lbl">Estado de Carga</span>
              <span class="status-badge-blue">{{ selectedVessel.status }}</span>
            </div>
            <div class="v-stat">
              <span class="v-lbl">Volumen CBM</span>
              <strong class="v-val">{{ selectedVessel.cbm }} m³</strong>
            </div>
            <div class="v-stat">
              <span class="v-lbl">ETA Estimado</span>
              <strong class="v-val green-txt">{{ selectedVessel.etaDays }} Días Restantes</strong>
            </div>
          </div>

          <div class="journey-progress-box">
            <div class="journey-labels">
              <span>China</span>
              <span>Pacífico Central</span>
              <span>Colombia</span>
            </div>
            <div class="journey-track">
              <div class="journey-fill" [style.width.%]="selectedVessel.progressPct"></div>
              <div class="journey-ship-pin" [style.left.%]="selectedVessel.progressPct">🚢</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .route-map-card {
      padding: 1.5rem;
      border-radius: 16px;
      background: rgba(20, 20, 24, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(12px);
      margin-bottom: 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    }
    .map-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .live-pulse-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 4px 10px;
      border-radius: 20px;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 8px #38bdf8;
      animation: pulseGlow 1.5s infinite;
    }
    @keyframes pulseGlow {
      0% { opacity: 0.4; transform: scale(0.9); }
      50% { opacity: 1; transform: scale(1.3); }
      100% { opacity: 0.4; transform: scale(0.9); }
    }
    .header-title-wrap h3 {
      font-size: 1.3rem;
      font-weight: 800;
      color: #fff;
      margin: 0 0 2px 0;
      letter-spacing: -0.02em;
    }
    .map-sub {
      font-size: 0.85rem;
      color: #94a3b8;
      margin: 0;
    }
    .map-kpis {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .map-kpi-pill {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 8px 14px;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
    }
    .map-kpi-pill.green {
      border-color: rgba(16, 185, 129, 0.25);
      background: rgba(16, 185, 129, 0.06);
    }
    .pill-lbl {
      font-size: 0.7rem;
      color: #64748b;
      text-transform: uppercase;
    }
    .pill-val {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
    }
    .green-txt { color: #10b981 !important; }

    .svg-map-wrapper {
      position: relative;
      width: 100%;
      background: radial-gradient(circle at 50% 50%, #0d1527 0%, #070b14 100%);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      overflow: hidden;
    }
    .world-map-svg {
      width: 100%;
      height: auto;
      min-height: 380px;
      display: block;
    }
    .animated-route-line {
      stroke-dasharray: 8, 6;
      animation: dashMove 25s linear infinite;
    }
    @keyframes dashMove {
      from { stroke-dashoffset: 200; }
      to { stroke-dashoffset: 0; }
    }
    .animated-route-line-alt {
      stroke-dasharray: 6, 4;
      animation: dashMoveAlt 30s linear infinite;
    }
    @keyframes dashMoveAlt {
      from { stroke-dashoffset: 0; }
      to { stroke-dashoffset: 200; }
    }
    .city-node {
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    .city-node:hover {
      transform: scale(1.15);
    }
    .node-pulse {
      animation: nodePulse 2s infinite;
    }
    .node-pulse-green {
      animation: nodePulse 1.8s infinite;
    }
    @keyframes nodePulse {
      0% { r: 6px; opacity: 0.8; }
      100% { r: 20px; opacity: 0; }
    }

    .vessel-marker {
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .vessel-marker:hover {
      filter: drop-shadow(0 0 10px #38bdf8);
    }
    .ship-radar {
      animation: radarExpand 2.2s infinite;
    }
    @keyframes radarExpand {
      0% { r: 8px; opacity: 0.9; }
      100% { r: 24px; opacity: 0; }
    }

    .active-vessel-card {
      position: absolute;
      bottom: 20px;
      left: 20px;
      width: calc(100% - 40px);
      max-width: 480px;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(56, 189, 248, 0.3);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(16px);
      border-radius: 14px;
      padding: 1.2rem;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 10;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .vessel-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .vessel-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .vessel-icon {
      font-size: 1.5rem;
    }
    .vessel-title h4 {
      margin: 0;
      font-size: 1.05rem;
      color: #fff;
      font-weight: 700;
    }
    .vessel-lote {
      font-size: 0.78rem;
      color: #38bdf8;
      font-weight: 600;
    }
    .close-card-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #94a3b8;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      font-weight: bold;
    }
    .close-card-btn:hover { background: rgba(255, 255, 255, 0.2); color: #fff; }
    .vessel-stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 1rem;
    }
    .v-stat {
      background: rgba(255, 255, 255, 0.03);
      padding: 8px 10px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
    }
    .v-lbl {
      font-size: 0.7rem;
      color: #64748b;
    }
    .v-val {
      font-size: 0.85rem;
      color: #e2e8f0;
      font-weight: 600;
    }
    .status-badge-blue {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.15);
      padding: 2px 8px;
      border-radius: 4px;
      margin-top: 2px;
      width: fit-content;
    }
    .journey-progress-box {
      margin-top: 8px;
    }
    .journey-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      color: #64748b;
      margin-bottom: 4px;
    }
    .journey-track {
      position: relative;
      height: 8px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      overflow: visible;
    }
    .journey-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #10b981);
      border-radius: 4px;
    }
    .journey-ship-pin {
      position: absolute;
      top: -10px;
      transform: translateX(-50%);
      font-size: 1rem;
    }

    @media (max-width: 768px) {
      .active-vessel-card {
        position: relative;
        bottom: 0;
        left: 0;
        width: 100%;
        margin-top: 1rem;
      }
      .vessel-stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RouteMapComponent implements OnInit {
  vessels: RouteVessel[] = [
    {
      id: 'V1',
      name: 'COSCO Guangzhou',
      lote: '1',
      origin: 'Guangzhou (GZ)',
      destination: 'Buenaventura (COL)',
      cbm: 68.4,
      etaDays: 14,
      status: 'En Tránsito - Pacífico Central',
      progressPct: 58,
      x: 520,
      y: 275
    },
    {
      id: 'V2',
      name: 'Evergreen Yiwu Express',
      lote: '2',
      origin: 'Yiwu / Ningbo',
      destination: 'Buenaventura (COL)',
      cbm: 42.1,
      etaDays: 22,
      status: 'Navegación Mar del Sur',
      progressPct: 28,
      x: 680,
      y: 235
    },
    {
      id: 'V3',
      name: 'Pacific Star III',
      lote: '3',
      origin: 'Guangzhou (GZ)',
      destination: 'Cartagena (COL)',
      cbm: 55.0,
      etaDays: 6,
      status: 'Aproximación Canal de Panamá',
      progressPct: 84,
      x: 350,
      y: 230
    }
  ];

  selectedVessel: RouteVessel | null = null;

  ngOnInit() {
    this.selectedVessel = this.vessels[0];
  }

  selectVessel(v: RouteVessel) {
    this.selectedVessel = v;
  }
}
