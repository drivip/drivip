import { useEffect, useRef, useState } from "react";
import { useTenantActions } from "@drivip/supabase";
import type { Tenant } from "@drivip/types";
import { MOCK_DRIVER_PROFILE } from "../mockData/driverMockData";
import { comprimirImagenWebp, type ImagenComprimida } from "../lib/imagen";

interface MiPerfilProps {
  tenant?: Tenant | null;
  demo?: boolean;
  embedded?: boolean;
  onSaved?: () => void;
}

interface FormPerfil {
  nombre: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  vehiculo_tipo: string;
  vehiculo_placa: string;
  vehiculo_modelo: string;
  vehiculo_color: string;
}

const MENSAJES_ERROR: Record<string, string> = {
  nombre_requerido: "El nombre es obligatorio.",
  no_autenticado: "Tu sesión expiró. Vuelve a iniciar sesión.",
  no_autorizado: "No tienes permiso para editar este perfil.",
  vehiculo_tipo_invalido: "Selecciona un tipo de vehículo válido.",
};

function mensajeError(raw: string | null | undefined) {
  if (!raw) return "No se pudo guardar el perfil. Intenta de nuevo.";
  const clave = Object.keys(MENSAJES_ERROR).find((item) => raw.includes(item));
  return clave ? MENSAJES_ERROR[clave] : "No se pudo guardar el perfil. Intenta de nuevo.";
}

function formDesdeTenant(tenant?: Tenant | null): FormPerfil {
  return {
    nombre: tenant?.nombre ?? "",
    telefono: tenant?.telefono ?? "",
    ciudad: tenant?.ciudad ?? "",
    direccion: tenant?.direccion ?? "",
    vehiculo_tipo: tenant?.vehiculo_tipo ?? "",
    vehiculo_placa: tenant?.vehiculo_placa ?? "",
    vehiculo_modelo: tenant?.vehiculo_modelo ?? "",
    vehiculo_color: tenant?.vehiculo_color ?? "",
  };
}

