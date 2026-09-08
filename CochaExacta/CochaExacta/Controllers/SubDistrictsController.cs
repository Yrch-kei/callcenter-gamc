using AspNetMapApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace AspNetMapApi.Controllers;

[ApiController]
[Route("api/subdistricts")]
public class SubDistrictsController : ControllerBase
{
    private readonly SubDistrictsService _service;
    private readonly ILogger<SubDistrictsController> _logger;

    public SubDistrictsController(SubDistrictsService service, ILogger<SubDistrictsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>GET /api/subdistricts/find?lat=..&lng=..</summary>
    [HttpGet("find")]
    public IActionResult Find([FromQuery] double lat, [FromQuery] double lng)
    {
        var hit = _service.Find(lat, lng);
        if (hit is null) return NotFound();
        return Ok(new { lat, lng, hit.Nombre, hit.Codigo, hit.Distrito });
    }

    /// <summary>GET /api/subdistricts/geojson</summary>
    [HttpGet("geojson")]
    public IActionResult GetGeoJson()
    {
        var json = _service.GetSimplifiedGeoJson();
        return Content(json, "application/geo+json");
    }

    /// <summary>GET /api/subdistricts (listado simple)</summary>
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
