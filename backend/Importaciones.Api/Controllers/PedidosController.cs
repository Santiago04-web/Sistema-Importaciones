using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using System.Security.Claims;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using Importaciones.Api.Data;
using Importaciones.Api.Models;
using Importaciones.Api.Hubs;

namespace Importaciones.Api.Controllers;

public static class ExcelColumns
{
    public const int Codigo = 1;
    public const int Ciudad = 2;
    public const int Fecha = 3;
    public const int Descripcion = 5;
    public const int Observaciones = 6;
    public const int Referencia = 7;
    public const int TotalQty = 8;
    public const int Yuanes = 9;
    public const int PiezasCaja = 10;
    public const int Cubica = 11;
    public const int Tasa = 12;
    public const int PrecioMt3 = 16;
    public const int PorcentajeEhuk = 26;
}

[Route("api/[controller]")]
[ApiController]
[Authorize] 
public class PedidosController : ControllerBase
{
    private readonly ImportacionesDbContext _context;
    private readonly ILogger<PedidosController> _logger;
    private readonly IHubContext<PedidosHub> _hubContext;

    public PedidosController(
        ImportacionesDbContext context, 
        ILogger<PedidosController> logger,
        IHubContext<PedidosHub> hubContext)
    {
        _context = context;
        _logger = logger;
        _hubContext = hubContext;
    }

