import type { Cliente, ClienteForm } from "../types";
const API = import.meta.env.VITE_API_URL ?? "http://localhost:5169";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
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

export const listarClientes = () => request<Cliente[]>("/api/clientes");

export const crearCliente = (f: ClienteForm) =>
  request<Cliente>("/api/clientes", { method: "POST", body: JSON.stringify(f) });

export const actualizarCliente = (id: number, f: ClienteForm) =>
  request<void>(`/api/clientes/${id}`, { method: "PUT", body: JSON.stringify(f) });

export const eliminarCliente = (id: number) =>
  request<void>(`/api/clientes/${id}`, { method: "DELETE" });