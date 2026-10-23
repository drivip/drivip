import { supabase } from "./client";

export interface PushCarreraInput {
  carrera_id: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

/**
 * Envia una notificacion push a la contraparte de una carrera.
 * El backend valida la participacion y calcula el destinatario:
 * si llama el cliente va al conductor; si llama el conductor va al cliente.
 */
export async function enviarPushCarrera(input: PushCarreraInput): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke("send-push", { body: input });
    return !error;
  } catch {
    return false;
  }
}

export interface PushReservaInput {
  reserva_id: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

/**
 * Envia una notificacion push a la contraparte de una reserva.
 * El backend valida la participacion y calcula el destinatario.
 */
export async function enviarPushReserva(input: PushReservaInput): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke("send-push", { body: input });
    return !error;
  } catch {
    return false;
  }
}
