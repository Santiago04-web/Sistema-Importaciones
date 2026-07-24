using Importaciones.Api.Models;
using Xunit;

namespace Importaciones.Api.Tests;

public class PedidoTests
{
    [Fact]
    public void CalculaElTotalIgualQueElExcelReal()
    {
        var pedido = new Pedido
        {
            Codigo = "ct-1",
            TotalQty = 5000,
            Yuanes = 6.5m,
            PiezasCaja = 1,
            Cubica = 0.001m,
            Tasa = 535m,
            PrecioMt3 = 2300000m,
            PorcentajeEhuk = 0.1m
        };

        Assert.Equal(30608862.5m, pedido.Total);
    }
}