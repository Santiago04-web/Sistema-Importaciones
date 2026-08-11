using System.ComponentModel.DataAnnotations;

namespace Importaciones.Api.Models;

public class Contenedor
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string NumeroContenedor { get; set; } = string.Empty;

    public DateTime? FechaZarpe { get; set; }

    public DateTime? FechaEstimadaLlegada { get; set; }

    [MaxLength(100)]
    public string Naviera { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Estado { get; set; } = "EnPuerto"; // EnPuerto, EnMar, EnAduana, Entregado

    [MaxLength(500)]
    public string? Notas { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
}
