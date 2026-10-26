import { useEffect, useState } from "react";
import { listarProductos, crearProducto } from "../api/productosApi";
import type { Producto } from "../types";

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({ nombre: "", precio: 0, stock: 0 });
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function cargar() {
    try {
      setLoading(true);
      setProductos(await listarProductos());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void cargar(); }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMensaje("");
    try {
      await crearProducto({ ...form, activo: true });
      setMensaje("Producto agregado al inventario.");
      setForm({ nombre: "", precio: 0, stock: 0 });
      await cargar();
    } catch (e) {
      console.error(e);
      setMensaje("Error al guardar el producto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        
        {/* HEADER */}
        <header className="dash-header">
          <div>
            <h1>Catálogo de Productos</h1>
            <p>Gestiona tu inventario y controla el stock disponible.</p>
          </div>
        </header>

        <main style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", alignItems: "start" }}>
          
          {/* FORMULARIO DE PRODUCTO */}
          <section className="chart-card" style={{ padding: 0 }}>
            <div className="chart-header" style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", margin: 0 }}>
              <h3>Nuevo Producto</h3>
            </div>
            
            <form onSubmit={guardar} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <label className="field">
                <span>Nombre del producto <b style={{ color: "var(--danger)" }}>*</b></span>
                <input 
                  placeholder="Ej. Licencia de Software" 
                  value={form.nombre} 
                  onChange={e => setForm({...form, nombre: e.target.value})} 
                  required 
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label className="field">
                  <span>Precio <b style={{ color: "var(--danger)" }}>*</b></span>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={form.precio || ''} 
                    onChange={e => setForm({...form, precio: Number(e.target.value)})} 
                    required 
                    min="1" 
                  />
                </label>
                <label className="field">
                  <span>Stock <b style={{ color: "var(--danger)" }}>*</b></span>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={form.stock || ''} 
                    onChange={e => setForm({...form, stock: Number(e.target.value)})} 
                    required 
                    min="0" 
                  />
                </label>
              </div>

              {mensaje && (
                <div className="banner" style={{ backgroundColor: "#ecfdf5", color: "#166534", borderColor: "#bbf7d0" }}>
                  {mensaje}
                </div>
              )}

              <button type="submit" disabled={saving} className="btn primary" style={{ width: "100%", marginTop: "0.5rem" }}>
                {saving ? "Guardando..." : "Guardar Producto"}
              </button>
            </form>
          </section>

          {/* LISTADO DE PRODUCTOS EN TARJETAS */}
          <section style={{ gridColumn: "span 2" }}>
            {loading ? (
              <div style={{ padding: "2rem", color: "var(--muted)" }}>Cargando productos...</div>
            ) : productos.length === 0 ? (
              <div className="empty" style={{ backgroundColor: "var(--card)", borderRadius: "16px", border: "1px solid var(--border)" }}>
                <div className="empty-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.3 7L12 12l8.7-5 M12 22V12"/></svg>
                </div>
                <h3>Aún no hay productos</h3>
                <p>Agrega tu primer producto al inventario usando el formulario.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.5rem" }}>
                {productos.map(p => {
                  // Generamos un color aleatorio basado en el nombre para el avatar
                  const hue = p.nombre.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
                  
                  return (
                    <div key={p.id} className="kpi-card" style={{ minHeight: "auto", padding: "1.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                        <div 
                          className="avatar" 
                          style={{ 
                            background: `hsl(${hue} 80% 93%)`, 
                            color: `hsl(${hue} 60% 30%)`,
                            width: "42px", height: "42px", borderRadius: "12px", fontSize: "16px"
                          }}
                        >
                          {p.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className={`status-badge ${p.stock > 0 ? "status-emitida" : "status-anulada"}`}>
                          Stock: {p.stock}
                        </span>
                      </div>
                      <div>
                        <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "var(--text)", fontWeight: "700" }}>
                          {p.nombre}
                        </h3>
                        <p style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--primary)", margin: 0, letterSpacing: "-0.03em" }}>
                          ${p.precio.toLocaleString("es-CO")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}