using Microsoft.EntityFrameworkCore;
using Importaciones.Api.Models;

namespace Importaciones.Api.Data;

public class ImportacionesDbContext : DbContext
{
    public ImportacionesDbContext(DbContextOptions<ImportacionesDbContext> options) : base(options) { }

    public DbSet<Pedido> Pedidos => Set<Pedido>();
}