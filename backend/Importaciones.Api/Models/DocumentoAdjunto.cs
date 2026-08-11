using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Importaciones.Api.Models;

public class DocumentoAdjunto
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PedidoId { get; set; }

    [ForeignKey(nameof(PedidoId))]
    public Pedido? Pedido { get; set; }

    [Required]
    [MaxLength(255)]
    public string NombreArchivo { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string RutaArchivo { get; set; } = string.Empty;

    [MaxLength(50)]
    public string TipoDocumento { get; set; } = "General"; // Factura, BL, Declaracion, Certificado, General

    [MaxLength(100)]
    public string MimeType { get; set; } = "application/octet-stream";

    public long TamanoBytes { get; set; }

    public DateTime FechaSubida { get; set; } = DateTime.UtcNow;

    [MaxLength(100)]
    public string? UsuarioSubidaId { get; set; }
}
