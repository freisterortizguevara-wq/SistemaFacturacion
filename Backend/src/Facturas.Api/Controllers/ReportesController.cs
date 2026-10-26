using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Facturas.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Facturas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportesController : ControllerBase
{
    private readonly IMongoCollection<Factura> _facturas;

    public ReportesController(IMongoDatabase database)
    {
        _facturas = database.GetCollection<Factura>("facturas");
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var todas = await _facturas.Find(_ => true).ToListAsync();
        var emitidas = todas.Where(f => f.Estado == "Emitida").ToList();

        // 1. KPIs Principales
        var totalFacturado = emitidas.Sum(f => f.Total);
        var cantidadFacturas = emitidas.Count;
        var promedioFactura = cantidadFacturas > 0 ? totalFacturado / cantidadFacturas : 0;

        // 2. Cliente Estrella (El que más ha facturado)
        var clienteEstrella = emitidas
            .GroupBy(f => f.ClienteNombre)
            .OrderByDescending(g => g.Sum(f => f.Total))
            .Select(g => new { Nombre = g.Key, Total = g.Sum(f => f.Total) })
            .FirstOrDefault();

        // 3. Ventas por Mes (Para la gráfica de líneas)
        var ventasPorMes = emitidas
            .GroupBy(f => f.Fecha.ToString("MMM yyyy")) // Ej: "Oct 2026"
            .Select(g => new { Mes = g.Key, Total = g.Sum(f => f.Total) })
            .ToList();

        // 4. Ventas por Cliente (Para la gráfica de torta)
        var ventasPorCliente = emitidas
            .GroupBy(f => f.ClienteNombre)
            .Select(g => new { Nombre = g.Key, Total = g.Sum(f => f.Total) })
            .OrderByDescending(c => c.Total)
            .Take(5) // Solo el Top 5
            .ToList();

        return Ok(new
        {
            totalFacturado,
            cantidadFacturas,
            promedioFactura,
            clienteEstrella,
            ventasPorMes,
            ventasPorCliente
        });
    }
}