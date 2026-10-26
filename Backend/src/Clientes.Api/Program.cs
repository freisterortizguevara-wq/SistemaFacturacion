using Clientes.Api.Data;
using Clientes.Api.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// --- CAMBIO CLAVE: Usamos PostgreSQL (Neon) ---
builder.Services.AddDbContext<ClientesDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("NeonConnection")));

builder.Services.AddScoped<IClienteRepository, ClienteRepository>();

builder.Services.AddCors(options =>
    options.AddPolicy("web", policy =>
        policy.AllowAnyOrigin()
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