import { useState } from "react";
import { useAuthContext } from "@drivip/supabase";

export default function LoginScreen() {
  const { signIn, loading, error } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f4f6f8] p-4 lg:p-8">
      <div className="w-full max-w-md lg:max-w-lg bg-white rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl shadow-slate-200/60 border border-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <svg className="w-7 h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-xl lg:text-2xl font-black text-slate-900">Drivip Admin</h1>
            <p className="text-xs lg:text-sm text-slate-500">Panel Maestro</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-sm lg:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 border border-slate-200"
              placeholder="admin@drivip.app"
              required
            />
          </div>
          <div>
            <label className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-sm lg:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 border border-slate-200"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-xs lg:text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 lg:py-3.5 rounded-xl bg-red-600 text-white font-semibold text-sm lg:text-base disabled:opacity-50 shadow-lg shadow-red-600/30 active:scale-[0.98] transition"
          >
            {loading ? "Procesando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
