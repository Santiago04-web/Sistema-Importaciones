using Importaciones.Api.Data;
using Importaciones.Api.Hubs;
using Importaciones.Api.Models;
using Importaciones.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Importaciones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PedidosController : ControllerBase
{
    private readonly ImportacionesDbContext _context;
    private readonly ExcelService _excelService;
    private readonly ImagenService _imagenService;
    private readonly DocumentoService _documentoService;
    private readonly IHubContext<PedidosHub> _hubContext;

    public PedidosController(
        ImportacionesDbContext context,
        ExcelService excelService,
        ImagenService imagenService,
        DocumentoService documentoService,
        IHubContext<PedidosHub> hubContext)
    {
        _context = context;
        _excelService = excelService;
        _imagenService = imagenService;
        _documentoService = documentoService;
        _hubContext = hubContext;
    }

    private void SetAuditUserId()
    {
        _context.CurrentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "System";
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Pedido>>> GetPedidos()
    {
        return await _context.Pedidos
            .AsNoTracking()
            .Where(p => !p.Eliminado)
            .Include(p => p.HistorialEtapas)
            .Include(p => p.PagosParciales)
            .Include(p => p.Proveedor)
            .Include(p => p.Contenedor)
            .Include(p => p.Documentos)
            .AsSplitQuery()
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Pedido>> GetPedido(int id)
    {
        var pedido = await _context.Pedidos
            .AsNoTracking()
            .Include(p => p.HistorialEtapas)
            .Include(p => p.PagosParciales)
            .Include(p => p.Proveedor)
            .Include(p => p.Contenedor)
            .Include(p => p.Documentos)
            .AsSplitQuery()
            .FirstOrDefaultAsync(p => p.Id == id && !p.Eliminado);

        if (pedido == null) return NotFound();
        return pedido;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<ActionResult<Pedido>> CreatePedido([FromBody] Pedido pedido)
    {
        SetAuditUserId();
        if (!ModelState.IsValid) return BadRequest(ModelState);

        pedido.Codigo = System.Net.WebUtility.HtmlEncode(pedido.Codigo.Trim());
        pedido.Ciudad = System.Net.WebUtility.HtmlEncode(pedido.Ciudad.Trim());
        pedido.Descripcion = System.Net.WebUtility.HtmlEncode(pedido.Descripcion ?? "");
        pedido.Observaciones = System.Net.WebUtility.HtmlEncode(pedido.Observaciones ?? "");
        pedido.Referencia = System.Net.WebUtility.HtmlEncode(pedido.Referencia ?? "");

        _context.Pedidos.Add(pedido);
        await _context.SaveChangesAsync();

        _context.EtapaHistoriales.Add(new EtapaHistorial
        {
            PedidoId = pedido.Id,
            Etapa = pedido.Etapa,
            FechaCambio = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        await _hubContext.Clients.All.SendAsync("PedidoCreado", pedido);
        return CreatedAtAction(nameof(GetPedido), new { id = pedido.Id }, pedido);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> UpdatePedido(int id, [FromBody] Pedido pedidoInput)
    {
        SetAuditUserId();
        var pedido = await _context.Pedidos.Include(p => p.HistorialEtapas).FirstOrDefaultAsync(p => p.Id == id);
        if (pedido == null) return NotFound();

        bool etapaCambio = pedido.Etapa != pedidoInput.Etapa;

        pedido.Codigo = System.Net.WebUtility.HtmlEncode(pedidoInput.Codigo.Trim());
        pedido.Ciudad = System.Net.WebUtility.HtmlEncode(pedidoInput.Ciudad.Trim());
        pedido.Descripcion = System.Net.WebUtility.HtmlEncode(pedidoInput.Descripcion ?? "");
        pedido.Observaciones = System.Net.WebUtility.HtmlEncode(pedidoInput.Observaciones ?? "");
        pedido.Referencia = System.Net.WebUtility.HtmlEncode(pedidoInput.Referencia ?? "");
        pedido.TotalQty = pedidoInput.TotalQty;
        pedido.Yuanes = pedidoInput.Yuanes;
        pedido.PiezasCaja = pedidoInput.PiezasCaja;
        pedido.Cubica = pedidoInput.Cubica;
        pedido.Tasa = pedidoInput.Tasa;
        pedido.PrecioMt3 = pedidoInput.PrecioMt3;
        pedido.PorcentajeEhuk = pedidoInput.PorcentajeEhuk;
        pedido.Etapa = pedidoInput.Etapa;
        pedido.Abono = pedidoInput.Abono;
        pedido.FechaLimitePago = pedidoInput.FechaLimitePago;
        pedido.Categoria = pedidoInput.Categoria ?? "General";
        pedido.ProveedorId = pedidoInput.ProveedorId;
        pedido.ContenedorId = pedidoInput.ContenedorId;

        if (etapaCambio)
        {
            _context.EtapaHistoriales.Add(new EtapaHistorial
            {
                PedidoId = id,
                Etapa = pedidoInput.Etapa,
                FechaCambio = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        await _hubContext.Clients.All.SendAsync("PedidoActualizado", pedido);
        return NoContent();
    }

    // SOFT-DELETE ENDPOINT
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePedido(int id)
    {
        SetAuditUserId();
        var pedido = await _context.Pedidos.FindAsync(id);
        if (pedido == null) return NotFound();

        pedido.Eliminado = true;
        pedido.FechaEliminacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _hubContext.Clients.All.SendAsync("PedidoEliminado", id);
        return NoContent();
    }

    [HttpPost("delete-batch")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteBatch([FromBody] DeleteBatchRequest req)
    {
        SetAuditUserId();
        if (req == null || req.Ids == null || req.Ids.Count == 0)
        {
            return BadRequest(new { Message = "No se proporcionaron IDs para eliminar." });
        }

        var pedidos = await _context.Pedidos.Where(p => req.Ids.Contains(p.Id)).ToListAsync();
        foreach (var p in pedidos)
        {
            p.Eliminado = true;
            p.FechaEliminacion = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        await _hubContext.Clients.All.SendAsync("PedidoEliminadoMasivo", req.Ids);
        return Ok(new { Count = pedidos.Count });
    }

    [HttpPost("update-batch")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> UpdateBatch([FromBody] UpdateBatchRequest req)
    {
        SetAuditUserId();
        if (req == null || req.Ids == null || req.Ids.Count == 0)
        {
            return BadRequest(new { Message = "No se proporcionaron IDs para actualizar." });
        }

        var pedidos = await _context.Pedidos.Where(p => req.Ids.Contains(p.Id)).ToListAsync();
        foreach (var p in pedidos)
        {
            if (req.Tasa.HasValue && req.Tasa.Value > 0) p.Tasa = req.Tasa.Value;
            if (req.Etapa.HasValue) p.Etapa = req.Etapa.Value;
            if (!string.IsNullOrWhiteSpace(req.Ciudad)) p.Ciudad = req.Ciudad.Trim();
            if (req.Abono.HasValue) p.Abono = req.Abono.Value;
            if (!string.IsNullOrWhiteSpace(req.Codigo)) p.Codigo = req.Codigo.Trim();
        }

        await _context.SaveChangesAsync();
        await _hubContext.Clients.All.SendAsync("PedidoActualizadoMasivo", req.Ids);
        return Ok(new { Count = pedidos.Count });
    }

    [HttpDelete("delete-all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAll()
    {
        SetAuditUserId();
        var allPedidos = await _context.Pedidos.ToListAsync();
        foreach (var p in allPedidos)
        {
            p.Eliminado = true;
            p.FechaEliminacion = DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();
        await _hubContext.Clients.All.SendAsync("TodosPedidosEliminados");
        return NoContent();
    }

    // EXCEL IMPORT & EXPORT
    [HttpPost("excel")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> ImportExcel(IFormFile file)
    {
        SetAuditUserId();
        if (file == null || file.Length == 0) return BadRequest("Archivo no proporcionado.");

        using var stream = new MemoryStream();
        await file.CopyToAsync(stream);
        stream.Position = 0;
        var nuevosPedidos = _excelService.ParsePedidosExcel(stream);

        _context.Pedidos.AddRange(nuevosPedidos);
        await _context.SaveChangesAsync();

        foreach (var p in nuevosPedidos)
        {
            _context.EtapaHistoriales.Add(new EtapaHistorial
            {
                PedidoId = p.Id,
                Etapa = p.Etapa,
                FechaCambio = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        await _hubContext.Clients.All.SendAsync("PedidoCreado", nuevosPedidos.FirstOrDefault());
        return Ok(new { Count = nuevosPedidos.Count });
    }

    [HttpPost("excel-preview")]
    [Authorize(Roles = "Admin,Editor")]
    public IActionResult PreviewExcel(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest(new { Message = "Archivo no proporcionado." });

        try
        {
            using var stream = new MemoryStream();
            file.CopyTo(stream);
            stream.Position = 0;
            var items = _excelService.ParsePedidosExcel(stream);
            if (items == null || items.Count == 0)
            {
                return BadRequest(new { Message = "No se encontraron filas válidas en el archivo Excel." });
            }

            var firstCode = items.FirstOrDefault(x => !string.IsNullOrWhiteSpace(x.Codigo))?.Codigo;
            var suggestedCodigo = !string.IsNullOrWhiteSpace(firstCode) ? firstCode : "1";

            return Ok(new
            {
                suggestedCodigo,
                items
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = $"Error al analizar el archivo Excel: {ex.Message}" });
        }
    }

    [HttpPost("excel-confirm")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> ConfirmExcel([FromBody] ExcelConfirmRequest req)
    {
        SetAuditUserId();
        if (req == null || req.Items == null || req.Items.Count == 0)
        {
            return BadRequest(new { Message = "No hay elementos para importar." });
        }

        var codigoFinal = !string.IsNullOrWhiteSpace(req.OverrideCodigo) ? req.OverrideCodigo.Trim() : "1";
        var nuevosPedidos = new List<Pedido>();

        foreach (var item in req.Items)
        {
            var p = new Pedido
            {
                Codigo = codigoFinal,
                Ciudad = string.IsNullOrWhiteSpace(item.Ciudad) ? "GZ" : item.Ciudad.Trim(),
                FechaNegociacion = item.FechaNegociacion ?? DateTime.UtcNow,
                Abono = item.Abono,
                Descripcion = item.Descripcion ?? "",
                Observaciones = item.Observaciones ?? "",
                Referencia = item.Referencia ?? "",
                TotalQty = item.TotalQty,
                Yuanes = item.Yuanes,
                PiezasCaja = item.PiezasCaja <= 0 ? 1 : item.PiezasCaja,
                Cubica = item.Cubica,
                Tasa = item.Tasa <= 0 ? 535m : item.Tasa,
                PrecioMt3 = item.PrecioMt3 <= 0 ? 2300000m : item.PrecioMt3,
                PorcentajeEhuk = item.PorcentajeEhuk <= 0 ? 0.10m : item.PorcentajeEhuk,
                Etapa = item.Etapa
            };
            nuevosPedidos.Add(p);
        }

        _context.Pedidos.AddRange(nuevosPedidos);
        await _context.SaveChangesAsync();

        foreach (var p in nuevosPedidos)
        {
            _context.EtapaHistoriales.Add(new EtapaHistorial
            {
                PedidoId = p.Id,
                Etapa = p.Etapa,
                FechaCambio = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        await _hubContext.Clients.All.SendAsync("PedidoCreado", nuevosPedidos.FirstOrDefault());
        return Ok(new { Count = nuevosPedidos.Count, Codigo = codigoFinal });
    }

    [HttpGet("export/excel")]
    public async Task<IActionResult> ExportExcel()
    {
        var pedidos = await _context.Pedidos.ToListAsync();
        var bytes = _excelService.ExportPedidosToExcel(pedidos);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Importaciones_{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }

    // IMAGE & DOCUMENT UPLOADS
    [HttpPost("{id}/image")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> UploadImage(int id, IFormFile file)
    {
        var pedido = await _context.Pedidos.FindAsync(id);
        if (pedido == null) return NotFound();

        var ruta = await _imagenService.GuardarImagenAsync(file);
        pedido.FotoUrl = ruta;
        await _context.SaveChangesAsync();

        return Ok(new { FotoUrl = ruta });
    }

    public class SyncFotoRequest
    {
        public string FotoUrl { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public List<int>? PedidoIds { get; set; }
    }

    [HttpPost("bulk-sync-foto")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> BulkSyncFoto([FromBody] SyncFotoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FotoUrl)) return BadRequest("FotoUrl es requerida.");

        IQueryable<Pedido> query = _context.Pedidos.AsQueryable();

        if (request.PedidoIds != null && request.PedidoIds.Any())
        {
            query = query.Where(p => request.PedidoIds.Contains(p.Id));
        }
        else if (!string.IsNullOrWhiteSpace(request.Descripcion))
        {
            var targetDesc = request.Descripcion.Trim().ToLower();
            query = query.Where(p => p.Descripcion != null && p.Descripcion.Trim().ToLower() == targetDesc);
        }
        else
        {
            return BadRequest("Se debe especificar la descripción o lista de IDs.");
        }

        var pedidosToUpdate = await query.ToListAsync();
        foreach (var p in pedidosToUpdate)
        {
            p.FotoUrl = request.FotoUrl;
        }

        await _context.SaveChangesAsync();
        await _hubContext.Clients.All.SendAsync("PedidosActualizados", pedidosToUpdate.Select(p => p.Id));

        return Ok(new { Actualizados = pedidosToUpdate.Count, FotoUrl = request.FotoUrl });
    }

    [HttpPost("{id}/documentos")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> UploadDocumento(int id, IFormFile file, [FromForm] string tipo = "General")
    {
        var pedido = await _context.Pedidos.FindAsync(id);
        if (pedido == null) return NotFound();

        var (ruta, mimeType, tamano) = await _documentoService.GuardarDocumentoAsync(file);

        var doc = new DocumentoAdjunto
        {
            PedidoId = id,
            NombreArchivo = file.FileName,
            RutaArchivo = ruta,
            TipoDocumento = tipo,
            MimeType = mimeType,
            TamanoBytes = tamano,
            FechaSubida = DateTime.UtcNow,
            UsuarioSubidaId = User.FindFirstValue(ClaimTypes.NameIdentifier)
        };

        _context.Documentos.Add(doc);
        await _context.SaveChangesAsync();

        return Ok(doc);
    }

    // PARTIAL PAYMENTS
    [HttpPost("{id}/pagos")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<ActionResult<PagoParcial>> AddPagoParcial(int id, [FromBody] PagoParcial pagoInput)
    {
        SetAuditUserId();
        var pedido = await _context.Pedidos.Include(p => p.PagosParciales).FirstOrDefaultAsync(p => p.Id == id);
        if (pedido == null) return NotFound("Pedido no encontrado.");

        if (pagoInput.Monto <= 0) return BadRequest("El monto debe ser mayor a 0.");

        var nuevoPago = new PagoParcial
        {
            PedidoId = id,
            Monto = pagoInput.Monto,
            FechaPago = DateTime.UtcNow,
            Nota = System.Net.WebUtility.HtmlEncode(pagoInput.Nota ?? ""),
            UsuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier)
        };

        _context.PagoParciales.Add(nuevoPago);
        await _context.SaveChangesAsync();
        await _hubContext.Clients.All.SendAsync("PedidoActualizado", pedido);

        return Ok(nuevoPago);
    }

    [HttpDelete("{id}/pagos/{pagoId}")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> DeletePagoParcial(int id, int pagoId)
    {
        SetAuditUserId();
        var pago = await _context.PagoParciales.FirstOrDefaultAsync(p => p.Id == pagoId && p.PedidoId == id);
        if (pago == null) return NotFound();

        _context.PagoParciales.Remove(pago);
        await _context.SaveChangesAsync();

        var pedido = await _context.Pedidos.Include(p => p.PagosParciales).FirstOrDefaultAsync(p => p.Id == id);
        await _hubContext.Clients.All.SendAsync("PedidoActualizado", pedido);

        return NoContent();
    }
}

public class DeleteBatchRequest
{
    public List<int>? Ids { get; set; }
}

public class UpdateBatchRequest
{
    public List<int>? Ids { get; set; }
    public decimal? Tasa { get; set; }
    public EtapaPedido? Etapa { get; set; }
    public string? Ciudad { get; set; }
    public bool? Abono { get; set; }
    public string? Codigo { get; set; }
}

public class ExcelConfirmRequest
{
    public string? OverrideCodigo { get; set; }
    public List<PedidoInputDto>? Items { get; set; }
}

public class PedidoInputDto
{
    public string? Codigo { get; set; }
    public string? Ciudad { get; set; }
    public DateTime? FechaNegociacion { get; set; }
    public bool Abono { get; set; }
    public string? Descripcion { get; set; }
    public string? Observaciones { get; set; }
    public string? Referencia { get; set; }
    public int TotalQty { get; set; }
    public decimal Yuanes { get; set; }
    public int PiezasCaja { get; set; }
    public decimal Cubica { get; set; }
    public decimal Tasa { get; set; }
    public decimal PrecioMt3 { get; set; }
    public decimal PorcentajeEhuk { get; set; }
    public EtapaPedido Etapa { get; set; }
}
