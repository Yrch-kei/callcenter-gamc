// Models/OtbFeature.cs
using NetTopologySuite.Geometries;

namespace AspNetMapApi.Models;

/// <summary>
/// Feature mínima para una OTB.
/// </summary>
public class OtbFeature
{
    public Geometry Geometry { get; set; }
    public string? Nombre { get; set; }
    public string? Codigo { get; set; }
    public string? Distrito { get; set; }

    public OtbFeature(Geometry geometry, string? nombre, string? codigo, string? distrito)
    {
        Geometry = geometry;
        Nombre = nombre;
        Codigo = codigo;
        Distrito = distrito;
    }
}
