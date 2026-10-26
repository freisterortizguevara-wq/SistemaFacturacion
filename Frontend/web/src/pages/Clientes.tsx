import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { actualizarCliente, crearCliente, eliminarCliente, listarClientes } from "../api/clientesApi";
import type { Cliente, ClienteForm } from "../types";
import { Icon } from "../components/Icon";

const vacio: ClienteForm = { nit: "", nombre: "", correo: "", telefono: "", direccion: "" };

function iniciales(nombre: string) {
  return nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("");
}

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function Campo(props: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string; placeholder?: string; }) {
  return (
    <label className="field">
      <span>{props.label}{props.required && <b> *</b>}</span>
      <input type={props.type ?? "text"} value={props.value} required={props.required} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} />
    </label>
  );
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState<ClienteForm>(vacio);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [porEliminar, setPorEliminar] = useState<Cliente | null>(null);
  const [toast, setToast] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  async function cargar() {
    try {
      setLoadError("");
      setClientes(await listarClientes());
    } catch {
      setLoadError("No se pudo conectar con la API. Verifica que esté corriendo en el puerto 5169.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void cargar(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q) || c.correo.toLowerCase().includes(q));
  }, [clientes, query]);

  const stats = useMemo(() => {
    const ahora = new Date();
    const nuevos = clientes.filter((c) => {
      const d = new Date(c.fechaCreacion);
      return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
    }).length;
    return { total: clientes.length, nuevos, conTelefono: clientes.filter((c) => c.telefono).length };
  }, [clientes]);

  function abrirNuevo() {
    setEditando(null); setForm(vacio); setFormError(""); setDrawerOpen(true);
  }

  function abrirEditar(c: Cliente) {
    setEditando(c); setForm({ nit: c.nit, nombre: c.nombre, correo: c.correo, telefono: c.telefono ?? "", direccion: c.direccion ?? "" }); setFormError(""); setDrawerOpen(true);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault(); setSaving(true); setFormError("");
    try {
      if (editando) { await actualizarCliente(editando.id, form); setToast({ tipo: "ok", texto: "Cliente actualizado" }); } 
      else { await crearCliente(form); setToast({ tipo: "ok", texto: "Cliente creado correctamente" }); }
      setDrawerOpen(false); await cargar();
    } catch (err) { setFormError(err instanceof Error ? err.message : "No se pudo guardar"); } 
    finally { setSaving(false); }
  }

  async function confirmarEliminar() {
    if (!porEliminar) return;
    try {
      await eliminarCliente(porEliminar.id); setToast({ tipo: "ok", texto: `"${porEliminar.nombre}" fue eliminado` }); setPorEliminar(null); await cargar();
    } catch { setToast({ tipo: "error", texto: "No se pudo eliminar el cliente" }); setPorEliminar(null); }
  }

  const set = (campo: keyof ClienteForm) => (v: string) => setForm({ ...form, [campo]: v });

  return (
    <>
      <header className="topbar">
        <div><h1>Clientes</h1><p>Administra los terceros a los que les facturas.</p></div>
        <button className="btn primary" onClick={abrirNuevo}><Icon name="plus" /> Nuevo cliente</button>
      </header>

      <main>
        {loadError && <div className="banner">{loadError}</div>}
        <section className="stats">
          <div className="stat"><div className="stat-icon"><Icon name="users" size={20} /></div><div><b>{loading ? "–" : stats.total}</b><span>Clientes activos</span></div></div>
          <div className="stat"><div className="stat-icon"><Icon name="calendar" size={20} /></div><div><b>{loading ? "–" : stats.nuevos}</b><span>Nuevos este mes</span></div></div>
          <div className="stat"><div className="stat-icon"><Icon name="phone" size={20} /></div><div><b>{loading ? "–" : stats.conTelefono}</b><span>Con teléfono registrado</span></div></div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Listado de clientes</h2>
            <div className="search"><Icon name="search" size={16} /><input placeholder="Buscar por nombre, NIT o correo" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Cliente</th><th>NIT</th><th className="hide-md">Teléfono</th><th className="hide-md">Creado</th><th></th></tr></thead>
              <tbody>
                {loading && [0, 1, 2, 3].map((i) => (<tr key={i}><td colSpan={5}><div className="skeleton" /></td></tr>))}
                {!loading && filtrados.map((c) => {
                  const hue = (c.id * 47) % 360;
                  return (
                    <tr key={c.id}>
                      <td><div className="person"><div className="avatar" style={{ background: `hsl(${hue} 80% 93%)`, color: `hsl(${hue} 60% 30%)` }}>{iniciales(c.nombre)}</div><div><strong>{c.nombre}</strong><small>{c.correo}</small></div></div></td>
                      <td><span className="chip">{c.nit}</span></td>
                      <td className="hide-md">{c.telefono || "—"}</td>
                      <td className="hide-md">{fecha(c.fechaCreacion)}</td>
                      <td><div className="actions">
                        <button className="icon-btn" title="Editar" onClick={() => abrirEditar(c)}><Icon name="edit" size={16} /></button>
                        <button className="icon-btn danger" title="Eliminar" onClick={() => setPorEliminar(c)}><Icon name="trash" size={16} /></button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && !loadError && filtrados.length === 0 && (
              <div className="empty">
                <div className="empty-icon"><Icon name="users" size={28} /></div>
                <h3>{query ? "Sin resultados" : "Aún no tienes clientes"}</h3>
                <p>{query ? "Prueba con otro nombre, NIT o correo." : "Crea tu primer cliente para empezar a facturar."}</p>
                {!query && <button className="btn primary" onClick={abrirNuevo}><Icon name="plus" /> Nuevo cliente</button>}
              </div>
            )}
          </div>
        </section>
      </main>

      {drawerOpen && (
        <div className="overlay" onClick={() => setDrawerOpen(false)}>
          <form className="drawer" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
            <div className="drawer-head">
              <div><h2>{editando ? "Editar cliente" : "Nuevo cliente"}</h2><p>Los campos con * son obligatorios.</p></div>
              <button type="button" className="icon-btn" onClick={() => setDrawerOpen(false)}><Icon name="close" /></button>
            </div>
            <div className="drawer-body">
              <Campo label="NIT" required value={form.nit} onChange={set("nit")} placeholder="900123456-1" />
              <Campo label="Nombre o razón social" required value={form.nombre} onChange={set("nombre")} placeholder="Mi Empresa SAS" />
              <Campo label="Correo electrónico" required type="email" value={form.correo} onChange={set("correo")} placeholder="contacto@empresa.com" />
              <Campo label="Teléfono" value={form.telefono} onChange={set("telefono")} placeholder="3001234567" />
              <Campo label="Dirección" value={form.direccion} onChange={set("direccion")} placeholder="Calle 100 # 10-20, Bogotá" />
              {formError && <div className="banner">{formError}</div>}
            </div>
            <div className="drawer-foot">
              <button type="button" className="btn ghost" onClick={() => setDrawerOpen(false)}>Cancelar</button>
              <button type="submit" className="btn primary" disabled={saving}>{saving ? "Guardando..." : editando ? "Guardar cambios" : "Crear cliente"}</button>
            </div>
          </form>
        </div>
      )}

      {porEliminar && (
        <div className="overlay center" onClick={() => setPorEliminar(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon"><Icon name="trash" size={22} /></div>
            <h3>¿Eliminar cliente?</h3>
            <p><strong>{porEliminar.nombre}</strong> dejará de aparecer en el listado. El historial se conserva.</p>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setPorEliminar(null)}>Cancelar</button>
              <button className="btn danger" onClick={confirmarEliminar}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.tipo}`}>
          <Icon name={toast.tipo === "ok" ? "check" : "close"} size={16} />
          {toast.texto}
        </div>
      )}
    </>
  );
}