    private void SetAuditUserId()
    {
        _context.CurrentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown";
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Editor,Viewer")]
    public async Task<ActionResult<IEnumerable<Pedido>>> GetPedidos()
    {
        return await _context.Pedidos
            .Include(p => p.HistorialEtapas)
            .Include(p => p.PagosParciales)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Editor,Viewer")]
    public async Task<ActionResult<Pedido>> GetPedido(int id)
    {
        var pedido = await _context.Pedidos
            .Include(p => p.HistorialEtapas)
            .Include(p => p.PagosParciales)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (pedido == null) return NotFound();
        return pedido;
    }

    [HttpGet("export/excel")]
    [Authorize(Roles = "Admin,Editor,Viewer")]
    public async Task<IActionResult> ExportExcel()
    {
        var pedidos = await _context.Pedidos.ToListAsync();

        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Importaciones");

        // ── Etapa helper ──
        static string EtapaName(int e) => e switch
        {
            1 => "Confirmado",
            2 => "Pagado",
            3 => "En Tránsito",
            4 => "Aduana",
            5 => "Recibido",
            _ => "Cotización"
        };

        // ── Column definitions ──
        var cols = new[]
        {
            "Código",       // A
            "Referencia",   // B
            "Ciudad",       // C
            "Fecha",        // D
            "Descripción",  // E
            "Qty",          // F
            "Yuanes/u",     // G
            "Tasa",         // H
            "Cúbica",       // I
            "Cajas",        // J
            "m³ Total",     // K
            "Precio m³",    // L
            "% EHUK",       // M
            "Producto (¥)", // N
            "Producto ($)", // O
            "Flete ($)",    // P
            "Com. Trabajo", // Q
            "Com. Apalanc.",// R
            "Pago Inicial", // S
            "Saldo",        // T
            "Total ($)",    // U
            "Costo Final",  // V
            "Costo Venta",  // W
            "Ganancia ($)", // X
            "Etapa"         // Y
        };

        int totalCols = cols.Length;

        // ── Row 1: Brand header ──
        var titleCell = ws.Cell(1, 1);
        ws.Range(1, 1, 1, totalCols).Merge();
        titleCell.Value = $"LOGIGHO — Manifiesto de Importaciones  |  Generado: {DateTime.Now:dd/MM/yyyy HH:mm}";
        titleCell.Style.Font.Bold = true;
        titleCell.Style.Font.FontSize = 13;
        titleCell.Style.Font.FontColor = XLColor.White;
        titleCell.Style.Fill.BackgroundColor = XLColor.FromHtml("#0f172a");
        titleCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        titleCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        ws.Row(1).Height = 28;

        // ── Row 2: Column headers ──
        for (int c = 0; c < cols.Length; c++)
        {
            var cell = ws.Cell(2, c + 1);
            cell.Value = cols[c];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 9;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1e3a5f");
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Border.BottomBorder = XLBorderStyleValues.Medium;
            cell.Style.Border.BottomBorderColor = XLColor.FromHtml("#3b82f6");
        }
        ws.Row(2).Height = 22;

        // Etapa colors map
        var etapaColors = new Dictionary<string, string>
        {
            ["Cotización"]  = "#94a3b8",
            ["Confirmado"]  = "#38bdf8",
            ["Pagado"]      = "#34d399",
            ["En Tránsito"] = "#fcd34d",
            ["Aduana"]      = "#f87171",
            ["Recibido"]    = "#a78bfa"
        };

        // ── Data rows ──
        int row = 3;
        foreach (var p in pedidos)
        {
            bool isAlt = (row % 2 == 0);
            var rowBg = XLColor.FromHtml(isAlt ? "#0f1a2e" : "#111827");

            void SetCell(int col, object? val, string? fmt = null, string? hexColor = null)
            {
                var cell = ws.Cell(row, col);
                if (val is decimal d) cell.Value = (double)d;
                else if (val is int i) cell.Value = i;
                else if (val is DateTime dt) cell.Value = dt;
                else cell.Value = val?.ToString() ?? "";

                cell.Style.Fill.BackgroundColor = hexColor != null ? XLColor.FromHtml(hexColor) : rowBg;
                cell.Style.Font.FontColor = XLColor.FromHtml("#e2e8f0");
                cell.Style.Font.FontSize = 9;
                cell.Style.Border.BottomBorder = XLBorderStyleValues.Thin;
                cell.Style.Border.BottomBorderColor = XLColor.FromHtml("#1e293b");
                if (fmt != null) cell.Style.NumberFormat.Format = fmt;
            }

            var etapa = EtapaName(p.Etapa);

            SetCell(1,  p.Codigo);
            SetCell(2,  p.Referencia);
            SetCell(3,  p.Ciudad);
            SetCell(4,  p.FechaNegociacion, "dd/mm/yyyy");
            SetCell(5,  p.Descripcion);
            SetCell(6,  p.TotalQty,         "#,##0");
            SetCell(7,  p.Yuanes,           "#,##0.0000");
            SetCell(8,  p.Tasa,             "#,##0.0000");
            SetCell(9,  p.Cubica,           "#,##0.000");
            SetCell(10, p.Cajas,            "#,##0");
            SetCell(11, p.Mt3,              "#,##0.000");
            SetCell(12, p.PrecioMt3,        "#,##0.0000");
            SetCell(13, p.PorcentajeEhuk,   "0.00%");
            SetCell(14, p.ProductoEnYuanes, "#,##0.00");
            SetCell(15, p.Producto,         "$#,##0.00");
            SetCell(16, p.Flete,            "$#,##0.00");
            SetCell(17, p.ComisionTrabajo,  "$#,##0.00");
            SetCell(18, p.ComisionApalancamiento, "$#,##0.00");
            SetCell(19, p.PagoInicial,      "$#,##0.00");
            SetCell(20, p.Saldo,            "$#,##0.00");
            SetCell(21, p.Total,            "$#,##0.00");
            SetCell(22, p.CostoFinal,       "$#,##0.00");
            SetCell(23, p.CostoVenta,       "$#,##0.00");
            SetCell(24, p.Ganancia,         "$#,##0.00");

            // Etapa cell with color
            var etapaHex = etapaColors.TryGetValue(etapa, out var ec) ? ec : "#94a3b8";
            var etapaCell = ws.Cell(row, 25);
            etapaCell.Value = etapa;
            etapaCell.Style.Fill.BackgroundColor = XLColor.FromHtml(etapaHex + "33"); // 20% opacity via hex
            etapaCell.Style.Font.FontColor = XLColor.FromHtml(etapaHex);
            etapaCell.Style.Font.Bold = true;
            etapaCell.Style.Font.FontSize = 9;
            etapaCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            etapaCell.Style.Border.BottomBorder = XLBorderStyleValues.Thin;
            etapaCell.Style.Border.BottomBorderColor = XLColor.FromHtml("#1e293b");

            ws.Row(row).Height = 18;
            row++;
        }

        // ── Totals row ──
        int totalRow = row;
        ws.Range(totalRow, 1, totalRow, 5).Merge();
        var totalLabel = ws.Cell(totalRow, 1);
        totalLabel.Value = $"TOTALES  ({pedidos.Count} pedidos)";
        totalLabel.Style.Font.Bold = true;
        totalLabel.Style.Font.FontColor = XLColor.White;
        totalLabel.Style.Fill.BackgroundColor = XLColor.FromHtml("#1e3a5f");

        void TotalCell(int col, decimal val, string fmt)
        {
            var c = ws.Cell(totalRow, col);
            c.Value = (double)val;
            c.Style.NumberFormat.Format = fmt;
            c.Style.Font.Bold = true;
            c.Style.Font.FontColor = XLColor.FromHtml("#34d399");
            c.Style.Fill.BackgroundColor = XLColor.FromHtml("#1e3a5f");
        }

        TotalCell(6,  pedidos.Sum(p => p.TotalQty), "#,##0");
        TotalCell(14, pedidos.Sum(p => p.ProductoEnYuanes), "#,##0.00");
        TotalCell(15, pedidos.Sum(p => p.Producto),  "$#,##0.00");
        TotalCell(16, pedidos.Sum(p => p.Flete),     "$#,##0.00");
        TotalCell(19, pedidos.Sum(p => p.PagoInicial), "$#,##0.00");
        TotalCell(20, pedidos.Sum(p => p.Saldo),     "$#,##0.00");
        TotalCell(21, pedidos.Sum(p => p.Total),     "$#,##0.00");
        TotalCell(24, pedidos.Sum(p => p.Ganancia),  "$#,##0.00");
        ws.Row(totalRow).Height = 22;

        // ── Freeze header rows & auto-fit columns ──
        ws.SheetView.FreezeRows(2);
        ws.Columns().AdjustToContents(8, 60);

        // Min widths for key columns
        ws.Column(5).Width = 28;  // Descripción
        ws.Column(1).Width = 12;  // Código
        ws.Column(25).Width = 14; // Etapa

        // ── Stream output ──
        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        ms.Seek(0, SeekOrigin.Begin);

        var fileName = $"Logigho_Importaciones_{DateTime.Now:yyyyMMdd_HHmm}.xlsx";
        return File(ms.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<ActionResult<Pedido>> PostPedido(Pedido pedido)
    {
        // XSS Sanitization
        pedido.Codigo = System.Net.WebUtility.HtmlEncode(pedido.Codigo ?? "");
        pedido.Ciudad = System.Net.WebUtility.HtmlEncode(pedido.Ciudad ?? "");
        pedido.Descripcion = System.Net.WebUtility.HtmlEncode(pedido.Descripcion ?? "");
        pedido.Observaciones = System.Net.WebUtility.HtmlEncode(pedido.Observaciones ?? "");
        pedido.Referencia = System.Net.WebUtility.HtmlEncode(pedido.Referencia ?? "");

        SetAuditUserId();
        _context.Pedidos.Add(pedido);
        await _context.SaveChangesAsync();

        // Registrar EtapaHistorial inicial
        _context.EtapaHistoriales.Add(new EtapaHistorial
        {
            PedidoId = pedido.Id,
            Etapa = pedido.Etapa,
            FechaCambio = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Transmitir evento SignalR en tiempo real
        await _hubContext.Clients.All.SendAsync("PedidoCreado", pedido);

        return CreatedAtAction(nameof(GetPedido), new { id = pedido.Id }, pedido);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> PutPedido(int id, Pedido pedido)
    {
        if (id != pedido.Id) return BadRequest();

        // XSS Sanitization
        pedido.Codigo = System.Net.WebUtility.HtmlEncode(pedido.Codigo ?? "");
        pedido.Ciudad = System.Net.WebUtility.HtmlEncode(pedido.Ciudad ?? "");
        pedido.Descripcion = System.Net.WebUtility.HtmlEncode(pedido.Descripcion ?? "");
        pedido.Observaciones = System.Net.WebUtility.HtmlEncode(pedido.Observaciones ?? "");
        pedido.Referencia = System.Net.WebUtility.HtmlEncode(pedido.Referencia ?? "");

        SetAuditUserId();

        var existing = await _context.Pedidos.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        if (existing != null && existing.Etapa != pedido.Etapa)
        {
            _context.EtapaHistoriales.Add(new EtapaHistorial
            {
                PedidoId = id,
                Etapa = pedido.Etapa,
                FechaCambio = DateTime.UtcNow
            });
        }

        _context.Entry(pedido).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("PedidoActualizado", pedido);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            if (!PedidoExists(id)) return NotFound();
            _logger.LogWarning(ex, "Conflicto de concurrencia detectado al actualizar pedido {Id}", id);
            return Conflict(new { Message = "El registro fue modificado por otro usuario en simultáneo. Por favor refresca los datos antes de guardar." });
        }

        return Ok(pedido);
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
        await _hubContext.Clients.All.SendAsync("PedidoEliminado", id);
        return NoContent();
    }

    [HttpPost("{id}/pagos")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<ActionResult<PagoParcial>> AddPagoParcial(int id, [FromBody] PagoParcial pagoInput)
    {
        SetAuditUserId();
        var pedido = await _context.Pedidos.Include(p => p.PagosParciales).FirstOrDefaultAsync(p => p.Id == id);
        if (pedido == null) return NotFound("Pedido no encontrado.");

        if (pagoInput.Monto <= 0) return BadRequest("El monto del abono debe ser mayor a 0.");

        var nuevoPago = new PagoParcial
        {
            PedidoId = id,
            Monto = pagoInput.Monto,
            FechaPago = DateTime.UtcNow,
            Nota = System.Net.WebUtility.HtmlEncode(pagoInput.Nota ?? ""),
            UsuarioId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
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
    public async Task<IActionResult> DeleteBatch([FromBody] DeleteBatchRequest request)
    {
        if (request?.Ids == null || request.Ids.Count == 0)
        {
            return BadRequest("No IDs provided.");
        }

        SetAuditUserId();

        var pedidos = await _context.Pedidos
            .Where(p => request.Ids.Contains(p.Id))
            .ToListAsync();

        _context.Pedidos.RemoveRange(pedidos);
        await _context.SaveChangesAsync();

        return Ok(new { Count = pedidos.Count });
    }

    [HttpPost("update-batch")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> UpdateBatch([FromBody] UpdateBatchRequest request)
    {
        if (request?.Ids == null || request.Ids.Count == 0)
        {
            return BadRequest("No IDs provided.");
        }

        SetAuditUserId();

        var pedidos = await _context.Pedidos
            .Where(p => request.Ids.Contains(p.Id))
            .ToListAsync();

        foreach (var p in pedidos)
        {
            if (request.Tasa.HasValue && request.Tasa.Value > 0)
            {
                p.Tasa = request.Tasa.Value;
            }
            if (request.Etapa.HasValue)
            {
                p.Etapa = request.Etapa.Value;
            }
            if (!string.IsNullOrWhiteSpace(request.Ciudad))
            {
                p.Ciudad = System.Net.WebUtility.HtmlEncode(request.Ciudad.Trim());
            }
            if (request.Abono.HasValue)
            {
                p.Abono = request.Abono.Value;
            }
            if (!string.IsNullOrWhiteSpace(request.Codigo))
            {
                p.Codigo = System.Net.WebUtility.HtmlEncode(request.Codigo.Trim());
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { Count = pedidos.Count });
    }

    [HttpDelete("delete-all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAll()
    {
        SetAuditUserId();

        var pedidos = await _context.Pedidos.ToListAsync();

        _context.Pedidos.RemoveRange(pedidos);
        await _context.SaveChangesAsync();

        return Ok(new { Count = pedidos.Count });
    }

    [HttpPost("excel")]
    [Authorize(Roles = "Admin,Editor")]
    [EnableRateLimiting("ExcelLimiter")]
    [Obsolete("Use /api/pedidos/excel-preview and /api/pedidos/excel-confirm for pre-validated import.")]
    public async Task<IActionResult> UploadExcel(IFormFile file)
    {
        _logger.LogInformation("Deprecado UploadExcel llamado. Redirigiendo a PreviewExcel...");
        return await PreviewExcel(file);
    }

    [HttpPost("excel-preview")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> PreviewExcel(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("No se proporcionó ningún archivo.");
        if (file.Length > 10 * 1024 * 1024) return BadRequest("El archivo excede el límite de 10 MB.");

        using (var stream = file.OpenReadStream())
        {
            var buffer = new byte[4];
            var bytesRead = await stream.ReadAsync(buffer, 0, 4);
            if (bytesRead < 4 || BitConverter.ToString(buffer).Replace("-", "") != "504B0304")
            {
                return BadRequest("Solo se admiten archivos de Excel (.xlsx) válidos.");
            }
        }

        var parsedItems = new List<object>();
        var detectedCodigos = new HashSet<string>();
        int warningsCount = 0;
        int rowNumber = 1;

        using (var memStream = new MemoryStream())
        {
            await file.CopyToAsync(memStream);
            using (var workbook = new XLWorkbook(memStream))
            {
                var worksheet = workbook.Worksheets.FirstOrDefault();
                if (worksheet == null) return BadRequest("El archivo Excel no tiene hojas.");

                var rows = worksheet.RangeUsed()?.RowsUsed().Skip(1);
                if (rows == null) return BadRequest("El archivo Excel está vacío.");

                foreach (var row in rows)
                {
                    rowNumber++;
                    var col1 = row.Cell(ExcelColumns.Codigo).GetString().Trim();
                    var desc = System.Net.WebUtility.HtmlEncode(row.Cell(ExcelColumns.Descripcion).GetString().Trim());
                    var qty = SafeGetInt(row.Cell(ExcelColumns.TotalQty));
                    var yuanes = SafeGetDecimal(row.Cell(ExcelColumns.Yuanes));
                    var tasa = SafeGetDecimal(row.Cell(ExcelColumns.Tasa));
                    var ciudad = System.Net.WebUtility.HtmlEncode(row.Cell(ExcelColumns.Ciudad).GetString().Trim());

                    // Skip empty note / total footer rows
                    if (string.IsNullOrEmpty(desc) && qty <= 0 && yuanes <= 0) continue;

                    var cod = System.Net.WebUtility.HtmlEncode(col1);
                    if (!string.IsNullOrEmpty(cod)) detectedCodigos.Add(cod);

                    var warnings = new List<string>();
                    if (string.IsNullOrEmpty(desc)) warnings.Add("Falta desc. (Auto: Mercancía)");
                    if (qty <= 0) warnings.Add("Falta cantidad (Auto: 1 pza)");
                    if (tasa <= 0) warnings.Add("Falta tasa (Auto: $535)");
                    if (string.IsNullOrEmpty(ciudad)) warnings.Add("Falta ciudad (Auto: GZ)");

                    if (warnings.Count > 0) warningsCount++;

                    parsedItems.Add(new
                    {
                        RowIndex = rowNumber,
                        Codigo = cod,
                        Ciudad = string.IsNullOrEmpty(ciudad) ? "GZ" : ciudad,
                        Fecha = SafeGetDate(row.Cell(ExcelColumns.Fecha)).ToString("yyyy-MM-dd"),
                        Descripcion = string.IsNullOrEmpty(desc) ? "Mercancía General / Sin Nombre" : ToTitleCase(desc),
                        Observaciones = System.Net.WebUtility.HtmlEncode(row.Cell(ExcelColumns.Observaciones).GetString().Trim()),
                        Referencia = System.Net.WebUtility.HtmlEncode(row.Cell(ExcelColumns.Referencia).GetString().Trim()),
                        TotalQty = qty > 0 ? qty : 1,
                        Yuanes = yuanes,
                        PiezasCaja = SafeGetInt(row.Cell(ExcelColumns.PiezasCaja)),
                        Tasa = tasa > 0 ? tasa : 535,
                        Cubica = SafeGetDecimal(row.Cell(ExcelColumns.Cubica)),
                        PrecioMt3 = SafeGetDecimal(row.Cell(ExcelColumns.PrecioMt3)),
                        PorcentajeEhuk = SafeGetPercent(row.Cell(ExcelColumns.PorcentajeEhuk)),
                        Warnings = warnings
                    });
                }
            }
        }

        var detectedCodeList = detectedCodigos.ToList();
        var suggestedCode = detectedCodeList.FirstOrDefault() ?? "1";

        return Ok(new
        {
            TotalRows = parsedItems.Count,
            WarningsCount = warningsCount,
            DetectedCodigos = detectedCodeList,
            SuggestedCodigo = suggestedCode,
            Items = parsedItems
        });
    }

    [HttpPost("excel-confirm")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> ConfirmExcel([FromBody] ConfirmExcelRequest request)
    {
        if (request?.Items == null || request.Items.Count == 0)
        {
            return BadRequest("No se enviaron ítems para confirmar.");
        }

        SetAuditUserId();
        var nuevosPedidos = new List<Pedido>();
        var batchCode = string.IsNullOrWhiteSpace(request.OverrideCodigo) 
            ? null 
            : System.Net.WebUtility.HtmlEncode(request.OverrideCodigo.Trim());

        foreach (var dto in request.Items)
        {
            var p = new Pedido
            {
                Codigo = batchCode ?? System.Net.WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(dto.Codigo) ? "1" : dto.Codigo.Trim()),
                Ciudad = string.IsNullOrWhiteSpace(dto.Ciudad) ? "GZ" : System.Net.WebUtility.HtmlEncode(dto.Ciudad.Trim()),
                FechaNegociacion = DateTime.TryParse(dto.Fecha, out var d) ? d : DateTime.Now,
                Descripcion = string.IsNullOrWhiteSpace(dto.Descripcion) ? "Mercancía General / Sin Nombre" : ToTitleCase(System.Net.WebUtility.HtmlEncode(dto.Descripcion.Trim())),
                Observaciones = System.Net.WebUtility.HtmlEncode(dto.Observaciones ?? ""),
                Referencia = System.Net.WebUtility.HtmlEncode(dto.Referencia ?? ""),
                TotalQty = dto.TotalQty > 0 ? dto.TotalQty : 1,
                Yuanes = dto.Yuanes,
                PiezasCaja = dto.PiezasCaja > 0 ? dto.PiezasCaja : 1,
                Tasa = dto.Tasa > 0 ? dto.Tasa : 535,
                Cubica = dto.Cubica,
                PrecioMt3 = dto.PrecioMt3,
                PorcentajeEhuk = dto.PorcentajeEhuk > 0 ? dto.PorcentajeEhuk : 0.12m,
                Etapa = 0
            };
            nuevosPedidos.Add(p);
        }

        _context.Pedidos.AddRange(nuevosPedidos);
        await _context.SaveChangesAsync();

        return Ok(new { Status = "Success", Count = nuevosPedidos.Count, Codigo = batchCode });
    }

    private string ToTitleCase(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        var decoded = System.Net.WebUtility.HtmlDecode(input.Trim());
        var culture = new System.Globalization.CultureInfo("es-CO");
        return culture.TextInfo.ToTitleCase(decoded.ToLower(culture));
    }

    private int SafeGetInt(IXLCell cell)
    {
        if (cell.DataType == XLDataType.Number)
        {
            return (int)cell.GetDouble();
        }
        var str = cell.GetString().Trim();
        if (string.IsNullOrEmpty(str)) return 0;
        
        str = str.Replace("$", "").Replace("¥", "").Replace("￥", "").Replace("%", "").Replace(" ", "").Replace(".", "").Replace(",", "").Trim();
        if (double.TryParse(str, out var d)) return (int)d;
        return 0;
    }

    private decimal SafeGetDecimal(IXLCell cell)
    {
        if (cell.DataType == XLDataType.Number)
        {
            return (decimal)cell.GetDouble();
        }
        var str = cell.GetString().Trim();
        if (string.IsNullOrEmpty(str)) return 0m;

        str = str.Replace("$", "").Replace("¥", "").Replace("￥", "").Replace(" ", "").Trim();

        if (decimal.TryParse(str, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.CurrentCulture, out var dec))
            return dec;

        // Try parsing after removing thousand separator dots or commas
        var strCleaned = str.Replace(".", ""); // Try removing dot thousand separator
        if (decimal.TryParse(strCleaned, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.CurrentCulture, out var decCleaned))
            return decCleaned;

        strCleaned = str.Replace(",", ""); // Try removing comma thousand separator
        if (decimal.TryParse(strCleaned, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.CurrentCulture, out var decCleaned2))
            return decCleaned2;

        return 0m;
    }

    private decimal SafeGetPercent(IXLCell cell)
    {
        if (cell.DataType == XLDataType.Number)
        {
            var val = (decimal)cell.GetDouble();
            // If Excel formatted as percentage, a cell with "10%" holds 0.10
            return val;
        }
        var str = cell.GetString().Trim();
        if (string.IsNullOrEmpty(str)) return 0m;

        bool hasPercentSign = str.Contains("%");
        str = str.Replace("%", "").Replace(" ", "").Trim();

        if (decimal.TryParse(str, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var dec))
        {
            return hasPercentSign ? dec / 100m : dec;
        }
        return 0m;
    }

    private DateTime SafeGetDate(IXLCell cell)
    {
        if (cell.DataType == XLDataType.DateTime)
        {
            return cell.GetDateTime();
        }
        if (cell.DataType == XLDataType.Number)
        {
            var val = cell.GetDouble();
            return DateTime.FromOADate(val);
        }
        var str = cell.GetString().Trim();
        if (DateTime.TryParse(str, out var dt))
        {
            return dt;
        }
        if (DateTime.TryParse(str, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var dtInv))
        {
            return dtInv;
        }
        return DateTime.UtcNow;
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

    private static bool IsValidImageMagicBytes(byte[] buffer)
    {
        if (buffer.Length < 4) return false;

        // JPEG: FF D8 FF
        if (buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF) return true;

        // PNG: 89 50 4E 47
        if (buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47) return true;

        // GIF: 47 49 46 38 ('GIF8')
        if (buffer[0] == 0x47 && buffer[1] == 0x49 && buffer[2] == 0x46 && buffer[3] == 0x38) return true;

        // WEBP: 52 49 46 46 ('RIFF')
        if (buffer[0] == 0x52 && buffer[1] == 0x49 && buffer[2] == 0x46 && buffer[3] == 0x46) return true;

        return false;
    }

    [HttpPost("{id}/upload-image")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> UploadImage(int id, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("El archivo de imagen está vacío.");

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest("La imagen excede el tamaño límite de 5 MB.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExts = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        if (!allowedExts.Contains(ext))
            return BadRequest("Formato no permitido. Solo se admiten archivos de imagen (.jpg, .jpeg, .png, .webp, .gif).");

        using (var stream = file.OpenReadStream())
        {
            var header = new byte[8];
            var bytesRead = await stream.ReadAsync(header, 0, 8);
            if (bytesRead < 4 || !IsValidImageMagicBytes(header))
            {
                return BadRequest("El archivo subido no es una imagen válida o está dañado.");
            }
        }

        var pedido = await _context.Pedidos.FindAsync(id);
        if (pedido == null) return NotFound("Pedido no encontrado.");

        SetAuditUserId();

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(fileStream);
        }

        pedido.FotoUrl = $"/images/{uniqueFileName}";
        _context.Entry(pedido).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return Ok(new { FotoUrl = pedido.FotoUrl });
    }

    private bool PedidoExists(int id)
    {
        return _context.Pedidos.Any(e => e.Id == id);
    }
}

public class DeleteBatchRequest
{
    public List<int> Ids { get; set; } = new();
}

public class UpdateBatchRequest
{
    public List<int> Ids { get; set; } = new();
    public decimal? Tasa { get; set; }
    public int? Etapa { get; set; }
    public string? Ciudad { get; set; }
    public bool? Abono { get; set; }
    public string? Codigo { get; set; }
}

public class ConfirmExcelRequest
{
    public string? OverrideCodigo { get; set; }
    public List<ConfirmExcelItemDto> Items { get; set; } = new();
}

public class ConfirmExcelItemDto
{
    public string? Codigo { get; set; }
    public string? Ciudad { get; set; }
    public string? Fecha { get; set; }
    public string? Descripcion { get; set; }
    public string? Observaciones { get; set; }
    public string? Referencia { get; set; }

    [System.ComponentModel.DataAnnotations.Range(0, 10000000, ErrorMessage = "La cantidad total debe ser un número positivo.")]
    public int TotalQty { get; set; }

    [System.ComponentModel.DataAnnotations.Range(0, 1000000000, ErrorMessage = "Los yuanes deben ser un número positivo.")]
    public decimal Yuanes { get; set; }

    [System.ComponentModel.DataAnnotations.Range(0, 1000000)]
    public int PiezasCaja { get; set; }

    [System.ComponentModel.DataAnnotations.Range(0, 1000000, ErrorMessage = "La tasa debe ser un número positivo.")]
    public decimal Tasa { get; set; }

    [System.ComponentModel.DataAnnotations.Range(0, 1000000)]
    public decimal Cubica { get; set; }

    [System.ComponentModel.DataAnnotations.Range(0, 100000000)]
    public decimal PrecioMt3 { get; set; }

    [System.ComponentModel.DataAnnotations.Range(0, 1.0)]
    public decimal PorcentajeEhuk { get; set; } = Pedido.DEFAULT_EHUK_PERCENT;
}
