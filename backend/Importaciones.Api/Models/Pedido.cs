using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Importaciones.Api.Models;

public class Pedido
{
    public const decimal DEFAULT_EHUK_PERCENT = 0.12m;

    public int Id { get; set; }
    
    [StringLength(100)]
    public string Codigo { get; set; } = "";
    
    [StringLength(100)]
    public string Ciudad { get; set; } = "";
    
    public DateTime FechaNegociacion { get; set; }
    public bool Abono { get; set; }
    
    [StringLength(500)]
    public string Descripcion { get; set; } = "";
    
    [StringLength(1000)]
    public string Observaciones { get; set; } = "";
    
    [StringLength(200)]
    public string Referencia { get; set; } = "";
    
    public EtapaPedido Etapa { get; set; } = EtapaPedido.Cotizacion;
    public string? FotoUrl { get; set; }
    public DateTime? FechaLimitePago { get; set; }
    
    public ICollection<EtapaHistorial> HistorialEtapas { get; set; } = new List<EtapaHistorial>();
    
    [Range(0, 10000000, ErrorMessage = "TotalQty debe ser un valor positivo.")]
    public int TotalQty { get; set; }
    
    [Precision(18, 4)]
    [Range(0, 1000000000, ErrorMessage = "Yuanes debe ser un valor positivo.")]
    public decimal Yuanes { get; set; }
    
    [Range(0, 1000000)]
    public int PiezasCaja { get; set; }
    
    [Precision(18, 4)]
    [Range(0, 1000000)]
    public decimal Cubica { get; set; }
    
    [Precision(18, 4)]
    [Range(0, 1000000)]
    public decimal Tasa { get; set; }
    
    [Precision(18, 4)]
    [Range(0, 100000000)]
    public decimal PrecioMt3 { get; set; }
    
    [Precision(18, 4)]
    [Range(0, 1.0)]
    public decimal PorcentajeEhuk { get; set; } = DEFAULT_EHUK_PERCENT;

    [Timestamp]
    public byte[]? RowVersion { get; set; }

    public decimal Pesos => Yuanes * Tasa;
    public int Cajas => PiezasCaja > 0 ? TotalQty / PiezasCaja : 0;
    public decimal Mt3 => Cubica * Cajas;
    public decimal Flete => Mt3 * PrecioMt3;
    public decimal Producto => TotalQty * Pesos;
    public decimal ProductoEnYuanes => Yuanes * TotalQty;
    public decimal ComisionTrabajo => Producto * 0.05m;
    public decimal PagoInicial => Producto * 0.30m;
    public decimal ComisionApalancamiento=> (Producto - PagoInicial) * 0.07m;
    public decimal Total => Flete + Producto + ComisionTrabajo + ComisionApalancamiento;
    public decimal Saldo => Total - PagoInicial; 
    public decimal CostoFinal => TotalQty  > 0 ? Total / TotalQty : 0;
    public decimal CostoVenta => CostoFinal * (1 + PorcentajeEhuk);
    public decimal FinalVenta => CostoVenta * TotalQty;
    public decimal Ganancia => (CostoVenta - CostoFinal) * TotalQty;
}
