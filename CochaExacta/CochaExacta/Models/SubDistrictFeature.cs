using NetTopologySuite.Geometries;

namespace AspNetMapApi.Models;

/// <summary>
/// Feature mínima para un SubDistrito.
/// </summary>
public class SubDistrictFeature
{
    public Geometry Geometry { get; set; }
    public string? Nombre { get; set; }    // nombre del subdistrito
    public string? Codigo { get; set; }    // opcional (si tu dataset lo trae)
    public string? Distrito { get; set; }  // distrito al que pertenece

    public SubDistrictFeature(Geometry geometry, string? nombre, string? codigo, string? distrito)
    {
        Geometry = geometry;
        Nombre = nombre;
        Codigo = codigo;
        Distrito = distrito;
    }
}
