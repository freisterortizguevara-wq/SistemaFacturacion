using Clientes.Api.Data;
using Clientes.Api.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<ClientesDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("ClientesDb")));

builder.Services.AddScoped<IClienteRepository, ClienteRepository>();

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
else
{
    app.UseHttpsRedirection();
}

app.UseCors("web");
app.UseAuthorization();

app.MapControllers();

app.Run();