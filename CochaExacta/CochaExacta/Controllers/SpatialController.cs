using AspNetMapApi.Models;
using AspNetMapApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace AspNetMapApi.Controllers;

[ApiController]
[Route("api")]
public class SpatialController : ControllerBase
{
    private readonly DistrictService _service;
    private readonly ILogger<SpatialController> _logger;

    public SpatialController(DistrictService service, ILogger<SpatialController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Reverse-geocode a point to its district.
    /// GET /api/district?lat=-17.3895&lng=-66.1568
    /// </summary>
    [HttpGet("district")]
    public ActionResult<DistrictResult> GetDistrict([FromQuery] double lat, [FromQuery] double lng)
    {
        var hit = _service.FindDistrict(lat, lng);
        var result = new DistrictResult(lat, lng, hit?.Distrito, hit?.Comuna, hit?.Nombre);
        return Ok(result);
    }

    /// <summary>
    /// POST body: { "lat": ..., "lng": ... }
    /// </summary>
    [HttpPost("district")]
    public ActionResult<DistrictResult> PostDistrict([FromBody] CoordinateDto body)
    {
        var hit = _service.FindDistrict(body.Lat, body.Lng);
        var result = new DistrictResult(body.Lat, body.Lng, hit?.Distrito, hit?.Comuna, hit?.Nombre);
        return Ok(result);
    }

    /// <summary>
    /// Returns all polygons as GeoJSON FeatureCollection, properties: distrito, comuna, Nombre.
    /// </summary>
    [HttpGet("geojson")]
    public IActionResult GetGeoJson()
    {
        var json = _service.GetSimplifiedGeoJson();
        return Content(json, "application/geo+json");
    }

    /// <summary>
    /// Returns the unique list of district names.
    /// </summary>
    [HttpGet("districts")]
    public IActionResult GetDistricts()
    {
        var list = _service.All
            .Select(f => new { f.Distrito, f.Comuna, f.Nombre })
            .Distinct()
            .OrderBy(x => x.Distrito)
            .ToList();
        return Ok(list);
    }

    public record CoordinateDto(double Lat, double Lng);
}
