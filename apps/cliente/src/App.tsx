import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  AuthProvider, useAuthContext, supabase, useTenantBySlug, useRedCliente, useTarifasTenant,
  useTasaCambio, useConductoresRed, useMisCarreras, crearCarreraCliente, calificarCarrera,
  cancelarCarrera, useDireccionesCliente, useReservasCliente, enviarPushCarrera,
  crearSolicitudServicio, conductorInviteUrl, useConversacionesCliente,
} from "@drivip/supabase";
import { TASA_BCV_REFERENCIA } from "@drivip/types";
import {
  fetchDrivingRoute,
  isInVenezuela,
  reverseVenezuelaPlace,
  searchVenezuelaPlaces,
  VENEZUELA_CENTER,
  VENEZUELA_STATES,
} from "@drivip/maps";
import { useCarreraRealtime } from "./hooks/useCarreraRealtime";
import { useConductorLocation } from "./hooks/useConductorLocation";
import { useScrollLock } from "./hooks/useScrollLock";
import { toDriver } from "./lib/driverMapper";
import PassengerHeader from "./components/passenger/PassengerHeader";
import PassengerBottomNav from "./components/passenger/PassengerBottomNav";
import NavGlyph from "./components/passenger/NavGlyph";
import AdCarousel from "./components/passenger/AdCarousel";
import ServiceHub from "./components/passenger/ServiceHub";
import CouponsSection from "./components/passenger/CouponsSection";
import VipDriversSection from "./components/passenger/VipDriversSection";
import OtherDriversModal from "./components/passenger/OtherDriversModal";
import ServiceRequestModal, { type ServiceMode, type ServiceRequestInput } from "./components/passenger/ServiceRequestModal";
import MessageCenter from "./components/passenger/MessageCenter";
import RouteCalculator from "./components/passenger/RouteCalculator";
import MapPickerModal from "./components/passenger/MapPickerModal";
import LiveTripTracker from "./components/passenger/LiveTripTracker";
import RatingModal from "./components/passenger/RatingModal";
import GridMenuDrawer from "./components/passenger/GridMenuDrawer";
import DriversList from "./components/passenger/DriversList";
import TripHistory from "./components/passenger/TripHistory";
import SavedAddresses from "./components/passenger/SavedAddresses";
import Reservations from "./components/passenger/Reservations";
import AuthModal from "./components/passenger/AuthModal";
import Toast from "./components/passenger/Toast";
import AddConductor from "./components/passenger/AddConductor";

import type { PassengerScreen, Driver, TripHistory as TripHistoryType, SavedAddress, Reservation } from "./types/passenger";
import type { Carrera, MetodoPago } from "@drivip/types";

const METODO_PAGO_MAP: Record<"usd" | "bs" | "pmovil", MetodoPago> = {
  usd: "efectivo",
  bs: "efectivo",
  pmovil: "pago_movil",
};

