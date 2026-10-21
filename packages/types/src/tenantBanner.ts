export type BannerPrioridad = "alta" | "normal" | "baja";

export interface TenantBanner {
  id: string;
  tenant_id: string;
  titulo: string;
  descripcion: string | null;
  imagen_url: string | null;
  enlace_url?: string | null;
  cta_texto?: string | null;
  activo: boolean;
  prioridad: BannerPrioridad;
  orden?: number;
  created_at: string;
}