function formatearPeso(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)} KB`;
}

export default function MiPerfil({ tenant, demo = false, embedded = false, onSaved }: MiPerfilProps) {
  const p = demo ? MOCK_DRIVER_PROFILE : null;
  const { actualizarPerfil, subirImagenPerfil } = useTenantActions();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormPerfil>(() => formDesdeTenant(tenant));
  const [foto, setFoto] = useState<ImagenComprimida | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarGuardado, setAvatarGuardado] = useState<string | null>(null);
  const [menuFoto, setMenuFoto] = useState(false);
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [imagenConError, setImagenConError] = useState(false);

  const camaraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);

  const nombre = tenant?.nombre || p?.nombre || "Conductor";
  const cedula = tenant?.cedula || p?.cedula || null;
  const telefono = tenant?.telefono || p?.telefono || null;
  const email = tenant?.email || p?.email || null;
  const plan = tenant?.plan || p?.plan || "estandar";
  const calificacion = tenant?.calificacion ?? p?.calificacion ?? null;
  const totalResenas = tenant?.total_carreras ?? p?.totalResenas ?? 0;
  const vehiculoTipo = tenant?.vehiculo_tipo || p?.vehiculo.tipo || null;
  const vehiculoPlaca = tenant?.vehiculo_placa || p?.vehiculo.placa || null;
  const vehiculoModelo = tenant?.vehiculo_modelo || p?.vehiculo.modelo || null;
  const vehiculoColor = tenant?.vehiculo_color || p?.vehiculo.color || null;
  const ciudad = tenant?.ciudad || null;
  const direccion = tenant?.direccion || null;

  const avatarSrc = previewUrl || avatarGuardado || tenant?.logo_url || p?.avatar || null;
  const mostrarImagen = Boolean(avatarSrc) && !imagenConError;

  useEffect(() => {
    setImagenConError(false);
  }, [avatarSrc]);

  useEffect(() => {
    if (!foto) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(foto.blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  useEffect(() => {
    if (tenant && !editing) setForm(formDesdeTenant(tenant));
  }, [tenant, editing]);

  const iniciarEdicion = () => {
    if (demo) return;
    setForm(formDesdeTenant(tenant));
    setError(null);
    setExito(null);
    setEditing(true);
  };

  const cancelarEdicion = () => {
    setEditing(false);
    setFoto(null);
    setError(null);
    setMenuFoto(false);
    setForm(formDesdeTenant(tenant));
  };

  const abrirMenuFoto = () => {
    if (demo) return;
    if (!editing) {
      setForm(formDesdeTenant(tenant));
      setEditing(true);
    }
    setError(null);
    setExito(null);
    setMenuFoto(true);
  };

  const procesarArchivo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setProcesandoFoto(true);
    setError(null);
    setExito(null);
    try {
      const comprimida = await comprimirImagenWebp(file);
      setFoto(comprimida);
      if (!editing) {
        setForm(formDesdeTenant(tenant));
        setEditing(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar la imagen.");
    } finally {
      setProcesandoFoto(false);
      setMenuFoto(false);
    }
  };

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tenant) return;

    const nombreLimpio = form.nombre.trim();
    if (!nombreLimpio) {
      setError("El nombre es obligatorio.");
      return;
    }

    setGuardando(true);
    setError(null);
    setExito(null);

    let logoUrl = tenant.logo_url ?? null;

    if (foto) {
      const subida = await subirImagenPerfil(tenant.id, foto.blob);
      if (!subida.ok || !subida.url) {
        setError(subida.error ?? "No se pudo subir la imagen.");
        setGuardando(false);
        return;
      }
      logoUrl = subida.url;
    }

    const resultado = await actualizarPerfil({
      nombre: nombreLimpio,
      telefono: form.telefono,
      ciudad: form.ciudad,
      direccion: form.direccion,
      vehiculo_tipo: form.vehiculo_tipo || null,
      vehiculo_placa: form.vehiculo_placa,
      vehiculo_modelo: form.vehiculo_modelo,
      vehiculo_color: form.vehiculo_color,
      logo_url: logoUrl,
    });

    if (!resultado.ok) {
      setError(mensajeError(resultado.error));
      setGuardando(false);
      return;
    }

    if (logoUrl && foto) setAvatarGuardado(logoUrl);
    setFoto(null);
    setEditing(false);
    setGuardando(false);
    setExito("Perfil actualizado correctamente.");
    onSaved?.();
  };

  const inputClass =
    "w-full mt-1 bg-slate-50 rounded-xl px-4 py-2.5 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200";
  const labelClass = "text-[10px] font-bold text-slate-500 uppercase tracking-wider";

  return (
    <div className={embedded ? "space-y-4" : "px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full"}>
      {!embedded && <h1 className="text-xl lg:text-2xl font-black text-slate-900">Mi Perfil</h1>}

      <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center gap-4">
        <div className="relative">
          <div className="relative w-20 h-20 lg:w-24 lg:h-24 overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            {mostrarImagen ? (
              <img
                src={avatarSrc ?? undefined}
                alt={nombre}
                className="h-full w-full object-cover"
                onError={() => setImagenConError(true)}
              />
            ) : (
              <span className="text-3xl lg:text-4xl font-black text-white">
                {nombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
            )}
            {procesandoFoto && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                <span className="material-symbols-outlined animate-spin text-[24px] text-white">progress_activity</span>
              </div>
            )}
          </div>
          {!demo && (
            <button
              type="button"
              onClick={abrirMenuFoto}
              className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-700 text-white shadow-lg shadow-purple-600/30 border-2 border-white active:scale-95"
              aria-label="Cambiar foto de perfil"
            >
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            </button>
          )}
          <span className="absolute -bottom-1 -left-1 w-6 h-6 bg-emerald-500 rounded-full border-3 border-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[12px] text-white">check</span>
          </span>
        </div>
        <div className="text-center">
          <h2 className="text-lg lg:text-xl font-black text-slate-900">{nombre}</h2>
          <p className="text-[11px] lg:text-xs text-slate-500">{cedula || "Sin cédula registrada"}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-lg lg:text-xl font-black text-slate-900">{calificacion != null ? calificacion.toFixed(1) : "-"}</p>
            <p className="text-[10px] lg:text-[11px] text-slate-500">Rating</p>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <p className="text-lg lg:text-xl font-black text-slate-900">{totalResenas}</p>
            <p className="text-[10px] lg:text-[11px] text-slate-500">Carreras</p>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] lg:text-xs font-bold uppercase">{plan}</span>
            <p className="text-[10px] lg:text-[11px] text-slate-500 mt-0.5">Plan</p>
          </div>
        </div>
      </div>

      {exito && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
          <p className="text-[12px] font-semibold text-emerald-700">{exito}</p>
        </div>
      )}

      {editing ? (
        <form onSubmit={guardar} className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Editar perfil</p>
            <button
              type="button"
              onClick={cancelarEdicion}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 active:scale-95"
              aria-label="Cancelar edición"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div>
            <label className={labelClass}>Nombre completo</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={inputClass}
              placeholder="Tu nombre"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelClass}>Teléfono</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className={inputClass}
                placeholder="+58 412-000-0000"
              />
            </div>
            <div>
              <label className={labelClass}>Ciudad</label>
              <input
                type="text"
                value={form.ciudad}
                onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                className={inputClass}
                placeholder="Caracas"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Dirección</label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className={inputClass}
              placeholder="Calle, edificio, sector"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelClass}>Tipo de vehículo</label>
              <select
                value={form.vehiculo_tipo}
                onChange={(e) => setForm({ ...form, vehiculo_tipo: e.target.value })}
                className={inputClass}
              >
                <option value="">Sin especificar</option>
                <option value="moto">Moto</option>
                <option value="carro">Carro</option>
                <option value="camioneta">Camioneta</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Modelo / Marca</label>
              <input
                type="text"
                value={form.vehiculo_modelo}
                onChange={(e) => setForm({ ...form, vehiculo_modelo: e.target.value })}
                className={inputClass}
                placeholder="Toyota Corolla"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelClass}>Color</label>
              <input
                type="text"
                value={form.vehiculo_color}
                onChange={(e) => setForm({ ...form, vehiculo_color: e.target.value })}
                className={inputClass}
                placeholder="Blanco"
              />
            </div>
            <div>
              <label className={labelClass}>Placa</label>
              <input
                type="text"
                value={form.vehiculo_placa}
                onChange={(e) => setForm({ ...form, vehiculo_placa: e.target.value.toUpperCase() })}
                className={`${inputClass} uppercase`}
                placeholder="ABC-123"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-purple-800">Foto de perfil</p>
                <p className="text-[10px] text-purple-600">
                  {foto
                    ? `Lista: ${formatearPeso(foto.blob.size)} · ${foto.mime.replace("image/", "").toUpperCase()}`
                    : "Se comprime a WebP para ocupar menos espacio."}
                </p>
              </div>
              <button
                type="button"
                onClick={abrirMenuFoto}
                disabled={procesandoFoto}
                className="shrink-0 rounded-xl bg-purple-700 px-3 py-2 text-[11px] font-bold text-white active:scale-95 disabled:opacity-50"
              >
                {foto ? "Cambiar" : "Elegir foto"}
              </button>
            </div>
          </div>

          {error && <p className="text-[12px] font-semibold text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={cancelarEdicion}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-[12px] font-bold text-slate-600 active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || procesandoFoto}
              className="flex-[1.4] rounded-xl bg-purple-700 py-3 text-[12px] font-bold text-white shadow-lg shadow-purple-600/25 active:scale-[0.98] disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-1">
            {[
              { icon: "badge", label: "Cédula", value: cedula },
              { icon: "phone", label: "Teléfono", value: telefono },
              { icon: "mail", label: "Email", value: email },
              { icon: "location_city", label: "Ciudad", value: ciudad },
              { icon: "home", label: "Dirección", value: direccion },
              { icon: "directions_car", label: "Vehículo", value: [vehiculoColor, vehiculoModelo].filter(Boolean).join(" ") || null },
              { icon: "pin", label: "Placa", value: vehiculoPlaca },
              { icon: "category", label: "Tipo", value: vehiculoTipo },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 px-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">{item.icon}</span>
                  <span className="text-xs lg:text-sm text-slate-500">{item.label}</span>
                </div>
                <span className="text-xs lg:text-sm font-bold text-slate-900 capitalize">{item.value || "-"}</span>
              </div>
            ))}
          </div>

          {error && <p className="text-[12px] font-semibold text-red-500">{error}</p>}

          <button
            type="button"
            onClick={iniciarEdicion}
            disabled={demo}
            className="w-full py-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm lg:text-base active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Editar Perfil
          </button>
        </>
      )}

      <input
        ref={camaraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={procesarArchivo}
      />
      <input
        ref={galeriaRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={procesarArchivo}
      />

      {menuFoto && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setMenuFoto(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="px-1 pb-3 text-sm font-black text-slate-900">Cambiar foto de perfil</p>
            <button
              type="button"
              onClick={() => {
                setMenuFoto(false);
                camaraRef.current?.click();
              }}
              className="mb-2 flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left active:scale-[0.99]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              </span>
              <span>
                <span className="block text-[13px] font-bold text-slate-900">Tomar foto</span>
                <span className="block text-[10px] text-slate-500">Abrir la cámara del teléfono</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuFoto(false);
                galeriaRef.current?.click();
              }}
              className="mb-2 flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left active:scale-[0.99]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <span className="material-symbols-outlined text-[20px]">photo_library</span>
              </span>
              <span>
                <span className="block text-[13px] font-bold text-slate-900">Elegir de la galería</span>
                <span className="block text-[10px] text-slate-500">Selecciona una imagen existente</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMenuFoto(false)}
              className="w-full rounded-2xl bg-slate-100 py-3 text-[12px] font-bold text-slate-600 active:scale-[0.99]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
