export interface Ubicacion {
  id: string;
  conductor_id: string;
  tenant_id: string;
  carrera_id: string | null;
  lat: number;
  lng: number;
  velocidad: number | null;
  direccion: number | null;
  timestamp: string;
}
