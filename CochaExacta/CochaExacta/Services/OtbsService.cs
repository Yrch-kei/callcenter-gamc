// Services/OtbsService.cs
using AspNetMapApi.Models;
using NetTopologySuite;
using NetTopologySuite.Features;
using NetTopologySuite.Geometries;
using NetTopologySuite.Geometries.Prepared;
using NetTopologySuite.Index.Strtree;
using NetTopologySuite.IO;

namespace AspNetMapApi.Services;

public sealed class OtbsService
{
    private readonly GeometryFactory _gf =
        NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);

    private readonly STRtree<(IPreparedGeometry prep, OtbFeature feature)> _index = new();
    private readonly List<OtbFeature> _all = new();
    public IReadOnlyList<OtbFeature> All => _all;

    public OtbsService(IConfiguration config, ILogger<OtbsService> logger)
    {
        var path = config["Data:OtbsGeoJsonPath"];
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
            throw new FileNotFoundException($"GeoJSON OTB not found. Configure 'Data:OtbsGeoJsonPath'. Current value: '{path}'");

        logger.LogInformation("Loading OTB GeoJSON from {Path}", path);

        var reader = new GeoJsonReader();
        using var sr = new StreamReader(path);
        var text = sr.ReadToEnd();
        var fc = reader.Read<FeatureCollection>(text)
                 ?? throw new InvalidOperationException("Invalid OTB FeatureCollection.");

        int count = 0;
        foreach (var f in fc)
        {
            if (f.Geometry is null) continue;

            // Fallbacks de nombres de campo frecuentes en catastro/OTB
            var nombre = GetFirst<string>(f.Attributes,
                "NOMBRE", "Nombre", "NOMBRE_OTB", "NOM_OTB", "OTB", "otb", "name");
            var codigo = GetFirst<string>(f.Attributes,
                "CODIGO", "Codigo", "COD_OTB", "cod_otb", "CODIGO_OTB", "codigo", "ID", "OBJECTID");
            var distrito = GetFirst<string>(f.Attributes,
                "DISTRITO", "Distrito", "distrito");

            // Si no encontramos nada, deja string.Empty para no romper serialización
            var prep = PreparedGeometryFactory.Prepare(f.Geometry);
            var feat = new OtbFeature(f.Geometry,
                nombre ?? string.Empty,
                codigo ?? string.Empty,
                distrito ?? string.Empty);

            _all.Add(feat);
            _index.Insert(f.Geometry.EnvelopeInternal, (prep, feat));
            count++;
        }

        _index.Build();
        logger.LogInformation("Loaded {Count} OTB features and built spatial index.", count);
    }

    public OtbFeature? FindOtb(double lat, double lng)
    {
        var pt = _gf.CreatePoint(new Coordinate(lng, lat));
        var candidates = _index.Query(pt.EnvelopeInternal);

        foreach (var (prep, feature) in candidates)
        {
            if (prep.Covers(pt) || prep.Contains(pt) || prep.Intersects(pt))
            {
                if (feature.Geometry.Covers(pt) || feature.Geometry.Contains(pt))
                    return feature;
            }
        }
        return null;
    }

    public string GetSimplifiedGeoJson()
    {
        var fc = new FeatureCollection();
        foreach (var f in _all)
        {
            var attrs = new AttributesTable(new Dictionary<string, object?>
            {
                ["nombre"] = f.Nombre ?? "",
                ["codigo"] = f.Codigo ?? "",
                ["distrito"] = f.Distrito ?? ""
            });
            fc.Add(new Feature(f.Geometry, attrs));
        }
        var writer = new GeoJsonWriter();
        return writer.Write(fc);
    }

    // -------- helpers --------

    private static T? GetFirst<T>(IAttributesTable attrs, params string[] keys)
    {
        foreach (var k in keys)
        {
            if (attrs.Exists(k))
            {
                var v = attrs[k];
                if (v is T t) return t;
                if (v is not null)
                {
                    try { return (T)Convert.ChangeType(v, typeof(T)); }
                    catch { /* ignore */ }
                }
            }
        }
        return default;
    }
}
