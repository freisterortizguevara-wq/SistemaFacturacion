import type { Factura, FacturaForm } from "./types"; // Asegúrate de crear estos tipos luego

// El puerto de Facturas (cámbialo al 5016 si es el que te está usando la API)
const API_FACTURAS = import.meta.env.VITE_API_FACTURAS_URL ?? "http://localhost:5016";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_FACTURAS}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    let mensaje = "Ocurrió un error inesperado";
    try {
      const data = await res.json();
      if (data.mensaje) mensaje = data.mensaje;
      else if (data.errors) mensaje = Object.values(data.errors).flat().join(" ");
    } catch {
      /* la respuesta no traía JSON */
    }
    throw new ApiError(res.status, mensaje);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Métodos para Facturas ---

export const listarFacturas = () => request<Factura[]>("/api/facturas");

export const crearFactura = (f: FacturaForm) =>
  request<Factura>("/api/facturas", { method: "POST", body: JSON.stringify(f) });

export const anularFactura = (id: string) =>
  request<void>(`/api/facturas/${id}/anular`, { method: "POST" });