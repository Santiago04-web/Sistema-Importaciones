using System;
using System.ComponentModel.DataAnnotations;

namespace Importaciones.Api.Models;

public class UserRefreshToken
{
    [Key]
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiryTime { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime CreatedTime { get; set; } = DateTime.UtcNow;
}
