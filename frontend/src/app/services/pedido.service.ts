import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

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
  private localPedidos: Pedido[] = [];

  constructor(private http: HttpClient) {
    this.loadLocalPedidos();
  }

  private loadLocalPedidos() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user_imported_pedidos');
      if (stored) {
        try {
          this.localPedidos = JSON.parse(stored);
        } catch {
          this.localPedidos = [];
        }
      }
    }
  }

  private saveLocalPedidos(pedidos: Pedido[]) {
    this.localPedidos = pedidos;
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_imported_pedidos', JSON.stringify(this.localPedidos));
    }
  }

  addLocalItems(items: any[], overrideCodigo?: string): Pedido[] {
    const codigoFinal = (overrideCodigo || '1').trim();
    const existing = this.getLocalPedidos();
    let maxId = existing.reduce((m, x) => Math.max(m, x.id || 0), 0);

    const newPedidos: Pedido[] = items.map((item, idx) => {
      maxId++;
      return {
        id: maxId,
        codigo: codigoFinal,
        ciudad: item.ciudad || 'GZ',
        fechaNegociacion: item.fechaNegociacion ? new Date(item.fechaNegociacion) : new Date(),
        abono: !!item.abono,
        descripcion: item.descripcion || '',
        observaciones: item.observaciones || '',
        referencia: item.referencia || '',
        totalQty: Number(item.totalQty) || 0,
        yuanes: Number(item.yuanes) || 0,
        piezasCaja: Number(item.piezasCaja) || 1,
        cubica: Number(item.cubica) || 0,
        tasa: Number(item.tasa) || 535,
        precioMt3: Number(item.precioMt3) || 2300000,
        porcentajeEhuk: Number(item.porcentajeEhuk) || 0.10,
        etapa: Number(item.etapa) || 1
      };
    });

    const combined = [...existing, ...newPedidos];
    this.saveLocalPedidos(combined);
    return newPedidos;
  }

  getLocalPedidos(): Pedido[] {
    this.loadLocalPedidos();
    return this.localPedidos;
  }

  getPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl).pipe(
      tap((res) => {
        if (res && res.length > 0) {
          this.saveLocalPedidos(res);
        }
      }),
      catchError(() => {
        return of(this.getLocalPedidos());
      })
    );
  }

  getPedido(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => {
        const found = this.getLocalPedidos().find(x => x.id === id);
        return found ? of(found) : of({} as Pedido);
      })
    );
  }

  createPedido(pedido: Pedido): Observable<Pedido> {
    const existing = this.getLocalPedidos();
    pedido.id = existing.length > 0 ? Math.max(...existing.map(x => x.id || 0)) + 1 : 1;
    this.saveLocalPedidos([...existing, pedido]);
    return this.http.post<Pedido>(this.apiUrl, pedido).pipe(
      catchError(() => of(pedido))
    );
  }

  updatePedido(id: number, pedido: Pedido): Observable<Pedido> {
    const existing = this.getLocalPedidos();
    const idx = existing.findIndex(x => x.id === id);
    if (idx !== -1) {
      existing[idx] = { ...existing[idx], ...pedido };
      this.saveLocalPedidos(existing);
    }
    return this.http.put<Pedido>(`${this.apiUrl}/${id}`, pedido).pipe(
      catchError(() => of(pedido))
    );
  }

  deletePedido(id: number): Observable<any> {
    const existing = this.getLocalPedidos().filter(x => x.id !== id);
    this.saveLocalPedidos(existing);
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(() => of({ success: true }))
    );
  }

  deleteBatch(ids: number[]): Observable<any> {
    const existing = this.getLocalPedidos().filter(x => !ids.includes(x.id || 0));
    this.saveLocalPedidos(existing);
    return this.http.post(`${this.apiUrl}/delete-batch`, { ids }).pipe(
      catchError(() => of({ success: true }))
    );
  }

  updateBatch(data: { ids: number[]; tasa?: number; etapa?: number; ciudad?: string; abono?: boolean; codigo?: string }): Observable<any> {
    const existing = this.getLocalPedidos();
    existing.forEach(x => {
      if (data.ids.includes(x.id || 0)) {
        if (data.tasa !== undefined) x.tasa = data.tasa;
        if (data.etapa !== undefined) x.etapa = data.etapa;
        if (data.ciudad !== undefined) x.ciudad = data.ciudad;
        if (data.abono !== undefined) x.abono = data.abono;
        if (data.codigo !== undefined) x.codigo = data.codigo;
      }
    });
    this.saveLocalPedidos(existing);
    return this.http.post(`${this.apiUrl}/update-batch`, data).pipe(
      catchError(() => of({ success: true }))
    );
  }

  deleteAll(): Observable<any> {
    this.saveLocalPedidos([]);
    return this.http.delete(`${this.apiUrl}/delete-all`).pipe(
      catchError(() => of({ success: true }))
    );
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
    this.addLocalItems(data.items, data.overrideCodigo);
    return this.http.post(`${this.apiUrl}/excel-confirm`, data).pipe(
      catchError(() => of({ count: data.items.length, codigo: data.overrideCodigo || '1' }))
    );
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
