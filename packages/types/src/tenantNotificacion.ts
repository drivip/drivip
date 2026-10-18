export type NotificacionTipo = "info" | "promocion" | "alerta" | "sistema";

export interface TenantNotificacion {
  id: string;
  tenant_id: string;
  titulo: string;
  mensaje: string;
  tipo: NotificacionTipo;
  enviada: boolean;
  enviada_at: string | null;
  created_at: string;
}
