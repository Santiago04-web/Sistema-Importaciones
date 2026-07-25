import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-4">
      <div class="glass-panel p-4 upload-card">
        <h2 class="mb-4">Carga de Pedidos (Excel)</h2>
        <p class="mb-4 text-secondary">Sube un archivo de Excel con formato válido (.xlsx) para carga masiva.</p>
        
        <div class="drop-zone mb-4" 
             [class.dragging]="isDragging"
             (dragover)="onDragOver($event)"
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event)">
             
          <div *ngIf="!selectedFile" class="text-center">
            <i class="fas fa-cloud-upload-alt upload-icon mb-2"></i>
            <p>Arrastra tu archivo aquí o</p>
            <button class="btn btn-outline mt-2" (click)="fileInput.click()">Explorar</button>
          </div>
          
          <div *ngIf="selectedFile" class="text-center">
            <i class="fas fa-file-excel file-icon mb-2"></i>
            <p class="fw-bold">{{ selectedFile.name }}</p>
            <p class="text-sm text-secondary">{{ (selectedFile.size / 1024).toFixed(2) }} KB</p>
            <button class="btn btn-outline mt-2" (click)="removeFile()">Quitar</button>
          </div>
          
          <input type="file" #fileInput (change)="onFileSelected($event)" accept=".xlsx, .xls" hidden>
        </div>
        
        <div *ngIf="error" class="alert-danger mb-4">{{ error }}</div>
        <div *ngIf="successMsg" class="alert-success mb-4">{{ successMsg }}</div>

        <button class="btn btn-primary w-full" 
                [disabled]="!selectedFile || loading" 
                (click)="uploadFile()">
          {{ loading ? 'Subiendo...' : 'Procesar Archivo' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .upload-card { max-width: 600px; margin: 0 auto; }
    .drop-zone {
      border: 2px dashed var(--card-border);
      border-radius: var(--radius-md);
      padding: 3rem 2rem;
      transition: var(--transition);
      background: rgba(15, 23, 42, 0.4);
    }
    .drop-zone.dragging {
      border-color: var(--primary-color);
      background: rgba(79, 70, 229, 0.1);
    }
    .upload-icon, .file-icon { font-size: 3rem; color: var(--primary-color); }
    .file-icon { color: var(--success); }
    .alert-danger {
      color: var(--danger);
      background: rgba(239, 68, 68, 0.1);
      padding: 0.75rem;
      border-radius: var(--radius-md);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .alert-success {
      color: var(--success);
      background: rgba(16, 185, 129, 0.1);
      padding: 0.75rem;
      border-radius: var(--radius-md);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .text-sm { font-size: 0.875rem; }
  `]
})
export class UploadComponent {
  isDragging = false;
  selectedFile: File | null = null;
  loading = false;
  error = '';
  successMsg = '';

  constructor(private pedidoService: PedidoService) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.handleFile(event.target.files[0]);
    }
  }

  handleFile(file: File) {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      this.selectedFile = file;
      this.error = '';
      this.successMsg = '';
    } else {
      this.error = 'Por favor, sube un archivo Excel (.xlsx, .xls)';
      this.selectedFile = null;
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.successMsg = '';
    this.error = '';
  }

  uploadFile() {
    if (!this.selectedFile) return;
    
    this.loading = true;
    this.error = '';
    this.successMsg = '';

    this.pedidoService.uploadExcel(this.selectedFile).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMsg = `Archivo procesado con éxito. Se importaron ${res.count} pedidos.`;
        this.selectedFile = null;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Ocurrió un error procesando el archivo.';
      }
    });
  }
}
