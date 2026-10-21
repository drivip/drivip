export type MensajeEmisorRol = "cliente" | "conductor";

export interface MensajeCarrera {
  id: string;
  carrera_id: string;
  emisor_id: string;
  emisor_rol: MensajeEmisorRol;
  contenido: string;
  leido: boolean;
  created_at: string;
}

export interface MensajeDirecto {
  id: string;
  conversacion_id: string;
  emisor_id: string;
  emisor_rol: MensajeEmisorRol;
  contenido: string;
  leido: boolean;
  created_at: string;
}

export interface ConversacionCliente {
  conversacion_id: string;
  tenant_id: string;
  ultima_carrera_id: string | null;
  ultimo_mensaje: string | null;
  ultimo_mensaje_at: string | null;
  ultimo_emisor_id: string | null;
  ultimo_emisor_rol: MensajeEmisorRol | null;
  no_leidos: number;
}
