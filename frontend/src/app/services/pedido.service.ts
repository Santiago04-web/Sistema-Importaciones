import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PagoParcial {
  id?: number;
  pedidoId?: number;
  monto: number;
  fechaPago?: string;
  nota?: string;
  usuarioId?: string;
}

export interface Pedido {
  id?: number;
  codigo: string;
  ciudad: string;
  fechaNegociacion: Date;
  abono?: boolean;
  descripcion: string;
  observaciones: string;
  referencia: string;
  totalQty: number;
  yuanes: number;
  piezasCaja: number;
  cubica: number;
  tasa: number;
  precioMt3: number;
  porcentajeEhuk: number;
  fotoUrl?: string;
  etapa: number;
  fechaLimitePago?: string;
  historialEtapas?: { id: number; pedidoId: number; etapa: number; fechaCambio: string }[];
  pagosParciales?: PagoParcial[];
  totalPagosParciales?: number;
  
  // Calculated fields
  pesos?: number;
  cajas?: number;
  mt3?: number;
  flete?: number;
  producto?: number;
  productoEnYuanes?: number;
  comisionTrabajo?: number;
  pagoInicial?: number;
  comisionApalancamiento?: number;
  total?: number;
  saldo?: number;
  costoFinal?: number;
  costoVenta?: number;
  finalVenta?: number;
  ganancia?: number;
}

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_ROOT = isLocal ? 'http://localhost:5174/api' : 'https://sistema-importaciones.onrender.com/api';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = `${API_ROOT}/pedidos`;

  constructor(private http: HttpClient) { }

  getPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl);
  }

  getPedido(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${id}`);
  }

  createPedido(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(this.apiUrl, pedido);
  }

  updatePedido(id: number, pedido: Pedido): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.apiUrl}/${id}`, pedido);
  }

  deletePedido(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  deleteBatch(ids: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/delete-batch`, { ids });
  }

  updateBatch(data: { ids: number[]; tasa?: number; etapa?: number; ciudad?: string; abono?: boolean; codigo?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/update-batch`, data);
  }

  deleteAll(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete-all`);
  }

  uploadExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/excel`, formData);
  }

  previewExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/excel-preview`, formData);
  }

  confirmExcel(data: { overrideCodigo?: string; items: any[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}/excel-confirm`, data);
  }

  uploadPedidoImage(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${id}/image`, formData);
  }

  bulkSyncFoto(payload: { fotoUrl: string; descripcion?: string; pedidoIds?: number[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk-sync-foto`, payload);
  }

  addPagoParcial(pedidoId: number, pago: { monto: number; nota?: string }): Observable<PagoParcial> {
    return this.http.post<PagoParcial>(`${this.apiUrl}/${pedidoId}/pagos`, pago);
  }

  deletePagoParcial(pedidoId: number, pagoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${pedidoId}/pagos/${pagoId}`);
  }

  getCnyCopRate(): Observable<{ rateCnyCop: number; lastUpdated: string; source: string; isLive: boolean }> {
    return this.http.get<{ rateCnyCop: number; lastUpdated: string; source: string; isLive: boolean }>('http://localhost:5174/api/tasas/cny-cop');
  }

  simularPedido(pedido: Partial<Pedido>): Observable<any> {
    return this.http.post(`${this.apiUrl}/simular`, pedido);
  }

  getDashboardData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`);
  }

  compartirWhatsApp(pedido: Pedido) {
    const formatCurrency = (val?: number) => val ? '$' + Math.round(val).toLocaleString('es-CO') + ' COP' : '$0 COP';
    const etapasMap: Record<number, string> = {
      0: 'Cotización',
      1: 'Pedido Confirmado',
      2: 'Pagado',
      3: 'En Tránsito',
      4: 'En Aduana',
      5: 'Recibido'
    };

    const etapaTxt = etapasMap[pedido.etapa] || 'Cotización';
    const totalAbonado = (pedido.pagoInicial || 0) + (pedido.pagosParciales?.reduce((a, b) => a + b.monto, 0) || 0);

    const message = 
`📦 *IMPORTACIONES LOGIGHO - RESUMEN DE LOTE*
--------------------------------------------
🏷️ *Lote / Ref:* #${pedido.referencia || pedido.codigo}
🛍️ *Producto:* ${pedido.descripcion || 'Sin descripción'}
📍 *Destino:* ${pedido.ciudad}
📊 *Cantidad:* ${pedido.totalQty ? pedido.totalQty.toLocaleString() : 0} unidades

💵 *Total Inversión:* ${formatCurrency(pedido.total)}
✅ *Pago Inicial (30%):* ${formatCurrency(pedido.pagoInicial)}
💰 *Total Abonado Real:* ${formatCurrency(totalAbonado)}
⏳ *Saldo Pendiente:* ${formatCurrency(pedido.saldo)}

🚚 *Estado / Etapa:* ${etapaTxt}
--------------------------------------------
_Enviado desde Sistema de Gestión de Importaciones_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
}
