import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = 'http://localhost:5174/api/pedidos';

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
    return this.http.post(`${this.apiUrl}/${id}/upload-image`, formData);
  }

  getDashboardData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`);
  }
}
