import { useState } from "react";
import { AuthProvider, useAuthContext, supabase, conductorInviteUrl, registrarReferido } from "@drivip/supabase";
import DriverApp from "./pages/DriverApp";

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
            <a href="#planes" className="hover:text-slate-900 transition">Planes</a>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://drivip-cliente.pages.dev" className="px-4 py-2 rounded-xl text-[12px] font-bold text-slate-500 hover:text-slate-900 transition">Soy Cliente</a>
            <button onClick={() => onShowAuth("login")} className="px-4 py-2 rounded-xl text-[12px] font-bold text-purple-700 bg-purple-50 border border-purple-100 hover:bg-purple-100 active:scale-95 transition">Iniciar Sesión</button>
            <button onClick={() => onShowAuth("register")} className="px-4 py-2 rounded-xl text-[12px] font-bold text-white bg-purple-700 shadow-md active:scale-95 transition">Registrarse</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-14 lg:pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200 mb-6">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Para conductores independientes</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-5" style={{ fontFamily: "Poppins, sans-serif" }}>
          Tu propia app<br />
          <span className="text-purple-700">para fidelizar clientes</span>
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto mb-8">Tú decides tus tarifas, tu disponibilidad y cómo cobrar. Pagas solo una mensualidad fija, desde $10 al mes.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => onShowAuth("register")} className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-purple-700 text-white font-bold text-[13px] shadow-lg shadow-purple-600/25 active:scale-95 transition flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">drive_eta</span> Quiero mi app
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
            { icon: "phone_iphone", title: "Tu app personal", desc: "Recibes tu enlace y tu QR. Tus clientes te piden directo, sin buscarte en mil chats.", gradient: "from-purple-500 to-indigo-600" },
            { icon: "tune", title: "Tú pones las tarifas", desc: "Por kilómetro, por zona, por hora, a crédito o por reserva. Tú pones las reglas.", gradient: "from-orange-400 to-red-500" },
            { icon: "account_balance_wallet", title: "Cobra directo", desc: "Efectivo, Pago Móvil, Zelle, lo que tú decidas. Drivip nunca toca tu dinero.", gradient: "from-emerald-400 to-teal-600" },
            { icon: "qr_code_2", title: "Tu QR y enlace", desc: "Comparte tu QR con tus clientes fijos. Se instalan tu app en el teléfono.", gradient: "from-amber-500 to-orange-500" },
            { icon: "savings", title: "Sin comisiones", desc: "Pagas solo tu mensualidad. Sin comisiones por viaje, sin retenciones.", gradient: "from-blue-500 to-indigo-600" },
            { icon: "install_mobile", title: "Sin tienda de apps", desc: "Es una PWA. Se instala desde el navegador, ocupa muy poco espacio.", gradient: "from-violet-500 to-purple-700" },
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

      {/* PLANES */}
      <section id="planes" className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Planes de Suscripción</span>
          <h2 className="text-2xl font-black text-slate-900 mt-1" style={{ fontFamily: "Poppins, sans-serif" }}>Elige Tu Plan</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          <div className="relative bg-white rounded-2xl p-6 border border-slate-200" style={{ boxShadow: "6px 6px 14px #d9dde2, -6px -6px 14px #ffffff" }}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-500 to-gray-600 text-white flex items-center justify-center shadow-md mb-4">
              <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">Estándar</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-black text-slate-900">$10</span>
              <span className="text-[12px] text-slate-400">/mes</span>
            </div>
            <ul className="space-y-1.5 mb-5">
              {["App personal con QR y enlace", "Control de disponibilidad", "Métodos de pago configurables", "Historial de servicios", "Soporte por email"].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] text-emerald-500 mt-0.5">check_circle</span>
                  <span className="text-[12px] text-slate-600">{f}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => onShowAuth("register")} className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-bold hover:bg-slate-200 active:scale-95 transition">
              Comenzar con Estándar
            </button>
          </div>

          <div className="relative bg-white rounded-2xl p-6 border border-purple-200 ring-2 ring-purple-500 scale-[1.02]" style={{ boxShadow: "6px 6px 14px #d9dde2, -6px -6px 14px #ffffff" }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-purple-700 text-white text-[10px] font-black uppercase tracking-wider shadow-lg">Más Popular</div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md mb-4">
              <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">Profesional</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-black text-slate-900">$20</span>
              <span className="text-[12px] text-slate-400">/mes</span>
            </div>
            <ul className="space-y-1.5 mb-5">
              {["Todo del Estándar", "Tarifas avanzadas (km/zona/hora)", "Reservas de clientes agendadas", "Badge verificado", "Soporte prioritario por WhatsApp"].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] text-emerald-500 mt-0.5">check_circle</span>
                  <span className="text-[12px] text-slate-600">{f}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => onShowAuth("register")} className="w-full py-3 rounded-xl bg-purple-700 text-white text-[13px] font-bold shadow-lg active:scale-95 transition">
              Comenzar con Profesional
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] text-slate-400 mt-6">Sin comisiones por viaje. Sin retenciones. Pagas tu mensualidad y listo.</p>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="bg-purple-700 rounded-3xl p-10 text-center shadow-2xl shadow-purple-600/30">
          <h2 className="text-2xl font-black text-white mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>¿Quieres tu propia app?</h2>
          <p className="text-purple-100 mb-6 text-sm">Desde $10 al mes. Sin comisiones. Tú manejas tu negocio.</p>
          <button onClick={() => onShowAuth("register")} className="px-7 py-3 rounded-2xl bg-white text-purple-700 font-bold text-[13px] shadow-lg active:scale-95 transition">
            Quiero mi app ahora
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
            <a href="https://drivip-cliente.pages.dev" className="hover:text-slate-900 transition">Soy Cliente</a>
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
            <span className="material-symbols-outlined text-[26px] text-white">drive_eta</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-slate-900">Drivip Conductor</h1>
            <p className="text-[12px] text-slate-500">Iniciar sesión</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
              placeholder="conductor@email.com" required />
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
          No tengo cuenta — Registrarme gratis
        </button>
        <a href="https://drivip-home.pages.dev" className="block text-center text-[11px] text-slate-400 hover:text-slate-600">← Volver a Drivip</a>
      </div>
    </div>
  );
}

