using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

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

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        var bytes = ms.ToArray();
        var base64 = Convert.ToBase64String(bytes);
        
        return $"data:{file.ContentType};base64,{base64}";
    }
}
