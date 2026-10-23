export type AdminMensajeRol = "superadmin" | "conductor" | "sistema";

export interface AdminMensaje {
  id: string;
  tenant_id: string;
  emisor_rol: AdminMensajeRol;
  emisor_id: string | null;
  titulo: string | null;
  contenido: string;
  leido: boolean;
  created_at: string;
}

export interface AdminConversacion {
  tenant_id: string;
  tenant_nombre: string;
  tenant_slug: string;
  tenant_email: string | null;
  ultimo_mensaje: string | null;
  ultimo_mensaje_at: string | null;
  ultimo_emisor_rol: AdminMensajeRol | null;
  no_leidos: number;
}