/* ==================== REGISTER ==================== */
function RegisterScreen({ onSwitchToLogin, onRegistered }: { onSwitchToLogin: () => void; onRegistered: (data: { nombre: string; apellido: string; cedula: string; plan: string; slug: string }) => void }) {
  const { loading: authLoading } = useAuthContext();
  const [form, setForm] = useState({
    nombre: "", apellido: "", cedula: "", email: "", telefono: "", password: "",
    ciudad: "Caracas", vehiculo_tipo: "carro", vehiculo_placa: "", vehiculo_modelo: "",
    plan: "estandar",
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          rol: "conductor",
          nombre: form.nombre,
          apellido: form.apellido,
          telefono: form.telefono,
          cedula: form.cedula,
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

    const base = `${form.nombre.toLowerCase().replace(/\s+/g, "")}${form.apellido.toLowerCase().replace(/\s+/g, "")}`;
    const suffix = Math.floor(Math.random() * 9000 + 1000);
    const slug = `${base}${suffix}`;
    const tenantId = crypto.randomUUID();

    const { error: tenantError } = await supabase.from("tenants").insert({
      id: tenantId,
      slug,
      type: "conductor",
      nombre: `${form.nombre} ${form.apellido}`.trim(),
      email: form.email,
      telefono: form.telefono,
      cedula: form.cedula,
      ciudad: form.ciudad,
      vehiculo_tipo: form.vehiculo_tipo,
      vehiculo_placa: form.vehiculo_placa,
      vehiculo_modelo: form.vehiculo_modelo,
      plan: form.plan,
      suscripcion_activa: false,
    });

    if (tenantError) {
      setFormError("Error al crear perfil de conductor. Intenta de nuevo.");
      setSubmitting(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      tenant_id: tenantId,
      rol: "conductor",
      nombre: form.nombre,
      apellido: form.apellido,
      telefono: form.telefono,
      email: form.email,
      activo: true,
    });

    if (profileError) {
      setFormError("Error al vincular tu cuenta con el perfil de conductor. Intenta de nuevo.");
      setSubmitting(false);
      return;
    }

    const codigoRef = new URLSearchParams(window.location.search).get("ref");
    if (codigoRef) {
      await registrarReferido(codigoRef);
    }

    setSubmitting(false);
    onRegistered({ nombre: form.nombre, apellido: form.apellido, cedula: form.cedula, plan: form.plan, slug });
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onload = (ev) => setFotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f4f6f8] p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 border border-slate-100" style={{ boxShadow: "6px 6px 14px #d9dde2, -6px -6px 14px #ffffff" }}>
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="material-symbols-outlined text-[26px] text-white">person_add</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-slate-900">Registrarse como Conductor</h1>
            <p className="text-[12px] text-slate-500">Crea tu app y empieza a fidelizar clientes</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre</label>
              <input type="text" value={form.nombre} onChange={(e) => update("nombre", e.target.value)}
                className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-2.5 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
                placeholder="Tu nombre" required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Apellido</label>
              <input type="text" value={form.apellido} onChange={(e) => update("apellido", e.target.value)}
                className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-2.5 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
                placeholder="Tu apellido" required />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cédula</label>
            <input type="text" value={form.cedula} onChange={(e) => update("cedula", e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-2.5 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
              placeholder="V-12345678" required />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-2.5 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
              placeholder="conductor@email.com" required />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teléfono</label>
              <input type="tel" value={form.telefono} onChange={(e) => update("telefono", e.target.value)}
                className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-2.5 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
                placeholder="+58 412..." required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ciudad</label>
              <select value={form.ciudad} onChange={(e) => update("ciudad", e.target.value)}
                className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-2.5 text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200">
                <option>Caracas</option><option>Maracaibo</option><option>Valencia</option>
                <option>Barquisimeto</option><option>Maracay</option><option>Mérida</option>
              </select>
            </div>
          </div>

          {/* FOTO PRINCIPAL */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Foto principal</label>
            <p className="text-[10px] text-slate-400 mb-1">Puede ser una foto tuya o de tu vehículo</p>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 border-dashed cursor-pointer hover:bg-slate-100 transition active:scale-[0.98]">
                <span className="material-symbols-outlined text-[18px] text-slate-400">cloud_upload</span>
                <span className="text-[12px] text-slate-500 font-medium">{foto ? "Cambiar foto" : "Subir foto"}</span>
                <input type="file" accept="image/*" onChange={handleFotoChange} className="hidden" required />
              </label>
              {fotoPreview && (
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                  <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* TIPO VEHICULO */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo de vehículo</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[
                { value: "carro", icon: "directions_car", label: "Carro" },
                { value: "moto", icon: "two_wheeler", label: "Moto" },
                { value: "camioneta", icon: "local_shipping", label: "Camioneta" },
              ].map((v) => (
                <button key={v.value} type="button" onClick={() => update("vehiculo_tipo", v.value)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition active:scale-95 ${
                    form.vehiculo_tipo === v.value ? "border-purple-500 bg-purple-50 text-purple-700" : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}>
                  <span className="material-symbols-outlined text-[18px]">{v.icon}</span>
                  <span className="text-[10px] font-bold">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Marca</label>
              <input type="text" value={form.vehiculo_modelo} onChange={(e) => update("vehiculo_modelo", e.target.value)}
                className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-2.5 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
                placeholder="Toyota, Hyundai..." required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Placa</label>
              <input type="text" value={form.vehiculo_placa} onChange={(e) => update("vehiculo_placa", e.target.value.toUpperCase())}
                className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-2.5 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200 uppercase"
                placeholder="ABC-123" required />
            </div>
          </div>

          {/* SELECCION DE PLAN */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Elige tu plan</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { value: "estandar", label: "Estándar", price: "$10/mes" },
                { value: "profesional", label: "Profesional", price: "$20/mes" },
              ].map((p) => (
                <button key={p.value} type="button" onClick={() => update("plan", p.value)}
                  className={`flex flex-col items-center gap-0.5 p-3 rounded-xl border-2 transition active:scale-95 ${
                    form.plan === p.value ? "border-purple-500 bg-purple-50 text-purple-700" : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}>
                  <span className="text-[12px] font-bold">{p.label}</span>
                  <span className="text-[10px] font-semibold opacity-70">{p.price}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contraseña</label>
            <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-2.5 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
              placeholder="Mínimo 6 caracteres" minLength={6} required />
          </div>

          {formError && <p className="text-[12px] text-red-500">{formError}</p>}
          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-xl bg-purple-700 text-white font-bold text-[13px] disabled:opacity-50 shadow-lg shadow-purple-600/30">
            {submitting ? "Creando..." : "Crear Cuenta de Conductor"}
          </button>
        </form>

        <button onClick={onSwitchToLogin} className="w-full text-center text-[12px] text-purple-600 font-bold mt-3">
          Ya tengo cuenta — Iniciar sesión
        </button>
        <a href="https://drivip-home.pages.dev" className="block text-center text-[11px] text-slate-400 hover:text-slate-600 mt-2">← Volver a Drivip</a>
      </div>
    </div>
  );
}

/* ==================== PENDING VALIDATION ==================== */
function PendingValidationScreen({ nombre, apellido, cedula, plan, slug }: { nombre: string; apellido: string; cedula: string; plan: string; slug: string }) {
  const planLabel = plan === "profesional" ? "Profesional ($20)" : "Estándar ($10)";
  const planMonto = plan === "profesional" ? "$20" : "$10";
  const inviteUrl = conductorInviteUrl(slug);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(inviteUrl)}`;

  const whatsappMsg = encodeURIComponent(
    `Hola, soy ${nombre} ${apellido}. Acabo de registrarme en Drivip como conductor con la cédula ${cedula}. Quiero activar mi plan ${planLabel}. Adjunto el comprobante de Pago Móvil.`
  );

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-100" style={{ boxShadow: "6px 6px 14px #d9dde2, -6px -6px 14px #ffffff" }}>
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-[26px] text-white">hourglass_top</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-slate-900">Tu cuenta está pendiente</h1>
            <p className="text-[12px] text-slate-500">Realiza el pago para activar tu app</p>
          </div>
        </div>

        {/* DATOS PAGO MÓVIL */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4">
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-3">Datos del Pago Móvil</h3>
          <div className="space-y-2">
            {[
              { label: "Banco", value: "0102 (Banco de Venezuela)" },
              { label: "Teléfono", value: "0414-3420573" },
              { label: "Cédula", value: "V-15.190.703" },
              { label: "Monto", value: `${planMonto} (Plan ${plan === "profesional" ? "Profesional" : "Estándar"})` },
            ].map((d) => (
              <div key={d.label} className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">{d.label}</span>
                <span className="text-[12px] text-slate-900 font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BOTON WHATSAPP */}
        <a
          href={`https://wa.me/584124058904?text=${whatsappMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold text-[13px] shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Enviar comprobante por WhatsApp
        </a>

        {/* QR Y ENLACE */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4">
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-3">Tu app personal</h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 flex items-center justify-center flex-shrink-0 p-1">
              <img src={qrSrc} alt={`QR de ${nombre}`} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-medium mb-1">Tu enlace personal:</p>
              <p className="text-[12px] text-purple-700 font-bold truncate">{inviteUrl}</p>
              <p className="text-[10px] text-slate-400 mt-2">Compártelo con tus clientes para que instalen tu app.</p>
            </div>
          </div>
        </div>

        {/* NOTA */}
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 mb-4">
          <p className="text-[11px] text-blue-700 text-center">Te contactaremos por WhatsApp en menos de 24 horas para validar tu pago.</p>
        </div>

        {/* IR AL PANEL */}
        <a href="/conductor" className="block w-full py-3 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-bold text-center hover:bg-slate-200 active:scale-[0.98] transition">
          Ir al panel de todos modos
        </a>
        <a href="https://drivip-home.pages.dev" className="block text-center text-[11px] text-slate-400 hover:text-slate-600 mt-4">← Volver a Drivip</a>
      </div>
    </div>
  );
}

/* ==================== MAIN APP ==================== */
export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}

function AppContent() {
  const { user, loading, configured } = useAuthContext();
  const [authView, setAuthView] = useState<"landing" | "login" | "register">("landing");
  const [registered, setRegistered] = useState<{ nombre: string; apellido: string; cedula: string; plan: string; slug: string } | null>(null);

  const demoParam =
    typeof window !== "undefined" &&
    ["1", "true"].includes(new URLSearchParams(window.location.search).get("demo") ?? "");

  if (demoParam) {
    return <DriverApp demo />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4f6f8]">
        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-[24px] text-purple-600">sync</span>
        </div>
      </div>
    );
  }

  if (registered) {
    return <PendingValidationScreen {...registered} />;
  }

  if (!user) {
    if (authView === "login") return <LoginScreen onSwitchToRegister={() => setAuthView("register")} />;
    if (authView === "register") return <RegisterScreen onSwitchToLogin={() => setAuthView("login")} onRegistered={setRegistered} />;
    return <LandingPage onShowAuth={(mode) => setAuthView(mode)} />;
  }

  return <DriverApp demo={!configured} />;
}
