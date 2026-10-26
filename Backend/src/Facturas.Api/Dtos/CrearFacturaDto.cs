using System.ComponentModel.DataAnnotations;

namespace Facturas.Api.Dtos;

public class CrearFacturaDto
{
    [Required]
    public int ClienteId { get; set; }

    [Required, MinLength(1, ErrorMessage = "La factura debe tener al menos un ítem")]
    public List<ItemDto> Items { get; set; } = new();
}

public class ItemDto
{
    [Required, StringLength(200)]
    public string Descripcion { get; set; } = string.Empty;

    [Range(1, 100000)]
    public int Cantidad { get; set; }

    [Range(0, 1000000000)]
    public decimal PrecioUnitario { get; set; }

    [Range(0, 100)]
    public decimal PorcentajeIva { get; set; } = 19;
}