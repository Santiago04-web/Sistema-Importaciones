namespace Importaciones.Api.Services;

public class DocumentoService
{
    private readonly IWebHostEnvironment _env;

    public DocumentoService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<(string ruta, string mimeType, long tamano)> GuardarDocumentoAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("Archivo no válido.");

        if (file.Length > 20 * 1024 * 1024) // 20 MB max
            throw new InvalidOperationException("El archivo supera el tamaño máximo permitido (20MB).");

        // Validate Magic Bytes (real file signature inspection)
        using var stream = file.OpenReadStream();
        var header = new byte[8];
        await stream.ReadExactlyAsync(header);

        bool isPdf = header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46; // %PDF
        bool isPng = header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47; // PNG
        bool isJpg = header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF; // JPG
        bool isWebp = header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46; // RIFF

        if (!isPdf && !isPng && !isJpg && !isWebp)
            throw new InvalidOperationException("Firma de archivo no permitida. Solo se aceptan archivos genuinos PDF, PNG, JPG y WEBP.");

        string mimeType = isPdf ? "application/pdf" :
                         isPng ? "image/png" :
                         isJpg ? "image/jpeg" : "image/webp";

        var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "documentos");
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var outputStream = new FileStream(filePath, FileMode.Create))
        {
            file.CopyTo(outputStream);
        }

        return ($"/documentos/{uniqueFileName}", mimeType, file.Length);
    }
}
