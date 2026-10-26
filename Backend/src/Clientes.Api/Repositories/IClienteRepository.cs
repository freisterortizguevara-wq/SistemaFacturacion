using Clientes.Api.Models;

namespace Clientes.Api.Repositories;

public interface IClienteRepository
{
    Task<IEnumerable<Cliente>> ObtenerTodosAsync();
    Task<Cliente?> ObtenerPorIdAsync(int id);
    Task<Cliente?> ObtenerPorNitAsync(string nit);
    Task<Cliente> CrearAsync(Cliente cliente);
    Task<bool> ActualizarAsync(Cliente cliente);
    Task<bool> EliminarAsync(int id);
}