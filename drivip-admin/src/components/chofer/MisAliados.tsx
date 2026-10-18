"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { aliadosData, aliadoStats } from "@/mockData/aliadosData";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import SearchInput from "@/components/ui/SearchInput";

type Aliado = (typeof aliadosData)[number];

type RideRequest = {
  id: string;
  pasajero: string;
  origen: string;
  destino: string;
  precio: number;
};

const STATUS_COLORS: Record<string, string> = {
  ONLINE: "bg-[#4edea3]",
  OCUPADO: "bg-yellow-500",
  OFFLINE: "bg-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  ONLINE: "En línea",
  OCUPADO: "Ocupado",
  OFFLINE: "Fuera de línea",
};

export default function MisAliados() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [selectedAllyToAdd, setSelectedAllyToAdd] = useState<Aliado | null>(null);
  const [commissionPct, setCommissionPct] = useState(15);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [ridePassModalOpen, setRidePassModalOpen] = useState(false);
  const [rideRequest, setRideRequest] = useState<RideRequest>({
    id: "R-901",
    pasajero: "Carlos Méndez",
    origen: "Av. Libertador",
    destino: "Plaza Venezuela",
    precio: 350,
  });
  const [selectedAllyForRide, setSelectedAllyForRide] = useState<Aliado | null>(null);
  const [rideCommissionPct, setRideCommissionPct] = useState(20);

  const filteredAllies = aliadosData.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const onlineAllies = aliadosData.filter((a) => a.status === "ONLINE");

  const addFiltered = aliadosData.filter(
    (a) =>
      a.name.toLowerCase().includes(addSearch.toLowerCase())
  );

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function handleSendRequest() {
    if (!selectedAllyToAdd) return;
    showToast(`Solicitud enviada a ${selectedAllyToAdd.name}`);
    setAddModalOpen(false);
    setSelectedAllyToAdd(null);
    setAddSearch("");
    setCommissionPct(15);
  }

  function handleSendOffer() {
    if (!selectedAllyForRide) return;
    showToast(`Oferta enviada a ${selectedAllyForRide.name}`);
    setTimeout(() => {
      showToast(`Carrera pasada a ${selectedAllyForRide.name}`);
      setRidePassModalOpen(false);
      setSelectedAllyForRide(null);
      setRideCommissionPct(20);
    }, 1500);
  }

  const myEarning = selectedAllyToAdd
    ? (rideRequest.precio * (100 - commissionPct)) / 100
    : 0;
  const allyEarning = selectedAllyToAdd
    ? (rideRequest.precio * commissionPct) / 100
    : 0;

  const rideMyEarning = selectedAllyForRide
    ? (rideRequest.precio * (100 - rideCommissionPct)) / 100
    : 0;
  const rideAllyEarning = selectedAllyForRide
    ? (rideRequest.precio * rideCommissionPct) / 100
    : 0;

  return (
    <div className="min-h-screen bg-surface p-6">
      <Toast message={toastMessage ?? ""} visible={!!toastMessage} />

      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white">
          Mis Aliados
        </h1>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setRidePassModalOpen(true)}
          >
            <span className="material-symbols-outlined text-lg mr-1">swap_horiz</span>
            Pasar carrera
          </Button>
          <Button onClick={() => setAddModalOpen(true)}>
            <span className="material-symbols-outlined text-lg mr-1">person_add</span>
            Agregar
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-container rounded-xl p-4">
          <p className="text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">
            Total Aliados
          </p>
          <p className="text-3xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
            {aliadoStats.total}
          </p>
        </div>
        <div className="bg-surface-container rounded-xl p-4">
          <p className="text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">
            En línea
          </p>
          <p className="text-3xl font-bold text-[#4edea3] font-[family-name:var(--font-space-grotesk)]">
            {aliadoStats.online}
          </p>
        </div>
        <div className="bg-surface-container rounded-xl p-4">
          <p className="text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">
            Pasajes Mes
          </p>
          <p className="text-3xl font-bold text-[#7c3aed] font-[family-name:var(--font-space-grotesk)]">
            {aliadoStats.totalTripsPassed}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <SearchInput
          placeholder="Buscar aliado por nombre..."
          value={search}
          onChange={setSearch}
        />
      </div>

      <div className="space-y-3">
        {filteredAllies.map((aliado) => (
          <div
            key={aliado.id}
            className="bg-surface-container rounded-xl p-4 cursor-pointer transition-all hover:bg-surface-container-high"
            onClick={() => setExpandedId(expandedId === aliado.id ? null : aliado.id)}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[#7c3aed] flex items-center justify-center text-white font-bold font-[family-name:var(--font-space-grotesk)]">
                  {aliado.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div
                  className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-container",
                    STATUS_COLORS[aliado.status]
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold font-[family-name:var(--font-space-grotesk)] truncate">
                    {aliado.name}
                  </h3>
                  <Badge
                    variant={
                      aliado.status === "ONLINE"
                        ? "active"
                        : aliado.status === "OCUPADO"
                          ? "warning"
                          : "offline"
                    }
                  >
                    {STATUS_LABELS[aliado.status]}
                  </Badge>
                </div>
                <p className="text-gray-400 text-sm font-[family-name:var(--font-geist-sans)]">
                  {aliado.vehicle} · {aliado.distance} km
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-[#ffb3ad]">
                  <span className="material-symbols-outlined text-sm">star</span>
                  <span className="text-sm font-[family-name:var(--font-geist-mono)]">
                    {aliado.rating}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-[family-name:var(--font-geist-mono)]">
                  {aliado.commission}% comisión
                </p>
              </div>

              <div className="text-right">
                <p className="text-[#4edea3] font-bold font-[family-name:var(--font-geist-mono)]">
                  {aliado.earnedThisMonth.toLocaleString()} Bs
                </p>
                <p className="text-xs text-gray-500 font-[family-name:var(--font-geist-mono)]">
                  este mes
                </p>
              </div>
            </div>

            {expandedId === aliado.id && (
              <div className="mt-4 pt-4 border-t border-gray-700/50 flex gap-3">
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e?.stopPropagation();
                    showToast(`WhatsApp de ${aliado.name}`);
                  }}
                >
                  <span className="material-symbols-outlined text-lg mr-1">chat</span>
                  WhatsApp
                </Button>
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e?.stopPropagation();
                    showToast(`Llamando a ${aliado.name}`);
                  }}
                >
                  <span className="material-symbols-outlined text-lg mr-1">call</span>
                  Llamar
                </Button>
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e?.stopPropagation();
                    showToast(`Precios enviados a ${aliado.name}`);
                  }}
                >
                  <span className="material-symbols-outlined text-lg mr-1">send</span>
                  Enviar precios
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setSelectedAllyToAdd(null);
          setAddSearch("");
          setCommissionPct(15);
        }}
      >
        <h2 className="text-lg font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-3">
          Agregar Aliado
        </h2>
        <div className="space-y-4">
          <SearchInput
            placeholder="Buscar por nombre..."
            value={addSearch}
            onChange={setAddSearch}
          />

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {addFiltered.map((aliado) => (
              <div
                key={aliado.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                  selectedAllyToAdd?.id === aliado.id
                    ? "bg-[#7c3aed]/20 border border-[#7c3aed]"
                    : "bg-surface-container-high hover:bg-gray-700"
                )}
                onClick={() => setSelectedAllyToAdd(aliado)}
              >
                <div className="w-10 h-10 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-sm font-bold font-[family-name:var(--font-space-grotesk)]">
                  {aliado.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm font-[family-name:var(--font-space-grotesk)]">
                    {aliado.name}
                  </p>
                  <p className="text-gray-400 text-xs font-[family-name:var(--font-geist-sans)]">
                    {aliado.vehicle}
                  </p>
                </div>
                <Badge
                  variant={
                    aliado.status === "ONLINE"
                      ? "active"
                      : aliado.status === "OCUPADO"
                        ? "warning"
                        : "offline"
                  }
                >
                  {STATUS_LABELS[aliado.status]}
                </Badge>
              </div>
            ))}
          </div>

          {selectedAllyToAdd && (
            <div className="bg-surface rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#7c3aed] flex items-center justify-center text-white font-bold font-[family-name:var(--font-space-grotesk)]">
                  {selectedAllyToAdd.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-white font-semibold font-[family-name:var(--font-space-grotesk)]">
                    {selectedAllyToAdd.name}
                  </p>
                  <p className="text-gray-400 text-sm font-[family-name:var(--font-geist-sans)]">
                    {selectedAllyToAdd.vehicle}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2 font-[family-name:var(--font-geist-mono)]">
                  Comisión del aliado: {commissionPct}%
                </label>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(Number(e.target.value))}
                  className="w-full accent-[#7c3aed]"
                />
                <div className="flex justify-between text-xs text-gray-500 font-[family-name:var(--font-geist-mono)]">
                  <span>5%</span>
                  <span>30%</span>
                </div>
              </div>

              <div className="bg-surface-container rounded-lg p-3 space-y-1">
                <p className="text-sm font-[family-name:var(--font-geist-mono)]">
                  <span className="text-gray-400">Tú recibes:</span>{" "}
                  <span className="text-[#4edea3] font-bold">
                    {((350 * (100 - commissionPct)) / 100).toFixed(0)} Bs
                  </span>
                </p>
                <p className="text-sm font-[family-name:var(--font-geist-mono)]">
                  <span className="text-gray-400">Aliado recibe:</span>{" "}
                  <span className="text-[#7c3aed] font-bold">
                    {((350 * commissionPct) / 100).toFixed(0)} Bs
                  </span>
                </p>
              </div>

              <Button onClick={handleSendRequest} className="w-full">
                <span className="material-symbols-outlined text-lg mr-1">send</span>
                Enviar solicitud
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={ridePassModalOpen}
        onClose={() => {
          setRidePassModalOpen(false);
          setSelectedAllyForRide(null);
          setRideCommissionPct(20);
        }}
      >
        <h2 className="text-lg font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-3">
          Pasar Carrera
        </h2>
        <div className="space-y-4">
          <div className="bg-surface rounded-lg p-3 space-y-1">
            <p className="text-white font-semibold font-[family-name:var(--font-space-grotesk)]">
              Carrera solicitada
            </p>
            <p className="text-gray-400 text-sm font-[family-name:var(--font-geist-sans)]">
              {rideRequest.pasajero}
            </p>
            <p className="text-gray-400 text-sm font-[family-name:var(--font-geist-sans)]">
              {rideRequest.origen} → {rideRequest.destino}
            </p>
            <p className="text-[#4edea3] font-bold font-[family-name:var(--font-geist-mono)]">
              {rideRequest.precio} Bs
            </p>
          </div>

          <p className="text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">
            Aliados disponibles (ONLINE):
          </p>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {onlineAllies.map((aliado) => (
              <div
                key={aliado.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                  selectedAllyForRide?.id === aliado.id
                    ? "bg-[#4edea3]/20 border border-[#4edea3]"
                    : "bg-surface-container-high hover:bg-gray-700"
                )}
                onClick={() => setSelectedAllyForRide(aliado)}
              >
                <div className="w-10 h-10 rounded-full bg-[#4edea3] flex items-center justify-center text-surface text-sm font-bold font-[family-name:var(--font-space-grotesk)]">
                  {aliado.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm font-[family-name:var(--font-space-grotesk)]">
                    {aliado.name}
                  </p>
                  <p className="text-gray-400 text-xs font-[family-name:var(--font-geist-sans)]">
                    {aliado.vehicle} · {aliado.distance} km
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selectedAllyForRide && (
            <div className="bg-surface rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-[family-name:var(--font-geist-mono)]">
                  Tu comisión: {rideCommissionPct}%
                </label>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={rideCommissionPct}
                  onChange={(e) => setRideCommissionPct(Number(e.target.value))}
                  className="w-full accent-[#4edea3]"
                />
                <div className="flex justify-between text-xs text-gray-500 font-[family-name:var(--font-geist-mono)]">
                  <span>5%</span>
                  <span>30%</span>
                </div>
              </div>

              <div className="bg-surface-container rounded-lg p-3 space-y-1">
                <p className="text-sm font-[family-name:var(--font-geist-mono)]">
                  <span className="text-gray-400">Tú recibes:</span>{" "}
                  <span className="text-[#4edea3] font-bold">
                    {rideMyEarning.toFixed(0)} Bs
                  </span>
                </p>
                <p className="text-sm font-[family-name:var(--font-geist-mono)]">
                  <span className="text-gray-400">{selectedAllyForRide.name} recibe:</span>{" "}
                  <span className="text-[#7c3aed] font-bold">
                    {rideAllyEarning.toFixed(0)} Bs
                  </span>
                </p>
              </div>

              <Button onClick={handleSendOffer} className="w-full">
                <span className="material-symbols-outlined text-lg mr-1">send</span>
                Enviar oferta
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
