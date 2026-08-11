using Importaciones.Api.Data;
using Importaciones.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Importaciones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ContenedoresController : ControllerBase
{
    private readonly ImportacionesDbContext _context;

    public ContenedoresController(ImportacionesDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Contenedor>>> GetContenedores()
    {
        return await _context.Contenedores
            .Include(c => c.Pedidos)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Contenedor>> GetContenedor(int id)
    {
        var contenedor = await _context.Contenedores
            .Include(c => c.Pedidos)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (contenedor == null) return NotFound();
        return contenedor;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<ActionResult<Contenedor>> CreateContenedor([FromBody] Contenedor input)
    {
        if (string.IsNullOrWhiteSpace(input.NumeroContenedor))
            return BadRequest("El número de contenedor es obligatorio.");

        var contenedor = new Contenedor
        {
            NumeroContenedor = System.Net.WebUtility.HtmlEncode(input.NumeroContenedor.Trim()),
            FechaZarpe = input.FechaZarpe,
            FechaEstimadaLlegada = input.FechaEstimadaLlegada,
            Naviera = System.Net.WebUtility.HtmlEncode(input.Naviera ?? ""),
            Estado = input.Estado ?? "EnPuerto",
            Notas = System.Net.WebUtility.HtmlEncode(input.Notas ?? ""),
            FechaCreacion = DateTime.UtcNow
        };

        _context.Contenedores.Add(contenedor);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetContenedor), new { id = contenedor.Id }, contenedor);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> UpdateContenedor(int id, [FromBody] Contenedor input)
    {
        var contenedor = await _context.Contenedores.FindAsync(id);
        if (contenedor == null) return NotFound();

        contenedor.NumeroContenedor = System.Net.WebUtility.HtmlEncode(input.NumeroContenedor.Trim());
        contenedor.FechaZarpe = input.FechaZarpe;
        contenedor.FechaEstimadaLlegada = input.FechaEstimadaLlegada;
        contenedor.Naviera = System.Net.WebUtility.HtmlEncode(input.Naviera ?? "");
        contenedor.Estado = input.Estado ?? "EnPuerto";
        contenedor.Notas = System.Net.WebUtility.HtmlEncode(input.Notas ?? "");

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/asignar-pedidos")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> AsignarPedidos(int id, [FromBody] List<int> pedidoIds)
    {
        var contenedor = await _context.Contenedores.FindAsync(id);
        if (contenedor == null) return NotFound("Contenedor no encontrado.");

        var pedidos = await _context.Pedidos.Where(p => pedidoIds.Contains(p.Id)).ToListAsync();
        foreach (var p in pedidos)
        {
            p.ContenedorId = id;
        }

        await _context.SaveChangesAsync();
        return Ok(new { Count = pedidos.Count });
    }
}
