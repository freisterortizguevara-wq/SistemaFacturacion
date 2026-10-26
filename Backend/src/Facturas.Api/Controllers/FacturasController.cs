using Facturas.Api.Dtos;
using Facturas.Api.Models;
using Facturas.Api.Repositories;
using Facturas.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Facturas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FacturasController : ControllerBase
{
    private readonly IFacturaRepository _repo;
    private readonly IClientesClient _clientes;

    public FacturasController(IFacturaRepository repo, IClientesClient clientes)
    {
        _repo = repo;
        _clientes = clientes;
    }

    [HttpGet]
    public async Task<ActionResult<List<Factura>>> Get() =>
        Ok(await _repo.ListarAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<Factura>> Get(string id)
    {
        var factura = await _repo.ObtenerAsync(id);
        return factura is null ? NotFound() : Ok(factura);
    }

    [HttpPost]
    public async Task<ActionResult<Factura>> Post(CrearFacturaDto dto)
    {
        // Regla de negocio 1: el cliente debe existir
        ClienteInfo? cliente;
        try
        {
            cliente = await _clientes.ObtenerAsync(dto.ClienteId);
        }
        catch (HttpRequestException)
        {
            return StatusCode(503, new { mensaje = "El servicio de clientes no está disponible" });
        }

        if (cliente is null)
            return BadRequest(new { mensaje = $"No existe el cliente {dto.ClienteId}" });

        var items = dto.Items.Select(i => new ItemFactura
        {
            Descripcion = i.Descripcion,
            Cantidad = i.Cantidad,
            PrecioUnitario = i.PrecioUnitario,
            PorcentajeIva = i.PorcentajeIva
        }).ToList();

        // Regla de negocio 2: los totales los calcula el servidor, nunca el frontend
        var subtotal = items.Sum(i => i.Cantidad * i.PrecioUnitario);
        var iva = items.Sum(i => i.Cantidad * i.PrecioUnitario * i.PorcentajeIva / 100m);

        var factura = new Factura
        {
            ClienteId = cliente.Id,
            ClienteNit = cliente.Nit,
            ClienteNombre = cliente.Nombre,
            Items = items,
            Subtotal = Math.Round(subtotal, 2),
            Iva = Math.Round(iva, 2),
            Total = Math.Round(subtotal + iva, 2)
        };

        var creada = await _repo.CrearAsync(factura);
        return CreatedAtAction(nameof(Get), new { id = creada.Id }, creada);
    }

    [HttpPost("{id}/anular")]
    public async Task<IActionResult> Anular(string id) =>
        await _repo.AnularAsync(id)
            ? NoContent()
            : NotFound(new { mensaje = "La factura no existe o ya está anulada" });
}