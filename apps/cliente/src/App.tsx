import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AuthProvider, useAuthContext, supabase } from "@drivip/supabase";
import PassengerHeader from "./components/passenger/PassengerHeader";
import HeroWelcomeCard from "./components/passenger/HeroWelcomeCard";
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

import {
  MOCK_DRIVERS,
  MOCK_TRIPS,
  MOCK_ADDRESSES,
  MOCK_RESERVATIONS,
  MOCK_PASSENGER,
} from "./mockData/passengerMockData";
import type { PassengerScreen, Driver } from "./types/passenger";

const bottomNavItems = [
  { id: "home", label: "En Vivo", icon: "map" },
  { id: "drivers", label: "Choferes", icon: "people" },
  { id: "center", label: "", icon: "plus" },
  { id: "history", label: "Historial", icon: "history" },
  { id: "menu", label: "Menú", icon: "menu" },
] as const;

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
function RegisterScreen({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", telefono: "", password: "", ciudad: "Caracas", codigo_referido: "" });
  const [step, setStep] = useState<"form" | "success">("form");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
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
      nombre: form.nombre,
      apellido: form.apellido,
      telefono: form.telefono,
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

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  if (step === "success") return <PostRegisterScreen />;

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

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre</label>
              <input type="text" value={form.nombre} onChange={(e) => update("nombre", e.target.value)}
                className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
                placeholder="Tu nombre" required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Apellido</label>
              <input type="text" value={form.apellido} onChange={(e) => update("apellido", e.target.value)}
                className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
                placeholder="Tu apellido" required />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
              placeholder="cliente@email.com" required />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teléfono</label>
            <input type="tel" value={form.telefono} onChange={(e) => update("telefono", e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
              placeholder="+58 412 1234567" required />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ciudad</label>
            <select value={form.ciudad} onChange={(e) => update("ciudad", e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200">
              <option>Caracas</option><option>Maracaibo</option><option>Valencia</option>
              <option>Barquisimeto</option><option>Maracay</option><option>Mérida</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contraseña</label>
            <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
              placeholder="Mínimo 6 caracteres" minLength={6} required />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Código de referido <span className="text-slate-400 normal-case">(opcional)</span></label>
            <input type="text" value={form.codigo_referido} onChange={(e) => update("codigo_referido", e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
              placeholder="¿Te refirió un conductor?" />
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
function PostRegisterScreen() {
  const [req, setReq] = useState<string | null>(null);
  const handleRequest = (id: string) => { setReq(id); setTimeout(() => setReq(null), 3000); };

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <div className="bg-white border-b border-slate-200/60 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-white text-[18px]">check_circle</span>
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900">¡Bienvenido a Drivip!</h1>
            <p className="text-[11px] text-slate-500">Encuentra tu primer chofer.</p>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Conductores Cerca de Ti</h2>
        {[
          { id: "1", name: "Carlos Mendoza", vehicle: "Toyota Corolla", rating: 4.9, trips: 1240, verified: true, premium: true, distance: "0.3 km" },
          { id: "2", name: "María González", vehicle: "Hyundai Accent", rating: 4.8, trips: 980, verified: true, premium: false, distance: "0.7 km" },
          { id: "3", name: "Luis Ramírez", vehicle: "Honda CB190R", rating: 4.7, trips: 2100, verified: true, premium: true, distance: "1.2 km" },
          { id: "4", name: "Ana Torres", vehicle: "Kia Picanto", rating: 4.6, trips: 650, verified: true, premium: false, distance: "1.8 km" },
          { id: "5", name: "Carmen Silva", vehicle: "Toyota RAV4", rating: 4.9, trips: 1870, verified: true, premium: true, distance: "2.1 km" },
        ].map((d) => (
          <div key={d.id} className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                <span className="text-sm font-black text-purple-700">{d.name.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <h4 className="text-[13px] font-extrabold text-slate-900">{d.name}</h4>
                  {d.verified && <span className="material-symbols-outlined text-[14px] text-blue-500">verified</span>}
                </div>
                <span className="text-[11px] text-slate-500">{d.vehicle} · {d.distance}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[13px] text-amber-400">star</span>
                <span className="text-[11px] font-bold text-slate-700">{d.rating}</span>
              </div>
            </div>
            {req === d.id ? (
              <div className="w-full py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[11px] font-bold text-center border border-emerald-100">✓ Solicitud Enviada</div>
            ) : (
              <button onClick={() => handleRequest(d.id)} className="w-full py-2 rounded-xl bg-purple-700 text-white text-[11px] font-bold shadow-md active:scale-[0.98] transition">Solicitar Servicio</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== PASSENGER APP ==================== */
function PassengerApp() {
  const { user, signOut } = useAuthContext();
  const [screen, setScreen] = useState<PassengerScreen>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapPointType, setMapPointType] = useState<"origin" | "destination">("destination");
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver>(MOCK_DRIVERS[0]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showTripTracker, setShowTripTracker] = useState(false);

  const [origin, setOrigin] = useState("Mi ubicación actual");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState("Aeropuerto Internacional Simón Bolívar");
  const [stops, setStops] = useState<{ lat: number; lng: number; address: string }[]>([]);
  const [routeKm, setRouteKm] = useState(38.4);
  const [routeMin, setRouteMin] = useState(42);

  useEffect(() => {
    if (originCoords) return;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOriginCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setOrigin("Mi ubicación GPS");
        },
        () => { setOriginCoords({ lat: 10.491, lng: -66.881 }); },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else { setOriginCoords({ lat: 10.491, lng: -66.881 }); }
  }, []);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3100); };

  const handleRequestRide = (driver?: Driver) => {
    const d = driver || MOCK_DRIVERS[0];
    setSelectedDriver(d);
    setShowTripTracker(true);
    showToast(`Solicitud enviada a ${d.name}`);
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

  const handleConfirmMapPin = (address: string, pointType: "origin" | "destination") => {
    if (pointType === "origin") {
      setOrigin(address);
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setOriginCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => {},
          { enableHighAccuracy: true, timeout: 3000 }
        );
      }
    } else {
      setDestination(address);
    }
    setMapModalOpen(false);
    showToast(`${pointType === "origin" ? "Origen" : "Destino"}: ${address}`);
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
    setRouteKm(km);
    setRouteMin(min);
    setMapModalOpen(false);
    showToast(`Ruta: ${km.toFixed(1)} km • ${Math.round(min)} min`);
  };

  const profileInitial = user?.email?.charAt(0)?.toUpperCase() ?? "U";
  const hasHeader = screen === "home";
  const hasBottomNav = screen === "home";

  return (
    <>
      <div
        className="flex flex-col bg-[#f4f6f8] mx-auto max-w-3xl lg:max-w-6xl w-full"
        style={{ height: "var(--app-h, 100dvh)" }}
      >
        {hasHeader && (
          <PassengerHeader
            onMenuClick={() => setMenuOpen(true)}
            onProfileClick={() => setAuthModalOpen(true)}
            profileInitial={profileInitial}
          />
        )}

        <main
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: hasBottomNav ? "4.5rem" : "0.5rem" }}
        >
          {screen === "home" && (
            <div className="px-4 lg:px-8 pt-3 space-y-4 w-full">
              <div className="lg:grid lg:grid-cols-2 lg:gap-6">
                <div className="space-y-4">
                  <HeroWelcomeCard
                    onDriversClick={() => setScreen("drivers")}
                    driverCount={MOCK_DRIVERS.length}
                  />
                  <RouteCalculator
                    onOpenMap={() => handleOpenMap("destination")}
                    onOpenOriginMap={() => handleOpenMap("origin")}
                    origin={origin}
                    destination={destination}
                    stops={stops.map((s) => s.address)}
                    fareUsd={`$${(2 + routeKm * 0.5).toFixed(0)}`}
                    fareBs={`Bs. ${((2 + routeKm * 0.5) * 36.5).toFixed(0)}`}
                    distance={`${routeKm.toFixed(1)} km • ~${routeMin < 60 ? Math.round(routeMin) + " min" : Math.floor(routeMin / 60) + "h " + Math.round(routeMin % 60) + "m"}`}
                    onRequestRide={() => handleRequestRide()}
                    onToggleSchedule={(mode) => {
                      if (mode === "schedule") showToast("Programar recogida: el chofer te confirmará por WhatsApp");
                    }}
                  />
                </div>
                <div className="space-y-4">
                  {showTripTracker && (
                    <LiveTripTracker
                      driver={selectedDriver}
                      onCallDriver={() => showToast("Llamando al chofer...")}
                      onRateTrip={() => setRatingModalOpen(true)}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {screen === "drivers" && (
            <DriversList
              drivers={MOCK_DRIVERS}
              onBack={() => setScreen("home")}
              onRequestRide={(driver) => {
                handleRequestRide(driver);
                setScreen("home");
              }}
            />
          )}

          {screen === "history" && (
            <TripHistory trips={MOCK_TRIPS} onBack={() => setScreen("home")} />
          )}

          {screen === "addresses" && (
            <SavedAddresses addresses={MOCK_ADDRESSES} onBack={() => setScreen("home")} />
          )}

          {screen === "reservations" && (
            <Reservations reservations={MOCK_RESERVATIONS} onBack={() => setScreen("home")} />
          )}

          {screen === "profile" && (
            <div className="px-4 lg:px-8 py-4 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Mi Perfil</h2>
              <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-xl shadow-slate-200/60 border border-slate-100 max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-700">{profileInitial}</span>
                </div>
                <span className="text-lg font-bold text-slate-900">{user?.email?.split("@")[0] ?? "Usuario"}</span>
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

      {hasBottomNav && (
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-4 py-2 z-30 flex items-center justify-between lg:hidden"
        >
          {bottomNavItems.map((item) => {
            if (item.id === "center") {
              return (
                <div key={item.id} className="-mt-5">
                  <button
                    className="w-13 h-13 p-3.5 rounded-full bg-gradient-to-tr from-purple-700 to-orange-500 text-white shadow-xl shadow-purple-600/40 border-4 border-[#f4f6f8] active:scale-90 transition-transform"
                    onClick={() => handleRequestRide()}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              );
            }

            const isActive = item.id === "home" && screen === "home";
            return (
              <button
                key={item.id}
                className={`flex flex-col items-center gap-1 text-[10px] w-14 ${isActive ? "text-purple-700 font-bold" : "text-slate-500 font-semibold"}`}
                onClick={() => handleBottomNav(item.id)}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  {item.icon === "map" && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="11" r="2" />
                    </svg>
                  )}
                  {item.icon === "people" && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {item.icon === "history" && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {item.icon === "menu" && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M4 6h16M4 12h16M4 18h7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </nav>
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
            passengerName={MOCK_PASSENGER.name}
          />

          <MapPickerModal
            isOpen={mapModalOpen}
            onClose={() => setMapModalOpen(false)}
            onUseGps={() => {
              if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setOriginCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setOrigin("Mi ubicación GPS");
                    showToast("Ubicación GPS detectada");
                  },
                  () => showToast("No se pudo obtener GPS"),
                  { enableHighAccuracy: true, timeout: 5000 }
                );
              }
              setMapModalOpen(false);
            }}
            onConfirmPin={handleConfirmMapPin}
            onConfirmRoute={handleConfirmRoute}
            pointType={mapPointType}
            initialOrigin={originCoords ? { ...originCoords, address: origin } : null}
          />

          <RatingModal
            isOpen={ratingModalOpen}
            driverName={selectedDriver.name}
            onClose={() => setRatingModalOpen(false)}
            onSubmit={(rating, comment) => {
              setRatingModalOpen(false);
              setShowTripTracker(false);
              showToast(`Calificación ${rating}/5 enviada a ${selectedDriver.name}`);
            }}
          />

          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            onConfirm={(phone) => { setAuthModalOpen(false); showToast("Código enviado por WhatsApp"); }}
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

function AppContent() {
  const { user, loading, configured } = useAuthContext();
  const [authView, setAuthView] = useState<"landing" | "login" | "register">("landing");

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
    if (authView === "login") return <LoginScreen onSwitchToRegister={() => setAuthView("register")} />;
    if (authView === "register") return <RegisterScreen onSwitchToLogin={() => setAuthView("login")} />;
    return <LandingPage onShowAuth={(mode) => setAuthView(mode)} />;
  }

  return <PassengerApp />;
}