/* ==================== LANDING PAGE ==================== */
function LandingPage({ onShowAuth }: { onShowAuth: (mode: "login" | "register") => void }) {
  return (
    <div className="min-h-screen bg-[#f4f6f8] font-sans">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Drivip" className="h-9 w-auto" />
          </div>
          <div className="hidden md:flex items-center gap-6 text-[12px] font-semibold text-slate-500">
            <a href="#beneficios" className="hover:text-slate-900 transition">Beneficios</a>
            <a href="#como-instalar" className="hover:text-slate-900 transition">Cómo Instalar</a>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://drivip-conductor.pages.dev" className="px-4 py-2 rounded-xl text-[12px] font-bold text-slate-500 hover:text-slate-900 transition">Soy Conductor</a>
            <button onClick={() => onShowAuth("login")} className="px-4 py-2 rounded-xl text-[12px] font-bold text-purple-700 bg-purple-50 border border-purple-100 hover:bg-purple-100 active:scale-95 transition">Iniciar Sesión</button>
            <button onClick={() => onShowAuth("register")} className="px-4 py-2 rounded-xl text-[12px] font-bold text-white bg-purple-700 shadow-md active:scale-95 transition">Registrarse</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-14 lg:pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200 mb-6">
          <span className="material-symbols-outlined text-[14px] text-purple-600">location_on</span>
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Disponible en tu ciudad</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-5" style={{ fontFamily: "Poppins, sans-serif" }}>
          Guarda a tus<br />
          <span className="text-purple-700">conductores de confianza</span>
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto mb-8">Pide al que esté activo o cobre menos. Paga directo al conductor, como siempre.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => onShowAuth("register")} className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-purple-700 text-white font-bold text-[13px] shadow-lg shadow-purple-600/25 active:scale-95 transition flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">person_add</span> Registrarse Gratis
          </button>
          <button onClick={() => onShowAuth("login")} className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-white text-slate-900 font-bold text-[13px] border border-slate-200 shadow-md active:scale-95 transition flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">login</span> Iniciar Sesión
          </button>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section id="beneficios" className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Beneficios</span>
          <h2 className="text-2xl font-black text-slate-900 mt-1" style={{ fontFamily: "Poppins, sans-serif" }}>¿Por qué Drivip?</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: "bookmark", title: "Guarda tus conductores", desc: "Ten a todos tus conductores favoritos en un solo panel.", gradient: "from-purple-500 to-indigo-600" },
            { icon: "search", title: "Elige al mejor", desc: "Pide al que esté activo o cobre menos. Sin escribir a cinco taxistas.", gradient: "from-orange-400 to-red-500" },
            { icon: "qr_code_scanner", title: "Escanea y listo", desc: "Abres el QR de tu conductor y se instala en tu teléfono. Sin tienda de apps.", gradient: "from-emerald-400 to-teal-600" },
            { icon: "paid", title: "Paga directo", desc: "Efectivo, Pago Móvil, Zelle. El conductor recibe todo.", gradient: "from-amber-500 to-orange-500" },
            { icon: "history", title: "Historial", desc: "Ves cuánto has pagado, a quién y cuándo.", gradient: "from-blue-500 to-indigo-600" },
            { icon: "event", title: "Reservas", desc: "Agenda un viaje para mañana o para la próxima semana.", gradient: "from-violet-500 to-purple-700" },
          ].map((b) => (
            <div key={b.title} className="bg-white rounded-2xl p-5 border border-slate-100 hover:scale-[1.02] transition-transform" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${b.gradient} text-white flex items-center justify-center shadow-md mb-4`}>
                <span className="material-symbols-outlined text-[20px]">{b.icon}</span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-1">{b.title}</h3>
              <p className="text-[12px] text-slate-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMO INSTALAR */}
      <section id="como-instalar" className="bg-white border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
          <div className="text-center mb-10">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Paso a Paso</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1" style={{ fontFamily: "Poppins, sans-serif" }}>Cómo descargar tu app</h2>
            <p className="text-[12px] text-slate-500 mt-2">No necesitas Google Play ni App Store. Se instala desde el navegador.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[20px]">android</span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">En Android (Chrome)</h3>
              </div>
              <div className="space-y-3">
                {[
                  { step: 1, text: "Abre el link de Drivip en Chrome" },
                  { step: 2, text: "Toca el menú de tres puntos en la esquina superior derecha" },
                  { step: 3, text: "Selecciona \"Agregar a pantalla de inicio\"" },
                  { step: 4, text: "Confirma. El ícono de Drivip aparecerá en tu pantalla" },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-black text-purple-700">{s.step}</span>
                    </div>
                    <span className="text-[12px] text-slate-600 leading-relaxed">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[20px]">phone_iphone</span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">En iPhone (Safari)</h3>
              </div>
              <div className="space-y-3">
                {[
                  { step: 1, text: "Abre el link de Drivip en Safari" },
                  { step: 2, text: "Toca el botón de compartir (el cuadrito con la flecha)" },
                  { step: 3, text: "Selecciona \"Agregar a pantalla de inicio\"" },
                  { step: 4, text: "Toca \"Agregar\". El ícono quedará en tu pantalla" },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-black text-purple-700">{s.step}</span>
                    </div>
                    <span className="text-[12px] text-slate-600 leading-relaxed">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-6 max-w-lg mx-auto">Una vez instalada, la app se abre en su propia ventana, sin barra de navegador, con su propio ícono. Se ve y se siente como una app nativa.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="bg-purple-700 rounded-3xl p-10 text-center shadow-2xl shadow-purple-600/30">
          <h2 className="text-2xl font-black text-white mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>¿Listo para viajar?</h2>
          <p className="text-purple-100 mb-6 text-sm">Crea tu cuenta gratis y empieza a usar Drivip.</p>
          <button onClick={() => onShowAuth("register")} className="px-7 py-3 rounded-2xl bg-white text-purple-700 font-bold text-[13px] shadow-lg active:scale-95 transition">
            Registrarse Gratis
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Drivip" className="h-7 w-auto" />
          </div>
          <div className="flex items-center gap-6 text-[11px] font-semibold text-slate-400">
            <a href="https://drivip-home.pages.dev" className="hover:text-slate-900 transition">Inicio</a>
            <a href="https://drivip-conductor.pages.dev" className="hover:text-slate-900 transition">Soy Conductor</a>
            <a href="#" className="hover:text-slate-900 transition">Términos</a>
            <a href="#" className="hover:text-slate-900 transition">Privacidad</a>
          </div>
          <span className="text-[11px] text-slate-400">© 2026 Drivip</span>
        </div>
      </footer>
    </div>
  );
}

/* ==================== LOGIN ==================== */
function LoginScreen({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { signIn, loading, error } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f4f6f8] p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 lg:p-8 space-y-5 border border-slate-100" style={{ boxShadow: "6px 6px 14px #d9dde2, -6px -6px 14px #ffffff" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="material-symbols-outlined text-[26px] text-white">person</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-slate-900">Drivip Cliente</h1>
            <p className="text-[12px] text-slate-500">Iniciar sesión</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
              placeholder="cliente@email.com" required />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
              placeholder="••••••••" required />
          </div>
          {error && <p className="text-[12px] text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-purple-700 text-white font-bold text-[13px] disabled:opacity-50 shadow-lg shadow-purple-600/30">
            {loading ? "Procesando..." : "Ingresar"}
          </button>
        </form>

        <button onClick={onSwitchToRegister} className="w-full text-center text-[12px] text-purple-600 font-bold">
          No tengo cuenta — Crear gratis
        </button>
        <a href="https://drivip-home.pages.dev" className="block text-center text-[11px] text-slate-400 hover:text-slate-600">← Volver a Drivip</a>
      </div>
    </div>
  );
}

/* ==================== REGISTER ==================== */
function RegisterScreen({ onSwitchToLogin, inviteConductor }: { onSwitchToLogin: () => void; inviteConductor?: string | null }) {
  const [form, setForm] = useState({
    nombreCompleto: "",
    email: "",
    telefono: "",
    password: "",
    estado: "Distrito Capital",
    ciudad: "Caracas",
  });
  const [step, setStep] = useState<"form" | "success">("form");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ciudades = useMemo(
    () => VENEZUELA_STATES.find((estado) => estado.nombre === form.estado)?.ciudades ?? [],
    [form.estado],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const nombreCompleto = form.nombreCompleto.trim();
    const email = form.email.trim();
    const telefono = form.telefono.trim();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          rol: "cliente",
          nombre: nombreCompleto,
          telefono,
          estado: form.estado,
          ciudad: form.ciudad,
        },
      },
    });

    if (authError) {
      setFormError(authError.message);
      setSubmitting(false);
      return;
    }

    const user = authData?.user;
    if (!user) {
      setFormError("No se pudo crear la cuenta. Intenta de nuevo.");
      setSubmitting(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      rol: "cliente",
      nombre: nombreCompleto,
      telefono,
      email,
      estado: form.estado,
      ciudad: form.ciudad,
      activo: true,
    });

    if (profileError) {
      setFormError("Error al crear perfil. Intenta de nuevo.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setStep("success");
  };

  const update = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateEstado = (estado: string) => {
    const ciudad = VENEZUELA_STATES.find((item) => item.nombre === estado)?.ciudades[0] ?? "";
    setForm((prev) => ({ ...prev, estado, ciudad }));
  };

  if (step === "success") return <PostRegisterScreen onContinue={onSwitchToLogin} />;

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f4f6f8] p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 lg:p-8 space-y-4 border border-slate-100" style={{ boxShadow: "6px 6px 14px #d9dde2, -6px -6px 14px #ffffff" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="material-symbols-outlined text-[26px] text-white">person_add</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-slate-900">Crear Cuenta</h1>
            <p className="text-[12px] text-slate-500">Registro de cliente en Drivip</p>
          </div>
        </div>

        {inviteConductor && (
          <div className="flex items-start gap-2 bg-purple-50 border border-purple-100 rounded-2xl px-3.5 py-3">
            <span className="material-symbols-outlined text-[18px] text-purple-600 mt-0.5">person_check</span>
            <p className="text-[11px] text-purple-800 leading-snug">
              Te estás registrando con <span className="font-black">{inviteConductor}</span>. Al terminar quedará guardado automáticamente en tu círculo de conductores.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre completo</label>
            <input type="text" value={form.nombreCompleto} onChange={(e) => update("nombreCompleto", e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
              placeholder="Nombre y apellido" autoComplete="name" required />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Correo <span className="text-slate-400 normal-case">(será tu usuario para iniciar sesión)</span></label>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
              placeholder="cliente@email.com" autoComplete="email" required />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teléfono / WhatsApp <span className="text-slate-400 normal-case">(para que tu conductor te contacte)</span></label>
            <input type="tel" value={form.telefono} onChange={(e) => update("telefono", e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
              placeholder="+58 412 1234567" autoComplete="tel" required />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ubicación</label>
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select value={form.estado} onChange={(e) => updateEstado(e.target.value)} aria-label="Estado"
                className="w-full bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200">
                {VENEZUELA_STATES.map((estado) => (
                  <option key={estado.nombre} value={estado.nombre}>{estado.nombre}</option>
                ))}
              </select>
              <select value={form.ciudad} onChange={(e) => update("ciudad", e.target.value)} aria-label="Ciudad"
                className="w-full bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200">
                {ciudades.map((ciudad) => (
                  <option key={ciudad} value={ciudad}>{ciudad}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contraseña</label>
            <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
              placeholder="Mínimo 6 caracteres" autoComplete="new-password" minLength={6} required />
          </div>
          {formError && <p className="text-[12px] text-red-500">{formError}</p>}
          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-xl bg-purple-700 text-white font-bold text-[13px] disabled:opacity-50 shadow-lg shadow-purple-600/30">
            {submitting ? "Creando..." : "Crear Cuenta Gratis"}
          </button>
        </form>

        <button onClick={onSwitchToLogin} className="w-full text-center text-[12px] text-purple-600 font-bold">
          Ya tengo cuenta — Iniciar sesión
        </button>
        <a href="https://drivip-home.pages.dev" className="block text-center text-[11px] text-slate-400 hover:text-slate-600">← Volver a Drivip</a>
      </div>
    </div>
  );
}

/* ==================== POST-REGISTER ==================== */
function PostRegisterScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] p-4">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/60">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
            <span className="material-symbols-outlined text-[30px] text-white">check_circle</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">¡Cuenta creada!</h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Revisa tu correo si necesitas confirmar la cuenta. Luego inicia sesión para empezar.
            </p>
          </div>
        </div>

        <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4">
          {[
            { icon: "mark_email_read", title: "Confirma tu correo", desc: "Abre el enlace que te enviamos." },
            { icon: "person_add", title: "Agrega a tu chofer", desc: "Pídele su enlace o código de invitación." },
            { icon: "near_me", title: "Pide tu primer viaje", desc: "Busca tu destino y acuerda el pago directo." },
          ].map((item, index) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              </span>
              <div>
                <p className="text-xs font-black text-slate-900">
                  {index + 1}. {item.title}
                </p>
                <p className="text-[11px] font-medium text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-xl bg-purple-700 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/30 active:scale-[0.98]"
        >
          Ya confirmé, iniciar sesión
        </button>
      </div>
    </div>
  );
}

/* ==================== PASSENGER APP ==================== */
function PassengerApp() {
  const { user, signOut } = useAuthContext();
  const { contactos, refetch: refetchRed, eliminarContacto } = useRedCliente(user?.id ?? "");
  const conductorTenantId = contactos[0]?.conductor_tenant_id ?? null;
  const { tasa } = useTasaCambio();
  const { conductores, refetch: refetchConductores } = useConductoresRed();
  const drivers = useMemo(() => conductores.map(toDriver), [conductores]);
  const { carreras: misCarreras, refetch: refetchCarreras } = useMisCarreras(user?.id);
  const { direcciones, crearDireccion, eliminarDireccion, marcarPredeterminada } = useDireccionesCliente(user?.id);
  const { reservas, crearReserva, cancelarReserva } = useReservasCliente(user?.id);

  const savedAddresses = useMemo<SavedAddress[]>(() => {
    const meta: Record<string, { iconBg: string; iconColor: string }> = {
      home: { iconBg: "bg-purple-50 border-purple-100 text-purple-600", iconColor: "text-purple-600" },
      business: { iconBg: "bg-blue-50 border-blue-100 text-blue-600", iconColor: "text-blue-600" },
      shopping_bag: { iconBg: "bg-amber-50 border-amber-100 text-amber-600", iconColor: "text-amber-600" },
      flight: { iconBg: "bg-sky-50 border-sky-100 text-sky-600", iconColor: "text-sky-600" },
      local_hospital: { iconBg: "bg-emerald-50 border-emerald-100 text-emerald-600", iconColor: "text-emerald-600" },
    };
    return direcciones.map((d) => {
      const m = meta[d.icono] ?? meta.home;
      return {
        id: d.id,
        name: d.alias,
        address: d.direccion,
        reference: d.referencia ?? undefined,
        lat: d.lat,
        lng: d.lng,
        icon: d.icono,
        iconBg: m.iconBg,
        iconColor: m.iconColor,
        isDefault: d.predeterminada,
      };
    });
  }, [direcciones]);

  const passengerReservations = useMemo<Reservation[]>(() => {
    return reservas
      .filter((r) => r.estado !== "cancelada")
      .map((r) => {
        const fecha = new Date(r.fecha_hora);
        return {
          id: r.id,
          title: "Reserva programada",
          dateLabel: fecha.toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" }),
          dayShort: fecha.toLocaleDateString("es-VE", { weekday: "short" }).slice(0, 3).toUpperCase(),
          dayNum: String(fecha.getDate()),
          time: fecha.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
          origin: r.origen,
          destination: r.destino,
          priceUsd: r.precio_usd ?? 0,
          paymentMethods: ["Efectivo", "Pago Móvil"],
          status: r.estado === "confirmada" ? "confirmed" : "pending",
        };
      });
  }, [reservas]);

  const [screen, setScreen] = useState<PassengerScreen>("home");
  const mainRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapPointType, setMapPointType] = useState<"origin" | "destination">("destination");
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeCarrera, setActiveCarrera] = useState<Carrera | null>(null);
  const [requestMode, setRequestMode] = useState<"now" | "schedule">("now");
  const [serviceModal, setServiceModal] = useState<ServiceMode | null>(null);
  const [otherDriversOpen, setOtherDriversOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [messagesTarget, setMessagesTarget] = useState<{ conversationId: string; tenantId: string } | null>(null);
  const {
    conversaciones,
    userId: messagesUserId,
    loading: messagesLoading,
    error: messagesError,
    totalNoLeidos,
    crearConversacion,
    marcarLeida,
  } = useConversacionesCliente();
  const { tarifas } = useTarifasTenant(selectedDriver?.id ?? conductorTenantId);

  const [origin, setOrigin] = useState("Mi ubicación actual");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [stops, setStops] = useState<{ lat: number; lng: number; address: string }[]>([]);
  const [routeKm, setRouteKm] = useState(0);
  const [routeMin, setRouteMin] = useState(0);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3100);
  }, []);

  const openRideRequest = useCallback((mode: "now" | "schedule" = "now") => {
    setRequestMode(mode);
    setRequestOpen(true);
  }, []);

  const openMessages = useCallback(async (driverId?: string) => {
    setMessagesOpen(true);
    if (!driverId) {
      setMessagesTarget(null);
      return;
    }
    const conversationId = await crearConversacion(driverId);
    setMessagesTarget(conversationId ? { conversationId, tenantId: driverId } : null);
  }, [crearConversacion]);

  const closeMessages = useCallback(() => {
    setMessagesOpen(false);
    setMessagesTarget(null);
  }, []);

  const ensureMessageConversation = useCallback(
    (tenantId: string) => crearConversacion(tenantId),
    [crearConversacion]
  );

  const handleUnfollowDriver = useCallback(
    async (driver: Driver) => {
      const contacto = contactos.find((item) => item.conductor_tenant_id === driver.id);
      if (!contacto) {
        showToast("Este conductor ya no está en tu círculo");
        return;
      }
      const ok = await eliminarContacto(contacto.id);
      if (!ok) {
        showToast("No pudimos eliminar el conductor. Intenta de nuevo.");
        return;
      }
      setSelectedDriver((prev) => (prev?.id === driver.id ? null : prev));
      void refetchRed();
      void refetchConductores();
      showToast(`${driver.name} eliminado de tu círculo`);
    },
    [contactos, eliminarContacto, refetchRed, refetchConductores, showToast]
  );

  useScrollLock(requestOpen);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [screen]);

  useEffect(() => {
    if (selectedDriver || drivers.length === 0) return;
    setSelectedDriver(drivers[0]);
  }, [drivers, selectedDriver]);

  const locationRequestedRef = useRef(false);

  useEffect(() => {
    if (locationRequestedRef.current || originCoords) return;
    locationRequestedRef.current = true;

    let cancelled = false;
    const useVenezuelaFallback = () => {
      if (cancelled) return;
      setOriginCoords({ lat: VENEZUELA_CENTER[0], lng: VENEZUELA_CENTER[1] });
      setOrigin("Caracas, Venezuela");
    };

    if (!("geolocation" in navigator)) {
      useVenezuelaFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;
        const { latitude: lat, longitude: lng } = pos.coords;

        if (!isInVenezuela(lat, lng)) {
          useVenezuelaFallback();
          showToast("Drivip solo opera en Venezuela. Busca tu dirección manualmente.");
          return;
        }

        setOriginCoords({ lat, lng });
        const place = await reverseVenezuelaPlace(lat, lng);
        if (!cancelled) setOrigin(place?.displayName || "Mi ubicación actual");
      },
      () => useVenezuelaFallback(),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 20000 }
    );

    return () => {
      cancelled = true;
      locationRequestedRef.current = false;
    };
  }, [showToast]);

  const initialOriginPlace = useMemo(
    () =>
      originCoords
        ? { lat: originCoords.lat, lng: originCoords.lng, address: origin }
        : null,
    [originCoords, origin]
  );

  useCarreraRealtime(activeCarrera?.id ?? null, setActiveCarrera);
  const { location: conductorLocation, lastUpdated: conductorUpdatedAt } = useConductorLocation(
    activeCarrera?.tenant_id ?? null
  );

  const trips = useMemo<TripHistoryType[]>(() => misCarreras.map((c) => {
    const d = drivers.find((x) => x.id === c.tenant_id);
    const created = new Date(c.created_at);
    return {
      id: c.id,
      date: created.toLocaleDateString("es-VE", { day: "2-digit", month: "short" }),
      time: created.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
      type: c.estado === "completada" ? "Completado" : c.estado,
      origin: c.origen_direccion ?? "Origen",
      destination: c.destino_direccion ?? "Destino",
      driverName: d?.name ?? "Conductor",
      driverInitials: d?.initials ?? "C",
      driverVehicle: d?.vehicle ?? "",
      driverRating: d?.rating ?? 5,
      priceUsd: c.precio ?? 0,
      priceBs: Math.round((c.precio ?? 0) * (tasa ?? TASA_BCV_REFERENCIA) * 100) / 100,
      paymentMethod: c.metodo_pago === "pago_movil" ? "Pago Móvil" : c.metodo_pago === "transferencia" ? "Transferencia" : "Efectivo",
      driverColor: d?.color ?? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white",
    };
  }), [misCarreras, drivers, tasa]);

  const activeDriver = useMemo(
    () => drivers.find((d) => d.id === activeCarrera?.tenant_id) ?? selectedDriver,
    [drivers, activeCarrera, selectedDriver]
  );

  const resolveRouteFor = useCallback(
    async (
      target: { lat: number; lng: number },
      originOverride?: { lat: number; lng: number }
    ) => {
      const start = originOverride ?? originCoords;
      if (!start || !isInVenezuela(start.lat, start.lng) || !isInVenezuela(target.lat, target.lng)) {
        return null;
      }

      const route = await fetchDrivingRoute([
        { lat: start.lat, lng: start.lng },
        ...stops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
        { lat: target.lat, lng: target.lng },
      ]);

      if (!route) return null;
      setRouteKm(route.distanceKm);
      setRouteMin(route.durationMin);
      return route;
    },
    [originCoords, stops]
  );

  const handleRequestRide = async (
    driverArg?: Driver | null,
    detalle?: { precioUsd: number; metodoPago: "usd" | "bs" | "pmovil"; programadaPara?: string }
  ) => {
    const d = driverArg ?? selectedDriver ?? drivers[0] ?? null;
    if (!d) { showToast("Agrega un conductor a tu círculo primero"); setScreen("drivers"); return; }
    setSelectedDriver(d);

    if (!originCoords || !destinationCoords) {
      showToast("Elige tu destino en el mapa para continuar");
      setMapPointType("destination");
      setMapModalOpen(true);
      return;
    }

    if (activeCarrera) {
      showToast("Ya tienes un viaje activo. Termínalo o cancélalo primero.");
      return;
    }

    let km = routeKm;
    let min = routeMin;

    if (km <= 0) {
      const route = await resolveRouteFor(destinationCoords);
      if (route) {
        km = route.distanceKm;
        min = route.durationMin;
      }
    }

    if (km <= 0) {
      showToast("No pudimos calcular la ruta. Vuelve a elegir el destino en el mapa.");
      setMapPointType("destination");
      setMapModalOpen(true);
      return;
    }

    if (detalle?.programadaPara) {
      const { error } = await crearReserva({
        conductor_tenant_id: d.id,
        origen: origin,
        destino: destination,
        fecha_hora: detalle.programadaPara,
        precio_usd: detalle.precioUsd,
        origen_lat: originCoords.lat,
        origen_lng: originCoords.lng,
        destino_lat: destinationCoords.lat,
        destino_lng: destinationCoords.lng,
      });
      if (error) {
        showToast(error);
        return;
      }
      setRequestOpen(false);
      showToast(`Reserva programada con ${d.name}`);
      return;
    }

    const carrera = await crearCarreraCliente({
      conductor_tenant_id: d.id,
      origen_lat: originCoords.lat,
      origen_lng: originCoords.lng,
      origen_direccion: origin,
      destino_lat: destinationCoords.lat,
      destino_lng: destinationCoords.lng,
      destino_direccion: destination,
      distancia_km: km,
      duracion_min: min,
      precio: detalle?.precioUsd ?? 0,
      metodo_pago: METODO_PAGO_MAP[detalle?.metodoPago ?? "usd"],
    });
    if (!carrera) { showToast("No se pudo enviar la solicitud. Intenta de nuevo."); return; }
    setActiveCarrera(carrera);
    setRequestOpen(false);
    void enviarPushCarrera({
      carrera_id: carrera.id,
      title: "Nueva solicitud de viaje",
      body: `${origin} a ${destination}`,
      tag: `carrera-${carrera.id}`,
      data: { carrera_id: carrera.id },
    });
    showToast(`Solicitud enviada a ${d.name}`);
  };

  const handleServiceRequest = async (input: ServiceRequestInput) => {
    const driver = drivers.find((item) => item.id === input.driverId);
    if (!driver) {
      showToast("No encontramos al conductor seleccionado.");
      return false;
    }
    if (activeCarrera) {
      showToast("Ya tienes un servicio activo. Termínalo o cancélalo primero.");
      return false;
    }

    const carrera = await crearSolicitudServicio({
      conductor_tenant_id: input.driverId,
      tipo_servicio: input.mode === "delivery" ? "delivery" : "compra",
      detalle_servicio: input.service,
      origen_lat: input.origin.lat,
      origen_lng: input.origin.lng,
      origen_direccion: input.origin.address,
      destino_lat: input.destination.lat,
      destino_lng: input.destination.lng,
      destino_direccion: input.destination.address,
      distancia_km: input.distanceKm,
      duracion_min: input.durationMin,
      precio: input.priceUsd,
      metodo_pago: "efectivo",
    });

    if (!carrera) {
      showToast("No se pudo enviar la solicitud. Intenta de nuevo.");
      return false;
    }

    setSelectedDriver(driver);
    setActiveCarrera(carrera);
    void enviarPushCarrera({
      carrera_id: carrera.id,
      title: input.mode === "delivery" ? "Nuevo delivery" : "Nueva compra",
      body: `${input.service} · ${input.origin.address} a ${input.destination.address}`,
      tag: `carrera-${carrera.id}`,
      data: { carrera_id: carrera.id, tipo_servicio: input.mode === "delivery" ? "delivery" : "compra" },
    });
    showToast(
      input.mode === "delivery"
        ? `Delivery enviado a ${driver.name}`
        : `Compra solicitada a ${driver.name}. Espera su precio.`
    );
    return true;
  };

  const handleSelectCoupon = (driver: Driver) => {
    setSelectedDriver(driver);
    showToast(`Cupón de ${driver.name} seleccionado`);
  };

  const handleShareDriver = async (driver: Driver) => {
    const url = conductorInviteUrl(driver.slug);
    const text = `Agrega a ${driver.name} en Drivip y pide tus servicios directamente.`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "Drivip", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      showToast("Enlace de invitación copiado");
    } catch {
      showToast("No pudimos compartir el enlace");
    }
  };

  const handleDismissTrip = () => {
    setActiveCarrera(null);
    refetchCarreras();
  };

  const handleCancelTrip = async () => {
    if (!activeCarrera) return;
    const cancelada = activeCarrera;
    const ok = await cancelarCarrera(cancelada.id);
    if (!ok) {
      showToast("No pudimos cancelar el viaje. Intenta de nuevo.");
      return;
    }

    void enviarPushCarrera({
      carrera_id: cancelada.id,
      title: "Viaje cancelado",
      body: "El cliente cancelo la solicitud.",
      tag: `carrera-${cancelada.id}`,
      data: { carrera_id: cancelada.id },
    });
    setActiveCarrera(null);
    refetchCarreras();
    showToast("Viaje cancelado");
  };

  const handleSubmitRating = async (rating: number, comment?: string) => {
    const ok = activeCarrera
      ? await calificarCarrera(activeCarrera.id, rating, comment)
      : true;

    if (!ok) {
      showToast("No pudimos guardar tu calificación. Intenta de nuevo.");
      return;
    }

    setRatingModalOpen(false);
    setActiveCarrera(null);
    refetchCarreras();
    showToast("¡Gracias por calificar!");
  };

  const handleBottomNav = (id: string) => {
    if (id === "menu") setMenuOpen(true);
    else if (id === "drivers") setScreen("drivers");
    else if (id === "history") setScreen("history");
    else setScreen(id as PassengerScreen);
  };

  const handleOpenMap = (pointType: "origin" | "destination") => {
    setMapPointType(pointType);
    setMapModalOpen(true);
  };

  const handleConfirmMapPin = (
    place: { address: string; lat: number; lng: number },
    pointType: "origin" | "destination"
  ) => {
    if (pointType === "origin") {
      setOrigin(place.address);
      setOriginCoords({ lat: place.lat, lng: place.lng });
      if (destinationCoords) void resolveRouteFor(destinationCoords, { lat: place.lat, lng: place.lng });
    } else {
      setDestination(place.address);
      setDestinationCoords({ lat: place.lat, lng: place.lng });
      void resolveRouteFor({ lat: place.lat, lng: place.lng });
    }
    setMapModalOpen(false);
    setRequestOpen(true);
    showToast(`${pointType === "origin" ? "Origen" : "Destino"}: ${place.address}`);
  };

  const handleConfirmRoute = (
    o: { lat: number; lng: number; address: string },
    s: { lat: number; lng: number; address: string }[],
    d: { lat: number; lng: number; address: string },
    km: number,
    min: number
  ) => {
    setOrigin(o.address);
    setOriginCoords({ lat: o.lat, lng: o.lng });
    setStops(s);
    setDestination(d.address);
    setDestinationCoords({ lat: d.lat, lng: d.lng });
    setRouteKm(km);
    setRouteMin(min);
    setMapModalOpen(false);
    setRequestOpen(true);
    showToast(`Ruta: ${km.toFixed(1)} km • ${Math.round(min)} min`);
  };

  const handleSavedAddressRide = async (address: SavedAddress) => {
    let target: { lat: number; lng: number } | null =
      typeof address.lat === "number" && typeof address.lng === "number" && isInVenezuela(address.lat, address.lng)
        ? { lat: address.lat, lng: address.lng }
        : null;

    if (!target) {
      const places = await searchVenezuelaPlaces(address.address, { near: originCoords, limit: 1 });
      const found = places[0];
      if (found) target = { lat: found.lat, lng: found.lng };
    }

    if (!target) {
      showToast("No pudimos ubicar esa dirección. Elígela de nuevo en el mapa.");
      return;
    }

    setDestination(address.address);
    setDestinationCoords(target);
    openRideRequest("now");
    void resolveRouteFor(target);
    showToast(`Destino: ${address.name}`);
  };

  const handleRepeatTrip = async (trip: TripHistoryType) => {
    const places = await searchVenezuelaPlaces(trip.destination, {
      near: originCoords,
      limit: 1,
    });
    const found = places[0];
    if (!found) {
      showToast("No pudimos ubicar el destino de ese viaje. Elígelo en el mapa.");
      return;
    }

    const target = { lat: found.lat, lng: found.lng };
    setDestination(found.displayName);
    setDestinationCoords(target);
    openRideRequest("now");
    void resolveRouteFor(target);
    showToast(`Destino: ${found.primary}`);
  };

  const handleCreateAddress = async (input: {
    alias: string;
    direccion: string;
    referencia?: string;
    icono?: string;
    predeterminada?: boolean;
  }) => {
    let lat: number | undefined;
    let lng: number | undefined;

    if (input.direccion.trim()) {
      const places = await searchVenezuelaPlaces(input.direccion, {
        near: originCoords,
        limit: 1,
      });
      if (places[0]) {
        lat = places[0].lat;
        lng = places[0].lng;
      }
    }

    return crearDireccion({
      alias: input.alias,
      direccion: input.direccion,
      referencia: input.referencia,
      icono: input.icono,
      predeterminada: input.predeterminada,
      lat,
      lng,
    });
  };

  const profileInitial = user?.email?.charAt(0)?.toUpperCase() ?? "U";
  const passengerName = (user?.user_metadata?.nombre as string | undefined)?.trim() || user?.email?.split("@")[0] || "Cliente";
  const hasHeader = screen === "home";
  const hasBottomNav = screen === "home" || screen === "drivers" || screen === "history";

  const renderRouteCalculator = () => (
    <RouteCalculator
      onOpenMap={() => handleOpenMap("destination")}
      onOpenOriginMap={() => handleOpenMap("origin")}
      origin={origin}
      destination={destination}
      stops={stops.map((s) => s.address)}
      distanceKm={routeKm}
      tarifas={tarifas}
      tasa={tasa}
      canRequest={Boolean(originCoords && destinationCoords)}
      driverWhatsapp={selectedDriver?.whatsapp ?? null}
      drivers={drivers}
      selectedDriverId={selectedDriver?.id ?? null}
      onSelectDriver={setSelectedDriver}
      onAddDriver={() => {
        setRequestOpen(false);
        setScreen("drivers");
      }}
      distance={
        routeKm > 0
          ? `${routeKm.toFixed(1)} km • ~${routeMin < 60 ? Math.round(routeMin) + " min" : Math.floor(routeMin / 60) + "h " + Math.round(routeMin % 60) + "m"}`
          : "Calculando ruta..."
      }
      onRequestRide={(detalle) => handleRequestRide(selectedDriver, detalle)}
      onToggleSchedule={(mode) => setRequestMode(mode)}
      initialTripMode={requestMode}
    />
  );

  return (
    <>
      <div className="mx-auto flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden bg-[#f1f4f8] lg:max-w-6xl lg:flex-row">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200/70 bg-white/85 p-4 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3 px-2 pb-4">
            <img src="/logo.png" alt="Drivip" className="h-10 w-10 rounded-xl object-contain" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>Drivip</p>
              <p className="truncate text-[11px] font-semibold text-slate-400">Panel del cliente</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openRideRequest("now")}
            className="mb-3 flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 text-sm font-black text-white shadow-lg shadow-purple-700/20 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[19px]">add</span>
            Pedir un viaje
          </button>

          <nav className="space-y-1">
            {[
              { id: "home", label: "En Vivo", icon: "map" },
              { id: "drivers", label: "Choferes", icon: "people" },
              { id: "history", label: "Historial", icon: "history" },
            ].map((item) => {
              const active = screen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScreen(item.id as PassengerScreen)}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold transition ${
                    active
                      ? "bg-purple-50 text-purple-700"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-purple-700 text-white" : "bg-slate-100 text-slate-500"}`}>
                    <NavGlyph icon={item.icon} className="h-[18px] w-[18px]" />
                  </span>
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <NavGlyph icon="menu" className="h-[18px] w-[18px]" />
              </span>
              Menú
            </button>
          </nav>

          <div className="mt-auto flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-sm font-black text-purple-700">
              {profileInitial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-slate-900">{passengerName}</p>
              <p className="truncate text-[11px] font-semibold text-slate-400">Pasajero VIP</p>
            </div>
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              aria-label="Abrir perfil"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
            </button>
          </div>
        </aside>

        <div
          className="relative flex min-h-0 flex-1 flex-col"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(100,116,139,0.16) 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        >
          {hasHeader && (
            <PassengerHeader
              onMenuClick={() => setMenuOpen(true)}
              onProfileClick={() => setAuthModalOpen(true)}
              profileInitial={profileInitial}
            />
          )}

          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto overscroll-contain"
            style={{ paddingBottom: hasBottomNav ? "calc(4.5rem + env(safe-area-inset-bottom))" : "0.5rem" }}
          >
          {screen === "home" && (
            <div className="w-full space-y-4 px-4 pb-3 pt-3 lg:px-8">
              {activeCarrera && activeDriver && (
                <LiveTripTracker
                  carrera={activeCarrera}
                  driver={activeDriver}
                  tasa={tasa}
                  conductorLocation={conductorLocation}
                  conductorUpdatedAt={conductorUpdatedAt}
                  onCallDriver={() => showToast("Llamando al chofer...")}
                  onRateTrip={() => setRatingModalOpen(true)}
                  onCancelTrip={handleCancelTrip}
                  onDismiss={handleDismissTrip}
                />
              )}

              <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-5">
                <div className="min-w-0 space-y-4">
                  <AdCarousel
                    onAction={(action) => {
                      if (action === "ride") openRideRequest("now");
                      if (action === "schedule") openRideRequest("schedule");
                      if (action === "delivery") setServiceModal("delivery");
                      if (action === "purchase") setServiceModal("purchase");
                    }}
                  />
                  <ServiceHub
                    onStartRide={() => openRideRequest("now")}
                    onDelivery={() => setServiceModal("delivery")}
                    onPurchase={() => setServiceModal("purchase")}
                    onSchedule={() => openRideRequest("schedule")}
                  />
                </div>

                <div className="min-w-0 space-y-4">
                  <CouponsSection
                    drivers={drivers}
                    selectedDriverId={selectedDriver?.id ?? null}
                    onSelect={handleSelectCoupon}
                  />
                  <VipDriversSection
                    drivers={drivers}
                    selectedDriverId={selectedDriver?.id ?? null}
                    onSelectDriver={setSelectedDriver}
                    onRequest={(driver) => {
                      setSelectedDriver(driver);
                      openRideRequest("now");
                    }}
                    onMessage={(driver) => void openMessages(driver.id)}
                    onShare={(driver) => void handleShareDriver(driver)}
                    onOpenAll={() => setOtherDriversOpen(true)}
                  />
                </div>
              </div>
            </div>
          )}

          {screen === "drivers" && (
            <DriversList
              drivers={drivers}
              onBack={() => setScreen("home")}
              onRequestRide={(driver) => {
                setSelectedDriver(driver);
                openRideRequest("now");
                showToast("Configura tu ruta y solicita la carrera");
              }}
              onConductorAdded={() => {
                void refetchConductores();
                void refetchRed();
                showToast("Conductor agregado a tu círculo");
              }}
              onUnfollow={handleUnfollowDriver}
            />
          )}

          {screen === "history" && (
            <TripHistory
              trips={trips}
              onBack={() => setScreen("home")}
              onRepeatTrip={(trip) => void handleRepeatTrip(trip)}
            />
          )}

          {screen === "addresses" && (
            <SavedAddresses
              addresses={savedAddresses}
              onBack={() => setScreen("home")}
              onCreate={handleCreateAddress}
              onDelete={eliminarDireccion}
              onSetDefault={marcarPredeterminada}
              onRequestRide={(address) => void handleSavedAddressRide(address)}
            />
          )}

          {screen === "reservations" && (
            <Reservations
              reservations={passengerReservations}
              onBack={() => setScreen("home")}
              onCreate={crearReserva}
              onCancel={cancelarReserva}
            />
          )}

          {screen === "profile" && (
            <div className="px-4 lg:px-8 py-4 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Mi Perfil</h2>
              <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-xl shadow-slate-200/60 border border-slate-100 max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-700">{profileInitial}</span>
                </div>
                <span className="text-lg font-bold text-slate-900">{passengerName}</span>
                <span className="text-xs text-slate-500 font-mono">{user?.email}</span>
                <button
                  onClick={signOut}
                  className="mt-2 w-full py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
          </main>
        </div>
      </div>

      {hasBottomNav && (
        <PassengerBottomNav
          screen={screen}
          onNavigate={handleBottomNav}
          onRequestRide={() => openRideRequest("now")}
        />
      )}

      {createPortal(
        <>
          <GridMenuDrawer
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            onAddressesClick={() => setScreen("addresses")}
            onDriversClick={() => setScreen("drivers")}
            onHistoryClick={() => setScreen("history")}
            onReservationsClick={() => setScreen("reservations")}
            passengerName={passengerName}
          />

          <OtherDriversModal
            open={otherDriversOpen}
            drivers={drivers}
            selectedDriverId={selectedDriver?.id ?? null}
            onClose={() => setOtherDriversOpen(false)}
            onSelect={setSelectedDriver}
            onConductorAdded={() => {
              void refetchConductores();
              void refetchRed();
              showToast("Conductor agregado a tu círculo");
            }}
            onUnfollow={handleUnfollowDriver}
          />

          <ServiceRequestModal
            isOpen={serviceModal !== null}
            mode={serviceModal ?? "delivery"}
            drivers={drivers}
            selectedDriverId={selectedDriver?.id ?? null}
            tarifas={tarifas}
            tasa={tasa}
            currentLocation={initialOriginPlace}
            savedAddresses={savedAddresses}
            onSelectDriver={setSelectedDriver}
            onClose={() => setServiceModal(null)}
            onSubmit={handleServiceRequest}
          />

          <MessageCenter
            open={messagesOpen}
            onClose={closeMessages}
            drivers={drivers}
            conversaciones={conversaciones}
            userId={messagesUserId}
            loading={messagesLoading}
            error={messagesError}
            initialTarget={messagesTarget}
            onEnsureConversation={ensureMessageConversation}
            onMarkRead={marcarLeida}
          />

          {requestOpen && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
              <button
                type="button"
                aria-label="Cerrar solicitud de viaje"
                className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
                onClick={() => setRequestOpen(false)}
              />
              <div
                className="relative flex h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] border border-white/80 bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:rounded-[32px]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.15) 1px, transparent 0)",
                  backgroundSize: "18px 18px",
                }}
              >
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/70 bg-white/95 px-4 pb-3 pt-3 backdrop-blur-xl">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-700 text-white shadow-lg shadow-purple-700/25">
                      <span className="material-symbols-outlined text-[22px]">local_taxi</span>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-purple-600">
                        Drivip
                      </p>
                      <h2 className="truncate text-base font-black text-slate-900">Pide tu viaje</h2>
                      <p className="truncate text-[11px] font-medium text-slate-500">
                        Origen, destino, precio y conductor
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequestOpen(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain p-3 pb-0">
                  {renderRouteCalculator()}
                </div>
              </div>
            </div>
          )}

          <MapPickerModal
            isOpen={mapModalOpen}
            onClose={() => setMapModalOpen(false)}
            onUseGps={(coords) => {
              if (mapPointType !== "origin") return;
              setOriginCoords(coords);
              setOrigin("Mi ubicación GPS");
              showToast("Ubicación GPS detectada");
            }}
            onConfirmPin={handleConfirmMapPin}
            onConfirmRoute={handleConfirmRoute}
            pointType={mapPointType}
            initialOrigin={initialOriginPlace}
            suggestions={savedAddresses.map((address) => ({
              id: address.id,
              name: address.name,
              address: address.address,
              lat: address.lat,
              lng: address.lng,
              icon: address.icon,
            }))}
          />

          <RatingModal
            isOpen={ratingModalOpen}
            driverName={activeDriver?.name ?? "Conductor"}
            onClose={() => setRatingModalOpen(false)}
            onSubmit={handleSubmitRating}
          />

          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            onMessagesClick={() => void openMessages()}
            unreadMessages={totalNoLeidos}
          />

          <Toast message={toastMsg ?? ""} visible={!!toastMsg} />
        </>,
        document.body
      )}
    </>
  );
}

