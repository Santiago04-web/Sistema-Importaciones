import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

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

export function calculateFinancials(item: any): Pedido {
  const totalQty = Number(item.totalQty) || 0;
  const yuanes = Number(item.yuanes) || 0;
  const tasa = Number(item.tasa) > 0 ? Number(item.tasa) : 535;
  const piezasCaja = Number(item.piezasCaja) > 0 ? Number(item.piezasCaja) : 1;
  const cubica = Number(item.cubica) || 0;
  const precioMt3 = Number(item.precioMt3) > 0 ? Number(item.precioMt3) : 2300000;
  const porcentajeEhuk = Number(item.porcentajeEhuk) > 0 ? Number(item.porcentajeEhuk) : 0.12;

  const pesos = yuanes * tasa;
  const cajas = piezasCaja > 0 ? Math.floor(totalQty / piezasCaja) : 0;
  const mt3 = cubica * cajas;
  const flete = mt3 * precioMt3;
  const producto = totalQty * pesos;
  const productoEnYuanes = yuanes * totalQty;
  const comisionTrabajo = producto * 0.05;
  const pagoInicial = item.abono ? producto * 0.30 : 0;
  const comisionApalancamiento = (producto - (producto * 0.30)) * 0.07;
  const total = flete + producto + comisionTrabajo + comisionApalancamiento;
  const saldo = Math.max(0, total - pagoInicial);
  const costoFinal = totalQty > 0 ? total / totalQty : 0;
  const costoVenta = costoFinal * (1 + porcentajeEhuk);
  const finalVenta = costoVenta * totalQty;
  const ganancia = (costoVenta - costoFinal) * totalQty;

  return {
    ...item,
    totalQty,
    yuanes,
    tasa,
    piezasCaja,
    cubica,
    precioMt3,
    porcentajeEhuk,
    pesos,
    cajas,
    mt3,
    flete,
    producto,
    productoEnYuanes,
    comisionTrabajo,
    comisionApalancamiento,
    total,
    pagoInicial,
    saldo,
    costoFinal,
    costoVenta,
    finalVenta,
    ganancia
  };
}

