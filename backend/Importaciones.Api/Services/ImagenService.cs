namespace Importaciones.Api.Services;

public class ImagenService
{
    private readonly IWebHostEnvironment _env;

    public ImagenService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> GuardarImagenAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("Archivo de imagen no válido.");

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLower();

        if (!allowedExtensions.Contains(ext))
            throw new InvalidOperationException("Solo se permiten imágenes (.jpg, .jpeg, .png, .webp).");

        var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "images");
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return $"/images/{uniqueFileName}";
    }
}
