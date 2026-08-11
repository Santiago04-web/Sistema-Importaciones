using Importaciones.Api.Data;
using Importaciones.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Importaciones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificacionesController : ControllerBase
{
    private readonly ImportacionesDbContext _context;

    public NotificacionesController(ImportacionesDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Notificacion>>> GetNotificaciones()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return await _context.Notificaciones
            .Where(n => n.UsuarioId == null || n.UsuarioId == userId)
            .OrderByDescending(n => n.FechaCreacion)
            .Take(30)
            .ToListAsync();
    }

    [HttpPost("{id}/marcar-leida")]
    public async Task<IActionResult> MarcarLeida(int id)
    {
        var notif = await _context.Notificaciones.FindAsync(id);
        if (notif == null) return NotFound();

        notif.Leida = true;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
