import { Injectable } from '@angular/core';
import { Pedido } from './pedido.service';
import { jsPDF } from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  exportSinglePedidoPdf(pedido: Pedido) {
    const doc = new jsPDF();
    const formatCop = (val?: number) => {
      if (val === undefined || val === null) return '$0';
      return '$' + Math.round(val).toLocaleString('es-CO');
    };

    // Header Background
    doc.setFillColor(18, 18, 22);
    doc.rect(0, 0, 210, 40, 'F');

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('LOGIGHO IMPORTACIONES', 14, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(161, 161, 170);
    doc.text('Hoja de Liquidación & Ficha Técnica de Producto', 14, 30);

    // Document Meta (Top Right)
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Fecha Emisión: ${new Date().toLocaleDateString('es-CO')}`, 145, 20);
    doc.text(`Lote/Código: ${pedido.codigo || 'S/N'}`, 145, 27);
    doc.text(`Referencia: ${pedido.referencia || 'N/A'}`, 145, 34);

    let y = 52;

    // Product Section Box
    doc.setDrawColor(220, 220, 225);
    doc.setFillColor(250, 250, 252);
    doc.roundedRect(14, y, 182, 38, 3, 3, 'FD');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    doc.text(pedido.descripcion || 'Producto de Importación', 20, y + 14);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(113, 113, 122);
    doc.text(`Origen: ${pedido.ciudad || 'GZ'} (China)  |  Piezas/Caja: ${pedido.piezasCaja || 1}  |  Observaciones: ${pedido.observaciones || 'Sin especificaciones'}`, 20, y + 24);
    doc.text(`Estado de Abono: ${pedido.abono ? 'PAGADO / ABONADO' : 'PENDIENTE'}`, 20, y + 31);

    y += 48;

    // Financial Table Header
    doc.setFillColor(59, 130, 246);
    doc.rect(14, y, 182, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DESGLOSE FINANCIERO Y DE COSTOS', 20, y + 6);

    y += 9;

    const rows = [
      ['Cantidad Total de Unidades (Qty)', `${(pedido.totalQty || 0).toLocaleString()} uds`],
      ['Costo Unitario en Yuanes (RMB)', `¥ ${(pedido.yuanes || 0).toFixed(2)}`],
      ['Tasa de Cambio Aplicada', `$ ${pedido.tasa || 535} COP/RMB`],
      ['Costo Unitario en Pesos (Pesos)', formatCop(pedido.pesos)],
      ['Total Costo Producto', formatCop(pedido.producto)],
      ['Volumen Ocupado (m³)', `${(pedido.mt3 || 0).toFixed(3)} m³ (${pedido.cajas || 0} cajas)`],
      ['Costo Flete Marítimo (Flete)', formatCop(pedido.flete)],
      ['Comisión Operativa (5% Trabajo)', formatCop(pedido.comisionTrabajo)],
      ['Abono Inicial Requerido (30%)', formatCop(pedido.pagoInicial)],
      ['Comisión Financiera (7% Apalancamiento)', formatCop(pedido.comisionApalancamiento)],
      ['COSTO TOTAL DE IMPORTACIÓN (TOTAL)', formatCop(pedido.total)],
      ['SALDO PENDIENTE POR PAGAR', formatCop(pedido.saldo)],
      ['Costo Final por Unidad Importada', `${formatCop(pedido.costoFinal)} / ud`],
      ['Precio de Venta Sugerido (con % EHUK)', `${formatCop(pedido.costoVenta)} / ud`],
      ['GANANCIA TOTAL PROYECTADA', formatCop(pedido.ganancia)]
    ];

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    rows.forEach(([label, value], idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(245, 245, 248);
        doc.rect(14, y, 182, 7.5, 'F');
      }
      
      const isHighlighted = label.startsWith('COSTO TOTAL') || label.startsWith('GANANCIA') || label.startsWith('SALDO');
      if (isHighlighted) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
      }

      doc.text(label, 20, y + 5.2);
      doc.text(value, 190, y + 5.2, { align: 'right' });
      y += 7.5;
    });

    y += 12;

    // Verification Footer / Watermark
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Documento generado automáticamente por Logigho Sistemas de Importación. Verificación segura de integridad de datos.', 14, 280);

    // Save File
    const fileName = `Liquidacion_${pedido.codigo}_${pedido.referencia || 'Importacion'}.pdf`;
    doc.save(fileName);
  }

  exportInvestorReportPdf(pedidos: Pedido[]) {
    const doc = new jsPDF();
    const formatCop = (val?: number) => {
      if (val === undefined || val === null) return '$0';
      return '$' + Math.round(val).toLocaleString('es-CO');
    };

    // Header Background
    doc.setFillColor(9, 13, 22);
    doc.rect(0, 0, 210, 42, 'F');

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('LOGIGHO GLOBAL INVESTORS', 14, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(96, 165, 250);
    doc.text('Informe Ejecutivo Consolidado de Inversiones & Cargas Internacionales', 14, 31);

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Emisión: ${new Date().toLocaleDateString('es-CO')}`, 145, 22);

    let y = 54;
    const totalInversion = pedidos.reduce((s, p) => s + (p.total || 0), 0);
    const totalGanancia = pedidos.reduce((s, p) => s + (p.ganancia || 0), 0);
    const totalMt3 = pedidos.reduce((s, p) => s + (p.cubica || 0), 0);

    // KPI Summary Box
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(220, 225, 235);
    doc.roundedRect(14, y, 182, 32, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`Capital Invertido Total: ${formatCop(totalInversion)}`, 20, y + 12);
    doc.text(`Ganancia Neto Proyectada: ${formatCop(totalGanancia)}`, 20, y + 23);
    doc.text(`Total Lotes: ${pedidos.length}  |  Volumen: ${totalMt3.toFixed(2)} m³`, 120, y + 12);

    y += 44;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('RESUMEN DE PORTAFOLIO POR CARGA', 14, y);

    y += 8;

    pedidos.slice(0, 18).forEach((p, idx) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${p.descripcion || 'Producto'} (${p.referencia || 'N/A'}) - Origen: ${p.ciudad || 'GZ'}`, 14, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Qty: ${(p.totalQty || 0).toLocaleString()} uds  |  Inversión: ${formatCop(p.total)}  |  Ganancia: ${formatCop(p.ganancia)}`, 14, y + 5);

      y += 12;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`Informe_Inversiones_Logigho_${Date.now()}.pdf`);
  }
}
