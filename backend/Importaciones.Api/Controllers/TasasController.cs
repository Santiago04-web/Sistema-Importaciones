using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Importaciones.Api.Services;

namespace Importaciones.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class TasasController : ControllerBase
{
    private readonly ExchangeRateService _exchangeRateService;

    public TasasController(ExchangeRateService exchangeRateService)
    {
        _exchangeRateService = exchangeRateService;
    }

    [HttpGet("cny-cop")]
    public async Task<IActionResult> GetCnyCopRate()
    {
        var rateInfo = await _exchangeRateService.GetCnyToCopRateAsync();
        return Ok(rateInfo);
    }
}
