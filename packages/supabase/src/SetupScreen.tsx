export function SetupScreen({ appName }: { appName: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface p-4">
      <div className="w-full max-w-[400px] bg-surface-container rounded-2xl p-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px] text-warning">warning</span>
          </div>
          <div className="text-center">
            <h1 className="text-[20px] font-bold text-on-surface font-display">Supabase no configurado</h1>
            <p className="text-[12px] text-on-surface-variant mt-1">{appName} necesita conexion a Supabase</p>
          </div>
        </div>

        <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
          <span className="text-[12px] font-mono text-on-surface-variant uppercase">Pasos para configurar</span>
          <ol className="space-y-2 text-[13px] text-on-surface">
            <li className="flex items-start gap-2">
              <span className="font-mono text-primary font-bold">1.</span>
              <span>Crea un proyecto en <a href="https://supabase.com" target="_blank" className="text-primary underline">supabase.com</a></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-primary font-bold">2.</span>
              <span>Crea un archivo <code className="bg-surface-container-highest px-1 rounded text-[12px]">.env</code> en la carpeta de la app</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-primary font-bold">3.</span>
              <div>Agrega estas variables:</div>
            </li>
          </ol>
          <pre className="bg-surface-container-highest rounded-lg p-3 text-[11px] font-mono text-on-surface overflow-x-auto">
{`VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...tu-anon-key`}
          </pre>
          <li className="flex items-start gap-2 text-[13px] text-on-surface list-none">
            <span className="font-mono text-primary font-bold">4.</span>
            <span>Reinicia el servidor de desarrollo</span>
          </li>
        </div>

        <div className="bg-surface-container-high rounded-xl p-4">
          <span className="text-[12px] font-mono text-on-surface-variant uppercase">URLs de las apps</span>
          <div className="mt-2 space-y-1 text-[12px] font-mono text-on-surface">
            <div>Home: <span className="text-primary">drivip-home.pages.dev</span></div>
            <div>Conductor: <span className="text-primary">drivip-conductor.pages.dev</span></div>
            <div>Linea: <span className="text-primary">drivip-linea.pages.dev</span></div>
            <div>SuperAdmin: <span className="text-primary">drivip-superadmin.pages.dev</span></div>
            <div>Cliente: <span className="text-primary">drivip-cliente.pages.dev</span></div>
            <div>Comercio: <span className="text-primary">drivip-comercio.pages.dev</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
