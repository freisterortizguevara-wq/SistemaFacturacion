using Clientes.Api.Controllers;
using Clientes.Api.Dtos;
using Clientes.Api.Models;
using Clientes.Api.Repositories;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Clientes.Tests;

public class ClientesControllerTests
{
    private readonly Mock<IClienteRepository> _repo = new();
    private readonly ClientesController _controller;

    public ClientesControllerTests()
    {
        _controller = new ClientesController(_repo.Object);
    }

    private static ClienteDto NuevoDto() => new()
    {
        Nit = "900123456-1",
        Nombre = "Mi Empresa SAS",
        Correo = "contacto@miempresa.com"
    };

    [Fact]
    public async Task Get_ConIdInexistente_RetornaNotFound()
    {
        _repo.Setup(r => r.ObtenerPorIdAsync(99)).ReturnsAsync((Cliente?)null);

        var resultado = await _controller.Get(99);

        Assert.IsType<NotFoundResult>(resultado.Result);
    }

    [Fact]
    public async Task Post_ConNitDuplicado_RetornaConflict()
    {
        _repo.Setup(r => r.ObtenerPorNitAsync("900123456-1"))
             .ReturnsAsync(new Cliente { Id = 1, Nit = "900123456-1" });

        var resultado = await _controller.Post(NuevoDto());

        Assert.IsType<ConflictObjectResult>(resultado.Result);
        _repo.Verify(r => r.CrearAsync(It.IsAny<Cliente>()), Times.Never);
    }

    [Fact]
    public async Task Post_ConDatosValidos_RetornaCreated()
    {
        _repo.Setup(r => r.ObtenerPorNitAsync(It.IsAny<string>())).ReturnsAsync((Cliente?)null);
        _repo.Setup(r => r.CrearAsync(It.IsAny<Cliente>()))
             .ReturnsAsync((Cliente c) => { c.Id = 5; return c; });

        var resultado = await _controller.Post(NuevoDto());

        var created = Assert.IsType<CreatedAtActionResult>(resultado.Result);
        var cliente = Assert.IsType<Cliente>(created.Value);
        Assert.Equal(5, cliente.Id);
    }

    [Fact]
    public async Task Delete_ConIdInexistente_RetornaNotFound()
    {
        _repo.Setup(r => r.EliminarAsync(99)).ReturnsAsync(false);

        var resultado = await _controller.Delete(99);

        Assert.IsType<NotFoundResult>(resultado);
    }
}