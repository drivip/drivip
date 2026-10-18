export interface PluginActivo {
  id: string;
  tenant_id: string;
  plugin_nombre: string;
  activo: boolean;
  configuracion: Record<string, unknown>;
  activado_at: string;
  desactivado_at: string | null;
}

export type PluginComponent = (props: Record<string, unknown>) => unknown;

export interface PluginModule {
  nombre: string;
  icono: string;
  componentes: Record<string, PluginComponent>;
  tablas: string[];
}
