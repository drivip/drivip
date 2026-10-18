export interface RedCliente {
  id: string;
  cliente_id: string;
  conductor_tenant_id: string;
  apodo: string | null;
  favorito: boolean;
  notificaciones_activas: boolean;
  agregado_at: string;
}

export interface Cliente {
  id: string;
  tenant_id: string;
  profile_id: string | null;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  total_carreras: number;
  created_at: string;
}
