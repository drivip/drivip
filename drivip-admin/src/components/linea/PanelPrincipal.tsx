"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import MetricCard from "@/components/ui/MetricCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import {
  lineaDrivers,
  lineaRideRequests,
  lineaActiveRides,
  lineaStats,
} from "@/mockData/lineaData";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
});

type Props = {
  onNavigate: (module: string) => void;
};

export default function PanelPrincipal({ onNavigate }: Props) {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>(
    {}
  );

  const onlineDrivers = lineaDrivers.filter((d) => d.status === "ONLINE");

  const driverMarkers = lineaDrivers.map((d) => ({
    id: d.id,
    lat: d.lat,
    lng: d.lng,
    color:
      d.status === "ONLINE"
        ? "#4edea3"
        : d.status === "OCUPADO"
          ? "#f59e0b"
          : d.status === "EN_RUTA"
            ? "#7c3aed"
            : "#64748b",
    label: d.name,
    icon: d.vehicle.type === "moto" ? "🏍" : "🚗",
  }));

  const handleAssign = (requestId: string) => {
    const driverId = selectedDriver[requestId];
    if (!driverId) return;
    const driver = lineaDrivers.find((d) => d.id === driverId);
    if (!driver) return;
    setToastMessage(`Carrera asignada a ${driver.name}`);
    setToastVisible(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-[22px] font-bold text-on-surface">
            Central de Despacho
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary/20 text-tertiary font-[family-name:var(--font-geist-mono)] text-[10px] font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-ping" />
            EN VIVO
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Choferes Online"
          value={String(lineaStats.onlineDrivers)}
          suffix={`/ ${lineaStats.totalDrivers}`}
          icon="group"
          className="border-tertiary/20"
        />
        <MetricCard
          label="Carreras Activas"
          value={String(lineaStats.activeRides)}
          icon="directions_car"
          className="border-tertiary/20"
        />
        <MetricCard
          label="Completadas Hoy"
          value={String(lineaStats.completedToday)}
          icon="check_circle"
          trend={{ value: "+12%", positive: true }}
          className="border-tertiary/20"
        />
        <MetricCard
          label="Ganancias Hoy"
          value={`$${lineaStats.earningsToday.toLocaleString()}`}
          icon="attach_money"
          trend={{ value: "+8%", positive: true }}
          className="border-tertiary/20"
        />
      </div>

      {lineaRideRequests.length > 0 && (
        <div className="bg-surface-container rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-[15px] font-semibold text-on-surface">
              Solicitudes Pendientes
            </h2>
            <Badge variant="warning">{lineaRideRequests.length} nuevos</Badge>
          </div>
          <div className="flex flex-col gap-3">
            {lineaRideRequests.map((req) => (
              <div
                key={req.id}
                className="bg-surface-container-high rounded-xl p-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-[family-name:var(--font-geist-sans)] text-[13px] font-medium text-on-surface">
                      {req.clientName}
                    </p>
                    <p className="font-[family-name:var(--font-geist-sans)] text-[11px] text-on-surface-variant">
                      {req.origin} → {req.destination}
                    </p>
                  </div>
                  <p className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-on-surface">
                    ${req.estimatedFare}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedDriver[req.id] || ""}
                    onChange={(e) =>
                      setSelectedDriver((prev) => ({
                        ...prev,
                        [req.id]: e.target.value,
                      }))
                    }
                    className="flex-1 h-9 px-2.5 rounded-lg bg-surface-container text-on-surface font-[family-name:var(--font-geist-sans)] text-[12px] border border-outline/30 focus:outline-none focus:ring-1 focus:ring-tertiary"
                  >
                    <option value="">Seleccionar chofer...</option>
                    {onlineDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — ★ {d.rating}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAssign(req.id)}
                    disabled={!selectedDriver[req.id]}
                  >
                    Asignar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lineaActiveRides.length > 0 && (
        <div className="bg-surface-container rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-[15px] font-semibold text-on-surface">
              Carreras Activas
            </h2>
            <Badge variant="active">{lineaActiveRides.length} activas</Badge>
          </div>
          <div className="flex flex-col gap-2">
            {lineaActiveRides.map((ride) => (
              <div
                key={ride.id}
                className="bg-surface-container-high rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-tertiary/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px] text-tertiary">
                      directions_car
                    </span>
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-geist-sans)] text-[13px] font-medium text-on-surface">
                      {ride.driverName}
                    </p>
                    <p className="font-[family-name:var(--font-geist-sans)] text-[11px] text-on-surface-variant">
                      {ride.origin} → {ride.destination}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      ride.status === "EN_RUTA"
                        ? "active"
                        : ride.status === "ESPERANDO"
                          ? "warning"
                          : "active"
                    }
                  >
                    {ride.status.replace("_", " ")}
                  </Badge>
                  <p className="font-[family-name:var(--font-space-grotesk)] text-[14px] font-bold text-on-surface">
                    ${ride.fare}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface-container rounded-xl p-4">
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-[15px] font-semibold text-on-surface mb-3">
          Mapa en Vivo
        </h2>
        <MapView
          center={[10.4806, -66.9036]}
          zoom={13}
          className="h-[280px] w-full"
          markers={driverMarkers}
        />
      </div>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        icon="check_circle"
        variant="success"
        onDismiss={() => setToastVisible(false)}
      />
    </div>
  );
}
