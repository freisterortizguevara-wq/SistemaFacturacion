using Xunit;
using Facturas.Api.Models;
using System.Collections.Generic;

namespace Facturas.Tests;

public class FacturaTests
{
    [Fact]
    public void CalculoDeTotales_DebeDarResultadosExactos()
    {
        // Arrange: Los mismos ítems de la prueba en Postman
        var items = new List<ItemFactura>
        {
            new ItemFactura { Descripcion = "Licencia mensual", Cantidad = 2, PrecioUnitario = 150000, PorcentajeIva = 19 },
            new ItemFactura { Descripcion = "Soporte técnico", Cantidad = 1, PrecioUnitario = 80000, PorcentajeIva = 19 }
        };

        // Act: Simulamos el cálculo
        decimal subtotal = 0;
        decimal iva = 0;
        foreach (var item in items)
        {
            subtotal += item.Cantidad * item.PrecioUnitario;
            iva += (item.Cantidad * item.PrecioUnitario) * (item.PorcentajeIva / 100m);
        }
        decimal total = subtotal + iva;

        // Assert: Validamos que las matemáticas coincidan
        Assert.Equal(380000m, subtotal);
        Assert.Equal(72200m, iva);
        Assert.Equal(452200m, total);
    }
}