import { APP_URLS } from "./config";

export default function App() {
  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col items-center justify-center px-4">

      <img src="/logo.png" alt="Drivip" className="w-64 max-w-full mb-12" />

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <a href={APP_URLS.conductor} className="w-full px-6 py-4 rounded-2xl bg-purple-700 text-white font-bold text-[14px] shadow-lg shadow-purple-600/25 active:scale-95 transition flex items-center justify-center gap-2 text-center">
          Soy Conductor — Quiero mi app
        </a>
        <a href={APP_URLS.cliente} className="w-full px-6 py-4 rounded-2xl bg-white text-slate-900 font-bold text-[14px] border border-slate-200 shadow-md active:scale-95 transition flex items-center justify-center gap-2 text-center">
          Soy Cliente — Busco conductor
        </a>
      </div>

    </div>
  );
}
