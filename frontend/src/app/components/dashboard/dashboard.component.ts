import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService, Pedido } from '../../services/pedido.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { RouteMapComponent } from '../route-map/route-map.component';
import { ExchangeRateComponent } from '../exchange-rate/exchange-rate.component';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FormsModule, RouteMapComponent, ExchangeRateComponent],
  template: `
    <div class="dash" *ngIf="!loading">

      <!-- TOOLBAR & FILTROS -->
      <div class="dash-toolbar mb-4">
        <!-- ROW 1: HEADER TITLE + LOTE SELECTOR -->
        <div class="toolbar-top-row">
          <div class="filter-title">
            <div class="header-badge">
              <span class="live-dot"></span>
              <span>ANÁLISIS DE IMPORTACIÓN EN TIEMPO REAL</span>
            </div>
            <h2>Control Financiero & Operativo</h2>
          </div>

          <!-- BUSCADOR / SELECTOR INTELIGENTE DE LOTES -->
          <div class="searchable-lote-container">
            <button class="lote-dropdown-btn" (click)="toggleLoteDropdown($event)">
              <span class="lote-lbl-icon">🔍 LOTE:</span>
              <span class="lote-active-name">{{ getSelectedLoteName() }}</span>
              <span class="dropdown-chevron">▼</span>
            </button>

            <!-- FLOATING SEARCHABLE POPOVER MENU -->
            <div class="lote-popover-menu" *ngIf="showLoteDropdown" (click)="$event.stopPropagation()">
              <div class="popover-search-box">
                <input type="text" class="popover-input" 
                       placeholder="🔍 Buscar pedido / lote (ej. 1, 2)..." 
                       [(ngModel)]="searchLoteQuery" 
                       (input)="filterLotes()">
              </div>
              
              <div class="popover-list">
                <div class="popover-item" 
                     [class.active]="selectedPedidoCodigo === 'ALL'"
                     (click)="selectLote('ALL')">
                  <span class="item-icon">📦</span>
                  <div class="item-details">
                    <strong>Todos los Pedidos</strong>
                    <span class="item-sub">Consolidado general ({{ allPedidos.length }} productos)</span>
                  </div>
                </div>

                <div class="popover-item" *ngFor="let item of filteredLotes" 
                     [class.active]="selectedPedidoCodigo === item.codigo"
                     (click)="selectLote(item.codigo)">
                  <span class="item-icon">🏷️</span>
                  <div class="item-details">
                    <strong>Pedido #{{ item.codigo }}</strong>
                    <span class="item-sub">{{ item.count }} productos · \${{ formatNum(item.totalVal) }}</span>
                  </div>
                </div>

                <div class="empty-popover" *ngIf="filteredLotes.length === 0 && searchLoteQuery">
                  Sin resultados
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- ROW 2: CATEGORY FILTER BUTTONS -->
        <div class="filter-buttons">
          <button class="filter-btn" [class.active]="filterCategory === 'ALL'" (click)="setFilter('ALL')">
            🌐 Visión General
          </button>
          <button class="filter-btn purple-btn" [class.active]="filterCategory === 'EHUK'" (click)="setFilter('EHUK')">
            💼 EHUK (Comisiones)
          </button>
          <button class="filter-btn orange-btn" [class.active]="filterCategory === 'FLETE'" (click)="setFilter('FLETE')">
            🚢 Flete & CBM
          </button>
          <button class="filter-btn blue-btn" [class.active]="filterCategory === 'PRODUCTO'" (click)="setFilter('PRODUCTO')">
            📦 Productos
          </button>
          <button class="filter-btn green-btn" [class.active]="filterCategory === 'PAGO_30'" (click)="setFilter('PAGO_30')">
            💵 30% Abonado
          </button>
          <button class="filter-btn red-btn" [class.active]="filterCategory === 'SALDO'" (click)="setFilter('SALDO')">
            ⏳ Saldo Pendiente
          </button>
        </div>
      </div>

      <!-- WIDGET DE TASA DE CAMBIO EN VIVO -->
      <app-exchange-rate></app-exchange-rate>

      <!-- MAPA INTERACTIVO DE RUTAS CHINA -> COLOMBIA -->
      <app-route-map></app-route-map>

      <!-- ROW 1: METRICAS PRINCIPALES (KPI CARDS) -->
      <div class="kpi-grid">
        <div class="kpi-card" [class.dash-card-anim]="isUpdating" [class.active-glow-blue]="filterCategory === 'ALL' || filterCategory === 'PRODUCTO'">
          <div class="kpi-head">
            <span class="kpi-title">{{ filterCategory === 'PRODUCTO' ? 'Costo Único Producto' : 'Total Invertido' }}</span>
            <span class="kpi-chip blue">{{ filterCategory === 'PRODUCTO' ? 'MERCANCÍA' : 'COP' }}</span>
          </div>
          <div class="kpi-value" [class.blue-txt]="filterCategory === 'PRODUCTO'">\${{ formatNum(displayInvertido) }}</div>
          <div class="kpi-footer">{{ getInvertidoSub() }}</div>
        </div>

        <div class="kpi-card" [class.dash-card-anim]="isUpdating" [class.active-glow-purple]="filterCategory === 'EHUK'">
          <div class="kpi-head">
            <span class="kpi-title">Comisiones EHUK</span>
            <span class="kpi-chip purple">5% + 7%</span>
          </div>
          <div class="kpi-value purple-txt">\${{ formatNum(comisionesTotal) }}</div>
          <div class="kpi-footer">Trabajo: \${{ formatShort(comisionTrabajoTotal) }} · Apalanc: \${{ formatShort(comisionApalancamientoTotal) }}</div>
        </div>

        <div class="kpi-card" [class.dash-card-anim]="isUpdating" [class.active-glow-orange]="filterCategory === 'FLETE'">
          <div class="kpi-head">
            <span class="kpi-title">Flete & Transporte</span>
            <span class="kpi-chip orange">CÚBICA</span>
          </div>
          <div class="kpi-value orange-txt">\${{ formatNum(fleteTotal) }}</div>
          <div class="kpi-footer">{{ formatNum(mt3Total) }} m³ CBM contratados</div>
        </div>

        <div class="kpi-card" [class.dash-card-anim]="isUpdating"
             [class.active-glow-green]="filterCategory === 'PAGO_30'"
             [class.active-glow-red]="filterCategory === 'SALDO'">
          <div class="kpi-head">
            <span class="kpi-title">{{ filterCategory === 'PAGO_30' ? 'Pago Inicial 30%' : 'Saldo Pendiente' }}</span>
            <span class="kpi-chip" [ngClass]="filterCategory === 'PAGO_30' ? 'green' : 'red'">
              {{ filterCategory === 'PAGO_30' ? 'PAGADO' : 'DEUDA' }}
            </span>
          </div>
          <div class="kpi-value" [ngClass]="filterCategory === 'PAGO_30' ? 'green-txt' : 'red-txt'">
            \${{ formatNum(filterCategory === 'PAGO_30' ? pagoInicialTotal : saldoTotal) }}
          </div>
          <div class="kpi-footer">{{ filterCategory === 'PAGO_30' ? 'Desembolso inicial efectuado' : 'Monto pendiente por liquidar' }}</div>
        </div>
      </div>

      <!-- ROW 2: CATEGORÍAS DE PRODUCTO + RESUMEN OPERATIVO -->
      <div class="logistics-row">
        <!-- CARD CATEGORÍAS Y TIPOS DE PRODUCTO -->
        <div class="glass-card container-card">
          <div class="card-title-box">
            <div class="title-with-icon">
              <span class="card-icon">🛍️</span>
              <div>
                <h3>Categorías & Distribución de Productos</h3>
                <p class="card-desc">Desglose de unidades e inversión según tipo de mercancía (Ropa, Relojes, Maquillaje...)</p>
              </div>
            </div>
            <div class="cbm-big-badge">
              <span class="cbm-num">{{ totalQtySum | number }}</span>
              <span class="cbm-unit">Piezas Totales</span>
            </div>
          </div>

          <div class="categories-list-grid">
            <div class="cat-card-item" *ngFor="let cat of productCategories">
              <div class="cat-card-top">
                <div class="cat-name">
                  <span class="cat-icon-badge">{{ cat.icon }}</span>
                  <strong>{{ cat.name }}</strong>
                </div>
                <span class="cat-pct-badge" [style.color]="cat.color">{{ cat.pctStr }}</span>
              </div>
              <div class="cat-card-vals">
                <span class="cat-qty">{{ cat.units | number }} unidades</span>
                <strong class="cat-price">\${{ formatNum(cat.totalVal) }}</strong>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" [style.width.%]="cat.pct" [style.background]="cat.color"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- QUICK OPERATIONAL METRICS -->
        <div class="glass-card stats-card">
          <h3>Resumen Operativo</h3>
          <div class="stat-pills-list">
            <div class="stat-pill-item">
              <span class="stat-icon">📋</span>
              <div class="stat-details">
                <span class="stat-name">Total Pedidos</span>
                <strong class="stat-value">{{ totalPedidos }} importaciones</strong>
              </div>
            </div>

            <div class="stat-pill-item">
              <span class="stat-icon">🚚</span>
              <div class="stat-details">
                <span class="stat-name">En Tránsito / Activos</span>
                <strong class="stat-value blue-txt">{{ pedidosActivos }} en proceso</strong>
              </div>
            </div>

            <div class="stat-pill-item">
              <span class="stat-icon">✅</span>
              <div class="stat-details">
                <span class="stat-name">Recibidos / Completados</span>
                <strong class="stat-value green-txt">{{ pedidosRecibidos }} recibidos</strong>
              </div>
            </div>

            <div class="stat-pill-item">
              <span class="stat-icon">🏬</span>
              <div class="stat-details">
                <span class="stat-name">Ciudades de Origen</span>
                <strong class="stat-value">{{ ciudadesUnicas }} bodegas</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ROW 3: ANALYTICS GRID (3 COLUMNAS PARALELAS) -->
      <div class="three-col-grid mb-4">

        <!-- PANEL 1: DESGLOSE DE COSTOS -->
        <div class="glass-card flex-col">
          <div class="card-header-clean">
            <h3>Desglose de Costos</h3>
            <span class="subtext">Inversión por categoría</span>
          </div>

          <div class="donut-box">
            <div class="chart-canvas-wrap">
              <canvas *ngIf="costDonutData" baseChart
                [data]="costDonutData"
                [options]="costDonutOptions"
                [type]="'doughnut'">
              </canvas>
              <div class="chart-center-info" [style.opacity]="isHoveringCostDonut ? '0' : '1'" [style.visibility]="isHoveringCostDonut ? 'hidden' : 'visible'" style="transition: opacity 0.15s ease, visibility 0.15s ease;">
                <span class="center-val">\${{ formatShort(displayInvertido) }}</span>
                <span class="center-lbl">Total</span>
              </div>
            </div>

            <div class="legend-list">
              <div class="legend-row" *ngFor="let item of costBreakdown; let i = index">
                <div class="legend-dot" [style.background]="costColors[i]"></div>
                <span class="legend-title">{{ item.name }}</span>
                <span class="legend-amount">\${{ formatNum(item.value) }}</span>
                <span class="legend-percent">{{ item.pct }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- PANEL 2: INVERSIÓN POR CIUDAD -->
        <div class="glass-card flex-col">
          <div class="card-header-clean">
            <h3>Inversión por Ciudad</h3>
            <span class="subtext">Distribución Guangzhou vs Yiwu</span>
          </div>

          <div class="donut-box">
            <div class="chart-canvas-wrap">
              <canvas *ngIf="cityDonutData" baseChart
                [data]="cityDonutData"
                [options]="cityDonutOptions"
                [type]="'doughnut'">
              </canvas>
              <div class="chart-center-info" [style.opacity]="isHoveringCityDonut ? '0' : '1'" [style.visibility]="isHoveringCityDonut ? 'hidden' : 'visible'" style="transition: opacity 0.15s ease, visibility 0.15s ease;">
                <span class="center-val">{{ ciudadesUnicas }}</span>
                <span class="center-lbl">Ciudades</span>
              </div>
            </div>

            <div class="legend-list">
              <div class="legend-row" *ngFor="let city of ciudadStats; let i = index">
                <div class="legend-dot" [style.background]="cityColors[i % cityColors.length]"></div>
                <span class="legend-title">{{ city.name }}</span>
                <span class="legend-amount">\${{ formatNum(city.total) }}</span>
                <span class="legend-percent">{{ city.pct }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- PANEL 3: COSTO VS GANANCIA -->
        <div class="glass-card flex-col">
          <div class="card-header-clean">
            <h3>Costo vs Ganancia Proyectada</h3>
            <span class="subtext">Rentabilidad por puerto de salida</span>
          </div>

          <div class="bar-canvas-wrap">
            <canvas *ngIf="compareBarData" baseChart
              [data]="compareBarData"
              [options]="barOptions"
              [type]="'bar'">
            </canvas>
          </div>
        </div>

      </div>

      <!-- ROW 4: PIPELINE, TOP PEDIDOS & RESUMEN FINANCIERO (3 COLUMNAS) -->
      <div class="three-col-grid">

        <!-- PANEL 4: ESTADO DE LA IMPORTACIÓN -->
        <div class="glass-card flex-col">
          <div class="card-header-clean">
            <h3>Estado de la Importación</h3>
            <span class="subtext">Avance por etapas logísticas</span>
          </div>

          <div class="pipeline-vertical-list">
            <div class="pipe-row" *ngFor="let stage of etapaStats">
              <div class="pipe-meta">
                <div class="pipe-name-box">
                  <span class="stage-dot" [style.background]="stage.color"></span>
                  <span class="stage-name">{{ stage.name }}</span>
                </div>
                <div class="pipe-price-box">
                  <span class="pipe-count">{{ stage.itemCount }} prods ({{ formatShort(stage.pieceCount) }} pzas)</span>
                  <span class="pipe-price">\${{ formatNum(stage.value) }}</span>
                </div>
              </div>
              <div class="pipe-track">
                <div class="pipe-fill" [style.width.%]="stage.pct" [style.background]="stage.color"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- PANEL 5: TOP PEDIDOS POR VALOR -->
        <div class="glass-card flex-col">
          <div class="card-header-clean">
            <h3>Top Importaciones por Valor</h3>
            <span class="subtext">Pedidos de mayor inversión en COP</span>
          </div>

          <div class="top-list">
            <div class="top-item" *ngFor="let p of topPedidos; let i = index">
              <div class="top-rank">#{{ i + 1 }}</div>
              <div class="top-badge" [style.background]="getEtapaColor(p.etapa)">
                {{ p.ciudad ? p.ciudad.substring(0, 2) : 'CN' }}
              </div>
              <div class="top-info">
                <span class="top-code">{{ p.referencia || p.codigo || 'S/N' }}</span>
                <span class="top-desc">{{ formatTitleCase(p.descripcion || p.ciudad) }}</span>
              </div>
              <div class="top-val">\${{ formatNum(p.total || 0) }}</div>
            </div>
          </div>
        </div>

        <!-- PANEL 6: RESUMEN FINANCIERO EJECUTIVO -->
        <div class="glass-card flex-col executive-summary">
          <div class="card-header-clean">
            <h3>Resumen Financiero</h3>
            <span class="subtext">Balance consolidado del sistema</span>
          </div>

          <div class="summary-balance-list">
            <div class="bal-row">
              <span class="bal-lbl">Producto (Mercancía)</span>
              <strong class="bal-val">\${{ formatNum(productoTotal) }}</strong>
            </div>

            <div class="bal-row">
              <span class="bal-lbl">Flete Logística</span>
              <strong class="bal-val">\${{ formatNum(fleteTotal) }}</strong>
            </div>

            <div class="bal-row">
              <span class="bal-lbl">Comisión Trabajo (5%)</span>
              <strong class="bal-val">\${{ formatNum(comisionTrabajoTotal) }}</strong>
            </div>

            <div class="bal-row">
              <span class="bal-lbl">Comisión Apalancamiento (7%)</span>
              <strong class="bal-val">\${{ formatNum(comisionApalancamientoTotal) }}</strong>
            </div>

            <div class="bal-divider"></div>

            <div class="bal-row total-highlight">
              <span class="bal-lbl">TOTAL INVERTIDO</span>
              <strong class="bal-val">\${{ formatNum(totalInvertido) }}</strong>
            </div>

            <div class="bal-row">
              <span class="bal-lbl">Desembolso Inicial (30%)</span>
              <strong class="bal-val">\${{ formatNum(pagoInicialTotal) }}</strong>
            </div>

            <div class="bal-row">
              <span class="bal-lbl">Saldo Deuda Pendiente</span>
              <strong class="bal-val orange-txt">\${{ formatNum(saldoTotal) }}</strong>
            </div>

            <div class="bal-divider"></div>

            <div class="bal-row profit-highlight">
              <div>
                <span class="profit-lbl">GANANCIA ESTIMADA</span>
                <span class="profit-sub">Venta: \${{ formatNum(finalVentaTotal) }}</span>
              </div>
              <strong class="profit-val">\${{ formatNum(gananciaTotal) }}</strong>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- EMPTY / LOADING STATES -->
    <div class="empty-state" *ngIf="!loading && totalPedidos === 0">
      <div class="empty-icon">📊</div>
      <h2>Sin datos de importación</h2>
      <p>Sube tu manifiesto en Excel para activar los paneles analíticos.</p>
    </div>

    <div class="loading-state" *ngIf="loading">
      <div class="spinner-ring"></div>
      <p>Cargando consola financiera...</p>
    </div>
  `,
  styles: [`
    .dash {
      max-width: 1440px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 0.5rem 1rem 3rem 1rem;
      font-family: inherit;
    }

    /* TOOLBAR & FILTROS */
    .dash-toolbar {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      background: #141418;
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 14px;
      padding: 1.2rem 1.6rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }
    .toolbar-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 0.85rem;
    }
    .header-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.68rem;
      font-weight: 800;
      color: #3b82f6;
      letter-spacing: 0.08em;
      margin-bottom: 0.25rem;
    }
    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }
    .filter-title h2 {
      font-size: 1.2rem;
      font-weight: 800;
      color: #fff;
      margin: 0;
    }

    /* SEARCHABLE LOTE POPOVER */
    .searchable-lote-container {
      position: relative;
      display: inline-block;
    }
    .lote-dropdown-btn {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: #1a1a20;
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 0.45rem 1rem;
      border-radius: 999px;
      color: #fff;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.15);
      transition: all 0.2s ease;
    }
    .lote-dropdown-btn:hover {
      background: #22222a;
      border-color: #3b82f6;
      box-shadow: 0 0 16px rgba(59, 130, 246, 0.3);
    }
    .lote-lbl-icon {
      font-size: 0.72rem;
      font-weight: 800;
      color: #60a5fa;
      letter-spacing: 0.05em;
    }
    .lote-active-name {
      font-weight: 700;
      color: #fff;
    }
    .dropdown-chevron {
      font-size: 0.65rem;
      color: #64748b;
      margin-left: 0.2rem;
    }

    .lote-popover-menu {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      width: 290px;
      background: #141418;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
      z-index: 100;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: popoverFade 0.15s ease-out;
    }
    @keyframes popoverFade {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .popover-search-box {
      padding: 0.65rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      background: rgba(255, 255, 255, 0.02);
    }
    .popover-input {
      width: 100%;
      background: #09090b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #fff;
      font-size: 0.8rem;
      padding: 0.45rem 0.75rem;
      outline: none;
    }
    .popover-input:focus {
      border-color: #3b82f6;
    }

    .popover-list {
      max-height: 240px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .popover-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.65rem 0.85rem;
      cursor: pointer;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      transition: background 0.15s ease;
    }
    .popover-item:hover {
      background: rgba(255, 255, 255, 0.06);
    }
    .popover-item.active {
      background: rgba(59, 130, 246, 0.15);
    }
    .item-icon { font-size: 1rem; }
    .item-details {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }
    .item-details strong {
      font-size: 0.8rem;
      color: #fff;
    }
    .item-sub {
      font-size: 0.68rem;
      color: #64748b;
    }
    .empty-popover {
      padding: 1.5rem;
      text-align: center;
      color: #64748b;
      font-size: 0.78rem;
    }

    /* NEON PULSE ANIMATION ON FILTER SWITCH */
    .dash-card-anim {
      animation: neonPulse 0.38s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes neonPulse {
      0% { transform: scale(0.993); filter: brightness(1.25); }
      50% { transform: scale(1.003); }
      100% { transform: scale(1); filter: brightness(1); }
    }

    .cat-bar-fill, .pipe-fill {
      transition: width 0.65s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.35s ease !important;
    }

    .filter-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .filter-btn {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      color: #a1a1aa;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.45rem 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .filter-btn:hover {
      background: rgba(255, 255, 255, 0.09);
      color: #fff;
    }
    .filter-btn.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #fff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
    }
    .filter-btn.purple-btn.active { background: #8b5cf6; border-color: #8b5cf6; }
    .filter-btn.orange-btn.active { background: #f59e0b; border-color: #f59e0b; }
    .filter-btn.blue-btn.active { background: #0284c7; border-color: #0284c7; }
    .filter-btn.green-btn.active { background: #10b981; border-color: #10b981; }
    .filter-btn.red-btn.active { background: #ef4444; border-color: #ef4444; }

    /* KPI GRID */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }
    .kpi-card {
      background: #141418;
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 14px;
      padding: 1.25rem 1.4rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.15);
    }
    .kpi-card.active-glow-blue {
      border-color: #3b82f6;
      box-shadow: 0 0 18px rgba(59, 130, 246, 0.3);
    }
    .kpi-card.active-glow-purple {
      border-color: #8b5cf6;
      box-shadow: 0 0 18px rgba(139, 92, 246, 0.3);
    }
    .kpi-card.active-glow-orange {
      border-color: #f59e0b;
      box-shadow: 0 0 18px rgba(245, 158, 11, 0.3);
    }
    .kpi-card.active-glow-green {
      border-color: #10b981;
      box-shadow: 0 0 18px rgba(16, 185, 129, 0.3);
    }
    .kpi-card.active-glow-red {
      border-color: #ef4444;
      box-shadow: 0 0 18px rgba(239, 68, 68, 0.3);
    }

    .kpi-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .kpi-title {
      font-size: 0.78rem;
      font-weight: 600;
      color: #94a3b8;
    }
    .kpi-chip {
      font-size: 0.62rem;
      font-weight: 800;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      letter-spacing: 0.05em;
    }
    .kpi-chip.blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .kpi-chip.purple { background: rgba(139, 92, 246, 0.15); color: #c084fc; }
    .kpi-chip.orange { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .kpi-chip.green { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .kpi-chip.red { background: rgba(239, 68, 68, 0.15); color: #f87171; }

    .kpi-value {
      font-size: 1.65rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
      margin-top: 0.2rem;
    }
    .purple-txt { color: #c084fc; }
    .orange-txt { color: #fbbf24; }
    .green-txt { color: #34d399; }
    .red-txt { color: #f87171; }
    .blue-txt { color: #60a5fa; }

    .kpi-footer {
      font-size: 0.72rem;
      color: #64748b;
      margin-top: 0.2rem;
    }

    /* LOGISTICS & CONTENEDORES ROW */
    .logistics-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.25rem;
    }

    .glass-card {
      background: #141418;
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 14px;
      padding: 1.4rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }

    .container-card {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .card-title-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title-with-icon {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .card-icon {
      font-size: 1.6rem;
      background: rgba(255, 255, 255, 0.04);
      padding: 0.4rem 0.6rem;
      border-radius: 10px;
    }
    .title-with-icon h3 {
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      margin: 0;
    }
    .card-desc {
      font-size: 0.74rem;
      color: #64748b;
      margin: 0.15rem 0 0 0;
    }

    .cbm-big-badge {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.25);
      padding: 0.45rem 0.95rem;
      border-radius: 10px;
      flex-shrink: 0;
    }
    .cbm-num {
      font-size: 1.25rem;
      font-weight: 800;
      color: #60a5fa;
      line-height: 1.1;
      white-space: nowrap;
    }
    .cbm-unit {
      font-size: 0.65rem;
      color: #94a3b8;
      font-weight: 600;
      white-space: nowrap;
      margin-top: 0.1rem;
    }

    .categories-list-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.85rem;
    }
    .cat-card-item {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }
    .cat-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cat-name {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .cat-icon-badge {
      font-size: 1.1rem;
    }
    .cat-name strong {
      font-size: 0.82rem;
      color: #f1f5f9;
    }
    .cat-pct-badge {
      font-size: 0.72rem;
      font-weight: 800;
    }
    .cat-card-vals {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.76rem;
    }
    .cat-qty { color: #64748b; }
    .cat-price { color: #fff; font-variant-numeric: tabular-nums; }

    .progress-bar-bg {
      height: 8px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 999px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.8s ease;
    }
    .progress-bar-fill.blue { background: #3b82f6; }
    .progress-bar-fill.green { background: #10b981; }

    .box-foot {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      color: #64748b;
    }
    .box-foot strong { color: #e2e8f0; }
    .equiv-tag { font-weight: 600; color: #94a3b8; }

    /* STATS CARD */
    .stats-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .stats-card h3 {
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      margin: 0;
    }

    .stat-pills-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .stat-pill-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.04);
      padding: 0.65rem 0.85rem;
      border-radius: 10px;
    }
    .stat-icon {
      font-size: 1.2rem;
    }
    .stat-details {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }
    .stat-name {
      font-size: 0.7rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }
    .stat-value {
      font-size: 0.9rem;
      color: #f1f5f9;
      font-weight: 700;
    }

    /* 3 COLUMNAS GRID */
    .three-col-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }

    .flex-col {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .card-header-clean h3 {
      font-size: 0.98rem;
      font-weight: 700;
      color: #fff;
      margin: 0;
    }
    .subtext {
      font-size: 0.72rem;
      color: #64748b;
    }

    /* DONUT BOX */
    .donut-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }
    .chart-canvas-wrap {
      position: relative;
      width: 170px;
      height: 170px;
    }
    .chart-center-info {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      pointer-events: none;
      display: flex;
      flex-direction: column;
    }
    .center-val {
      font-size: 0.92rem;
      font-weight: 800;
      color: #fff;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }
    .center-lbl {
      font-size: 0.65rem;
      color: #64748b;
      margin-top: 0.2rem;
    }

    .legend-list {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }
    .legend-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.76rem;
    }
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .legend-title {
      color: #cbd5e1;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .legend-amount {
      color: #f8fafc;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .legend-percent {
      color: #64748b;
      min-width: 28px;
      text-align: right;
      font-size: 0.7rem;
    }

    /* BAR CANVAS WRAP */
    .bar-canvas-wrap {
      position: relative;
      height: 250px;
      width: 100%;
    }

    /* PIPELINE VERTICAL LIST */
    .pipeline-vertical-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      flex: 1;
      justify-content: center;
    }
    .pipe-row {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .pipe-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pipe-name-box {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .stage-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .stage-name {
      font-size: 0.78rem;
      font-weight: 600;
      color: #e2e8f0;
    }
    .pipe-price-box {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .pipe-count {
      font-size: 0.7rem;
      color: #64748b;
    }
    .pipe-price {
      font-size: 0.8rem;
      font-weight: 700;
      color: #fff;
      font-variant-numeric: tabular-nums;
    }
    .pipe-track {
      height: 6px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 999px;
      overflow: hidden;
    }
    .pipe-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.8s ease;
    }

    /* TOP LIST */
    .top-list {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      flex: 1;
    }
    .top-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.45rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }
    .top-item:last-child { border-bottom: none; }
    .top-rank {
      font-size: 0.72rem;
      font-weight: 800;
      color: #64748b;
      min-width: 20px;
    }
    .top-badge {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 0.65rem;
      font-weight: 800;
      flex-shrink: 0;
    }
    .top-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }
    .top-code {
      font-size: 0.78rem;
      font-weight: 700;
      color: #f1f5f9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .top-desc {
      font-size: 0.68rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .top-val {
      font-size: 0.8rem;
      font-weight: 700;
      color: #fff;
      font-variant-numeric: tabular-nums;
    }

    /* EXECUTIVE SUMMARY BALANCE */
    .summary-balance-list {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      flex: 1;
      justify-content: center;
    }
    .bal-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.78rem;
    }
    .bal-lbl { color: #94a3b8; }
    .bal-val { color: #fff; font-weight: 600; font-variant-numeric: tabular-nums; }

    .bal-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.07);
      margin: 0.2rem 0;
    }
    .total-highlight .bal-lbl { color: #fff; font-weight: 800; }
    .total-highlight .bal-val { font-size: 0.95rem; font-weight: 800; color: #fff; }

    .profit-highlight {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.2);
      padding: 0.65rem 0.85rem;
      border-radius: 10px;
      margin-top: 0.3rem;
    }
    .profit-lbl {
      display: block;
      font-size: 0.72rem;
      font-weight: 800;
      color: #34d399;
    }
    .profit-sub {
      display: block;
      font-size: 0.65rem;
      color: #64748b;
    }
    .profit-val {
      font-size: 1.1rem;
      font-weight: 800;
      color: #34d399;
      font-variant-numeric: tabular-nums;
    }

    /* EMPTY / LOADING STATES */
    .empty-state {
      text-align: center; padding: 4rem 2rem;
      background: #141418; border: 1px solid rgba(255,255,255,0.07);
      border-radius: 14px; max-width: 500px; margin: 2rem auto;
    }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state h2 { font-size: 1.25rem; margin-bottom: 0.5rem; color: #fff; }
    .empty-state p { color: #64748b; font-size: 0.9rem; }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 6rem;
      color: #64748b;
      gap: 1rem;
    }
    .spinner-ring {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1200px) {
      .three-col-grid { grid-template-columns: repeat(2, 1fr); }
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .logistics-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .three-col-grid, .kpi-grid, .container-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  allPedidos: Pedido[] = [];
  loading = true;

  // KPIs
  totalPedidos = 0;
  pedidosActivos = 0;
  pedidosRecibidos = 0;
  totalInvertido = 0;
  gananciaTotal = 0;
  fleteTotal = 0;
  mt3Total = 0;
  saldoTotal = 0;
  productoTotal = 0;
  comisionesTotal = 0;
  comisionTrabajoTotal = 0;
  comisionApalancamientoTotal = 0;
  pagoInicialTotal = 0;
  finalVentaTotal = 0;
  margenPct = 0;
  ciudadesUnicas = 0;

  // Stats
  costBreakdown: { name: string; value: number; pct: number }[] = [];
  ciudadStats: { name: string; total: number; pct: number; count: number }[] = [];
  etapaStats: { name: string; itemCount: number; pieceCount: number; value: number; pct: number; color: string }[] = [];
  topPedidos: Pedido[] = [];

  // Chart data
  costDonutData: ChartConfiguration<'doughnut'>['data'] | undefined;
  cityDonutData: ChartConfiguration<'doughnut'>['data'] | undefined;
  compareBarData: ChartConfiguration<'bar'>['data'] | undefined;

  costColors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
  cityColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  etapaNombres = ['Cotización', 'Confirmado', 'Pagado', 'En Tránsito', 'Aduana', 'Recibido'];
  etapaColores = ['#71717a', '#14b8a6', '#f59e0b', '#3b82f6', '#ec4899', '#10b981'];

  // Chart dynamic center hover state
  isHoveringCostDonut = false;
  isHoveringCityDonut = false;

  costDonutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
    layout: { padding: 6 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#141418',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed;
            const item = this.costBreakdown[ctx.dataIndex];
            const pctStr = item ? ' (' + item.pct + '%)' : '';
            return ' $' + this.formatNum(val) + pctStr;
          }
        }
      }
    },
    onHover: (event: any, activeElements: any[]) => {
      const isHov = activeElements && activeElements.length > 0;
      if (this.isHoveringCostDonut !== isHov) {
        this.isHoveringCostDonut = isHov;
        this.cdr.detectChanges();
      }
    }
  };

  cityDonutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
    layout: { padding: 6 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#141418',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed;
            const city = this.ciudadStats[ctx.dataIndex];
            const pctStr = city ? ' (' + city.pct + '%)' : '';
            return ' $' + this.formatNum(val) + pctStr;
          }
        }
      }
    },
    onHover: (event: any, activeElements: any[]) => {
      const isHov = activeElements && activeElements.length > 0;
      if (this.isHoveringCityDonut !== isHov) {
        this.isHoveringCityDonut = isHov;
        this.cdr.detectChanges();
      }
    }
  };

  barOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: '#94a3b8', font: { size: 10 }, usePointStyle: true, pointStyle: 'circle' } },
      tooltip: {
        backgroundColor: '#141418',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed.y;
            if (val >= 1_000_000) return ' ' + ctx.dataset.label + ': $' + (val / 1_000_000).toFixed(1) + 'M';
            if (val >= 1_000) return ' ' + ctx.dataset.label + ': $' + (val / 1_000).toFixed(0) + 'K';
            return ' ' + ctx.dataset.label + ': $' + val.toFixed(0);
          }
        }
      }
    },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false }, border: { color: 'rgba(255,255,255,0.06)' } },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        border: { display: false }
      }
    }
  };

  filterCategory: 'ALL' | 'EHUK' | 'FLETE' | 'PRODUCTO' | 'PAGO_30' | 'SALDO' = 'ALL';

  constructor(private pedidoService: PedidoService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.pedidoService.getPedidos().subscribe({
      next: (pedidos) => {
        this.allPedidos = pedidos;
        this.computeAll();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  setFilter(category: 'ALL' | 'EHUK' | 'FLETE' | 'PRODUCTO' | 'PAGO_30' | 'SALDO') {
    this.filterCategory = category;
    this.triggerCardAnimation();
    this.computeAll();
  }

  displayInvertido = 0;

  getInvertidoSub(): string {
    if (this.filterCategory === 'EHUK') return 'Comisión 5% Trabajo + 7% Apalancamiento';
    if (this.filterCategory === 'FLETE') return 'Costo total de transporte e importación';
    if (this.filterCategory === 'PRODUCTO') return 'Costo exclusivo de compra de producto';
    if (this.filterCategory === 'PAGO_30') return 'Monto total abonado inicial (30%)';
    if (this.filterCategory === 'SALDO') return 'Monto total adeudado pendiente';
    return 'Flete + Producto + Comisiones';
  }

  getPct20ft(): number {
    return Math.min(100, Math.round((this.mt3Total / 33) * 100));
  }

  getFree20ft(): string {
    const free = Math.max(0, 33 - this.mt3Total);
    return free.toFixed(2);
  }

  getPct40ft(): number {
    return Math.min(100, Math.round((this.mt3Total / 67) * 100));
  }

  getFree40ft(): string {
    const free = Math.max(0, 67 - this.mt3Total);
    return free.toFixed(2);
  }

  showLoteDropdown = false;
  searchLoteQuery = '';
  loteListWithStats: { codigo: string; count: number; totalVal: number }[] = [];
  filteredLotes: { codigo: string; count: number; totalVal: number }[] = [];

  @HostListener('document:click')
  onDocumentClick() {
    this.showLoteDropdown = false;
  }

  toggleLoteDropdown(event: Event) {
    event.stopPropagation();
    this.showLoteDropdown = !this.showLoteDropdown;
    if (this.showLoteDropdown) {
      this.searchLoteQuery = '';
      this.filterLotes();
    }
  }

  getSelectedLoteName(): string {
    if (this.selectedPedidoCodigo === 'ALL') return 'Todos los Pedidos';
    return 'Pedido #' + this.selectedPedidoCodigo;
  }

  isUpdating = false;

  triggerCardAnimation() {
    this.isUpdating = true;
    setTimeout(() => this.isUpdating = false, 400);
  }

  selectLote(codigo: string) {
    this.selectedPedidoCodigo = codigo;
    this.showLoteDropdown = false;
    this.triggerCardAnimation();
    this.computeAll();
  }

  filterLotes() {
    const q = (this.searchLoteQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredLotes = [...this.loteListWithStats];
    } else {
      this.filteredLotes = this.loteListWithStats.filter(l => 
        l.codigo.toLowerCase().includes(q)
      );
    }
  }

  uniquePedidoCodigos: string[] = [];
  selectedPedidoCodigo = 'ALL';

  computeAll() {
    // Extract unique codes & stats from allPedidos
    const loteStatsMap = new Map<string, { count: number; totalVal: number }>();
    this.allPedidos.forEach(x => {
      const cod = (x.codigo || '').trim();
      if (cod) {
        const current = loteStatsMap.get(cod) || { count: 0, totalVal: 0 };
        current.count++;
        current.totalVal += x.total || 0;
        loteStatsMap.set(cod, current);
      }
    });

    this.loteListWithStats = Array.from(loteStatsMap.entries())
      .map(([codigo, data]) => ({ codigo, count: data.count, totalVal: data.totalVal }))
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
    this.uniquePedidoCodigos = this.loteListWithStats.map(x => x.codigo);
    this.filterLotes();

    // Filter by selected batch code if active
    let p = this.allPedidos;
    if (this.selectedPedidoCodigo !== 'ALL') {
      p = p.filter(x => (x.codigo || '').trim() === this.selectedPedidoCodigo);
    }

    this.totalPedidos = p.length;
    if (p.length === 0) return;

    this.pedidosRecibidos = p.filter(x => x.etapa === 5).length;
    this.pedidosActivos = p.length - this.pedidosRecibidos;

    // Financial KPIs
    this.totalInvertido = p.reduce((s, x) => s + (x.total || 0), 0);
    this.gananciaTotal = p.reduce((s, x) => s + (x.ganancia || 0), 0);
    this.fleteTotal = p.reduce((s, x) => s + (x.flete || 0), 0);
    this.mt3Total = p.reduce((s, x) => s + (x.mt3 || 0), 0);
    this.saldoTotal = p.reduce((s, x) => s + (x.saldo || 0), 0);
    this.productoTotal = p.reduce((s, x) => s + (x.producto || 0), 0);
    this.comisionTrabajoTotal = p.reduce((s, x) => s + (x.comisionTrabajo || 0), 0);
    this.comisionApalancamientoTotal = p.reduce((s, x) => s + (x.comisionApalancamiento || 0), 0);
    this.comisionesTotal = this.comisionTrabajoTotal + this.comisionApalancamientoTotal;
    this.pagoInicialTotal = p.reduce((s, x) => s + (x.pagoInicial || 0), 0);
    this.finalVentaTotal = p.reduce((s, x) => s + (x.finalVenta || 0), 0);
    this.margenPct = this.totalInvertido > 0 ? Math.round((this.gananciaTotal / this.totalInvertido) * 100) : 0;

    // Dynamic Display Total depending on active filter
    if (this.filterCategory === 'EHUK') this.displayInvertido = this.comisionesTotal;
    else if (this.filterCategory === 'FLETE') this.displayInvertido = this.fleteTotal;
    else if (this.filterCategory === 'PRODUCTO') this.displayInvertido = this.productoTotal;
    else if (this.filterCategory === 'PAGO_30') this.displayInvertido = this.pagoInicialTotal;
    else if (this.filterCategory === 'SALDO') this.displayInvertido = this.saldoTotal;
    else this.displayInvertido = this.totalInvertido;

    // Ciudades breakdown dynamic according to filterCategory
    const cityMap = new Map<string, { total: number; count: number }>();
    p.forEach(x => {
      const c = cityMap.get(x.ciudad) || { total: 0, count: 0 };
      let metricVal = x.total || 0;
      if (this.filterCategory === 'EHUK') metricVal = (x.comisionTrabajo || 0) + (x.comisionApalancamiento || 0);
      else if (this.filterCategory === 'FLETE') metricVal = x.flete || 0;
      else if (this.filterCategory === 'PRODUCTO') metricVal = x.producto || 0;
      else if (this.filterCategory === 'PAGO_30') metricVal = x.pagoInicial || 0;
      else if (this.filterCategory === 'SALDO') metricVal = x.saldo || 0;
      
      c.total += metricVal;
      c.count++;
      cityMap.set(x.ciudad, c);
    });
    this.ciudadesUnicas = cityMap.size;
    const cityTotalSum = Array.from(cityMap.values()).reduce((s, v) => s + v.total, 0) || 1;
    this.ciudadStats = Array.from(cityMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, data]) => ({
        name, total: data.total, count: data.count,
        pct: Math.round((data.total / cityTotalSum) * 100)
      }));

    // Cost breakdown
    const totalForPct = this.productoTotal + this.fleteTotal + this.comisionTrabajoTotal + this.comisionApalancamientoTotal || 1;
    this.costBreakdown = [
      { name: 'Producto', value: this.productoTotal, pct: Math.round((this.productoTotal / totalForPct) * 100) },
      { name: 'Flete', value: this.fleteTotal, pct: Math.round((this.fleteTotal / totalForPct) * 100) },
      { name: 'Com. Trabajo 5%', value: this.comisionTrabajoTotal, pct: Math.round((this.comisionTrabajoTotal / totalForPct) * 100) },
      { name: 'Com. Apalanc. 7%', value: this.comisionApalancamientoTotal, pct: Math.round((this.comisionApalancamientoTotal / totalForPct) * 100) },
    ];

    // Etapa stats
    this.etapaStats = this.etapaNombres.map((name, i) => {
      const items = p.filter(x => x.etapa === i);
      const value = items.reduce((s, x) => s + (x.total || 0), 0);
      const pieceCount = items.reduce((s, x) => s + (x.totalQty || 0), 0);
      return {
        name,
        itemCount: items.length,
        pieceCount,
        value,
        pct: this.totalInvertido > 0 ? Math.round((value / this.totalInvertido) * 100) : 0,
        color: this.etapaColores[i]
      };
    });

    // Top pedidos
    this.topPedidos = [...p].sort((a, b) => (b.total || 0) - (a.total || 0)).slice(0, 6);

    // Product Categories computation
    this.computeProductCategories(p);

    // Build charts
    this.buildCostDonut();
    this.buildCityDonut();
    this.buildCompareBar();
  }

  totalQtySum = 0;
  productCategories: { name: string; icon: string; units: number; totalVal: number; pct: number; pctStr: string; color: string }[] = [];

  computeProductCategories(p: Pedido[]) {
    this.totalQtySum = p.reduce((s, x) => s + (x.totalQty || 0), 0);

    // Calculate global category totals across ALL pedidos
    const globalCatMap = new Map<string, number>();
    this.allPedidos.forEach(x => {
      const desc = (x.descripcion || '').toLowerCase();
      let key = 'Variedades / Otros';
      if (desc.includes('pantalon') || desc.includes('camiseta') || desc.includes('buzo') || desc.includes('ropa') || desc.includes('conjunto') || desc.includes('vestido')) {
        key = 'Textil & Ropa';
      } else if (desc.includes('reloj') || desc.includes('smartwatch') || desc.includes('joya') || desc.includes('cadena')) {
        key = 'Relojes & Accesorios';
      } else if (desc.includes('maquillaje') || desc.includes('labial') || desc.includes('crema') || desc.includes('cosmetico') || desc.includes('brocha')) {
        key = 'Cosmética & Belleza';
      }
      globalCatMap.set(key, (globalCatMap.get(key) || 0) + (x.total || 0));
    });

    const catMap = new Map<string, { icon: string; units: number; totalVal: number; color: string }>();
    catMap.set('Textil & Ropa', { icon: '👕', units: 0, totalVal: 0, color: '#3b82f6' });
    catMap.set('Relojes & Accesorios', { icon: '⌚', units: 0, totalVal: 0, color: '#f59e0b' });
    catMap.set('Cosmética & Belleza', { icon: '💄', units: 0, totalVal: 0, color: '#ec4899' });
    catMap.set('Variedades / Otros', { icon: '📦', units: 0, totalVal: 0, color: '#10b981' });

    p.forEach(x => {
      const desc = (x.descripcion || '').toLowerCase();
      let key = 'Variedades / Otros';
      if (desc.includes('pantalon') || desc.includes('camiseta') || desc.includes('buzo') || desc.includes('ropa') || desc.includes('conjunto') || desc.includes('vestido')) {
        key = 'Textil & Ropa';
      } else if (desc.includes('reloj') || desc.includes('smartwatch') || desc.includes('joya') || desc.includes('cadena')) {
        key = 'Relojes & Accesorios';
      } else if (desc.includes('maquillaje') || desc.includes('labial') || desc.includes('crema') || desc.includes('cosmetico') || desc.includes('brocha')) {
        key = 'Cosmética & Belleza';
      }
      
      const item = catMap.get(key)!;
      item.units += x.totalQty || 0;
      item.totalVal += x.total || 0;
    });

    const grandTotal = p.reduce((s, x) => s + (x.total || 0), 0) || 1;

    this.productCategories = Array.from(catMap.entries())
      .map(([name, data]) => {
        let rawPct = 0;
        let formattedPct = '0%';

        if (this.selectedPedidoCodigo === 'ALL') {
          rawPct = (data.totalVal / grandTotal) * 100;
          const numStr = rawPct > 0 && rawPct < 1 ? rawPct.toFixed(1) : Math.round(rawPct).toString();
          formattedPct = numStr + '% del catálogo';
        } else {
          const globalVal = globalCatMap.get(name) || 1;
          rawPct = (data.totalVal / globalVal) * 100;
          const numStr = rawPct > 0 && rawPct < 1 ? rawPct.toFixed(1) : Math.round(rawPct).toString();
          formattedPct = numStr + '% del total global';
        }

        return {
          name,
          icon: data.icon,
          units: data.units,
          totalVal: data.totalVal,
          color: data.color,
          pct: Math.min(100, Math.round(rawPct)),
          pctStr: formattedPct
        };
      })
      .filter(c => c.units > 0);

    if (this.productCategories.length === 0 && p.length > 0) {
      this.productCategories = [{
        name: 'Mercancía General',
        icon: '📦',
        units: this.totalQtySum,
        totalVal: this.totalInvertido,
        color: '#3b82f6',
        pct: 100,
        pctStr: '100% del catálogo'
      }];
    }
  }

  buildCostDonut() {
    let filteredLabels = this.costBreakdown.map(c => c.name);
    let filteredValues = this.costBreakdown.map(c => c.value);

    if (this.filterCategory === 'EHUK') {
      filteredLabels = ['Com. Trabajo 5%', 'Com. Apalanc. 7%'];
      filteredValues = [this.comisionTrabajoTotal, this.comisionApalancamientoTotal];
    } else if (this.filterCategory === 'FLETE') {
      filteredLabels = ['Flete / Logística'];
      filteredValues = [this.fleteTotal];
    } else if (this.filterCategory === 'PRODUCTO') {
      filteredLabels = ['Producto'];
      filteredValues = [this.productoTotal];
    } else if (this.filterCategory === 'PAGO_30') {
      filteredLabels = ['Pago Inicial 30%', 'Restante por Pagar'];
      filteredValues = [this.pagoInicialTotal, this.saldoTotal];
    } else if (this.filterCategory === 'SALDO') {
      filteredLabels = ['Saldo Pendiente', 'Abonado 30%'];
      filteredValues = [this.saldoTotal, this.pagoInicialTotal];
    }

    this.costDonutData = {
      labels: filteredLabels,
      datasets: [{
        data: filteredValues,
        backgroundColor: this.costColors,
        borderWidth: 0, hoverOffset: 6,
      }]
    };
  }

  buildCityDonut() {
    if (this.ciudadStats.length === 0) return;
    this.cityDonutData = {
      labels: this.ciudadStats.map(c => c.name),
      datasets: [{
        data: this.ciudadStats.map(c => c.total),
        backgroundColor: this.ciudadStats.map((_, i) => this.cityColors[i % this.cityColors.length]),
        borderWidth: 0, hoverOffset: 6,
      }]
    };
  }

  buildCompareBar() {
    if (this.ciudadStats.length === 0) return;
    const cityNames = this.ciudadStats.map(c => c.name);

    if (this.filterCategory === 'EHUK') {
      const cityComisiones = cityNames.map(name => {
        let sum = 0;
        for (const p of this.allPedidos) {
          if (p.ciudad === name) {
            sum += (p.comisionTrabajo || 0) + (p.comisionApalancamiento || 0);
          }
        }
        return sum;
      });
      const cityGanancia = cityNames.map(name => {
        let sum = 0;
        for (const p of this.allPedidos) {
          if (p.ciudad === name) sum += (p.ganancia || 0);
        }
        return sum;
      });
      this.compareBarData = {
        labels: cityNames,
        datasets: [
          { data: cityComisiones, label: 'Comisiones EHUK', backgroundColor: '#8b5cf6', borderRadius: 4, barThickness: 24 },
          { data: cityGanancia, label: 'Ganancia Proyectada', backgroundColor: '#10b981', borderRadius: 4, barThickness: 24 },
        ]
      };
      return;
    }

    if (this.filterCategory === 'FLETE') {
      const cityFlete = cityNames.map(name => {
        let sum = 0;
        for (const p of this.allPedidos) {
          if (p.ciudad === name) sum += (p.flete || 0);
        }
        return sum;
      });
      this.compareBarData = {
        labels: cityNames,
        datasets: [
          { data: cityFlete, label: 'Gasto de Flete', backgroundColor: '#f59e0b', borderRadius: 4, barThickness: 24 }
        ]
      };
      return;
    }

    if (this.filterCategory === 'PRODUCTO') {
      const cityProd = cityNames.map(name => {
        let sum = 0;
        for (const p of this.allPedidos) {
          if (p.ciudad === name) sum += (p.producto || 0);
        }
        return sum;
      });
      this.compareBarData = {
        labels: cityNames,
        datasets: [
          { data: cityProd, label: 'Costo Producto', backgroundColor: '#0284c7', borderRadius: 4, barThickness: 24 }
        ]
      };
      return;
    }

    if (this.filterCategory === 'PAGO_30') {
      const cityPago = cityNames.map(name => {
        let sum = 0;
        for (const p of this.allPedidos) {
          if (p.ciudad === name) sum += (p.pagoInicial || 0);
        }
        return sum;
      });
      this.compareBarData = {
        labels: cityNames,
        datasets: [
          { data: cityPago, label: 'Pago Inicial 30%', backgroundColor: '#10b981', borderRadius: 4, barThickness: 24 }
        ]
      };
      return;
    }

    if (this.filterCategory === 'SALDO') {
      const citySaldo = cityNames.map(name => {
        let sum = 0;
        for (const p of this.allPedidos) {
          if (p.ciudad === name) sum += (p.saldo || 0);
        }
        return sum;
      });
      this.compareBarData = {
        labels: cityNames,
        datasets: [
          { data: citySaldo, label: 'Saldo Pendiente', backgroundColor: '#ef4444', borderRadius: 4, barThickness: 24 }
        ]
      };
      return;
    }

    const cityTotals = this.ciudadStats.map(c => c.total);
    const cityGanancia = cityNames.map(name => {
      let sum = 0;
      for (const p of this.allPedidos) {
        if (p.ciudad === name) sum += (p.ganancia || 0);
      }
      return sum;
    });

    this.compareBarData = {
      labels: cityNames,
      datasets: [
        { data: cityTotals, label: 'Costo Total', backgroundColor: '#3b82f6', borderRadius: 4, barThickness: 24 },
        { data: cityGanancia, label: 'Ganancia', backgroundColor: '#10b981', borderRadius: 4, barThickness: 24 },
      ]
    };
  }

  formatNum(n: number): string {
    return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  formatShort(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return n.toFixed(0);
  }

  getEtapaColor(etapa: number): string {
    return this.etapaColores[etapa] || '#71717a';
  }

  formatTitleCase(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
      .join(' ');
  }
}
