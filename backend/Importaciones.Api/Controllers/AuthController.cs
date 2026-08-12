using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.RateLimiting;
using Importaciones.Api.Data;
using Importaciones.Api.Models;

namespace Importaciones.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ImportacionesDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(
        UserManager<IdentityUser> userManager,
        RoleManager<IdentityRole> roleManager,
        ImportacionesDbContext context,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("register")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Register([FromBody] RegisterDto model)
    {
        var userExists = await _userManager.FindByNameAsync(model.Username);
        if (userExists != null)
            return Conflict(new { Status = "Error", Message = "El nombre de usuario ya existe en el sistema." });

        IdentityUser user = new()
        {
            Email = model.Email,
            SecurityStamp = Guid.NewGuid().ToString(),
            UserName = model.Username
        };
        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return BadRequest(new { Status = "Error", Message = $"No se pudo crear el usuario: {errors}" });
        }

        if (!await _roleManager.RoleExistsAsync(model.Role))
        {
            model.Role = "Viewer"; // Fallback to viewer
        }
        await _userManager.AddToRoleAsync(user, model.Role);

        return Ok(new { Status = "Success", Message = "User created successfully!" });
    }

    [HttpPost("login")]
    [EnableRateLimiting("LoginLimiter")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        // Accept username OR email in the username field
        var user = await _userManager.FindByNameAsync(model.Username)
                   ?? await _userManager.FindByEmailAsync(model.Username);

        if (user != null && await _userManager.IsLockedOutAsync(user))
        {
            return StatusCode(StatusCodes.Status423Locked, new { Status = "Error", Message = "Tu cuenta está bloqueada temporalmente por exceso de intentos fallidos. Intenta de nuevo en 15 minutos." });
        }

        if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
        {
            // Reset lockout counters on successful authentication
            await _userManager.ResetAccessFailedCountAsync(user);

            var userRoles = await _userManager.GetRolesAsync(user);

            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName!),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            foreach (var userRole in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, userRole));
            }

            var accessToken = GenerateAccessToken(authClaims);
            var refreshTokenString = GenerateSecureRandomToken();

            // Store refresh token in database (7 days lifetime)
            var refreshTokenModel = new UserRefreshToken
            {
                UserId = user.Id,
                Token = refreshTokenString,
                ExpiryTime = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            };
            _context.UserRefreshTokens.Add(refreshTokenModel);
            await _context.SaveChangesAsync();

            // Set refresh token in HttpOnly Cookie
            SetRefreshTokenCookie(refreshTokenString);

            return Ok(new
            {
                token = accessToken,
                roles = userRoles,
                username = user.UserName
            });
        }

        // Track failed access attempt
        if (user != null)
        {
            await _userManager.AccessFailedAsync(user);
        }

        return Unauthorized(new { Status = "Error", Message = "Credenciales inválidas o cuenta inexistente." });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        if (!Request.Cookies.TryGetValue("refreshToken", out var tokenValue) || string.IsNullOrEmpty(tokenValue))
        {
            return BadRequest(new { Message = "No refresh token provided." });
        }

        var dbToken = await _context.UserRefreshTokens
            .FirstOrDefaultAsync(t => t.Token == tokenValue && !t.IsRevoked);

        if (dbToken == null || dbToken.ExpiryTime < DateTime.UtcNow)
        {
            return Unauthorized(new { Message = "Invalid or expired refresh token." });
        }

        var user = await _userManager.FindByIdAsync(dbToken.UserId);
        if (user == null) return Unauthorized();

        // ROTATION: Revoke old refresh token, generate new one
        dbToken.IsRevoked = true;
        _context.Entry(dbToken).State = EntityState.Modified;

        var newRefreshTokenString = GenerateSecureRandomToken();
        var newRefreshTokenModel = new UserRefreshToken
        {
            UserId = user.Id,
            Token = newRefreshTokenString,
            ExpiryTime = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };
        _context.UserRefreshTokens.Add(newRefreshTokenModel);
        await _context.SaveChangesAsync();

        SetRefreshTokenCookie(newRefreshTokenString);

        // Generate new short-lived Access Token
        var userRoles = await _userManager.GetRolesAsync(user);
        var authClaims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.UserName!),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };
        foreach (var userRole in userRoles)
        {
            authClaims.Add(new Claim(ClaimTypes.Role, userRole));
        }

        var newAccessToken = GenerateAccessToken(authClaims);

        return Ok(new { token = newAccessToken });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        if (Request.Cookies.TryGetValue("refreshToken", out var tokenValue))
        {
            var dbToken = await _context.UserRefreshTokens
                .FirstOrDefaultAsync(t => t.Token == tokenValue);
            if (dbToken != null)
            {
                dbToken.IsRevoked = true;
                await _context.SaveChangesAsync();
            }
        }

        // Expire the client cookie
        Response.Cookies.Delete("refreshToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Force HTTPS
            SameSite = SameSiteMode.Strict
        });

        return Ok(new { Message = "Logout successful." });
    }

    private string GenerateAccessToken(List<Claim> authClaims)
    {
        var jwtKey = _configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new InvalidOperationException("La clave secreta 'Jwt:Key' no está configurada.");
        }

        var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            expires: DateTime.UtcNow.AddMinutes(15), // Short access token lifetime (15 mins)
            claims: authClaims,
            signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateSecureRandomToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private void SetRefreshTokenCookie(string token)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,   // Block XSS access to tokens
            Secure = true,     // Require HTTPS
            SameSite = SameSiteMode.Strict, // Mitigate CSRF
            Expires = DateTime.UtcNow.AddDays(7)
        };

        // If local development, loosen secure requirements to allow plain http testing
        var isDev = _configuration["Environment"] == "Development" || _configuration["ASPNETCORE_ENVIRONMENT"] == "Development";
        if (isDev)
        {
            cookieOptions.Secure = false;
            cookieOptions.SameSite = SameSiteMode.Lax;
        }

        Response.Cookies.Append("refreshToken", token, cookieOptions);
    }
}

public class RegisterDto
{
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string Role { get; set; } = "Viewer"; // Admin, Editor, Viewer
}

public class LoginDto
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
}
