export type PedidoB2BEstado = "pendiente" | "asignada" | "en_curso" | "completada" | "cancelada";

export interface PedidoB2B {
  id: string;
  empresa: string;
  destino: string;
  conductor: string | null;
  estado: PedidoB2BEstado;
  monto: number | null;
  created_at: string;
}
