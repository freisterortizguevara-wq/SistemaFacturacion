using Clientes.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Clientes.Api.Data;

public class ClientesDbContext : DbContext
{
    public ClientesDbContext(DbContextOptions<ClientesDbContext> options)
        : base(options) { }

    public DbSet<Cliente> Clientes => Set<Cliente>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cliente>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Nit).IsRequired().HasMaxLength(20);
            e.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
            e.Property(c => c.Correo).IsRequired().HasMaxLength(200);
            e.Property(c => c.Telefono).HasMaxLength(30);
            e.Property(c => c.Direccion).HasMaxLength(300);
            e.HasIndex(c => c.Nit).IsUnique();
        });
    }
}