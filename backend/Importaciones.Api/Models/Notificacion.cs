using System.ComponentModel.DataAnnotations;

namespace Importaciones.Api.Models;

public class Notificacion
{
    [Key]
    public int Id { get; set; }

    [MaxLength(100)]
    public string? UsuarioId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Titulo { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Mensaje { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Tipo { get; set; } = "Info"; // Info, Alerta, Exito, Advertencia

    public bool Leida { get; set; } = false;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}
