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
