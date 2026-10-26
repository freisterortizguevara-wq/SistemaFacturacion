import type { Producto } from "./types";

const API_URL = import.meta.env.VITE_API_FACTURAS_URL ?? "http://localhost:5016"; // O 5016 si es tu puerto

export const listarProductos = async (): Promise<Producto[]> => {
  const res = await fetch(`${API_URL}/api/productos`);
  if (!res.ok) throw new Error("Error al cargar productos");
  return res.json();
};

export const crearProducto = async (p: Omit<Producto, "id">): Promise<Producto> => {
  const res = await fetch(`${API_URL}/api/productos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  if (!res.ok) throw new Error("Error al crear producto");
  return res.json();
};