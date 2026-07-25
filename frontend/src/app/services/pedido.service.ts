import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Pedido {
  id?: number;
  codigo: string;
  ciudad: string;
  fechaNegociacion: Date;
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
  etapa: number;
  
  // Calculated fields (optional for frontend updates, backend calculates them)
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
  private apiUrl = 'https://localhost:7111/api/pedidos';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl, this.getHeaders());
  }

  getPedido(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  createPedido(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(this.apiUrl, pedido, this.getHeaders());
  }

  updatePedido(id: number, pedido: Pedido): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, pedido, this.getHeaders());
  }

  deletePedido(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  uploadExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    // Note: Don't set Content-Type for FormData, browser sets it with boundary
    
    return this.http.post(`${this.apiUrl}/excel`, formData, { headers });
  }

  getDashboardData(): Observable<any> {
    // Dashboard data might be public or require token depending on setup
    return this.http.get(`${this.apiUrl}/dashboard`, this.getHeaders());
  }
}
