using System.ComponentModel.DataAnnotations;

namespace Importaciones.Api.Models;

public class Proveedor
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(100)]
    public string CiudadChina { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ContactoEmail { get; set; }

    [MaxLength(50)]
    public string? ContactoTelefono { get; set; }

    [MaxLength(500)]
    public string? Notas { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
}
