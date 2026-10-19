import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import type { PublicTenant } from "@drivip/types";
import { agregarConductorRed, buscarConductores } from "@drivip/supabase";

type Tab = "search" | "qr";

interface AddConductorModalProps {
  open: boolean;
  initialTab?: Tab;
  onClose: () => void;
  onAdded: () => void;
}

function extractSlug(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const add = url.searchParams.get("add") ?? url.searchParams.get("conductor");
    if (add?.trim()) return add.trim();
  } catch {
    // El valor puede ser un slug o un enlace sin protocolo.
  }

  const match = value.match(/[?&](?:add|conductor)=([^&#]+)/i);
  if (match) {
    try {
      return decodeURIComponent(match[1]).trim();
    } catch {
      return match[1].trim();
    }
  }

  if (/^[a-z0-9._-]{2,80}$/i.test(value)) return value;
  return null;
}

function vehicleLabel(conductor: PublicTenant): string {
  const parts = [conductor.vehiculo_modelo, conductor.vehiculo_placa].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Vehículo no indicado";
}

export default function AddConductorModal({
  open,
  initialTab = "search",
  onClose,
  onAdded,
}: AddConductorModalProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicTenant[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingSlug, setAddingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const closingTimerRef = useRef<number | null>(null);

  const stopScan = useCallback(() => {
    if (scanTimerRef.current !== null) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  }, []);

  const addBySlug = useCallback(
    async (slug: string) => {
      if (busyRef.current) return;
      const clean = slug.trim();
      if (!clean) {
        setError("Escribe el código o pega el enlace del conductor.");
        return;
      }

      busyRef.current = true;
      setAddingSlug(clean);
      setError(null);
      setSuccess(null);
      stopScan();

      try {
        const result = await agregarConductorRed(clean);
        setSuccess(`¡${result.nombre} ya está en tu círculo!`);
        onAdded();
        closingTimerRef.current = window.setTimeout(() => {
          onClose();
        }, 900);
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        setError(
          message.includes("conductor_no_encontrado")
            ? "Ese conductor no existe. Verifica el enlace o busca su nombre."
            : "No se pudo agregar el conductor. Intenta de nuevo."
        );
      } finally {
        busyRef.current = false;
        setAddingSlug(null);
      }
    },
    [onAdded, onClose, stopScan]
  );

  const handleDetected = useCallback(
    (raw: string) => {
      const slug = extractSlug(raw);
      if (!slug) {
        setScanError("El QR no pertenece a un conductor de Drivip.");
        return;
      }
      setScanError(null);
      void addBySlug(slug);
    },
    [addBySlug]
  );

  const startScan = useCallback(async () => {
    setScanError(null);
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError("Tu navegador no permite usar la cámara. Pega el enlace abajo.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      video.srcObject = stream;
      await video.play();
      setScanning(true);

      scanTimerRef.current = window.setInterval(() => {
        if (busyRef.current) return;
        const current = videoRef.current;
        if (!current || current.readyState < 2 || !current.videoWidth) return;

        const canvas = document.createElement("canvas");
        canvas.width = current.videoWidth;
        canvas.height = current.videoHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;

        context.drawImage(current, 0, 0, canvas.width, canvas.height);
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(image.data, canvas.width, canvas.height, {
          inversionAttempts: "dontInvert",
        });
        if (code?.data) handleDetected(code.data);
      }, 450);
    } catch {
      setScanError("No pudimos abrir la cámara. Revisa los permisos o pega el enlace.");
      stopScan();
    }
  }, [handleDetected, stopScan]);

  useEffect(() => {
    if (!open) {
      stopScan();
      return;
    }
    setTab(initialTab);
  }, [open, initialTab, stopScan]);

  useEffect(() => {
    return () => {
      stopScan();
      if (closingTimerRef.current !== null) window.clearTimeout(closingTimerRef.current);
    };
  }, [stopScan]);

  useEffect(() => {
    if (!open || tab !== "search") return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const found = await buscarConductores(q);
        if (!cancelled) setResults(found);
      } catch {
        if (!cancelled) setError("No se pudo buscar conductores. Intenta de nuevo.");
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, open, tab]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-100">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">Agregar conductor</h2>
            <p className="text-[11px] text-slate-500">Busca por nombre o escanea su QR</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95"
          >
            <span className="material-symbols-outlined text-[19px]">close</span>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2 bg-slate-100 rounded-2xl p-1">
            <button
              onClick={() => { setTab("search"); setError(null); stopScan(); }}
              className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                tab === "search" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">search</span>
              Por nombre
            </button>
            <button
              onClick={() => { setTab("qr"); setError(null); }}
              className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                tab === "qr" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">qr_code_scanner</span>
              Escanear QR
            </button>
          </div>

          {tab === "search" && (
            <div className="space-y-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                  person_search
                </span>
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nombre del conductor..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300"
                />
              </div>

              {query.trim().length < 2 && (
                <div className="text-center py-6">
                  <span className="material-symbols-outlined text-[38px] text-slate-300">search</span>
                  <p className="text-xs text-slate-500 mt-1">Escribe al menos 2 letras del nombre.</p>
                </div>
              )}

              {searching && (
                <div className="flex items-center justify-center py-5">
                  <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!searching && query.trim().length >= 2 && results.length === 0 && (
                <div className="text-center py-6">
                  <span className="material-symbols-outlined text-[38px] text-slate-300">person_off</span>
                  <p className="text-xs text-slate-500 mt-1">No encontramos ese conductor.</p>
                  <p className="text-[11px] text-slate-400">Prueba con su nombre completo o escanea su QR.</p>
                </div>
              )}

              <div className="space-y-2">
                {results.map((conductor) => (
                  <div
                    key={conductor.id}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-white shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-violet-700">
                        {conductor.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-900 truncate">{conductor.nombre}</p>
                        {conductor.pausado && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-bold">Pausado</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {conductor.ciudad ? `${conductor.ciudad} · ` : ""}{vehicleLabel(conductor)}
                      </p>
                    </div>
                    <button
                      onClick={() => void addBySlug(conductor.slug)}
                      disabled={addingSlug !== null}
                      className="px-3 py-2 rounded-xl bg-violet-600 text-white text-[11px] font-bold active:scale-95 disabled:opacity-50 flex items-center gap-1"
                    >
                      {addingSlug === conductor.slug ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[15px]">person_add</span>
                      )}
                      Agregar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "qr" && (
            <div className="space-y-3">
              <div className="relative aspect-square max-h-[300px] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                {!scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/90 gap-2 p-5 text-center">
                    <span className="material-symbols-outlined text-[46px]">qr_code_scanner</span>
                    <p className="text-xs">Apunta la cámara al QR del conductor.</p>
                    <button
                      onClick={() => void startScan()}
                      className="mt-1 px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-black active:scale-95"
                    >
                      Abrir cámara
                    </button>
                  </div>
                )}
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white/80 rounded-2xl shadow-[0_0_0_999px_rgba(15,23,42,0.35)]" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  O pega el enlace del conductor
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualValue}
                    onChange={(e) => setManualValue(e.target.value)}
                    placeholder="https://drivip-cliente.pages.dev/?add=..."
                    className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                  <button
                    onClick={() => {
                      const slug = extractSlug(manualValue);
                      if (!slug) {
                        setError("Pega un enlace válido de Drivip o el código del conductor.");
                        return;
                      }
                      void addBySlug(slug);
                    }}
                    disabled={addingSlug !== null}
                    className="px-3 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold active:scale-95 disabled:opacity-50"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          )}

          {scanError && <p className="text-xs text-amber-600 text-center">{scanError}</p>}
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          {success && (
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600">
              <span className="material-symbols-outlined text-[17px]">check_circle</span>
              {success}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
