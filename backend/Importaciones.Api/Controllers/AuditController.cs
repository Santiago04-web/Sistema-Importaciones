using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Importaciones.Api.Data;

namespace Importaciones.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Editor")]
public class AuditController : ControllerBase
{
    private readonly ImportacionesDbContext _context;

    public AuditController(ImportacionesDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Returns audit logs ordered by most recent. Admin only.
    /// Optional query params: ?take=100&amp;skip=0&amp;action=Modified&amp;entity=Pedido
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] int take = 100,
        [FromQuery] int skip = 0,
        [FromQuery] string? action = null,
        [FromQuery] string? entity = null)
    {
        var query = _context.AuditLogs.AsQueryable();

        if (!string.IsNullOrEmpty(action))
            query = query.Where(a => a.Action == action);

        if (!string.IsNullOrEmpty(entity))
            query = query.Where(a => a.EntityName == entity);

        var total = await query.CountAsync();

        // Pull logs + join users into memory to avoid EF translation issues with DateTime.SpecifyKind
        var rawLogs = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        var userIds = rawLogs.Select(l => l.UserId).Distinct().ToList();
        var users = await _context.Users
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.UserName })
            .ToListAsync();

        var userMap = users.ToDictionary(u => u.Id, u => u.UserName);

        var logs = rawLogs.Select(log => new
        {
            id = log.Id,
            // Show UserName (display name) or fall back to the stored UserId
            userId = userMap.TryGetValue(log.UserId, out var name) ? name : log.UserId,
            action = log.Action,
            entityName = log.EntityName,
            entityId = log.EntityId,
            changes = log.Changes,
            // Explicitly mark as UTC so JSON serialization includes the Z suffix
            timestamp = DateTime.SpecifyKind(log.Timestamp, DateTimeKind.Utc)
        }).ToList();

        return Ok(new { total, logs });
    }
}
