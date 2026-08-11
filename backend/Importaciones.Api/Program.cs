using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Importaciones.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddDbContext<ImportacionesDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("ImportacionesDb")));

// Configure Identity with Strong Password & Lockout Policies
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    // Enterprise password policies
    options.Password.RequiredLength = 12;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false; // symbols not strictly required to allow user's password

    // Account lockout policy
    options.Lockout.AllowedForNewUsers = true;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
})
.AddEntityFrameworkStores<ImportacionesDbContext>()
.AddDefaultTokenProviders();

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException("La clave secreta 'Jwt:Key' no está configurada en appsettings.json o variables de entorno.");
}

builder.Services.Configure<Importaciones.Api.Services.ImportacionesConfig>(builder.Configuration.GetSection("ImportacionesConfig"));
builder.Services.AddHttpClient<Importaciones.Api.Services.ExchangeRateService>();
builder.Services.AddScoped<Importaciones.Api.Services.ExcelService>();
builder.Services.AddScoped<Importaciones.Api.Services.ImagenService>();
builder.Services.AddScoped<Importaciones.Api.Services.DocumentoService>();
builder.Services.AddSignalR();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero // Strict lifetime validation
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Configure Rate Limiting Middleware
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    
    // Login endpoints: 5 attempts per minute
    options.AddPolicy("LoginLimiter", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? httpContext.Request.Headers.Host.ToString(),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 5,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            }));

    // Critical endpoints (e.g. Upload Excel): 10 requests per minute
    options.AddPolicy("ExcelLimiter", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? httpContext.Request.Headers.Host.ToString(),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 10,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            }));
});

// Restrictive CORS configured for credentials (cookies)
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                     ?? new[] { "http://localhost:4200" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // REQUIRED for HttpOnly cookies
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// Seed Roles and Default Admin
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ImportacionesDbContext>();
    try
    {
        await context.Database.ExecuteSqlRawAsync(@"
            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Pedidos')
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Pedidos') AND name = 'FotoUrl')
                    ALTER TABLE Pedidos ADD FotoUrl nvarchar(max) NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Pedidos') AND name = 'RowVersion')
                    ALTER TABLE Pedidos ADD RowVersion rowversion NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Pedidos') AND name = 'Abono')
                    ALTER TABLE Pedidos ADD Abono bit NOT NULL DEFAULT 0;
            END
        ");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"===> Auto-migration schema check notice: {ex.Message}");
    }

    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
    
    var roles = new[] { "Admin", "Editor", "Viewer" };
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole(role));
        }
    }

    // Seed default Admin, Editor, and Viewer users
    var seedUsers = new[]
    {
        new { Email = "admin@logigho.com", Password = "Santiago0417#Admin", Role = "Admin" },
        new { Email = "smenendez554@gmail.com", Password = "Santiago0417#Admin", Role = "Admin" },
        new { Email = "editor@logigho.com", Password = "Santiago0417#Editor", Role = "Editor" },
        new { Email = "viewer@logigho.com", Password = "Santiago0417#Viewer", Role = "Viewer" }
    };

    foreach (var su in seedUsers)
    {
        var existingUser = await userManager.FindByEmailAsync(su.Email);
        if (existingUser == null)
        {
            var newUser = new IdentityUser { UserName = su.Email, Email = su.Email, EmailConfirmed = true };
            var res = await userManager.CreateAsync(newUser, su.Password);
            if (res.Succeeded)
            {
                await userManager.AddToRoleAsync(newUser, su.Role);
            }
        }
        else
        {
            var userRoles = await userManager.GetRolesAsync(existingUser);
            if (!userRoles.Contains(su.Role))
            {
                await userManager.AddToRoleAsync(existingUser, su.Role);
            }
        }
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseHsts(); // Force HTTPS using HSTS
}

app.UseHttpsRedirection();

app.UseCors("AllowAngularApp");

// Custom Middleware for HTTP Security Headers (MAX SECURITY ENFORCED)
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    context.Response.Headers.Append("Content-Security-Policy", 
        "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' http://localhost:5174 https://localhost:7200 http://localhost:5200 https://localhost:7200 http://localhost:4200 ws://localhost:5174 wss://localhost:7200;");
    await next();
});

app.UseRateLimiter(); // Enable rate limiting before authentication and route mapping
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<Importaciones.Api.Hubs.PedidosHub>("/hubs/pedidos");

app.Run();
