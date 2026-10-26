using Clientes.Api.Data;
using Clientes.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Clientes.Api.Repositories;

public class ClienteRepository : IClienteRepository
{
    private readonly ClientesDbContext _db;

    public ClienteRepository(ClientesDbContext db) => _db = db;

    public async Task<IEnumerable<Cliente>> ObtenerTodosAsync() =>
        await _db.Clientes.AsNoTracking().Where(c => c.Activo).ToListAsync();

    public async Task<Cliente?> ObtenerPorIdAsync(int id) =>
        await _db.Clientes.FirstOrDefaultAsync(c => c.Id == id && c.Activo);

    public async Task<Cliente?> ObtenerPorNitAsync(string nit) =>
        await _db.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Nit == nit);

    public async Task<Cliente> CrearAsync(Cliente cliente)
    {
        _db.Clientes.Add(cliente);
        await _db.SaveChangesAsync();
        return cliente;
    }

    public async Task<bool> ActualizarAsync(Cliente cliente)
    {
        _db.Clientes.Update(cliente);
        return await _db.SaveChangesAsync() > 0;
    }

    public async Task<bool> EliminarAsync(int id)
    {
        var cliente = await _db.Clientes.FindAsync(id);
        if (cliente is null) return false;

        cliente.Activo = false; // borrado lógico: no se pierde el historial
        return await _db.SaveChangesAsync() > 0;
    }
}