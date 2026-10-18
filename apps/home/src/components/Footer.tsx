import DrivipLogo from "./DrivipLogo";

interface FooterProps {
  variant?: "light" | "dark";
}

export default function Footer({ variant = "light" }: FooterProps) {
  const isDark = variant === "dark";

  return (
    <footer className={`${isDark ? "bg-[#0a0a1a] border-white/10" : "bg-white border-slate-200/60"} border-t`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <DrivipLogo size="md" variant={isDark ? "white" : "full"} />
            <p className={`text-[12px] ${isDark ? "text-white/50" : "text-slate-500"} mt-3 max-w-xs`}>
              La plataforma de movilidad más segura y confiable de Venezuela.
            </p>
          </div>

          <div>
            <h4 className={`text-[11px] font-bold ${isDark ? "text-white/70" : "text-slate-900"} uppercase tracking-wider mb-3`}>Producto</h4>
            <ul className="space-y-2">
              {["Para Clientes", "Para Conductores", "Para Negocios", "Planes"].map((item) => (
                <li key={item}>
                  <a href="#" className={`text-[12px] ${isDark ? "text-white/50 hover:text-white" : "text-slate-500 hover:text-slate-900"} transition`}>{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={`text-[11px] font-bold ${isDark ? "text-white/70" : "text-slate-900"} uppercase tracking-wider mb-3`}>Empresa</h4>
            <ul className="space-y-2">
              {["Sobre Nosotros", "Blog", "Empleo", "Contacto"].map((item) => (
                <li key={item}>
                  <a href="#" className={`text-[12px] ${isDark ? "text-white/50 hover:text-white" : "text-slate-500 hover:text-slate-900"} transition`}>{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={`text-[11px] font-bold ${isDark ? "text-white/70" : "text-slate-900"} uppercase tracking-wider mb-3`}>Legal</h4>
            <ul className="space-y-2">
              {["Términos", "Privacidad", "Cookies", "Licencias"].map((item) => (
                <li key={item}>
                  <a href="#" className={`text-[12px] ${isDark ? "text-white/50 hover:text-white" : "text-slate-500 hover:text-slate-900"} transition`}>{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={`pt-6 border-t ${isDark ? "border-white/10" : "border-slate-200/60"} flex flex-col md:flex-row items-center justify-between gap-4`}>
          <span className={`text-[11px] ${isDark ? "text-white/40" : "text-slate-400"}`}>© 2026 Drivip. Todos los derechos reservados. Venezuela.</span>
          <div className="flex items-center gap-4">
            {["facebook", "instagram", "twitter"].map((social) => (
              <a key={social} href="#" className={`w-8 h-8 rounded-lg ${isDark ? "bg-white/10 text-white/50 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"} flex items-center justify-center transition`}>
                <span className="material-symbols-outlined text-[16px]">{social === "twitter" ? "tag" : social}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
