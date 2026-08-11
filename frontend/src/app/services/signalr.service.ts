import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: signalR.HubConnection | null = null;
  
  public isConnected$ = new BehaviorSubject<boolean>(false);
  public pedidoCreado$ = new Subject<any>();
  public pedidoActualizado$ = new Subject<any>();
  public pedidoEliminado$ = new Subject<number>();

  constructor(private authService: AuthService) {
    this.initConnection();
  }

  public initConnection() {
    const token = this.authService.getToken();
    if (!token) return;

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const HUB_URL = isLocal ? 'http://localhost:5174/hubs/pedidos' : 'https://sistema-importaciones.onrender.com/hubs/pedidos';

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => this.authService.getToken() || ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.hubConnection.onreconnecting(() => {
      this.isConnected$.next(false);
    });

    this.hubConnection.onreconnected(() => {
      this.isConnected$.next(true);
    });

    this.hubConnection.onclose(() => {
      this.isConnected$.next(false);
    });

    this.registerEvents();
    
    this.hubConnection.start()
      .then(() => {
        this.isConnected$.next(true);
      })
      .catch(err => {
        this.isConnected$.next(false);
      });
  }

  private registerEvents() {
    if (!this.hubConnection) return;

    this.hubConnection.on('PedidoCreado', (pedido: any) => {
      this.pedidoCreado$.next(pedido);
    });

    this.hubConnection.on('PedidoActualizado', (pedido: any) => {
      this.pedidoActualizado$.next(pedido);
    });

    this.hubConnection.on('PedidoEliminado', (id: number) => {
      this.pedidoEliminado$.next(id);
    });
  }

  public stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.isConnected$.next(false);
    }
  }
}
