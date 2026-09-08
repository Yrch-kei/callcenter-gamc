using AspNetMapApi.Services;
using Microsoft.OpenApi.Models; // Para OpenApiInfo (no agrega los métodos, solo el modelo)

var builder = WebApplication.CreateBuilder(args);

// Servicios
builder.Services.AddSingleton<SubDistrictsService>();

builder.Services.AddSingleton<DistrictService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer(); // Necesario para Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AspNetMapApi",
        Version = "v1",
        Description = "API de mapas/distritos para el frontend",
    });
});
builder.Services.AddSingleton<OtbsService>(); // <-- nuevo servicio

// CORS DEV (permisivo). En prod, especifica orígenes
builder.Services.AddCors(options =>
{
    options.AddPolicy("dev", policy =>
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .SetIsOriginAllowed(_ => true)
            .AllowCredentials()
    );
});

var app = builder.Build();

// Middleware
app.UseCors("dev");
app.UseDefaultFiles(); // sirve index.html si existe en wwwroot
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger(); // <-- viene de Swashbuckle
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "AspNetMapApi v1");
        c.RoutePrefix = "swagger"; // UI en /swagger
    });
}

app.MapControllers();
app.Run();
