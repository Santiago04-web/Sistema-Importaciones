using ClosedXML.Excel;
using System;
using System.IO;
using System.Linq;

try
{
    var filePath = @"C:\Users\Logi\Downloads\pedidos china.xlsx";
    Console.WriteLine($"Loading file: {filePath}");
    
    using (var stream = File.OpenRead(filePath))
    using (var workbook = new XLWorkbook(stream))
    {
        var worksheet = workbook.Worksheets.FirstOrDefault();
        if (worksheet == null) 
        {
            Console.WriteLine("No worksheets found!");
            return;
        }

        var range = worksheet.RangeUsed();
        if (range == null)
        {
            Console.WriteLine("Empty sheet!");
            return;
        }

        var headerRow = range.RowsUsed().FirstOrDefault();
        if (headerRow != null)
        {
            Console.WriteLine("HEADERS:");
            for (int col = 1; col <= headerRow.CellCount(); col++)
            {
                Console.WriteLine($"Col {col}: {headerRow.Cell(col).GetString()}");
            }
        }

        Console.WriteLine("\nFIRST 3 DATA ROWS:");
        var dataRows = range.RowsUsed().Skip(1).Take(3);
        foreach (var row in dataRows)
        {
            Console.WriteLine($"\n--- Row {row.RowNumber()} ---");
            for (int col = 1; col <= row.CellCount(); col++)
            {
                Console.WriteLine($"Col {col}: {row.Cell(col).GetString()}");
            }
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"ERROR: {ex.Message}");
}
