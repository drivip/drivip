import { useEffect, useState } from "react";
import type { TarifaModo, Tenant } from "@drivip/types";
import { DEFAULT_TARIFA_BASE, DEFAULT_TARIFA_POR_KM } from "@drivip/types";
import { guardarTarifas, useZonas } from "@drivip/supabase";
import { MOCK_ZONE_PRICING } from "../mockData/driverMockData";

interface MisPreciosProps {
  tenant?: Tenant | null;
  demo?: boolean;
  onSaved?: () => void;
}

interface ZonaDraft {
  id: string | null;
  nombre: string;
  precio: number;
}

const ZONE_GRADIENTS = [
  "from-purple-500 to-indigo-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-500",
];

const defaultZonas: ZonaDraft[] = MOCK_ZONE_PRICING.map((z) => ({
  id: null,
  nombre: z.zona,
  precio: z.porKm,
}));

export default function MisPrecios({ tenant, demo = false, onSaved }: MisPreciosProps) {
  const useRemote = !demo && Boolean(tenant?.id);
  const { zonas, insertarZona, actualizarZona, eliminarZona } = useZonas(useRemote ? tenant?.id : null);

  const [modo, setModo] = useState<TarifaModo>("km");
  const [base, setBase] = useState(DEFAULT_TARIFA_BASE);
  const [porKm, setPorKm] = useState(DEFAULT_TARIFA_POR_KM);
  const [zonasDraft, setZonasDraft] = useState<ZonaDraft[]>(defaultZonas);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useEffect(() => {
    if (!tenant) {
      setModo("km");
      setBase(DEFAULT_TARIFA_BASE);
      setPorKm(DEFAULT_TARIFA_POR_KM);
      setZonasDraft(defaultZonas);
      return;
    }
    setModo(tenant.tarifa_modo ?? "km");
    setBase(Number(tenant.tarifa_base ?? DEFAULT_TARIFA_BASE));
    setPorKm(Number(tenant.tarifa_por_km ?? DEFAULT_TARIFA_POR_KM));
  }, [tenant]);

  useEffect(() => {
    if (!useRemote) return;
    setZonasDraft(zonas.map((z) => ({ id: z.id, nombre: z.nombre, precio: Number(z.precio) })));
  }, [useRemote, zonas]);

  const actualizarZonaDraft = (index: number, cambios: Partial<ZonaDraft>) => {
    setZonasDraft((prev) => prev.map((z, i) => (i === index ? { ...z, ...cambios } : z)));
  };

  const agregarZona = () => {
    setZonasDraft((prev) => [...prev, { id: null, nombre: `Zona ${prev.length + 1}`, precio: 0 }]);
  };

  const quitarZona = (index: number) => {
    setZonasDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setMensaje(null);

    if (!useRemote) {
      setGuardando(false);
      setMensaje({ tipo: "ok", texto: "Tarifas guardadas (modo demo)." });
      onSaved?.();
      return;
    }

    const resultado = await guardarTarifas(modo, base, porKm);
    if (!resultado.ok) {
      setGuardando(false);
      setMensaje({ tipo: "error", texto: resultado.error ?? "No se pudieron guardar las tarifas." });
      return;
    }

    const idsDraft = new Set(zonasDraft.map((z) => z.id).filter(Boolean) as string[]);
    const eliminadas = zonas.filter((z) => !idsDraft.has(z.id));
    await Promise.all(eliminadas.map((z) => eliminarZona(z.id)));

    for (const zona of zonasDraft) {
      if (!zona.nombre.trim()) continue;
      if (zona.id) {
        await actualizarZona(zona.id, { nombre: zona.nombre.trim(), precio: zona.precio });
      } else {
        await insertarZona(zona.nombre.trim(), zona.precio);
      }
    }

    setGuardando(false);
    setMensaje({ tipo: "ok", texto: "Tarifas guardadas. Tus clientes ya ven el nuevo precio." });
    onSaved?.();
  };

  const ejemploKm = 5;
  const ejemploPrecio = base + porKm * ejemploKm;

  return (
    <div className="px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full">
      <div>
        <h1 className="text-xl lg:text-2xl font-black text-slate-900">Configurar Tarifas</h1>
        <p className="text-[11px] lg:text-xs text-slate-500 mt-1">
          Elige tu metodo de cobro. La app de tus clientes calcula y muestra el precio automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-2 p-1 bg-white rounded-2xl border border-slate-200/60 shadow-md shadow-slate-200/40">
        <button
          onClick={() => setModo("km")}
          className={`py-2.5 rounded-xl font-bold text-xs lg:text-sm transition ${modo === "km" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md" : "text-slate-600"}`}
        >
          Por Kilómetro
        </button>
        <button
          onClick={() => setModo("zona")}
          className={`py-2.5 rounded-xl font-bold text-xs lg:text-sm transition ${modo === "zona" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md" : "text-slate-600"}`}
        >
          Zona Fija
        </button>
      </div>

      {modo === "km" ? (
        <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[20px]">route</span>
            </div>
            <div>
              <p className="text-sm lg:text-base font-black text-slate-900">Tarifa por Kilómetro</p>
              <p className="text-[10px] lg:text-[11px] text-slate-500">Precio = base + ($/km × distancia)</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <label className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase">Base ($)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={base}
                onChange={(e) => setBase(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 bg-white rounded-xl px-3 py-2 text-base font-black text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
              />
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <label className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase">$/KM</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={porKm}
                onChange={(e) => setPorKm(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 bg-white rounded-xl px-3 py-2 text-base font-black text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
              />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-between">
            <span className="text-[11px] lg:text-xs text-purple-700 font-medium">Ejemplo: {ejemploKm} km</span>
            <span className="text-base lg:text-lg font-black text-purple-800">${ejemploPrecio.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {zonasDraft.map((zona, index) => (
            <div key={zona.id ?? `nueva-${index}`} className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${ZONE_GRADIENTS[index % ZONE_GRADIENTS.length]} text-white flex items-center justify-center shadow-md`}>
                  <span className="text-sm font-bold">{index + 1}</span>
                </div>
                <input
                  type="text"
                  value={zona.nombre}
                  onChange={(e) => actualizarZonaDraft(index, { nombre: e.target.value })}
                  placeholder="Nombre de la zona"
                  className="flex-1 min-w-0 text-sm lg:text-base font-black text-slate-900 bg-transparent border-b border-slate-200 focus:outline-none focus:border-purple-500 py-1"
                />
                <button
                  onClick={() => quitarZona(index)}
                  className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 text-red-500 flex items-center justify-center active:scale-95 transition flex-shrink-0"
                  aria-label={`Eliminar ${zona.nombre}`}
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <label className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase">Precio fijo ($)</label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={zona.precio}
                  onChange={(e) => actualizarZonaDraft(index, { precio: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 bg-white rounded-xl px-3 py-2 text-base font-black text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                />
              </div>
            </div>
          ))}
          <button
            onClick={agregarZona}
            className="w-full py-3 rounded-2xl bg-purple-50 border border-dashed border-purple-300 text-purple-700 font-bold text-xs lg:text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
            Agregar zona
          </button>
        </div>
      )}

      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-2xl p-3">
        <span className="material-symbols-outlined text-[18px] text-blue-600 mt-0.5">info</span>
        <p className="text-[11px] lg:text-xs text-blue-700 leading-snug">
          {modo === "km"
            ? "El cliente vera el precio calculado con tu base y tu precio por kilometro segun la distancia del viaje."
            : "El cliente elegira su zona y vera el precio fijo que definiste para esa zona."}
        </p>
      </div>

      {mensaje && (
        <p className={`text-[12px] font-semibold text-center ${mensaje.tipo === "ok" ? "text-emerald-600" : "text-red-500"}`}>
          {mensaje.texto}
        </p>
      )}

      <button
        onClick={handleGuardar}
        disabled={guardando}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white font-black text-sm lg:text-base shadow-lg shadow-purple-600/30 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-[18px]">{guardando ? "sync" : "save"}</span>
        {guardando ? "Guardando..." : "Guardar Tarifas"}
      </button>
    </div>
  );
}
