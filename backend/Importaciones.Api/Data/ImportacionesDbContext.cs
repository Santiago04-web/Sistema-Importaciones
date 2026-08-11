using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using System.Text.Json;
using Importaciones.Api.Models;

namespace Importaciones.Api.Data;

public class ImportacionesDbContext : IdentityDbContext<IdentityUser>
{
    private readonly IHttpContextAccessor? _httpContextAccessor;
    private string? _currentUserId;

    public string CurrentUserId
    {
        get
        {
            if (!string.IsNullOrEmpty(_currentUserId) && _currentUserId != "System")
            {
                return _currentUserId;
            }
            var user = _httpContextAccessor?.HttpContext?.User;
            return user?.FindFirstValue(ClaimTypes.NameIdentifier) 
                   ?? user?.Identity?.Name 
                   ?? "System";
        }
        set => _currentUserId = value;
    }

    // Prevents infinite recursion when we save audit logs internally
    private bool _isSavingAudit = false;

    public ImportacionesDbContext(
        DbContextOptions<ImportacionesDbContext> options,
        IHttpContextAccessor? httpContextAccessor = null) : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<EtapaHistorial> EtapaHistoriales => Set<EtapaHistorial>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<UserRefreshToken> UserRefreshTokens => Set<UserRefreshToken>();

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Skip audit logic when saving audit logs themselves (avoid infinite recursion)
        if (_isSavingAudit)
        {
            return await base.SaveChangesAsync(cancellationToken);
        }

        // Capture all Pedido changes BEFORE saving (so we still have OriginalValues)
        var entries = ChangeTracker
            .Entries()
            .Where(e => e.Entity is Pedido &&
                        (e.State == EntityState.Added ||
                         e.State == EntityState.Modified ||
                         e.State == EntityState.Deleted))
            .ToList();

        // Build audit log objects — for Added entities the real Id is not yet assigned
        var pendingAudits = new List<(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry, AuditLog log, bool needsId)>();

        foreach (var entry in entries)
        {
            try
            {
                var changes = new Dictionary<string, object?>();
                var needsId = false;
                string entityId = "";

                if (entry.State == EntityState.Deleted)
                {
                    entityId = entry.Property("Id").OriginalValue?.ToString() ?? "";
                    // For deletes we only record which entity was removed
                }
                else if (entry.State == EntityState.Added)
                {
                    needsId = true;
                    foreach (var prop in entry.Properties)
                    {
                        try
                        {
                            if (prop.IsTemporary || prop.Metadata.IsPrimaryKey()) continue;
                            // Skip computed/read-only properties (no setter)
                            if (prop.Metadata.PropertyInfo?.SetMethod == null) continue;
                            changes[prop.Metadata.Name] = prop.CurrentValue;
                        }
                        catch { /* skip unmappable property */ }
                    }
                }
                else // Modified
                {
                    entityId = entry.Property("Id").CurrentValue?.ToString() ?? "";
                    foreach (var prop in entry.Properties)
                    {
                        try
                        {
                            if (prop.IsTemporary || prop.Metadata.IsPrimaryKey()) continue;
                            if (prop.Metadata.PropertyInfo?.SetMethod == null) continue;
                            if (prop.IsModified && !Equals(prop.OriginalValue, prop.CurrentValue))
                            {
                                changes[prop.Metadata.Name] = new { Original = prop.OriginalValue, Current = prop.CurrentValue };
                            }
                        }
                        catch { /* skip unmappable property */ }
                    }
                }

                var auditLog = new AuditLog
                {
                    UserId = CurrentUserId,
                    EntityName = entry.Entity.GetType().Name,
                    Action = entry.State.ToString(),
                    EntityId = entityId,
                    Changes = JsonSerializer.Serialize(changes),
                    Timestamp = DateTime.UtcNow
                };

                pendingAudits.Add((entry, auditLog, needsId));
            }
            catch { /* if audit building fails, skip — don't block the real operation */ }
        }

        // Save the actual entities first so EF generates the real primary keys
        var result = await base.SaveChangesAsync(cancellationToken);

        // Now save audit logs if any changes were tracked
        if (pendingAudits.Any())
        {
            foreach (var (entry, log, needsId) in pendingAudits)
            {
                if (needsId)
                {
                    // Now the real DB-assigned Id is available
                    log.EntityId = entry.Property("Id").CurrentValue?.ToString() ?? "";
                }
                AuditLogs.Add(log);
            }

            _isSavingAudit = true;
            try
            {
                await base.SaveChangesAsync(cancellationToken);
            }
            finally
            {
                _isSavingAudit = false;
            }
        }

        return result;
    }
}