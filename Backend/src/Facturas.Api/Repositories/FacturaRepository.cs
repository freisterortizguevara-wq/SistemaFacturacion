using Facturas.Api.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Facturas.Api.Repositories;

public class FacturaRepository : IFacturaRepository
{
    private readonly IMongoCollection<Factura> _facturas;
    private readonly IMongoCollection<BsonDocument> _contadores;

    public FacturaRepository(IMongoDatabase db)
    {
        _facturas = db.GetCollection<Factura>("facturas");
        _contadores = db.GetCollection<BsonDocument>("contadores");
    }

    public async Task<List<Factura>> ListarAsync() =>
        await _facturas.Find(_ => true)
                       .SortByDescending(f => f.Numero)
                       .ToListAsync();

    public async Task<Factura?> ObtenerAsync(string id)
    {
        if (!ObjectId.TryParse(id, out _)) return null;
        return await _facturas.Find(f => f.Id == id).FirstOrDefaultAsync();
    }

    public async Task<Factura> CrearAsync(Factura factura)
    {
        factura.Numero = await SiguienteNumeroAsync();
        await _facturas.InsertOneAsync(factura);
        return factura;
    }

    public async Task<bool> AnularAsync(string id)
    {
        if (!ObjectId.TryParse(id, out _)) return false;

        var resultado = await _facturas.UpdateOneAsync(
            f => f.Id == id && f.Estado == "Emitida",
            Builders<Factura>.Update.Set(f => f.Estado, "Anulada"));

        return resultado.ModifiedCount > 0;
    }

    // Consecutivo atómico: aunque lleguen dos facturas a la vez, nunca se repite el número
    private async Task<int> SiguienteNumeroAsync()
    {
        var filtro = Builders<BsonDocument>.Filter.Eq("_id", "facturas");
        var update = Builders<BsonDocument>.Update.Inc("valor", 1);
        var opciones = new FindOneAndUpdateOptions<BsonDocument>
        {
            IsUpsert = true,
            ReturnDocument = ReturnDocument.After
        };

        var doc = await _contadores.FindOneAndUpdateAsync(filtro, update, opciones);
        return doc["valor"].AsInt32;
    }
}