function useVh() {
  useEffect(() => {
    const set = () => {
      document.documentElement.style.setProperty("--app-h", `${window.innerHeight}px`);
    };
    set();
    window.addEventListener("resize", set);
    window.addEventListener("orientationchange", set);
    return () => {
      window.removeEventListener("resize", set);
      window.removeEventListener("orientationchange", set);
    };
  }, []);
}

export default function App() {
  useVh();
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function InviteBanner({ conductor }: { conductor: string | null }) {
  return (
    <div className="fixed top-0 inset-x-0 z-[80] bg-purple-700 text-white text-center px-4 py-2 text-[11px] font-bold shadow-lg flex items-center justify-center gap-2">
      <span className="material-symbols-outlined text-[15px]">qr_code_scanner</span>
      {conductor ? `Te estás uniendo al conductor ${conductor}` : "Buscando conductor..."}
    </div>
  );
}

function AppContent() {
  const { user, loading, configured } = useAuthContext();
  const [authView, setAuthView] = useState<"landing" | "login" | "register">("landing");
  const [addSlug, setAddSlug] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const add = (params.get("add") ?? params.get("conductor"))?.trim();
    if (add) {
      setAddSlug(add);
      setAuthView("register");
    }
  }, []);

  const { tenant: inviteTenant } = useTenantBySlug(addSlug);

  const clearAddParam = () => {
    setAddSlug(null);
    window.history.replaceState({}, "", window.location.pathname);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f4f6f8]">
        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center animate-pulse">
          <img src="/logo.png" alt="Drivip" className="w-8 h-8 rounded-lg object-cover" />
        </div>
      </div>
    );
  }

  if (!user) {
    const authScreen =
      authView === "login" ? (
        <LoginScreen onSwitchToRegister={() => setAuthView("register")} />
      ) : authView === "register" ? (
        <RegisterScreen onSwitchToLogin={() => setAuthView("login")} inviteConductor={inviteTenant?.nombre ?? null} />
      ) : (
        <LandingPage onShowAuth={(mode) => setAuthView(mode)} />
      );

    return (
      <>
        {addSlug && <InviteBanner conductor={inviteTenant?.nombre ?? null} />}
        {authScreen}
      </>
    );
  }

  if (addSlug) {
    return <AddConductor slug={addSlug} autoAdd onAdded={clearAddParam} onBack={clearAddParam} />;
  }

  return <PassengerApp />;
}
