import { useState, useEffect, useRef } from "react";
import { useTenantBySlug, useAuthContext, APP_URLS, agregarConductorRed } from "@drivip/supabase";

interface AddConductorProps {
  slug: string;
  onAdded: () => void;
  onBack: () => void;
  autoAdd?: boolean;
}

export default function AddConductor({ slug, onAdded, onBack, autoAdd = false }: AddConductorProps) {
  const { user } = useAuthContext();
  const { tenant, loading: tenantLoading, error: tenantError } = useTenantBySlug(slug);
  const [apodo, setApodo] = useState("");
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!user || !tenant) return;
    setAddError(null);
    setAdding(true);
    try {
      await agregarConductorRed(tenant.slug, apodo);
      setAdded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setAddError(
        message.includes("conductor_no_encontrado")
          ? "Ese enlace ya no existe. Escanea el QR actualizado del conductor."
          : "No se pudo agregar. Revisa tu conexión e intenta de nuevo."
      );
    } finally {
      setAdding(false);
    }
  };

  const autoAddedRef = useRef(false);
  useEffect(() => {
    if (!autoAdd || autoAddedRef.current) return;
    if (!user || !tenant || added || adding || addError) return;
    autoAddedRef.current = true;
    void handleAdd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAdd, user, tenant, added, adding, addError]);

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-[24px] text-purple-600">person_search</span>
          </div>
          <p className="text-sm text-slate-500 font-medium">Buscando conductor...</p>
        </div>
      </div>
    );
  }

  if (tenantError || !tenant) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px] text-red-500">error</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Conductor no encontrado</h2>
          <p className="text-sm text-slate-500">El enlace no es válido, está incompleto o el conductor ya no existe.</p>
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl bg-purple-600 text-white text-sm font-bold active:scale-95 transition"
          >
            Buscar conductor manualmente
          </button>
        </div>
      </div>
    );
  }

  if (added) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px] text-emerald-600">check_circle</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">¡{tenant.nombre} está en tu círculo!</h2>
          <p className="text-sm text-slate-500">Ahora puedes pedirle carreras directamente desde tu app.</p>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-xs text-slate-400 mb-2">Próximo paso:</p>
            <p className="text-sm font-semibold text-slate-700">Abre Drivip y selecciona a {tenant.nombre} para pedir tu primera carrera</p>
          </div>
          <button
            onClick={onAdded}
            className="w-full py-3 rounded-xl bg-purple-600 text-white text-sm font-bold active:scale-95 transition"
          >
            Ir a Mis Conductores
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#f4f6f8]/95 backdrop-blur-md px-4 pt-3 pb-3 border-b border-slate-200/50">
        <div className="flex items-center gap-3">
          <button
            className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-700 active:scale-95 transition border border-slate-100"
            style={{ boxShadow: "3px 3px 8px #d9dce1, -3px -3px 8px #ffffff" }}
            onClick={onBack}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900">Agregar Conductor</h1>
            <p className="text-[11px] text-slate-400">desde {APP_URLS.conductor}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-6 space-y-4">
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/60 border border-slate-100/90 space-y-5">
          {/* Conductor profile */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center shadow-md">
              <span className="text-2xl font-black text-purple-700">{tenant.nombre.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">{tenant.nombre}</h2>
              <p className="text-xs text-slate-500 font-mono truncate">{APP_URLS.conductor}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Verificado</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {tenant.type === "conductor" ? "Conductor" : "Línea"}
                </span>
              </div>
            </div>
          </div>

          {/* Apodo */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Apodo (opcional)</label>
            <input
              type="text"
              value={apodo}
              onChange={(e) => setApodo(e.target.value)}
              placeholder="Ej: Mi taxi favorito"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-300 transition"
            />
          </div>

          {addError && (
            <p className="text-xs text-red-500 text-center">{addError}</p>
          )}

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={adding}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50"
          >
            {adding ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Agregando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                Agregar a mi círculo
              </>
            )}
          </button>
        </div>

        {/* Info card */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-100">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[20px] text-purple-600 mt-0.5">info</span>
            <div>
              <p className="text-xs font-bold text-purple-900">¿Qué significa esto?</p>
              <p className="text-[11px] text-purple-700 mt-0.5">Este conductor quedará guardado en "Mi Círculo". Podrás pedirle carreras directamente sin intermediarios.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
