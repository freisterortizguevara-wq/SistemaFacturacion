using Facturas.Api.Models;
using Facturas.Api.Repositories;
using Facturas.Api.Services;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;

// Guarda los decimales como Decimal128 (exactos, apropiados para dinero)
BsonSerializer.RegisterSerializer(new DecimalSerializer(BsonType.Decimal128));

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Conexión a MongoDB
var mongo = builder.Configuration.GetSection("Mongo").Get<MongoSettings>()!;
builder.Services.AddSingleton<IMongoClient>(new MongoClient(mongo.ConnectionString));
builder.Services.AddSingleton<IMongoDatabase>(sp =>
    sp.GetRequiredService<IMongoClient>().GetDatabase(mongo.Database));

// Repositorio y cliente HTTP hacia el servicio de Clientes
builder.Services.AddScoped<IFacturaRepository, FacturaRepository>();
builder.Services.AddHttpClient<IClientesClient, ClientesClient>(c =>
    c.BaseAddress = new Uri(builder.Configuration["ClientesApi:BaseUrl"]!));

builder.Services.AddCors(options =>
    options.AddPolicy("web", policy =>
        policy.AllowAnyOrigin() // <-- Cambiamos WithOrigins por AllowAnyOrigin
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("web");
app.UseAuthorization();
app.MapControllers();

app.Run();