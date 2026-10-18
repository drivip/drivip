export type BannerPrioridad = "alta" | "normal" | "baja";

export interface TenantBanner {
  id: string;
  tenant_id: string;
  titulo: string;
  descripcion: string | null;
  imagen_url: string | null;
  activo: boolean;
  prioridad: BannerPrioridad;
  created_at: string;
}
