using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using System.Text.Json;
using Importaciones.Api.Models;

namespace Importaciones.Api.Data;

public class ImportacionesDbContext : IdentityDbContext<IdentityUser>
{
    // The current user id to be injected
    public string CurrentUserId { get; set; } = "System";

    public ImportacionesDbContext(DbContextOptions<ImportacionesDbContext> options) : base(options) { }

    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker
            .Entries()
            .Where(e => e.Entity is Pedido && (e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted))
            .ToList();

        var auditEntries = new List<AuditLog>();

        foreach (var entry in entries)
        {
            var auditEntry = new AuditLog
            {
                UserId = CurrentUserId,
                EntityName = entry.Entity.GetType().Name,
                Action = entry.State.ToString(),
                Timestamp = DateTime.UtcNow
            };

            var changes = new Dictionary<string, object?>();
            
            if (entry.State == EntityState.Deleted)
            {
                // Solo capturamos Id para eliminados (o los que existan antes de eliminar)
                auditEntry.EntityId = entry.Property("Id").OriginalValue?.ToString() ?? "";
            }
            else
            {
                // Added o Modified
                auditEntry.EntityId = entry.Property("Id").CurrentValue?.ToString() ?? "";
                
                foreach (var property in entry.Properties)
                {
                    if (property.IsTemporary)
                    {
                        // Para Added, Id suele ser temporary y se actualizará al guardar
                        continue;
                    }

                    string propertyName = property.Metadata.Name;
                    if (property.Metadata.IsPrimaryKey())
                    {
                        continue;
                    }

                    if (entry.State == EntityState.Added)
                    {
                        changes[propertyName] = property.CurrentValue;
                    }
                    else if (entry.State == EntityState.Modified)
                    {
                        if (property.IsModified && !Equals(property.OriginalValue, property.CurrentValue))
                        {
                            changes[propertyName] = new { Original = property.OriginalValue, Current = property.CurrentValue };
                        }
                    }
                }
            }

            auditEntry.Changes = JsonSerializer.Serialize(changes);
            auditEntries.Add(auditEntry);
        }

        if (auditEntries.Any())
        {
            AuditLogs.AddRange(auditEntries);
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}