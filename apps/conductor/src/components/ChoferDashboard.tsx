import { useEffect, useMemo, useRef, useState } from "react";
import type { Carrera, DisponibilidadConductor } from "@drivip/types";
import { useClientesTenant, useResenasConductor } from "@drivip/supabase";
import DriverAdCarousel from "./driver/DriverAdCarousel";
import StatusHeroCard from "./driver/StatusHeroCard";
import IncomingServiceCard from "./driver/IncomingServiceCard";
import IncomingOrderModal from "./driver/IncomingOrderModal";
import ActiveServiceModal from "./driver/ActiveServiceModal";

interface Props {
  onNavigate: (module: string) => void;
  tenantId?: string | null;
  carreras: Carrera[];
  disponibilidad: DisponibilidadConductor;
  disponibilidadNota?: string | null;
  disponibilidadHasta?: string | null;
  guardandoDisponibilidad?: boolean;
  disponibilidadError?: string | null;
  onDisponibilidadChange: (estado: DisponibilidadConductor, nota?: string | null) => void;
  onAcceptCarrera: (id: string) => void;
  onRejectCarrera: (id: string) => void;
  onStartCarrera: (id: string) => void;
  onCompleteCarrera: (id: string) => void;
  onArrivedAtPickup?: (id: string) => void;
  onQuoteCarrera?: (id: string, precio: number) => Promise<boolean>;
  carreraActiva: string | null;
  profileName: string;
  isPaused?: boolean;
  totalNoLeidos?: number;
}

