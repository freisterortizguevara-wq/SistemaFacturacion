using Facturas.Api.Models;

namespace Facturas.Api.Repositories;

public interface IFacturaRepository
{
    Task<List<Factura>> ListarAsync();
    Task<Factura?> ObtenerAsync(string id);
    Task<Factura> CrearAsync(Factura factura);
    Task<bool> AnularAsync(string id);
}