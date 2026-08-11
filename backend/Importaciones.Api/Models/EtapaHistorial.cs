using System.ComponentModel.DataAnnotations;

namespace Importaciones.Api.Models;

public class EtapaHistorial
{
    public int Id { get; set; }
    public int PedidoId { get; set; }
    public EtapaPedido Etapa { get; set; }
    public DateTime FechaCambio { get; set; } = DateTime.UtcNow;

    public Pedido? Pedido { get; set; }
}
