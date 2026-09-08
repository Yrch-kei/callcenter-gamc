using NetTopologySuite.Geometries;

namespace AspNetMapApi.Models;

/// <summary>
/// Represents a district polygon and a minimal subset of its attributes.
/// </summary>
public class DistrictFeature
{
    public Geometry Geometry { get; set; }
    public string? Distrito { get; set; }
    public string? Comuna { get; set; }
    public string? Nombre { get; set; }

    public DistrictFeature(Geometry geometry, string? distrito, string? comuna, string? nombre)
    {
        Geometry = geometry;
        Distrito = distrito;
        Comuna = comuna;
        Nombre = nombre;
    }
}
