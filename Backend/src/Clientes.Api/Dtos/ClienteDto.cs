using System.ComponentModel.DataAnnotations;

namespace Clientes.Api.Dtos;

public class ClienteDto
{
    [Required, StringLength(20)]
    public string Nit { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(200)]
    public string Correo { get; set; } = string.Empty;

    [StringLength(30)]
    public string? Telefono { get; set; }

    [StringLength(300)]
    public string? Direccion { get; set; }
}