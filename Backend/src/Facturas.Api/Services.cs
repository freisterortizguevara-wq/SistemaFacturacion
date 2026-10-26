using System.Net;

namespace Facturas.Api.Services;

public record ClienteInfo(int Id, string Nit, string Nombre);

public interface IClientesClient
{
    Task<ClienteInfo?> ObtenerAsync(int id);
}

public class ClientesClient : IClientesClient
{
    private readonly HttpClient _http;

    public ClientesClient(HttpClient http) => _http = http;

    public async Task<ClienteInfo?> ObtenerAsync(int id)
    {
        var res = await _http.GetAsync($"api/clientes/{id}");

        if (res.StatusCode == HttpStatusCode.NotFound)
            return null;

        res.EnsureSuccessStatusCode();
        return await res.Content.ReadFromJsonAsync<ClienteInfo>();
    }
}