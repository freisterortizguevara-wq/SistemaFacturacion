export interface Cliente {
  id: number;
  nit: string;
  nombre: string;
  correo: string;
  telefono?: string | null;
  direccion?: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export type ClienteForm = {
  nit: string;
  nombre: string;
  correo: string;
  telefono: string;
  direccion: string;
};

// ==========================================
// TIPOS PARA FACTURAS
// ==========================================

export type ItemFacturaForm = {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  porcentajeIva: number;
};

export type FacturaForm = {
  clienteId: number;
  items: ItemFacturaForm[];
};

export interface Factura {
  id: string; // En MongoDB el ID es un string (ObjectId)
  numero: number;
  clienteId: number;
  clienteNit: string;
  clienteNombre: string;
  subtotal: number;
  iva: number;
  total: number;
  estado: string; // "Emitida", "Anulada", etc.
  fechaEmision: string;
  items: ItemFacturaForm[];
}

export interface Producto {
  id?: string;
  nombre: string;
  precio: number;
  stock: number;
  activo: boolean;
}