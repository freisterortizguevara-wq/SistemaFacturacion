using Clientes.Api.Dtos;
using Clientes.Api.Models;
using Clientes.Api.Repositories;
using Microsoft.AspNetCore.Mvc;


namespace Clientes.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly IClienteRepository _repo;

    public ClientesController(IClienteRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Cliente>>> Get() =>
        Ok(await _repo.ObtenerTodosAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Cliente>> Get(int id)
    {
        var cliente = await _repo.ObtenerPorIdAsync(id);
        return cliente is null ? NotFound() : Ok(cliente);
    }

    [HttpPost]
    public async Task<ActionResult<Cliente>> Post(ClienteDto dto)
    {
        if (await _repo.ObtenerPorNitAsync(dto.Nit) is not null)
            return Conflict(new { mensaje = $"Ya existe un cliente con NIT {dto.Nit}" });

        var cliente = new Cliente
        {
            Nit = dto.Nit,
            Nombre = dto.Nombre,
            Correo = dto.Correo,
            Telefono = dto.Telefono,
            Direccion = dto.Direccion
        };

        var creado = await _repo.CrearAsync(cliente);
        return CreatedAtAction(nameof(Get), new { id = creado.Id }, creado);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Put(int id, ClienteDto dto)
    {
        var cliente = await _repo.ObtenerPorIdAsync(id);
        if (cliente is null) return NotFound();

        cliente.Nit = dto.Nit;
        cliente.Nombre = dto.Nombre;
        cliente.Correo = dto.Correo;
        cliente.Telefono = dto.Telefono;
        cliente.Direccion = dto.Direccion;

        await _repo.ActualizarAsync(cliente);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) =>
        await _repo.EliminarAsync(id) ? NoContent() : NotFound();
}