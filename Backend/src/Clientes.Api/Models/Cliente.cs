namespace Clientes.Api.Models;

public class Cliente
{
    public int Id { get; set; }
    public string Nit { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}