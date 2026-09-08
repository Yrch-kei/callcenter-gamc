using AspNetMapApi.Models;
using NetTopologySuite;
using NetTopologySuite.Features;
using NetTopologySuite.Geometries;
using NetTopologySuite.Geometries.Prepared; // IPreparedGeometry + factory
using NetTopologySuite.Index.Strtree;
using NetTopologySuite.IO;

namespace AspNetMapApi.Services;

/// <summary>
/// Carga un GeoJSON (EPSG:4326 / WGS84) y permite consultas punto-en-polígono.
/// Usa STRtree para acelerar la búsqueda y geometría preparada para Covers/Contains.
/// </summary>
public sealed class DistrictService
{
    // WGS84 (SRID 4326) para crear puntos (FindDistrict)
    private readonly GeometryFactory _gf =
        NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);

    // OJO: PreparedGeometryFactory.Prepare(...) devuelve IPreparedGeometry
    private readonly STRtree<(IPreparedGeometry prep, DistrictFeature feature)> _index = new();

    // Cache en memoria de todas las features (para listar/exportar)
    private readonly List<DistrictFeature> _all = new();
    public IReadOnlyList<DistrictFeature> All => _all;

    public DistrictService(IConfiguration config, ILogger<DistrictService> logger)
    {
        var path = config["Data:GeoJsonPath"];
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
            throw new FileNotFoundException($"GeoJSON not found. Configure 'Data:GeoJsonPath'. Current value: '{path}'");

        logger.LogInformation("Loading GeoJSON from {Path}", path);

        // En NTS 2.5.x, usa el ctor sin parámetros; si pasas GeometryFactory te da error.
        var reader = new GeoJsonReader();

        using var sr = new StreamReader(path);
        var text = sr.ReadToEnd();
        var fc = reader.Read<FeatureCollection>(text)
                 ?? throw new InvalidOperationException("Invalid GeoJSON FeatureCollection.");

        int count = 0;
        foreach (var f in fc)
        {
            if (f.Geometry is null) continue;

            // Atributos típicos (si no existen, quedan null/empty)
            f.Attributes.TryGetOptional("distrito", out string? distrito);
            f.Attributes.TryGetOptional("comuna", out string? comuna);
            f.Attributes.TryGetOptional("Nombre", out string? nombre);

            // Prepara geom para acelerar Covers/Contains/Intersects
            var prep = PreparedGeometryFactory.Prepare(f.Geometry);

            var df = new DistrictFeature(f.Geometry, distrito, comuna, nombre);
            _all.Add(df);

            // Inserta por envelope (bbox) en el índice
            _index.Insert(f.Geometry.EnvelopeInternal, (prep, df));
            count++;
        }

        _index.Build();
        logger.LogInformation("Loaded {Count} district features and built spatial index.", count);
    }

    /// <summary>
    /// Reverse geocode: dado lat/lng, devuelve el primer distrito cuyo polígono cubre el punto.
    /// </summary>
    public DistrictFeature? FindDistrict(double lat, double lng)
    {
        // NTS: X=lon, Y=lat
        var pt = _gf.CreatePoint(new Coordinate(lng, lat));

        // 1) Candidatos por bbox, 2) test preciso con Covers/Contains/Intersects
        var candidates = _index.Query(pt.EnvelopeInternal);

        foreach (var (prep, feature) in candidates)
        {
            if (prep.Covers(pt) || prep.Contains(pt) || prep.Intersects(pt))
            {
                // Comprobación final sobre la geometría original
                if (feature.Geometry.Covers(pt) || feature.Geometry.Contains(pt) || feature.Geometry.Intersects(pt))
                    return feature;
            }
        }
        return null;
    }

    /// <summary>
    /// Devuelve un FeatureCollection GeoJSON con propiedades simplificadas (para dibujar en el cliente).
    /// </summary>
    public string GetSimplifiedGeoJson()
    {
        var fc = new FeatureCollection();
        foreach (var f in _all)
        {
            var attrs = new AttributesTable(new Dictionary<string, object?>
            {
                ["distrito"] = f.Distrito ?? "",
                ["comuna"] = f.Comuna ?? "",
                ["Nombre"] = f.Nombre ?? ""
            });

            // Reusamos la misma geometría. Si necesitas bajar peso, simplifica el GeoJSON en preproceso.
            fc.Add(new Feature(f.Geometry, attrs));
        }

        var writer = new GeoJsonWriter();
        return writer.Write(fc);
    }
}

internal static class AttributeTableExtensions
{
    /// <summary>
    /// Intento seguro de obtener una key y convertirla a T (si existe).
    /// Devuelve false si no existe o no se puede convertir.
    /// </summary>
    public static bool TryGetOptional<T>(this IAttributesTable table, string key, out T? value)
    {
        if (table.Exists(key))
        {
            var raw = table[key];
            if (raw is T t)
            {
                value = t;
                return true;
            }
            if (raw is not null)
            {
                try
                {
                    value = (T)Convert.ChangeType(raw, typeof(T));
                    return true;
                }
                catch
                {
                    // ignore conversion errors
                }
            }
        }
        value = default;
        return false;
    }
}
