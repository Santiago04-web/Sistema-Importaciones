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
        
        var headerRow = worksheet.Row(1);
        int colPedido = 1, colCiudad = 2, colFecha = 3, colAbono = 4;
        int colDesc = 5, colObs = 6, colRef = 7, colQty = 8;
        int colYuanes = 9, colPiezasCaja = 10, colCubica = 11, colTasa = 12;
        int colPrecioMt3 = 16, colEhuk = 26;

        // Auto-detect header columns dynamically (loop up to 35)
        for (int c = 1; c <= 35; c++)
        {
            var headerText = GetCellValueAsString(headerRow.Cell(c)).ToUpperInvariant();
            if (string.IsNullOrEmpty(headerText)) continue;

            if (headerText.Contains("PEDIDO")) colPedido = c;
            else if (headerText.Contains("CIUDAD")) colCiudad = c;
            else if (headerText.Contains("FECHA")) colFecha = c;
            else if (headerText.Contains("ABONO")) colAbono = c;
            else if (headerText.Contains("DESCRIPCION") || headerText.Contains("品名")) colDesc = c;
            else if (headerText.Contains("OBSERVACION") || headerText.Contains("要求")) colObs = c;
            else if (headerText.Contains("REFERENCIA")) colRef = c;
            else if (headerText.Contains("QTY") || headerText.Contains("CANTIDAD") || headerText.Contains("总数量")) colQty = c;
            else if (headerText.Contains("YUAN")) colYuanes = c;
            else if (headerText.Contains("PIEZAS") || headerText.Contains("CAJA")) colPiezasCaja = c;
            else if (headerText.Contains("CUBICA")) colCubica = c;
            else if (headerText.Contains("TASA")) colTasa = c;
            else if (headerText.Contains("PRECIO MT") || headerText.Contains("PRECIO M3")) colPrecioMt3 = c;
            else if (headerText.Contains("EHUK") || headerText.Contains("%EHUK")) colEhuk = c;
        }

        var rows = worksheet.RangeUsed().RowsUsed().Skip(1); // Skip header row

        foreach (var row in rows)
        {
            var rawPedido = GetCellValueAsString(row.Cell(colPedido));
            if (string.IsNullOrWhiteSpace(rawPedido) || 
                rawPedido.Equals("TOTAL", StringComparison.OrdinalIgnoreCase) ||
                rawPedido.Equals("TOTALES", StringComparison.OrdinalIgnoreCase) ||
                rawPedido.Equals("NOTAS", StringComparison.OrdinalIgnoreCase) ||
                rawPedido.StartsWith("NOTA", StringComparison.OrdinalIgnoreCase) ||
                rawPedido.StartsWith("El rojo", StringComparison.OrdinalIgnoreCase) ||
                rawPedido.StartsWith("Morado", StringComparison.OrdinalIgnoreCase))
            {
                continue; // Skip empty rows, notes, and totals
            }

            var ciudad = GetCellValueAsString(row.Cell(colCiudad));
            if (string.IsNullOrWhiteSpace(ciudad)) ciudad = "GZ";

            DateTime fechaNegociacion = DateTime.UtcNow;
            var cellFecha = row.Cell(colFecha);
            if (cellFecha.DataType == XLDataType.DateTime)
            {
                fechaNegociacion = cellFecha.GetDateTime();
            }
            else if (DateTime.TryParse(GetCellValueAsString(cellFecha), out var parsedDate))
            {
                fechaNegociacion = parsedDate;
            }

            var abonoStr = GetCellValueAsString(row.Cell(colAbono)).ToLower();
            bool abono = abonoStr == "si" || abonoStr == "sí" || abonoStr == "yes" || abonoStr == "true" || abonoStr == "1";

            var descripcion = GetCellValueAsString(row.Cell(colDesc));
            var observaciones = GetCellValueAsString(row.Cell(colObs));
            var referencia = GetCellValueAsString(row.Cell(colRef));

            int totalQty = (int)GetCellValueAsDouble(row.Cell(colQty));
            decimal yuanes = (decimal)GetCellValueAsDouble(row.Cell(colYuanes));
            int piezasCaja = (int)GetCellValueAsDouble(row.Cell(colPiezasCaja));
            decimal cubica = (decimal)GetCellValueAsDouble(row.Cell(colCubica));
            decimal tasa = (decimal)GetCellValueAsDouble(row.Cell(colTasa));

            if (totalQty <= 0 && yuanes <= 0) continue; // Skip invalid rows

            if (piezasCaja <= 0) piezasCaja = 1;
            if (tasa <= 0) tasa = 535m;

            // Dynamically read precioMt3 per row if present
            decimal precioMt3 = 2300000m;
            if (colPrecioMt3 > 0)
            {
                var valP = (decimal)GetCellValueAsDouble(row.Cell(colPrecioMt3));
                if (valP > 0)
                {
                    precioMt3 = valP;
                }
            }

            // Dynamically read %Ehuk per row if present
            decimal porcentajeEhuk = _defaultEhukPercent;
            if (colEhuk > 0)
            {
                var cellEhuk = row.Cell(colEhuk);
                if (!cellEhuk.IsEmpty())
                {
                    string ehukStr = GetCellValueAsString(cellEhuk).Trim();
                    if (!string.IsNullOrEmpty(ehukStr))
                    {
                        if (ehukStr.Contains("%"))
                        {
                            ehukStr = ehukStr.Replace("%", "").Trim();
                            if (decimal.TryParse(ehukStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var p1))
                            {
                                porcentajeEhuk = p1 / 100m;
                            }
                            else if (decimal.TryParse(ehukStr, System.Globalization.NumberStyles.Any, new System.Globalization.CultureInfo("es-CO"), out var p2))
                            {
                                porcentajeEhuk = p2 / 100m;
                            }
                        }
                        else
                        {
                            double dVal = GetCellValueAsDouble(cellEhuk);
                            if (dVal > 0)
                            {
                                porcentajeEhuk = dVal > 1.0 ? (decimal)(dVal / 100.0) : (decimal)dVal;
                            }
                        }
                    }
                }
            }

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
                PrecioMt3 = precioMt3,
                PorcentajeEhuk = porcentajeEhuk,
                Etapa = EtapaPedido.Cotizacion
            };

            pedidos.Add(pedido);
        }

        return pedidos;
    }

    private string GetCellValueAsString(IXLCell cell)
    {
        if (cell == null || cell.IsEmpty()) return string.Empty;
        if (cell.DataType == XLDataType.Text) return cell.GetString().Trim();
        if (cell.DataType == XLDataType.Number) return cell.GetDouble().ToString(System.Globalization.CultureInfo.InvariantCulture).Trim();
        if (cell.DataType == XLDataType.Boolean) return cell.GetBoolean() ? "true" : "false";
        if (cell.DataType == XLDataType.DateTime) return cell.GetDateTime().ToString("yyyy-MM-dd");
        return cell.Value.ToString()?.Trim() ?? string.Empty;
    }

    private double GetCellValueAsDouble(IXLCell cell)
    {
        if (cell == null || cell.IsEmpty()) return 0;
        if (cell.DataType == XLDataType.Number) return cell.GetDouble();
        var str = cell.GetString().Trim().Replace("$", "").Replace(",", "").Replace(" ", "");
        if (double.TryParse(str, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var d)) return d;
        if (double.TryParse(str, System.Globalization.NumberStyles.Any, new System.Globalization.CultureInfo("es-CO"), out var d2)) return d2;
        return 0;
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
