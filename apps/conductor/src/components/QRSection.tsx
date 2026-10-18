import { useState } from "react";

interface QRSectionProps {
  profileSlug: string;
  profileName: string;
  isOnline: boolean;
}

export default function QRSection({ profileSlug, profileName, isOnline }: QRSectionProps) {
  const [copied, setCopied] = useState(false);
  const pwaUrl = `https://${profileSlug}.drivip.app`;

  const copyToClipboard = () => {
    navigator.clipboard?.writeText(pwaUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`¡Hola! Ahora puedes pedirme viajes directos sin comisiones desde mi enlace personal: ${pwaUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="px-4 py-4 space-y-5 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full">
      <div className="flex flex-col pt-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider">Tu Marca Personal</span>
            <h1 className="text-xl lg:text-2xl font-black text-slate-900">Tu QR & PWA Directa</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-md border border-slate-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] lg:text-xs font-bold text-slate-700">PWA Activa</span>
          </div>
        </div>
        <p className="text-[11px] lg:text-xs text-slate-500 mt-1">Comparte tu enlace exclusivo para que tus pasajeros habituales pidan sin intermediarios ni comisiones.</p>
      </div>

      <div className="bg-white rounded-3xl p-5 lg:p-6 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center text-center">
        <div className="flex items-center justify-between w-full mb-4 pb-3 border-b border-slate-100">
          <span className="text-base lg:text-lg font-black text-slate-900">Drivip</span>
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
            <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
            <span className="text-[11px] lg:text-xs font-bold text-emerald-700">Conductor Verificado</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full bg-slate-50 p-3 rounded-2xl mb-4 border border-slate-100">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center border-2 border-white shadow-md">
              <span className="text-base font-bold text-purple-700">{profileName.charAt(0)}</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex flex-col min-w-0 flex-1 text-left">
            <span className="text-sm lg:text-base font-bold text-slate-900 truncate">{profileName}</span>
            <span className="text-[11px] lg:text-xs text-slate-500 truncate">Conductor VIP • Drivip</span>
          </div>
        </div>

        <div className="w-full max-w-[220px] aspect-square bg-slate-900 rounded-2xl p-3 flex items-center justify-center mb-4">
          <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 100 100">
            <rect height="22" rx="2" width="22" x="6" y="6" />
            <rect fill="#1e293b" height="16" rx="1" width="16" x="9" y="9" />
            <rect height="10" rx="1" width="10" x="12" y="12" />
            <rect height="22" rx="2" width="22" x="72" y="6" />
            <rect fill="#1e293b" height="16" rx="1" width="16" x="75" y="9" />
            <rect height="10" rx="1" width="10" x="78" y="12" />
            <rect height="22" rx="2" width="22" x="6" y="72" />
            <rect fill="#1e293b" height="16" rx="1" width="16" x="9" y="75" />
            <rect height="10" rx="1" width="10" x="12" y="78" />
            <rect height="5" width="5" x="32" y="8" />
            <rect height="4" width="4" x="42" y="8" />
            <rect height="4" width="6" x="52" y="8" />
            <rect height="5" width="5" x="62" y="8" />
            <rect height="6" width="4" x="34" y="16" />
            <rect height="5" width="5" x="44" y="15" />
            <rect height="7" width="4" x="56" y="14" />
            <rect height="4" width="4" x="64" y="16" />
            <rect height="4" width="6" x="32" y="24" />
            <rect height="6" width="4" x="42" y="22" />
            <rect height="4" width="6" x="50" y="24" />
            <rect height="5" width="5" x="62" y="22" />
            <rect height="6" width="4" x="8" y="32" />
            <rect height="4" width="6" x="16" y="34" />
            <rect height="5" width="5" x="24" y="32" />
            <rect height="4" width="6" x="72" y="32" />
            <rect height="6" width="4" x="82" y="34" />
            <rect height="4" width="4" x="90" y="32" />
            <rect height="4" width="6" x="8" y="42" />
            <rect height="6" width="4" x="18" y="40" />
            <rect height="4" width="5" x="24" y="44" />
            <rect height="4" width="4" x="74" y="42" />
            <rect height="5" width="6" x="82" y="40" />
            <rect height="5" width="4" x="90" y="44" />
            <rect height="5" width="5" x="8" y="52" />
            <rect height="6" width="5" x="16" y="50" />
            <rect height="5" width="4" x="25" y="52" />
            <rect height="5" width="5" x="72" y="52" />
            <rect height="6" width="4" x="80" y="50" />
            <rect height="5" width="6" x="88" y="52" />
            <rect height="4" width="6" x="8" y="62" />
            <rect height="5" width="4" x="18" y="60" />
            <rect height="5" width="5" x="24" y="62" />
            <rect height="6" width="5" x="74" y="60" />
            <rect height="4" width="4" x="84" y="62" />
            <rect height="6" width="4" x="90" y="60" />
            <rect height="6" width="5" x="32" y="72" />
            <rect height="4" width="6" x="40" y="74" />
            <rect height="5" width="4" x="50" y="72" />
            <rect height="5" width="5" x="58" y="74" />
            <rect height="6" width="4" x="68" y="72" />
            <rect height="4" width="6" x="76" y="74" />
            <rect height="5" width="5" x="86" y="72" />
            <rect height="4" width="4" x="34" y="82" />
            <rect height="6" width="5" x="42" y="80" />
            <rect height="4" width="6" x="52" y="82" />
            <rect height="6" width="4" x="62" y="80" />
            <rect height="5" width="5" x="72" y="82" />
            <rect height="4" width="6" x="82" y="80" />
          </svg>
        </div>

        <div className="w-full bg-slate-50 px-3 py-2.5 rounded-2xl flex items-center justify-between border border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-slate-400 text-[16px]">public</span>
            <span className="text-xs lg:text-sm text-slate-700 font-bold truncate">{pwaUrl}</span>
          </div>
          <button onClick={copyToClipboard} className="text-purple-600 active:scale-95 flex items-center gap-1 text-[11px] lg:text-xs font-bold">
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <button className="w-full py-3.5 lg:py-4 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white font-black text-sm lg:text-base shadow-lg shadow-purple-600/30 active:scale-[0.98] transition flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[20px]">print</span>
          Descargar Afiche para Vehículo
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={copyToClipboard} className="py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs lg:text-sm font-bold flex items-center justify-center gap-2 active:scale-95 shadow-md">
            <span className="material-symbols-outlined text-[16px] text-purple-600">link</span>
            {copied ? "¡Copiado!" : "Copiar Enlace"}
          </button>
          <button onClick={shareWhatsApp} className="py-3 rounded-2xl bg-emerald-600 text-white text-xs lg:text-sm font-bold flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-emerald-500/30">
            <span className="material-symbols-outlined text-[16px]">share</span>
            WhatsApp
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] lg:text-xs font-bold text-slate-500">Escaneos QR</span>
            <span className="material-symbols-outlined text-amber-500 text-[18px]">qr_code_scanner</span>
          </div>
          <span className="text-2xl lg:text-3xl font-black text-slate-900">142</span>
          <p className="text-[10px] lg:text-[11px] text-slate-500 mt-1">Personas escanearon tu código</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-full w-[72%] rounded-full" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] lg:text-xs font-bold text-slate-500">Fidelizados</span>
            <span className="material-symbols-outlined text-purple-600 text-[18px]">install_mobile</span>
          </div>
          <span className="text-2xl lg:text-3xl font-black text-slate-900">38</span>
          <p className="text-[10px] lg:text-[11px] text-slate-500 mt-1">Agregaron tu icono a su inicio</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full w-[48%] rounded-full" />
          </div>
        </div>
      </div>

      {copied && (
        <div className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 rounded-full text-[13px] sm:text-sm lg:text-base shadow-xl flex items-center gap-2 transition-all duration-300 max-w-[90vw]">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span>¡Enlace copiado al portapapeles!</span>
        </div>
      )}
    </div>
  );
}
