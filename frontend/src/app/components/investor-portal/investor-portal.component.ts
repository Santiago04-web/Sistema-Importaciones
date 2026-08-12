import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService, Pedido } from '../../services/pedido.service';
import { PdfService } from '../../services/pdf.service';

interface GroupedInvestment {
  descripcion: string;
  ciudad: string;
  fotoUrl?: string;
  totalQty: number;
  totalYuanes: number;
  totalCop: number;
  gananciaTotal: number;
  cajasTotal: number;
  cubicaTotal: number;
  pedidosCount: number;
  etapaPredominante: number;
  costoUnidadCop: number;
}

@Component({
  selector: 'app-investor-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="investor-portal-page">

      <!-- EXECUTIVE HERO HEADER -->
      <div class="portal-hero">
        <div class="hero-bg-glow"></div>
        <div class="hero-content">
          <div class="hero-top">
            <span class="portal-badge">💼 PORTAL EJECUTIVO DE INVERSIÓN & SOCIOS</span>
            <span class="live-status">● DATOS EN TIEMPO REAL</span>
          </div>
          <h1 class="hero-title">Resumen de Inversiones & Estado de Cargas</h1>
          <p class="hero-subtitle">
            Monitoreo consolidado de capital invertido, proyección de rentabilidad y estado logístico internacional.
          </p>

          <!-- DYNAMIC CITY / ORIGIN FILTER CHIPS -->
          <div class="origin-filter-bar">
            <span class="filter-lbl">Filtrar por Origen:</span>
            <button class="origin-chip" [class.active]="selectedOrigen === 'TODOS'" (click)="selectedOrigen = 'TODOS'">
              🌐 Todos los Orígenes ({{ pedidos.length }})
            </button>
            <button class="origin-chip" 
                    *for="let orig of origenesDisponibles" 
                    [class.active]="selectedOrigen === orig.nombre" 
                    (click)="selectedOrigen = orig.nombre">
              🏢 {{ orig.nombre }} ({{ orig.count }})
            </button>
          </div>
        </div>
      </div>

      <!-- KEY EXECUTIVE INVESTMENT METRICS -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon cop-icon">💰</div>
          <div class="metric-info">
            <span class="m-lbl">Capital Invertido Total</span>
            <h3 class="m-val highlight-green">$ {{ totalInversionCop | number:'1.0-0' }} COP</h3>
            <span class="m-sub">Consolidado en {{ totalPedidosCount }} lotes de importación</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon gain-icon">📈</div>
          <div class="metric-info">
            <span class="m-lbl">Ganancia / Retorno Proyectado</span>
            <h3 class="m-val highlight-blue">$ {{ totalGananciaProyectada | number:'1.0-0' }} COP</h3>
            <span class="m-sub">Margen Neto Estimado: 10% - 12%</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon volume-icon">📦</div>
          <div class="metric-info">
            <span class="m-lbl">Volumen Cúbico Importado</span>
            <h3 class="m-val text-yellow">{{ totalCubicaSum | number:'1.2-2' }} m³</h3>
            <span class="m-sub">{{ totalCajasSum | number }} cajas consolidadas</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon ship-icon">🚀</div>
          <div class="metric-info">
            <span class="m-lbl">Cargas Activas (Tránsito / Aduana)</span>
            <h3 class="m-val text-cyan">{{ cargasEnTransitoCount }} Cargas</h3>
            <span class="m-sub">Flujo marítimo en progreso</span>
          </div>
        </div>
      </div>

      <!-- LOGISTICAL PROGRESS & PORTFOLIO SECTION -->
      <div class="portfolio-section">
        <div class="section-header">
          <div>
            <h2 class="sec-title">Portafolio de Productos en Inversión</h2>
            <p class="sec-sub">Desglose por tipo de mercancía, cantidad importada y costo unitario puesto en Colombia</p>
          </div>

          <button class="export-report-btn" (click)="exportReportPDF()">
            📄 Exportar Informe PDF
          </button>
        </div>

        <!-- PORTFOLIO CARDS GRID -->
        <div class="portfolio-grid" *ngIf="!loading">
          <div class="portfolio-card glass-card" *ngFor="let item of filteredPortafolio">
            
            <div class="card-head">
              <div class="prod-img-box">
                <img *ngIf="item.fotoUrl" [src]="formatPhotoUrl(item.fotoUrl)" (error)="item.fotoUrl = undefined" alt="Foto">
                <span *ngIf="!item.fotoUrl" class="no-img-emoji">📦</span>
              </div>

              <div class="prod-title-box">
                <div class="origin-badge">
                  <span>🏢 Origen: {{ item.ciudad }}</span>
                </div>
                <h3 class="prod-name">{{ item.descripcion }}</h3>
                <span class="pedidos-badge">{{ item.pedidosCount }} lotes consolidados</span>
              </div>
            </div>

            <div class="card-stats-grid">
              <div class="c-stat">
                <span class="cs-lbl">Cant. Total</span>
                <strong class="cs-val">{{ item.totalQty | number }} pzas</strong>
              </div>
              <div class="c-stat">
                <span class="cs-lbl">Costo Unidad (COP)</span>
                <strong class="cs-val text-cyan">$ {{ item.costoUnidadCop | number:'1.0-0' }}</strong>
              </div>
              <div class="c-stat">
                <span class="cs-lbl">Inversión Lote (COP)</span>
                <strong class="cs-val text-green">$ {{ item.totalCop | number:'1.0-0' }}</strong>
              </div>
              <div class="c-stat">
                <span class="cs-lbl">Ganancia Neto</span>
                <strong class="cs-val text-yellow">$ {{ item.gananciaTotal | number:'1.0-0' }}</strong>
              </div>
            </div>

            <div class="card-foot">
              <span [class]="'etapa-pill etapa-' + item.etapaPredominante">
                {{ getEtapaLabel(item.etapaPredominante) }}
              </span>
              <span class="cubica-info">📦 {{ item.cubicaTotal | number:'1.2-2' }} m³</span>
            </div>

          </div>
        </div>

        <!-- EMPTY / LOADING STATES -->
        <div class="loading-box" *ngIf="loading">
          <span class="spinner"></span>
          <span>Cargando datos de inversiones en tiempo real...</span>
        </div>

        <div class="empty-box" *ngIf="!loading && filteredPortafolio.length === 0">
          <span>📭 No hay inversiones registradas para el origen seleccionado.</span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .investor-portal-page {
      padding: 1.75rem 2.25rem;
      max-width: 1600px;
      margin: 0 auto;
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
    }

    /* HERO HEADER */
    .portal-hero {
      position: relative;
      background: linear-gradient(135deg, #09132b 0%, #030712 100%);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 20px;
      padding: 2.25rem 2.5rem;
      margin-bottom: 2rem;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
    }
    .hero-bg-glow {
      position: absolute;
      top: -100px; right: -100px;
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero-content {
      position: relative;
      z-index: 2;
    }
    .hero-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.85rem;
      flex-wrap: wrap;
      gap: 10px;
    }
    .portal-badge {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #60a5fa;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
    }
    .live-status {
      font-size: 0.72rem;
      font-weight: 800;
      color: #34d399;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
    }
    .hero-title {
      font-size: 2rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 0.4rem;
      letter-spacing: -0.02em;
    }
    .hero-subtitle {
      font-size: 0.95rem;
      color: #94a3b8;
      max-width: 750px;
      margin-bottom: 1.5rem;
    }

    /* ORIGIN FILTER BAR */
    .origin-filter-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .filter-lbl {
      font-size: 0.78rem;
      font-weight: 700;
      color: #94a3b8;
      margin-right: 4px;
    }
    .origin-chip {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      padding: 5px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .origin-chip:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
      transform: translateY(-1px);
    }
    .origin-chip.active {
      background: #2563eb !important;
      border-color: #60a5fa !important;
      color: #ffffff !important;
      box-shadow: 0 0 16px rgba(37, 99, 235, 0.4);
    }

    /* METRICS GRID */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2.25rem;
    }
    .metric-card {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.35rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.1rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      transition: transform 0.2s ease;
    }
    .metric-card:hover {
      transform: translateY(-2px);
      border-color: rgba(59, 130, 246, 0.3);
    }
    .metric-icon {
      width: 50px;
      height: 50px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .cop-icon { background: rgba(16, 185, 129, 0.15); }
    .gain-icon { background: rgba(59, 130, 246, 0.15); }
    .volume-icon { background: rgba(250, 204, 21, 0.15); }
    .ship-icon { background: rgba(20, 184, 166, 0.15); }

    .metric-info { display: flex; flex-direction: column; }
    .m-lbl { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .m-val { font-size: 1.35rem; font-weight: 800; margin: 2px 0; }
    .m-sub { font-size: 0.72rem; color: #64748b; }
    .highlight-green { color: #4ade80; }
    .highlight-blue { color: #60a5fa; }
    .text-yellow { color: #facc15; }
    .text-cyan { color: #2dd4bf; }

    /* PORTFOLIO SECTION */
    .portfolio-section {
      background: #090d16;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.35rem;
      flex-wrap: wrap;
      gap: 12px;
    }
    .sec-title {
      font-size: 1.3rem;
      font-weight: 800;
      color: #f8fafc;
    }
    .sec-sub {
      font-size: 0.83rem;
      color: #94a3b8;
    }
    .export-report-btn {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #60a5fa;
      padding: 0.6rem 1.1rem;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .export-report-btn:hover {
      background: #2563eb;
      color: #fff;
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.4);
    }

    .portfolio-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.35rem;
    }

    .portfolio-card {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      padding: 1.35rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.5);
      transition: all 0.2s ease;
    }
    .portfolio-card:hover {
      transform: translateY(-3px);
      border-color: rgba(59, 130, 246, 0.35);
    }

    .card-head {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 1.15rem;
    }
    .prod-img-box {
      width: 58px; height: 58px;
      border-radius: 12px;
      background: #020617;
      border: 1px solid rgba(255, 255, 255, 0.1);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .prod-img-box img { width: 100%; height: 100%; object-fit: cover; }
    .no-img-emoji { font-size: 1.8rem; }

    .prod-title-box { display: flex; flex-direction: column; }
    .origin-badge { font-size: 0.7rem; font-weight: 800; color: #38bdf8; margin-bottom: 2px; }
    .prod-name { font-size: 1.05rem; font-weight: 800; color: #f8fafc; line-height: 1.25; }
    .pedidos-badge { font-size: 0.72rem; color: #94a3b8; }

    .card-stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.03);
      padding: 0.85rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      margin-bottom: 1rem;
    }
    .c-stat { display: flex; flex-direction: column; }
    .cs-lbl { font-size: 0.68rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
    .cs-val { font-size: 0.95rem; font-weight: 800; color: #f8fafc; }

    .card-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.4rem;
    }
    .etapa-pill {
      font-size: 0.72rem; font-weight: 800; padding: 3px 9px; border-radius: 6px;
    }
    .etapa-0 { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }
    .etapa-1 { background: rgba(168, 85, 247, 0.18); color: #d8b4fe; }
    .etapa-2 { background: rgba(16, 185, 129, 0.18); color: #6ee7b7; }
    .etapa-3 { background: rgba(59, 130, 246, 0.22); color: #93c5fd; }
    .etapa-4 { background: rgba(249, 115, 22, 0.22); color: #ffedd5; }
    .etapa-5 { background: rgba(20, 184, 166, 0.22); color: #99f6e4; }

    .cubica-info { font-size: 0.75rem; color: #94a3b8; font-weight: 700; }

    .loading-box, .empty-box {
      text-align: center;
      padding: 4rem;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      font-size: 0.9rem;
    }
    .spinner {
      width: 28px; height: 28px;
      border: 3px solid rgba(59, 130, 246, 0.2);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class InvestorPortalComponent implements OnInit {
  pedidos: Pedido[] = [];
  portafolio: GroupedInvestment[] = [];
  selectedOrigen = 'TODOS';
  loading = true;

  constructor(
    private pedidoService: PedidoService,
    private pdfService: PdfService
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  formatPhotoUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const base = isLocal ? 'http://localhost:5174' : 'https://sistema-importaciones.onrender.com';
    return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
  }

  cargarDatos() {
    this.loading = true;
    this.pedidoService.getPedidos().subscribe({
      next: (data) => {
        this.pedidos = data;
        this.procesarPortafolio();
        this.loading = false;
      },
      error: (err) => {
        console.error("Error al cargar pedidos para inversionistas:", err);
        this.loading = false;
      }
    });
  }

  get origenesDisponibles(): { nombre: string; count: number }[] {
    const map = new Map<string, number>();
    this.pedidos.forEach(p => {
      const orig = (p.ciudad || 'GZ').trim();
      map.set(orig, (map.get(orig) || 0) + 1);
    });
    return Array.from(map.entries()).map(([nombre, count]) => ({ nombre, count }));
  }

  procesarPortafolio() {
    const map = new Map<string, Pedido[]>();
    
    this.pedidos.forEach(p => {
      const key = (p.descripcion || 'Sin Descripción').trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });

    this.portafolio = Array.from(map.entries()).map(([desc, items]) => {
      const firstWithPhoto = items.find(x => x.fotoUrl);
      const totalQty = items.reduce((s, x) => s + (x.totalQty || 0), 0);
      const totalYuanes = items.reduce((s, x) => s + (x.yuanes || 0), 0);
      const totalCop = items.reduce((s, x) => s + (x.total || 0), 0);
      const gananciaTotal = items.reduce((s, x) => s + (x.ganancia || 0), 0);
      const cajasTotal = items.reduce((s, x) => s + (x.cajas || 0), 0);
      const cubicaTotal = items.reduce((s, x) => s + (x.cubica || 0), 0);
      
      const ciudad = items[0]?.ciudad || 'GZ';

      // Get predominant stage
      const stageCounts: { [key: number]: number } = {};
      items.forEach(x => {
        const et = Number(x.etapa) || 0;
        stageCounts[et] = (stageCounts[et] || 0) + 1;
      });
      let maxEtapa = 0, maxCount = 0;
      Object.entries(stageCounts).forEach(([et, count]) => {
        if (count > maxCount) {
          maxCount = count;
          maxEtapa = Number(et);
        }
      });

      const costoUnidadCop = totalQty > 0 ? totalCop / totalQty : 0;

      return {
        descripcion: desc,
        ciudad,
        fotoUrl: firstWithPhoto?.fotoUrl,
        totalQty,
        totalYuanes,
        totalCop,
        gananciaTotal,
        cajasTotal,
        cubicaTotal,
        pedidosCount: items.length,
        etapaPredominante: maxEtapa,
        costoUnidadCop
      };
    });
  }

  get filteredPortafolio(): GroupedInvestment[] {
    if (this.selectedOrigen === 'TODOS') return this.portafolio;
    return this.portafolio.filter(x => x.ciudad.toLowerCase() === this.selectedOrigen.toLowerCase());
  }

  get totalInversionCop(): number {
    return this.pedidos.reduce((sum, p) => sum + (p.total || 0), 0);
  }

  get totalGananciaProyectada(): number {
    return this.pedidos.reduce((sum, p) => sum + (p.ganancia || 0), 0);
  }

  get totalCubicaSum(): number {
    return this.pedidos.reduce((sum, p) => sum + (p.cubica || 0), 0);
  }

  get totalCajasSum(): number {
    return this.pedidos.reduce((sum, p) => sum + (p.cajas || 0), 0);
  }

  get totalPedidosCount(): number {
    return this.pedidos.length;
  }

  get cargasEnTransitoCount(): number {
    return this.pedidos.filter(p => Number(p.etapa) === 3 || Number(p.etapa) === 4).length;
  }

  getEtapaLabel(etapa: any): string {
    switch (Number(etapa)) {
      case 0: return 'Cotización';
      case 1: return 'Confirmado';
      case 2: return 'Pagado';
      case 3: return 'En Tránsito';
      case 4: return 'Aduana';
      case 5: return 'Recibido';
      default: return 'En Proceso';
    }
  }

  exportReportPDF() {
    this.pdfService.exportInvestorReportPdf(this.pedidos);
  }
}
