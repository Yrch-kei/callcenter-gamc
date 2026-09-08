using AspNetMapApi.Models;
using AspNetMapApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace AspNetMapApi.Controllers;

[ApiController]
[Route("api/otbs")]
public class OtbsController : ControllerBase
{
    private readonly OtbsService _service;
    private readonly ILogger<OtbsController> _logger;

    public OtbsController(OtbsService service, ILogger<OtbsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("find")]
    public ActionResult<object> Find([FromQuery] double lat, [FromQuery] double lng)
    {
        var hit = _service.FindOtb(lat, lng);
        if (hit is null) return NotFound();
        return Ok(new { lat, lng, hit.Nombre, hit.Codigo, hit.Distrito });
    }

    [HttpGet("geojson")]
    public IActionResult GetGeoJson()
    {
        var json = _service.GetSimplifiedGeoJson();
        return Content(json, "application/geo+json");
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        var list = _service.All
            .Select(f => new { f.Nombre, f.Codigo, f.Distrito })
            .Distinct()
            .OrderBy(x => x.Nombre)
            .ToList();
        return Ok(list);
    }
}