const INITIAL_MANIFEST_DATA: any[] = [
  { codigo: '1', ciudad: 'YIWU', fechaNegociacion: new Date('2026-05-29'), descripcion: 'MASCARILLA', referencia: 'ms-1', totalQty: 5000, yuanes: 6.00, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'YIWU', fechaNegociacion: new Date('2026-05-29'), descripcion: 'SET HOMBRE', referencia: 'sh-1', totalQty: 5000, yuanes: 6.50, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'YIWU', fechaNegociacion: new Date('2026-05-29'), descripcion: 'PESTAÑA', referencia: 'ps-1', totalQty: 1800, yuanes: 5.90, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'YIWU', fechaNegociacion: new Date('2026-05-29'), descripcion: 'LABIAL', referencia: 'lb-1', totalQty: 5000, yuanes: 10.80, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'YIWU', fechaNegociacion: new Date('2026-05-29'), descripcion: 'FRESA', referencia: 'fr-1', totalQty: 5000, yuanes: 5.50, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'YIWU', fechaNegociacion: new Date('2026-05-29'), descripcion: 'LAPIZ', referencia: 'lp-1', totalQty: 3000, yuanes: 4.49, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'YIWU', fechaNegociacion: new Date('2026-05-29'), descripcion: 'SET MUJER', referencia: 'sm-1', totalQty: 3000, yuanes: 6.80, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'GZ', fechaNegociacion: new Date('2026-05-29'), descripcion: 'comprimidos transp...', referencia: 'cp-1', totalQty: 3000, yuanes: 14.80, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'GZ', fechaNegociacion: new Date('2026-05-29'), descripcion: 'comprimidos', referencia: 'cp-2', totalQty: 10000, yuanes: 9.60, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'GZ', fechaNegociacion: new Date('2026-05-29'), descripcion: 'pantalone deportiva', referencia: 'pd-1', totalQty: 10000, yuanes: 6.00, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'GZ', fechaNegociacion: new Date('2026-05-29'), descripcion: 'CAMISETA HOMBRE', referencia: 'co-1', totalQty: 5000, yuanes: 6.00, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'GZ', fechaNegociacion: new Date('2026-05-29'), descripcion: 'CAMISETA HOMBRE', referencia: 'ct-1', totalQty: 5000, yuanes: 6.50, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'GZ', fechaNegociacion: new Date('2026-05-29'), descripcion: 'Buzo hombre', referencia: 'bs-1', totalQty: 1800, yuanes: 5.90, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'GZ', fechaNegociacion: new Date('2026-05-29'), descripcion: 'CAMISETA HOMBRE', referencia: 'cp-3', totalQty: 5000, yuanes: 10.80, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'GZ', fechaNegociacion: new Date('2026-05-29'), descripcion: 'Buzo hombre', referencia: 'bs-2', totalQty: 5000, yuanes: 5.50, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'GZ', fechaNegociacion: new Date('2026-05-29'), descripcion: 'CAMISETA HOMBRE', referencia: 'ct-2', totalQty: 3000, yuanes: 4.49, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'GZ', fechaNegociacion: new Date('2026-05-29'), descripcion: 'Buzo hombre', referencia: 'bs-3', totalQty: 3000, yuanes: 6.80, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'GZ', fechaNegociacion: new Date('2026-05-29'), descripcion: 'CAMISETA HOMBRE', referencia: 'co-2', totalQty: 3000, yuanes: 14.80, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'GZ', fechaNegociacion: new Date('2026-05-29'), descripcion: 'CONJUNTO NINO', referencia: 'cn-1', totalQty: 10000, yuanes: 9.60, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true },
  { codigo: '1', ciudad: 'GZ', fechaNegociacion: new Date('2026-05-29'), descripcion: 'CAJA LUJO', referencia: 'cm-1', totalQty: 5000, yuanes: 7.50, tasa: 535, piezasCaja: 1, cubica: 0.001, precioMt3: 2300000, porcentajeEhuk: 0.10, etapa: 0, abono: true }
].map((item, index) => calculateFinancials({ ...item, id: index + 1 }));

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
          const list: any[] = JSON.parse(stored);
          if (list && list.length > 0) {
            this.localPedidos = list.map(x => calculateFinancials(x));
            return;
          }
        } catch {
          this.localPedidos = [...INITIAL_MANIFEST_DATA];
          return;
        }
      }
    }
    this.localPedidos = [...INITIAL_MANIFEST_DATA];
  }

  private saveLocalPedidos(pedidos: Pedido[]) {
    this.localPedidos = pedidos.map(x => calculateFinancials(x));
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
      let etapaVal = 0; // Default: 0 (Cotización)
      if (item.etapa !== undefined && item.etapa !== null && !isNaN(Number(item.etapa))) {
        etapaVal = Number(item.etapa);
      } else if (typeof item.etapa === 'string') {
        const eStr = item.etapa.toLowerCase();
        if (eStr.includes('confir')) etapaVal = 1;
        else if (eStr.includes('paga')) etapaVal = 2;
        else if (eStr.includes('tran')) etapaVal = 3;
        else if (eStr.includes('adua')) etapaVal = 4;
        else if (eStr.includes('reci')) etapaVal = 5;
        else etapaVal = 0;
      }

      const raw = {
        id: maxId,
        codigo: codigoFinal,
        ciudad: item.ciudad || 'GZ',
        fechaNegociacion: item.fechaNegociacion ? new Date(item.fechaNegociacion) : new Date(),
        abono: item.abono !== undefined ? !!item.abono : true,
        descripcion: item.descripcion || '',
        observaciones: item.observaciones || '',
        referencia: item.referencia || '',
        totalQty: Number(item.totalQty) || 0,
        yuanes: Number(item.yuanes) || 0,
        piezasCaja: Number(item.piezasCaja) || 1,
        cubica: Number(item.cubica) || 0,
        tasa: Number(item.tasa) || 535,
        precioMt3: Number(item.precioMt3) || 2300000,
        porcentajeEhuk: Number(item.porcentajeEhuk) || 0.12,
        etapa: etapaVal
      };
      return calculateFinancials(raw);
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
      map((res) => {
        const remote = (res || []).map(p => calculateFinancials(p));
        // Overwrite the local storage cache with the fresh database records
        this.saveLocalPedidos(remote);
        return remote;
      }),
      catchError(() => {
        // Fallback to local storage only if backend is unreachable
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
    // Guardar en localStorage primero como backup
    this.addLocalItems(data.items, data.overrideCodigo);
    // Enviar al backend SIN catchError - si falla, el error llega al componente
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
    return this.http.get<{ rateCnyCop: number; lastUpdated: string; source: string; isLive: boolean }>(`${API_ROOT}/tasas/cny-cop`);
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
