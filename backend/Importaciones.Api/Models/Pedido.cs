using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Importaciones.Api.Models;

public class Pedido
{
    public const decimal DEFAULT_EHUK_PERCENT = 0.12m;

    [Key]
    public int Id { get; set; }

    [Required(ErrorMessage = "El código es obligatorio.")]
    [MaxLength(50)]
    public string Codigo { get; set; } = string.Empty;

    [Required(ErrorMessage = "La ciudad es obligatoria.")]
    [MaxLength(100)]
    public string Ciudad { get; set; } = string.Empty;

    public DateTime FechaNegociacion { get; set; } = DateTime.UtcNow;

    public DateTime? FechaLimitePago { get; set; }

    public bool Abono { get; set; } = false;

    public string? FotoUrl { get; set; }

    public EtapaPedido Etapa { get; set; } = EtapaPedido.Cotizacion;

    [MaxLength(100)]
    public string Categoria { get; set; } = "General";

    [MaxLength(500)]
    public string Descripcion { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Observaciones { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Referencia { get; set; } = string.Empty;

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

    // SOFT-DELETE FOR AUDIT & REAL MONEY INTEGRITY
    public bool Eliminado { get; set; } = false;
    public DateTime? FechaEliminacion { get; set; }

    // RELATIONS
    public int? ProveedorId { get; set; }
    [ForeignKey(nameof(ProveedorId))]
    public Proveedor? Proveedor { get; set; }

    public int? ContenedorId { get; set; }
    [ForeignKey(nameof(ContenedorId))]
    public Contenedor? Contenedor { get; set; }

    public ICollection<EtapaHistorial> HistorialEtapas { get; set; } = new List<EtapaHistorial>();
    public ICollection<PagoParcial> PagosParciales { get; set; } = new List<PagoParcial>();
    public ICollection<DocumentoAdjunto> Documentos { get; set; } = new List<DocumentoAdjunto>();

    // CALCULATED PROPERTIES
    public decimal Pesos => Yuanes * Tasa;
    public int Cajas => PiezasCaja > 0 ? TotalQty / PiezasCaja : 0;
    public decimal Mt3 => Cubica * Cajas;
    public decimal Flete => Mt3 * PrecioMt3;
    public decimal Producto => TotalQty * Pesos;
    public decimal ProductoEnYuanes => Yuanes * TotalQty;
    public decimal ComisionTrabajo => Producto * 0.05m;
    public decimal PagoInicial => Producto * 0.30m;
    public decimal ComisionApalancamiento => (Producto - PagoInicial) * 0.07m;
    public decimal Total => Flete + Producto + ComisionTrabajo + ComisionApalancamiento;
    public decimal TotalPagosParciales => PagosParciales?.Sum(p => p.Monto) ?? 0m;
    public decimal Saldo => Math.Max(0, Total - PagoInicial - TotalPagosParciales);
    public decimal CostoFinal => TotalQty > 0 ? Total / TotalQty : 0;
    public decimal CostoVenta => CostoFinal * (1 + PorcentajeEhuk);
    public decimal FinalVenta => CostoVenta * TotalQty;
    public decimal Ganancia => (CostoVenta - CostoFinal) * TotalQty;
}
