import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService } from '../../services/pedido.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="container glass-panel mt-4">
      <h2 class="mb-4">Dashboard</h2>
      
      <div class="metrics-grid mb-4">
        <div class="metric-card glass-panel">
          <h4>Total Pedidos</h4>
          <p class="metric-value">{{ data?.totalPedidos || 0 }}</p>
        </div>
        <div class="metric-card glass-panel">
          <h4>Margen Promedio</h4>
          <p class="metric-value">{{ (data?.margenPromedio || 0) | currency:'USD' }}</p>
        </div>
      </div>
      
      <div class="charts-grid">
        <div class="chart-container glass-panel">
          <h4>Gasto por Mes</h4>
          <canvas *ngIf="barChartData" baseChart 
            [data]="barChartData" 
            [options]="barChartOptions" 
            [type]="'bar'">
          </canvas>
        </div>
        
        <div class="chart-container glass-panel">
          <h4>Gasto por Ciudad</h4>
          <canvas *ngIf="pieChartData" baseChart 
            [data]="pieChartData" 
            [options]="pieChartOptions" 
            [type]="'pie'">
          </canvas>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    .metric-card {
      padding: 1.5rem;
      text-align: center;
    }
    .metric-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-top: 0.5rem;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    .chart-container {
      padding: 1.5rem;
      min-height: 350px;
    }
    h4 { color: var(--text-secondary); }
    @media (max-width: 768px) {
      .charts-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  data: any;

  // Chart configs
  public barChartOptions: ChartOptions<'bar'> = { responsive: true, maintainAspectRatio: false };
  public barChartData: ChartConfiguration<'bar'>['data'] | undefined;
  
  public pieChartOptions: ChartOptions<'pie'> = { responsive: true, maintainAspectRatio: false };
  public pieChartData: ChartConfiguration<'pie'>['data'] | undefined;

  constructor(private pedidoService: PedidoService) {}

  ngOnInit() {
    this.pedidoService.getDashboardData().subscribe({
      next: (res) => {
        this.data = res;
        this.setupCharts();
      }
    });
  }

  setupCharts() {
    if (!this.data) return;

    // Bar Chart
    const meses = this.data.gastoPorMes.map((x: any) => x.mes);
    const totales = this.data.gastoPorMes.map((x: any) => x.total);

    this.barChartData = {
      labels: meses,
      datasets: [
        { data: totales, label: 'Gasto Total ($)', backgroundColor: '#4f46e5', borderRadius: 4 }
      ]
    };

    // Pie Chart
    const ciudades = this.data.gastoPorCiudad.map((x: any) => x.ciudad);
    const totalesCiudad = this.data.gastoPorCiudad.map((x: any) => x.total);

    this.pieChartData = {
      labels: ciudades,
      datasets: [
        {
          data: totalesCiudad,
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
          borderWidth: 0
        }
      ]
    };
  }
}
