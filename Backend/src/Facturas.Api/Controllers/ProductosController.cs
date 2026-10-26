using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Facturas.Api.Models;

namespace Facturas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductosController : ControllerBase
{
    private readonly IMongoCollection<Producto> _productos;

    public ProductosController(IMongoDatabase database)
    {
        _productos = database.GetCollection<Producto>("productos");
    }

    [HttpGet]
    public async Task<ActionResult<List<Producto>>> Get()
    {
        var lista = await _productos.Find(_ => true).ToListAsync();
        return Ok(lista);
    }

    [HttpPost]
    public async Task<ActionResult<Producto>> Post(Producto producto)
    {
        await _productos.InsertOneAsync(producto);
        return CreatedAtAction(nameof(Get), new { id = producto.Id }, producto);
    }
}