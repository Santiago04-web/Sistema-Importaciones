using Importaciones.Api.Data;
using Importaciones.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Importaciones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ImportacionesDbContext _context;

    public DashboardController(ImportacionesDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var pedidos = await _context.Pedidos.Include(p => p.PagosParciales).ToListAsync();

        var totalInvertido = pedidos.Sum(p => p.Total);
        var totalFlete = pedidos.Sum(p => p.Flete);
        var totalProducto = pedidos.Sum(p => p.Producto);
        var totalComisiones = pedidos.Sum(p => p.ComisionTrabajo + p.ComisionApalancamiento);
        var totalGanancia = pedidos.Sum(p => p.Ganancia);
        var totalSaldo = pedidos.Sum(p => p.Saldo);
        var totalCubica = pedidos.Sum(p => p.Mt3);
        var totalPiezas = pedidos.Sum(p => p.TotalQty);

        return Ok(new
        {
            TotalPedidos = pedidos.Count,
            TotalInvertido = totalInvertido,
            TotalFlete = totalFlete,
            TotalProducto = totalProducto,
            TotalComisiones = totalComisiones,
            TotalGanancia = totalGanancia,
            TotalSaldo = totalSaldo,
            TotalCubica = totalCubica,
            TotalPiezas = totalPiezas
        });
    }

    [HttpGet("trends")]
    public async Task<IActionResult> GetFinancialTrends()
    {
        var historial = await _context.EtapaHistoriales
            .Include(h => h.Pedido)
            .OrderBy(h => h.FechaCambio)
            .ToListAsync();

        var monthlyTrends = historial
            .GroupBy(h => new { h.FechaCambio.Year, h.FechaCambio.Month })
            .Select(g => new
            {
                Mes = $"{g.Key.Year}-{g.Key.Month:D2}",
                Inversion = g.Sum(x => x.Pedido?.Total ?? 0),
                Ganancia = g.Sum(x => x.Pedido?.Ganancia ?? 0),
                TotalPedidos = g.Select(x => x.PedidoId).Distinct().Count()
            })
            .ToList();

        return Ok(monthlyTrends);
    }

    [HttpGet("funnel")]
    public async Task<IActionResult> GetStageFunnel()
    {
        var pedidos = await _context.Pedidos.ToListAsync();

        var funnel = Enum.GetValues<EtapaPedido>().Select(etapa => new
        {
            EtapaId = (int)etapa,
            EtapaNombre = etapa.ToString(),
            Count = pedidos.Count(p => p.Etapa == etapa),
            MontoTotal = pedidos.Where(p => p.Etapa == etapa).Sum(p => p.Total)
        }).ToList();

        return Ok(funnel);
    }
}
