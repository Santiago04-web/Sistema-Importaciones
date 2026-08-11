using ClosedXML.Excel;
using Importaciones.Api.Models;
using Microsoft.Extensions.Options;

namespace Importaciones.Api.Services;

public class ImportacionesConfig
{
    public decimal DefaultEhukPercent { get; set; } = 0.12m;
}

public class ExcelService
{
    private readonly decimal _defaultEhukPercent;

    public ExcelService(IOptions<ImportacionesConfig> config)
    {
        _defaultEhukPercent = config.Value.DefaultEhukPercent > 0 ? config.Value.DefaultEhukPercent : 0.12m;
    }

    public List<Pedido> ParsePedidosExcel(Stream stream)
    {
        var pedidos = new List<Pedido>();
        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheet(1);
        var rows = worksheet.RangeUsed().RowsUsed().Skip(1); // Skip header row

        foreach (var row in rows)
        {
            var rawPedido = row.Cell(1).GetString().Trim();
            if (string.IsNullOrWhiteSpace(rawPedido) || 
                rawPedido.Equals("TOTAL", StringComparison.OrdinalIgnoreCase) ||
                rawPedido.Equals("TOTALES", StringComparison.OrdinalIgnoreCase) ||
                rawPedido.Equals("NOTAS", StringComparison.OrdinalIgnoreCase) ||
                rawPedido.StartsWith("NOTA", StringComparison.OrdinalIgnoreCase))
            {
                continue; // Skip empty rows, notes, and totals
            }

            var ciudad = row.Cell(2).GetString().Trim();
            if (string.IsNullOrWhiteSpace(ciudad)) ciudad = "Guangzhou";

            DateTime fechaNegociacion = DateTime.UtcNow;
            if (row.Cell(3).DataType == XLDataType.DateTime)
            {
                fechaNegociacion = row.Cell(3).GetDateTime();
            }
            else if (DateTime.TryParse(row.Cell(3).GetString(), out var parsedDate))
            {
                fechaNegociacion = parsedDate;
            }

            var abonoStr = row.Cell(4).GetString().Trim().ToLower();
            bool abono = abonoStr == "si" || abonoStr == "sí" || abonoStr == "yes" || abonoStr == "true" || abonoStr == "1";

            var descripcion = row.Cell(5).GetString().Trim();
            var observaciones = row.Cell(6).GetString().Trim();
            var referencia = row.Cell(7).GetString().Trim();

            int totalQty = (int)row.Cell(8).GetDouble();
            decimal yuanes = (decimal)row.Cell(9).GetDouble();
            int piezasCaja = (int)row.Cell(10).GetDouble();
            decimal cubica = (decimal)row.Cell(11).GetDouble();
            decimal tasa = (decimal)row.Cell(12).GetDouble();

            if (totalQty <= 0 && yuanes <= 0) continue; // Skip invalid rows

            var pedido = new Pedido
            {
                Codigo = rawPedido,
                Ciudad = ciudad,
                FechaNegociacion = fechaNegociacion,
                Abono = abono,
                Descripcion = descripcion,
                Observaciones = observaciones,
                Referencia = referencia,
                TotalQty = totalQty,
                Yuanes = yuanes,
                PiezasCaja = piezasCaja,
                Cubica = cubica,
                Tasa = tasa,
                PrecioMt3 = 2300000m,
                PorcentajeEhuk = _defaultEhukPercent,
                Etapa = EtapaPedido.Cotizacion
            };

            pedidos.Add(pedido);
        }

        return pedidos;
    }

    public byte[] ExportPedidosToExcel(IEnumerable<Pedido> pedidos)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Importaciones");

        // Headers
        string[] headers = new[]
        {
            "PEDIDO", "CIUDAD", "Fecha negociacion", "Abono", "DESCRIPCION", "OBSERVACIONES",
            "referencia", "Total Qty", "Yuanes", "Piezas caja", "Cubica", "Tasa",
            "Pesos", "Cajas", "Mt3", "precio mt3", "Flete", "Producto", "Producto en Yuanes",
            "Comisión 5%", "Comisión Apalanc 7%", "Total", "Pago Inicial 30%", "Saldo", "Costo Final", "%Ehuk", "Costo Venta", "ganancia", "Final Venta"
        };

        for (int c = 0; c < headers.Length; c++)
        {
            var cell = worksheet.Cell(1, c + 1);
            cell.Value = headers[c];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1e293b");
            cell.Style.Font.FontColor = XLColor.White;
        }

        int r = 2;
        foreach (var p in pedidos)
        {
            worksheet.Cell(r, 1).Value = p.Codigo;
            worksheet.Cell(r, 2).Value = p.Ciudad;
            worksheet.Cell(r, 3).Value = p.FechaNegociacion;
            worksheet.Cell(r, 4).Value = p.Abono ? "si" : "no";
            worksheet.Cell(r, 5).Value = p.Descripcion;
            worksheet.Cell(r, 6).Value = p.Observaciones;
            worksheet.Cell(r, 7).Value = p.Referencia;
            worksheet.Cell(r, 8).Value = p.TotalQty;
            worksheet.Cell(r, 9).Value = p.Yuanes;
            worksheet.Cell(r, 10).Value = p.PiezasCaja;
            worksheet.Cell(r, 11).Value = p.Cubica;
            worksheet.Cell(r, 12).Value = p.Tasa;

            // Calculated
            worksheet.Cell(r, 13).Value = p.Pesos;
            worksheet.Cell(r, 14).Value = p.Cajas;
            worksheet.Cell(r, 15).Value = p.Mt3;
            worksheet.Cell(r, 16).Value = p.PrecioMt3;
            worksheet.Cell(r, 17).Value = p.Flete;
            worksheet.Cell(r, 18).Value = p.Producto;
            worksheet.Cell(r, 19).Value = p.ProductoEnYuanes;
            worksheet.Cell(r, 20).Value = p.ComisionTrabajo;
            worksheet.Cell(r, 21).Value = p.ComisionApalancamiento;
            worksheet.Cell(r, 22).Value = p.Total;
            worksheet.Cell(r, 23).Value = p.PagoInicial;
            worksheet.Cell(r, 24).Value = p.Saldo;
            worksheet.Cell(r, 25).Value = p.CostoFinal;
            worksheet.Cell(r, 26).Value = p.PorcentajeEhuk;
            worksheet.Cell(r, 27).Value = p.CostoVenta;
            worksheet.Cell(r, 28).Value = p.Ganancia;
            worksheet.Cell(r, 29).Value = p.FinalVenta;
            r++;
        }

        worksheet.Columns().AdjustToContents();
        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }
}
