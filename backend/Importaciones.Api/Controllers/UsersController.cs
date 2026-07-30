using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Importaciones.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public UsersController(UserManager<IdentityUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    /// <summary>
    /// List all users with their roles. Admin only.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userManager.Users.ToListAsync();
        var result = new List<object>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            result.Add(new
            {
                id = user.Id,
                username = user.UserName,
                email = user.Email,
                roles = roles,
                lockoutEnd = user.LockoutEnd,
                isLockedOut = user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow
            });
        }

        return Ok(result);
    }

    /// <summary>
    /// Create a new user. Admin only.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto model)
    {
        if (string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.Password))
            return BadRequest(new { message = "El correo y la contraseña son obligatorios." });

        // Use the provided Nombre as username, fallback to email prefix
        var username = !string.IsNullOrWhiteSpace(model.Nombre)
            ? model.Nombre.Trim()
            : model.Email.Split('@')[0];

        // Check if user already exists by email
        var existingUser = await _userManager.FindByEmailAsync(model.Email);
        if (existingUser != null)
            return BadRequest(new { message = "Ya existe un usuario con ese correo." });

        // Check if username is already taken
        var existingUsername = await _userManager.FindByNameAsync(username);
        if (existingUsername != null)
            return BadRequest(new { message = $"El nombre '{username}' ya está en uso. Elegí otro." });

        var user = new IdentityUser
        {
            UserName = username,
            Email = model.Email,
            SecurityStamp = Guid.NewGuid().ToString()
        };

        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return BadRequest(new { message = $"Error al crear usuario: {errors}" });
        }

        // Assign role
        var role = model.Role ?? "Viewer";
        if (!await _roleManager.RoleExistsAsync(role))
            role = "Viewer";

        await _userManager.AddToRoleAsync(user, role);

        return Ok(new
        {
            id = user.Id,
            username = user.UserName,
            email = user.Email,
            role = role,
            message = "Usuario creado exitosamente."
        });
    }

    /// <summary>
    /// Update user name, email, role or password. Admin only.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto model)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound(new { message = "Usuario no encontrado." });

        // Update display name (username) if provided and changed
        if (!string.IsNullOrWhiteSpace(model.Nombre) && model.Nombre.Trim() != user.UserName)
        {
            var existing = await _userManager.FindByNameAsync(model.Nombre.Trim());
            if (existing != null && existing.Id != id)
                return BadRequest(new { message = $"El nombre '{model.Nombre}' ya está en uso." });

            user.UserName = model.Nombre.Trim();
            user.NormalizedUserName = model.Nombre.Trim().ToUpperInvariant();
        }

        // Update email if provided and changed
        if (!string.IsNullOrWhiteSpace(model.Email) && model.Email.Trim() != user.Email)
        {
            var existing = await _userManager.FindByEmailAsync(model.Email.Trim());
            if (existing != null && existing.Id != id)
                return BadRequest(new { message = $"El correo '{model.Email}' ya está en uso." });

            user.Email = model.Email.Trim();
            user.NormalizedEmail = model.Email.Trim().ToUpperInvariant();
        }

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
            return BadRequest(new { message = $"Error al actualizar: {errors}" });
        }

        // Update role if provided
        if (!string.IsNullOrWhiteSpace(model.Role))
        {
            var currentRoles = await _userManager.GetRolesAsync(user);
            if (!currentRoles.Contains(model.Role))
            {
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (await _roleManager.RoleExistsAsync(model.Role))
                    await _userManager.AddToRoleAsync(user, model.Role);
            }
        }

        // Change password if provided
        if (!string.IsNullOrWhiteSpace(model.NewPassword))
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var pwResult = await _userManager.ResetPasswordAsync(user, token, model.NewPassword);
            if (!pwResult.Succeeded)
            {
                var errors = string.Join(", ", pwResult.Errors.Select(e => e.Description));
                return BadRequest(new { message = $"Error al cambiar contraseña: {errors}" });
            }
        }

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new { id = user.Id, username = user.UserName, email = user.Email, roles, message = "Usuario actualizado." });
    }

    /// <summary>
    /// Delete a user by ID. Admin only.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound(new { message = "Usuario no encontrado." });

        // Prevent deleting yourself
        var currentUsername = User.Identity?.Name;
        if (user.UserName == currentUsername)
            return BadRequest(new { message = "No podés eliminar tu propia cuenta." });

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { message = "Error al eliminar el usuario." });

        return Ok(new { message = "Usuario eliminado." });
    }

    /// <summary>
    /// Unlock a locked-out user. Admin only.
    /// </summary>
    [HttpPost("{id}/unlock")]
    public async Task<IActionResult> UnlockUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound(new { message = "Usuario no encontrado." });

        await _userManager.SetLockoutEndDateAsync(user, null);
        await _userManager.ResetAccessFailedCountAsync(user);

        return Ok(new { message = "Usuario desbloqueado." });
    }
}

public class CreateUserDto
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string? Role { get; set; } = "Viewer";
    /// <summary>Optional display name used as the login username. Defaults to the email prefix.</summary>
    public string? Nombre { get; set; }
}

public class UpdateUserDto
{
    /// <summary>New display name / username. Leave empty to keep existing.</summary>
    public string? Nombre { get; set; }
    /// <summary>New email address. Leave empty to keep existing.</summary>
    public string? Email { get; set; }
    /// <summary>New role (Admin / Editor / Viewer). Leave empty to keep existing.</summary>
    public string? Role { get; set; }
    /// <summary>New password. Leave empty to keep existing password.</summary>
    public string? NewPassword { get; set; }
}
