using Importaciones.Api.Data;
using Importaciones.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Importaciones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class ProveedoresController : ControllerBase
{
    private readonly ImportacionesDbContext _context;

    public ProveedoresController(ImportacionesDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Proveedor>>> GetProveedores()
    {
        return await _context.Proveedores
            .Include(p => p.Pedidos)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Proveedor>> GetProveedor(int id)
    {
        var proveedor = await _context.Proveedores
            .Include(p => p.Pedidos)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proveedor == null) return NotFound();
        return proveedor;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<ActionResult<Proveedor>> CreateProveedor([FromBody] Proveedor input)
    {
        if (string.IsNullOrWhiteSpace(input.Nombre)) return BadRequest("El nombre del proveedor es obligatorio.");

        var proveedor = new Proveedor
        {
            Nombre = input.Nombre.Trim(),
            CiudadChina = (input.CiudadChina ?? "Guangzhou").Trim(),
            Categoria = (input.Categoria ?? "General").Trim(),
            ContactoEmail = input.ContactoEmail,
            ContactoTelefono = input.ContactoTelefono,
            WeChatId = input.WeChatId,
            Calificacion = input.Calificacion > 0 ? input.Calificacion : 5,
            Notas = (input.Notas ?? "").Trim(),
            FechaCreacion = DateTime.UtcNow
        };

        _context.Proveedores.Add(proveedor);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProveedor), new { id = proveedor.Id }, proveedor);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> UpdateProveedor(int id, [FromBody] Proveedor input)
    {
        var proveedor = await _context.Proveedores.FindAsync(id);
        if (proveedor == null) return NotFound();

        proveedor.Nombre = input.Nombre.Trim();
        proveedor.CiudadChina = (input.CiudadChina ?? "Guangzhou").Trim();
        proveedor.Categoria = (input.Categoria ?? "General").Trim();
        proveedor.ContactoEmail = input.ContactoEmail;
        proveedor.ContactoTelefono = input.ContactoTelefono;
        proveedor.WeChatId = input.WeChatId;
        proveedor.Calificacion = input.Calificacion;
        proveedor.Notas = (input.Notas ?? "").Trim();

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteProveedor(int id)
    {
        var proveedor = await _context.Proveedores.FindAsync(id);
        if (proveedor == null) return NotFound();

        _context.Proveedores.Remove(proveedor);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