export default function ChoferDashboard({
  onNavigate,
  tenantId,
  carreras,
  disponibilidad,
  disponibilidadNota,
  disponibilidadHasta,
  guardandoDisponibilidad,
  disponibilidadError,
  onDisponibilidadChange,
  onAcceptCarrera,
  onRejectCarrera,
  onStartCarrera,
  onCompleteCarrera,
  onArrivedAtPickup,
  onQuoteCarrera,
  carreraActiva,
  profileName,
  isPaused,
  totalNoLeidos = 0,
}: Props) {
  const [incomingModalId, setIncomingModalId] = useState<string | null>(null);
  const seenIncomingRef = useRef<Set<string>>(new Set());

  const { clientes } = useClientesTenant(tenantId);
  const { promedio, total: totalResenas } = useResenasConductor(tenantId);

  const clientesMap = useMemo(() => {
    const map = new Map<string, { nombre: string; telefono: string | null }>();
    clientes.forEach((cliente) => {
      map.set(cliente.profile_id ?? cliente.id, {
        nombre: cliente.nombre,
        telefono: cliente.telefono,
      });
    });
    return map;
  }, [clientes]);

  const hoy = new Date().toDateString();
  const carrerasHoy = carreras.filter(
    (carrera) => new Date(carrera.created_at).toDateString() === hoy
  );
  const ingresosHoy = carrerasHoy
    .filter((carrera) => carrera.estado === "completada")
    .reduce((sum, carrera) => sum + (carrera.precio ?? 0), 0);
  const completadasHoy = carrerasHoy.filter((carrera) => carrera.estado === "completada").length;

  const pendientes = useMemo(
    () =>
      carreras
        .filter((carrera) => carrera.estado === "pendiente" && carrera.id !== carreraActiva)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [carreras, carreraActiva]
  );

  const carreraPendiente = pendientes[0] ?? null;
  const carreraEnCurso = carreraActiva
    ? carreras.find((carrera) => carrera.id === carreraActiva) ?? null
    : null;

  const puedeRecibir = disponibilidad === "disponible" && !isPaused;
  const pendienteModal = pendientes.find((carrera) => carrera.id === incomingModalId) ?? null;

  const infoCliente = (carrera: Carrera | null) => {
    if (!carrera?.cliente_id) return { nombre: "Cliente", telefono: null as string | null };
    const cliente = clientesMap.get(carrera.cliente_id);
    return {
      nombre: cliente?.nombre ?? "Cliente",
      telefono: cliente?.telefono ?? null,
    };
  };

  useEffect(() => {
    if (!carreraPendiente || !puedeRecibir || carreraActiva) return;
    if (seenIncomingRef.current.has(carreraPendiente.id)) return;
    seenIncomingRef.current.add(carreraPendiente.id);
    setIncomingModalId(carreraPendiente.id);
  }, [carreraPendiente?.id, puedeRecibir, carreraActiva]);

  useEffect(() => {
    if (incomingModalId && !pendientes.some((carrera) => carrera.id === incomingModalId)) {
      setIncomingModalId(null);
    }
  }, [incomingModalId, pendientes]);

  const aceptar = (id: string) => {
    onAcceptCarrera(id);
    setIncomingModalId(null);
  };

  const rechazar = (id: string, _motivo?: string) => {
    onRejectCarrera(id);
    setIncomingModalId(null);
  };

  const clientePendiente = infoCliente(carreraPendiente);
  const clienteModal = infoCliente(pendienteModal);
  const clienteActivo = infoCliente(carreraEnCurso);

  const primerNombre = profileName.trim().split(/\s+/)[0] || "Conductor";
  const fecha = new Date().toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-4 lg:px-8 lg:py-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-600">
            Panel del conductor
          </p>
          <h1 className="text-xl font-black leading-tight text-slate-900 lg:text-2xl">
            Hola, {primerNombre}
          </h1>
          <p className="mt-0.5 text-[11px] font-semibold capitalize text-slate-500">{fecha}</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black ${
            puedeRecibir ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${puedeRecibir ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
          {isPaused ? "Pausado" : puedeRecibir ? "En línea" : "Sin solicitudes"}
        </span>
      </div>

      <DriverAdCarousel tenantId={tenantId} onNavigate={onNavigate} />

      <StatusHeroCard
        estado={disponibilidad}
        nota={disponibilidadNota}
        hasta={disponibilidadHasta}
        guardando={guardandoDisponibilidad}
        isPaused={isPaused}
        syncError={disponibilidadError}
        onChange={onDisponibilidadChange}
        dailyEarnings={ingresosHoy}
        dailyRides={completadasHoy}
        rating={promedio}
        totalResenas={totalResenas}
        onOpenReviews={() => onNavigate("resenas")}
      />

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-slate-900">Solicitudes</h2>
            {pendientes.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-700">
                {pendientes.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-400">Tiempo real</span>
        </div>

        {carreraEnCurso && (
          <button
            type="button"
            onClick={() => onNavigate("carreras")}
            className="flex w-full items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-left active:scale-[0.99]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <span className="material-symbols-outlined text-[20px]">local_taxi</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-emerald-900">Servicio en curso</p>
              <p className="truncate text-[10px] font-semibold text-emerald-700">
                {carreraEnCurso.destino_direccion ?? "Ver detalles del servicio"}
              </p>
            </div>
            <span className="material-symbols-outlined text-[18px] text-emerald-600">chevron_right</span>
          </button>
        )}

        {carreraPendiente && puedeRecibir && !carreraActiva && (
          <IncomingServiceCard
            carrera={carreraPendiente}
            clienteNombre={clientePendiente.nombre}
            clienteTelefono={clientePendiente.telefono}
            onAccept={() => aceptar(carreraPendiente.id)}
            onOpenMap={() => setIncomingModalId(carreraPendiente.id)}
            onReject={() => setIncomingModalId(carreraPendiente.id)}
          />
        )}

        {carreraPendiente && !puedeRecibir && !carreraActiva && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <span className="material-symbols-outlined text-[20px]">notifications_active</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-amber-900">
                  Tienes {pendientes.length} {pendientes.length === 1 ? "solicitud esperando" : "solicitudes esperando"}
                </p>
                <p className="mt-0.5 text-[10px] font-medium leading-snug text-amber-700">
                  Actívate como Disponible para ver y aceptar servicios nuevos.
                </p>
                <button
                  type="button"
                  onClick={() => onDisponibilidadChange("disponible")}
                  disabled={isPaused}
                  className="mt-2 rounded-xl bg-amber-500 px-3 py-1.5 text-[10px] font-black text-white active:scale-95 disabled:opacity-50"
                >
                  Estar disponible
                </button>
              </div>
            </div>
          </div>
        )}

        {!carreraPendiente && !carreraEnCurso && (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-200/50">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
              <span className="material-symbols-outlined text-[22px]">local_taxi</span>
              {puedeRecibir && (
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-slate-900">
                {puedeRecibir ? "Esperando servicios..." : "No estás recibiendo solicitudes"}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                {puedeRecibir
                  ? "Te avisaremos en cuanto un cliente de tu red solicite un servicio."
                  : "Cambia tu estado a Disponible cuando quieras volver a recibir carreras."}
              </p>
            </div>
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                puedeRecibir ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
              }`}
            />
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-black text-slate-900">Accesos rápidos</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onNavigate("mensajes")}
            className="relative flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-md shadow-slate-200/40 active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <span className="material-symbols-outlined text-[20px]">forum</span>
            </span>
            <div>
              <p className="text-[11px] font-black text-slate-900">Mensajes</p>
              <p className="text-[9px] font-semibold text-slate-500">
                {totalNoLeidos > 0 ? `${totalNoLeidos} sin leer` : "Centro de chat"}
              </p>
            </div>
            {totalNoLeidos > 0 && (
              <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
                {totalNoLeidos}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate("resenas")}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-md shadow-slate-200/40 active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <span className="material-symbols-outlined text-[20px]">reviews</span>
            </span>
            <div>
              <p className="text-[11px] font-black text-slate-900">Mis reseñas</p>
              <p className="text-[9px] font-semibold text-slate-500">
                {totalResenas > 0 ? `${promedio.toFixed(1)} de 5` : "Sin reseñas"}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("clientes")}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-md shadow-slate-200/40 active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </span>
            <div>
              <p className="text-[11px] font-black text-slate-900">Mis clientes</p>
              <p className="text-[9px] font-semibold text-slate-500">{clientes.length} en tu red</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("qr")}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-md shadow-slate-200/40 active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
            </span>
            <div>
              <p className="text-[11px] font-black text-slate-900">Mi QR</p>
              <p className="text-[9px] font-semibold text-slate-500">Comparte tu perfil</p>
            </div>
          </button>
        </div>
      </section>

      {pendienteModal && (
        <IncomingOrderModal
          isOpen
          onAccept={() => aceptar(pendienteModal.id)}
          onReject={(motivo) => rechazar(pendienteModal.id, motivo)}
          onDismiss={() => setIncomingModalId(null)}
          onQuote={(precio) => onQuoteCarrera?.(pendienteModal.id, precio) ?? Promise.resolve(false)}
          carrera={pendienteModal}
          clienteNombre={clienteModal.nombre}
          clienteTelefono={clienteModal.telefono}
        />
      )}

      {carreraEnCurso && (
        <ActiveServiceModal
          carrera={carreraEnCurso}
          clienteNombre={clienteActivo.nombre}
          clienteTelefono={clienteActivo.telefono}
          onArrived={() => onArrivedAtPickup?.(carreraEnCurso.id)}
          onStart={() => onStartCarrera(carreraEnCurso.id)}
          onComplete={() => onCompleteCarrera(carreraEnCurso.id)}
          onCancel={() => onRejectCarrera(carreraEnCurso.id)}
        />
      )}
    </div>
  );
}
