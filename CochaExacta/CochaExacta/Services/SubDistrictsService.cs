using AspNetMapApi.Models;
using NetTopologySuite;
using NetTopologySuite.Features;
using NetTopologySuite.Geometries;
using NetTopologySuite.Geometries.Prepared;
using NetTopologySuite.Index.Strtree;
using NetTopologySuite.IO;
namespace AspNetMapApi.Services;

/// <summary>
/// Carga SubDistritos desde GeoJSON (EPSG:4326) y permite PIP queries.
/// </summary>
public sealed class SubDistrictsService
{
    private readonly GeometryFactory _gf =
        NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);

    // PreparedGeometryFactory.Prepare(...) devuelve IPreparedGeometry
    private readonly STRtree<(IPreparedGeometry prep, SubDistrictFeature feature)> _index = new();
    private readonly List<SubDistrictFeature> _all = new();
    public IReadOnlyList<SubDistrictFeature> All => _all;

    public SubDistrictsService(IConfiguration config, ILogger<SubDistrictsService> logger)
    {
        var path = config["Data:SubDistrictsGeoJsonPath"];
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
            throw new FileNotFoundException($"GeoJSON SubDistritos no encontrado. Configura 'Data:SubDistrictsGeoJsonPath'. Valor actual: '{path}'");

        logger.LogInformation("Loading SubDistricts GeoJSON from {Path}", path);

        var reader = new GeoJsonReader(); // NTS 3.x: usa ctor sin GeometryFactory
        using var sr = new StreamReader(path);
        var text = sr.ReadToEnd();
        var fc = reader.Read<FeatureCollection>(text)
                 ?? throw new InvalidOperationException("Invalid SubDistricts FeatureCollection.");

        int count = 0;
        foreach (var f in fc)
        {
            if (f.Geometry is null) continue;

            // Aliases típicos
            var nombre = GetFirst<string>(f.Attributes,
                "SUBDISTRITO", "SubDistrito", "SUB_DIST", "SUBDIST", "NOMBRE_SUBD", "NOMBRE", "name", "Name");
            var codigo = GetFirst<string>(f.Attributes,
                "CODIGO", "Codigo", "COD_SUBD", "CODE", "ID", "OBJECTID");
            var distrito = GetFirst<string>(f.Attributes,
                "DISTRITO", "Distrito", "DIST");

            var prep = PreparedGeometryFactory.Prepare(f.Geometry);

            var feat = new SubDistrictFeature(
                f.Geometry,
                nombre ?? string.Empty,
                codigo ?? string.Empty,
                distrito ?? string.Empty
            );

            _all.Add(feat);
            _index.Insert(f.Geometry.EnvelopeInternal, (prep, feat));
            count++;
        }

        _index.Build();
        logger.LogInformation("Loaded {Count} SubDistrict features and built spatial index.", count);
    }

    public SubDistrictFeature? Find(double lat, double lng)
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

    // Helpers
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
                    catch { }
                }
            }
        }
        return default;
    }
}
