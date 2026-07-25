using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using System.Security.Claims;
using Importaciones.Api.Data;
using Importaciones.Api.Models;

namespace Importaciones.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] // Requires login by default
public class PedidosController : ControllerBase
{
    private readonly ImportacionesDbContext _context;

    public PedidosController(ImportacionesDbContext context)
    {
        _context = context;
    }

    private void SetAuditUserId()
    {
        _context.CurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown";
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Pedido>>> GetPedidos()
    {
        return await _context.Pedidos.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Pedido>> GetPedido(int id)
    {
        var pedido = await _context.Pedidos.FindAsync(id);
        if (pedido == null) return NotFound();
        return pedido;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<ActionResult<Pedido>> PostPedido(Pedido pedido)
    {
        SetAuditUserId();
        _context.Pedidos.Add(pedido);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPedido), new { id = pedido.Id }, pedido);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> PutPedido(int id, Pedido pedido)
    {
        if (id != pedido.Id) return BadRequest();

        SetAuditUserId();
        _context.Entry(pedido).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!PedidoExists(id)) return NotFound();
            else throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePedido(int id)
    {
        SetAuditUserId();
        var pedido = await _context.Pedidos.FindAsync(id);
        if (pedido == null) return NotFound();

        _context.Pedidos.Remove(pedido);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("excel")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> UploadExcel(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is empty.");

        SetAuditUserId();
        var nuevosPedidos = new List<Pedido>();

        using (var stream = new MemoryStream())
        {
            await file.CopyToAsync(stream);
            using (var workbook = new XLWorkbook(stream))
            {
                var worksheet = workbook.Worksheets.FirstOrDefault();
                if (worksheet == null) return BadRequest("Excel file has no worksheets.");

                // Start from row 2 assuming row 1 is headers
                var rows = worksheet.RangeUsed()?.RowsUsed().Skip(1);
                if (rows == null) return BadRequest("Empty excel sheet");

                foreach (var row in rows)
                {
                    try
                    {
                        var pedido = new Pedido
                        {
                            Codigo = row.Cell(1).GetString(),
                            Ciudad = row.Cell(2).GetString(),
                            FechaNegociacion = row.Cell(3).GetDateTime(),
                            Descripcion = row.Cell(4).GetString(),
                            Observaciones = row.Cell(5).GetString(),
                            Referencia = row.Cell(6).GetString(),
                            TotalQty = row.Cell(7).GetValue<int>(),
                            Yuanes = row.Cell(8).GetValue<decimal>(),
                            PiezasCaja = row.Cell(9).GetValue<int>(),
                            Cubica = row.Cell(10).GetValue<decimal>(),
                            Tasa = row.Cell(11).GetValue<decimal>(),
                            PrecioMt3 = row.Cell(12).GetValue<decimal>(),
                            PorcentajeEhuk = row.Cell(13).GetValue<decimal>(),
                            Etapa = Enum.TryParse<EtapaPedido>(row.Cell(14).GetString(), out var etapa) ? etapa : EtapaPedido.Cotizacion
                        };
                        nuevosPedidos.Add(pedido);
                    }
                    catch (Exception ex)
                    {
                        // Log or handle parsing error for a specific row
                        return BadRequest($"Error parsing row {row.RowNumber()}: {ex.Message}");
                    }
                }
            }
        }

        _context.Pedidos.AddRange(nuevosPedidos);
        await _context.SaveChangesAsync();

        return Ok(new { Status = "Success", Count = nuevosPedidos.Count });
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardData()
    {
        var pedidos = await _context.Pedidos.ToListAsync();

        var gastoPorMes = pedidos
            .GroupBy(p => new { p.FechaNegociacion.Year, p.FechaNegociacion.Month })
            .Select(g => new { 
                Mes = $"{g.Key.Year}-{g.Key.Month:D2}", 
                Total = g.Sum(p => p.Total) 
            })
            .OrderBy(x => x.Mes)
            .ToList();

        var gastoPorCiudad = pedidos
            .GroupBy(p => p.Ciudad)
            .Select(g => new { 
                Ciudad = string.IsNullOrEmpty(g.Key) ? "Desconocida" : g.Key, 
                Total = g.Sum(p => p.Total) 
            })
            .OrderByDescending(x => x.Total)
            .ToList();

        var margenPromedio = pedidos.Any(p => p.TotalQty > 0) 
            ? pedidos.Where(p => p.TotalQty > 0).Average(p => (double)p.Ganancia) 
            : 0;

        return Ok(new
        {
            GastoPorMes = gastoPorMes,
            GastoPorCiudad = gastoPorCiudad,
            MargenPromedio = margenPromedio,
            TotalPedidos = pedidos.Count
        });
    }

    private bool PedidoExists(int id)
    {
        return _context.Pedidos.Any(e => e.Id == id);
    }
}
