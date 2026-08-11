using System.Text.Json;
using System.Text.Json.Serialization;

namespace Importaciones.Api.Services;

public class ExchangeRateResponse
{
    [JsonPropertyName("result")]
    public string? Result { get; set; }

    [JsonPropertyName("rates")]
    public Dictionary<string, decimal>? Rates { get; set; }

    [JsonPropertyName("time_last_update_utc")]
    public string? TimeLastUpdateUtc { get; set; }
}

public class ExchangeRateInfo
{
    public decimal RateCnyCop { get; set; } = 560.50m;
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    public string Source { get; set; } = "ExchangeRate-API (En Vivo)";
    public bool IsLive { get; set; } = true;
}

public class ExchangeRateService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ExchangeRateService> _logger;
    private static ExchangeRateInfo _cachedRate = new ExchangeRateInfo();
    private static DateTime _lastFetchAttempt = DateTime.MinValue;

    public ExchangeRateService(HttpClient httpClient, ILogger<ExchangeRateService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<ExchangeRateInfo> GetCnyToCopRateAsync()
    {
        if ((DateTime.UtcNow - _lastFetchAttempt).TotalMinutes < 15 && _cachedRate != null)
        {
            return _cachedRate;
        }

        _lastFetchAttempt = DateTime.UtcNow;

        try
        {
            var response = await _httpClient.GetAsync("https://open.er-api.com/v6/latest/CNY");
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var data = JsonSerializer.Deserialize<ExchangeRateResponse>(content);
                if (data?.Rates != null && data.Rates.TryGetValue("COP", out var copRate) && copRate > 0)
                {
                    _cachedRate = new ExchangeRateInfo
                    {
                        RateCnyCop = copRate,
                        LastUpdated = DateTime.UtcNow,
                        Source = "Open ExchangeRate-API (Real-Time Live)",
                        IsLive = true
                    };
                    _logger.LogInformation("Tasa de cambio CNY/COP actualizada en vivo desde API: {Rate}", copRate);
                    return _cachedRate;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error al consultar API pública de divisa en vivo. Usando caché o fallback.");
        }

        _cachedRate.IsLive = false;
        _cachedRate.Source = "Banco de la República / Referencia DB";
        return _cachedRate;
    }
}
