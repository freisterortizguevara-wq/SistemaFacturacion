using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Facturas.Api.Models;

public class Factura
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public int Numero { get; set; }

    public int ClienteId { get; set; }
    public string ClienteNit { get; set; } = string.Empty;
    public string ClienteNombre { get; set; } = string.Empty;

    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public List<ItemFactura> Items { get; set; } = new();

    public decimal Subtotal { get; set; }
    public decimal Iva { get; set; }
    public decimal Total { get; set; }

    public string Estado { get; set; } = "Emitida"; // Emitida | Anulada
}

public class ItemFactura
{
    public string Descripcion { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal PorcentajeIva { get; set; }
}