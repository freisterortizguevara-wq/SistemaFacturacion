import { useEffect, useState } from "react";
import { listarFacturas, crearFactura } from "../api/facturasApi";
import { listarClientes } from "../api/clientesApi";
import { listarProductos } from "../api/productosApi";
import type { Factura, Cliente, ItemFacturaForm, Producto } from "../types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Facturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clienteId, setClienteId] = useState<string>("");
  const [items, setItems] = useState<ItemFacturaForm[]>([
    { descripcion: "", cantidad: 1, precioUnitario: 0, porcentajeIva: 19 },
  ]);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);

  async function cargarDatos() {
    try {
      setLoading(true);
      const [f, c, p] = await Promise.all([
        listarFacturas(), 
        listarClientes(),
        listarProductos()
      ]);
      setFacturas(f);
      setClientes(c);
      setProductos(p);
    } catch (error) {
      console.error("Error cargando datos", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void cargarDatos();
  }, []);

  const agregarItem = () => {
    setItems([...items, { descripcion: "", cantidad: 1, precioUnitario: 0, porcentajeIva: 19 }]);
  };

  const eliminarItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const actualizarItem = (index: number, campo: keyof ItemFacturaForm, valor: any) => {
    const nuevos = [...items];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setItems(nuevos);
  };

  const seleccionarProducto = (index: number, productoId: string) => {
    const prod = productos.find(p => p.id === productoId);
    if (prod) {
      const nuevos = [...items];
      nuevos[index] = {
        ...nuevos[index],
        descripcion: prod.nombre,
        precioUnitario: prod.precio
      };
      setItems(nuevos);
    }
  };

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId) return setMensaje({ tipo: "error", texto: "Por favor, selecciona un cliente." });
    if (items.some(i => !i.descripcion || i.precioUnitario <= 0)) {
      return setMensaje({ tipo: "error", texto: "Completa la descripción y un precio mayor a 0." });
    }

    setSaving(true);
    setMensaje(null);
    
    try {
      await crearFactura({ clienteId: Number(clienteId), items });
      setMensaje({ tipo: "ok", texto: "¡Factura generada exitosamente!" });
      setClienteId("");
      setItems([{ descripcion: "", cantidad: 1, precioUnitario: 0, porcentajeIva: 19 }]);
      await cargarDatos(); 
    } catch (error: any) {
      setMensaje({ tipo: "error", texto: error.message || "Error al crear la factura." });
    } finally {
      setSaving(false);
    }
  }

  const descargarPDF = (factura: Factura) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Mini Facturación", 14, 22);
    doc.setFontSize(12);
    doc.text(`Factura Nº: ${factura.numero}`, 14, 32);
    doc.text(`Fecha: ${new Date(factura.fecha).toLocaleDateString('es-CO')}`, 14, 38); 
    
    doc.setFontSize(14);
    doc.text("Datos del Cliente", 14, 50);
    doc.setFontSize(10);
    doc.text(`Nombre: ${factura.clienteNombre}`, 14, 58);
    doc.text(`NIT: ${factura.clienteNit}`, 14, 64);

    const itemsData = factura.items.map(item => [
      item.descripcion,
      item.cantidad,
      `$${item.precioUnitario.toLocaleString("es-CO")}`,
      `${item.porcentajeIva}%`,
      `$${((item.cantidad * item.precioUnitario) * (1 + item.porcentajeIva/100)).toLocaleString("es-CO")}`
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['Descripción', 'Cant.', 'Precio Unit.', 'IVA', 'Total']],
      body: itemsData,
      theme: 'grid',
      headStyles: { fillColor: [91, 92, 240] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Subtotal: $${factura.subtotal.toLocaleString("es-CO")}`, 140, finalY);
    doc.text(`IVA: $${factura.iva.toLocaleString("es-CO")}`, 140, finalY + 6);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: $${factura.total.toLocaleString("es-CO")}`, 140, finalY + 14);

    doc.save(`Factura_${factura.numero}.pdf`);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        
        <header className="dash-header">
          <div>
            <h1>Facturación</h1>
            <p>Gestiona y visualiza las facturas de tus clientes.</p>
          </div>
        </header>

        <main className="charts-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", alignItems: "start" }}>
          
          {/* COLUMNA IZQUIERDA: FORMULARIO */}
          <section className="chart-card" style={{ padding: 0 }}>
            <div className="chart-header" style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", margin: 0 }}>
              <h3>Nueva Factura</h3>
            </div>
            
            <form onSubmit={guardar} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <label className="field">
                <span>Cliente <b style={{ color: "var(--danger)" }}>*</b></span>
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
                  <option value="">Selecciona un cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.nit})</option>
                  ))}
                </select>
              </label>

              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "var(--text)", marginBottom: "1rem", marginTop: 0 }}>Ítems a facturar</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {items.map((item, i) => (
                    <div key={i} style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: "12px", backgroundColor: "#fafaff", display: "flex", flexDirection: "column", gap: "1rem", position: "relative" }}>
                      {items.length > 1 && (
                        <button type="button" onClick={() => eliminarItem(i)} style={{ position: "absolute", top: "10px", right: "10px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontWeight: "bold" }}>×</button>
                      )}
                      
                      <label className="field">
                        <span>Seleccionar del catálogo (Opcional)</span>
                        <select onChange={(e) => seleccionarProducto(i, e.target.value)} value="">
                          <option value="">-- Elige un producto --</option>
                          {productos.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre} - ${p.precio.toLocaleString("es-CO")}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field">
                        <span>Descripción / Producto</span>
                        <input placeholder="Ej. Licencia de software" value={item.descripcion} onChange={(e) => actualizarItem(i, "descripcion", e.target.value)} required />
                      </label>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: "0.75rem" }}>
                        <label className="field"><span>Cant.</span><input type="number" value={item.cantidad} onChange={(e) => actualizarItem(i, "cantidad", Number(e.target.value))} min="1" required /></label>
                        <label className="field"><span>Precio Unit.</span><input type="number" value={item.precioUnitario} onChange={(e) => actualizarItem(i, "precioUnitario", Number(e.target.value))} min="1" required /></label>
                        <label className="field"><span>IVA %</span><input type="number" value={item.porcentajeIva} onChange={(e) => actualizarItem(i, "porcentajeIva", Number(e.target.value))} min="0" required /></label>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={agregarItem} className="btn ghost" style={{ marginTop: "1rem", width: "100%" }}>+ Añadir otro ítem</button>
              </div>

              {mensaje && (
                <div style={{ padding: "0.75rem", borderRadius: "8px", fontSize: "0.875rem", fontWeight: "500", color: mensaje.tipo === "error" ? "#b91c1c" : "#15803d", backgroundColor: mensaje.tipo === "error" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${mensaje.tipo === "error" ? "#fecaca" : "#bbf7d0"}` }}>
                  {mensaje.texto}
                </div>
              )}

              <button type="submit" disabled={saving} className="btn primary" style={{ width: "100%" }}>
                {saving ? "Procesando..." : "Emitir Factura"}
              </button>
            </form>
          </section>

          {/* COLUMNA DERECHA: TABLA */}
          <section className="chart-card" style={{ padding: 0 }}>
            <div className="chart-header" style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", margin: 0 }}>
              <h3>Historial</h3>
              <span className="chip" style={{ backgroundColor: "#e0e7ff", color: "#4338ca" }}>
                {facturas.length} {facturas.length === 1 ? "Registro" : "Registros"}
              </span>
            </div>
            
            <div className="table-wrap" style={{ padding: "0 1.5rem 1.5rem 1.5rem" }}>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>Cargando facturas...</td></tr>
                  ) : facturas.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>No hay facturas emitidas.</td></tr>
                  ) : (
                    facturas.map((f) => (
                      <tr key={f.id}>
                        <td className="font-bold">#{f.numero}</td>
                        <td>{f.clienteNombre}</td>
                        <td className="font-bold">${f.total.toLocaleString("es-CO")}</td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            onClick={() => setFacturaSeleccionada(f)}
                            className="btn ghost"
                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* MODAL DE DETALLE */}
      {facturaSeleccionada && (
        <div className="overlay center" onClick={() => setFacturaSeleccionada(null)}>
          <div className="modal" style={{ textAlign: "left", maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.5rem", color: "var(--text)" }}>Factura #{facturaSeleccionada.numero}</h2>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.875rem" }}>{new Date(facturaSeleccionada.fecha).toLocaleDateString()}</p>
              </div>
              <span className={`status-badge ${facturaSeleccionada.estado === "Emitida" ? "status-emitida" : "status-anulada"}`}>
                {facturaSeleccionada.estado}
              </span>
            </div>

            <div style={{ marginBottom: "1.5rem", backgroundColor: "#f9fafb", padding: "1rem", borderRadius: "8px" }}>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", color: "var(--muted)", textTransform: "uppercase" }}>Cliente</h3>
              <p style={{ margin: 0, fontWeight: "600", color: "var(--text)" }}>{facturaSeleccionada.clienteNombre}</p>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.875rem" }}>NIT: {facturaSeleccionada.clienteNit}</p>
            </div>

            <div className="table-wrap" style={{ marginBottom: "1.5rem" }}>
              <table className="dash-table" style={{ minWidth: "100%" }}>
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th style={{ textAlign: "center" }}>Cant.</th>
                    <th style={{ textAlign: "right" }}>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {facturaSeleccionada.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.descripcion}</td>
                      <td style={{ textAlign: "center" }}>{item.cantidad}</td>
                      <td style={{ textAlign: "right" }}>${item.precioUnitario.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem", marginBottom: "2rem" }}>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.875rem" }}>Subtotal: ${facturaSeleccionada.subtotal.toLocaleString()}</p>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.875rem" }}>IVA: ${facturaSeleccionada.iva.toLocaleString()}</p>
              <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700", color: "var(--text)" }}>Total: ${facturaSeleccionada.total.toLocaleString()}</p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button onClick={() => setFacturaSeleccionada(null)} className="btn ghost">
                Cerrar
              </button>
              <button onClick={() => descargarPDF(facturaSeleccionada)} className="btn primary">
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}