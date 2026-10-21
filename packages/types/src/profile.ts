export interface Profile {
  id: string;
  tenant_id: string | null;
  rol: "maestro" | "conductor" | "cliente";
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  email: string | null;
  estado: string | null;
  ciudad: string | null;
  avatar_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}
