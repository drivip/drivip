"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import { lineaRideRequests, lineaDrivers } from "@/mockData/lineaData";

const PRIORITY_VARIANT: Record<string, "active" | "warning" | "offline"> = {
  normal: "offline",
  premium: "warning",
  vip: "active",
};

export default function SolicitudesDespacho() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>(
    {}
  );
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [requests, setRequests] = useState(lineaRideRequests);

  const onlineDrivers = lineaDrivers.filter((d) => d.status === "ONLINE");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const handleAssign = (reqId: string) => {
    const driverId = selectedDriver[reqId];
    if (!driverId) return;
    const driver = lineaDrivers.find((d) => d.id === driverId);
    if (!driver) return;
    showToast(`Carrera asignada a ${driver.name}`);
    setRequests((prev) => prev.filter((r) => r.id !== reqId));
    setSelectedDriver((prev) => {
      const next = { ...prev };
      delete next[reqId];
      return next;
    });
    setExpandedId(null);
  };

  const handleCancel = (reqId: string) => {
    showToast("Solicitud cancelada");
    setRequests((prev) => prev.filter((r) => r.id !== reqId));
    setExpandedId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-[22px] font-bold text-on-surface">
          Solicitudes Pendientes
        </h1>
        {requests.length > 0 && (
          <Badge variant="warning">{requests.length} pendientes</Badge>
        )}
      </div>

      {requests.length === 0 && (
        <div className="bg-surface-container rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-[56px] text-on-surface-variant mb-3 block">
            inbox
          </span>
          <p className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-semibold text-on-surface mb-1">
            Sin solicitudes pendientes
          </p>
          <p className="font-[family-name:var(--font-geist-sans)] text-[13px] text-on-surface-variant">
            Las nuevas solicitudes aparecerán aquí
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className="bg-surface-container rounded-xl p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-tertiary/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px] text-tertiary">
                    person
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-[family-name:var(--font-geist-sans)] text-[13px] font-semibold text-on-surface">
                      {req.clientName}
                    </p>
                    <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-amber-400">
                      ★ {req.rating}
                    </span>
                  </div>
                  <Badge variant={PRIORITY_VARIANT[req.priority]}>
                    {req.priority}
                  </Badge>
                </div>
              </div>
              <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant">
                {req.timestamp}
              </span>
            </div>

            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
              <span className="font-[family-name:var(--font-geist-sans)] text-[12px] truncate">
                {req.origin}
              </span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-tertiary shrink-0" />
              <span className="font-[family-name:var(--font-geist-sans)] text-[12px] truncate">
                {req.destination}
              </span>
            </div>

            <div className="flex items-center gap-4 text-on-surface-variant">
              <span className="flex items-center gap-1 font-[family-name:var(--font-geist-mono)] text-[11px]">
                <span className="material-symbols-outlined text-[14px]">straighten</span>
                {req.distance} km
              </span>
              <span className="font-[family-name:var(--font-space-grotesk)] text-[15px] font-bold text-on-surface">
                ${req.estimatedFare}
              </span>
              <span className="flex items-center gap-1 font-[family-name:var(--font-geist-mono)] text-[11px]">
                <span className="material-symbols-outlined text-[14px]">payments</span>
                {req.paymentMethod}
              </span>
            </div>

            {expandedId === req.id ? (
              <div className="flex flex-col gap-2 border-t border-outline/20 pt-3">
                <select
                  value={selectedDriver[req.id] || ""}
                  onChange={(e) =>
                    setSelectedDriver((prev) => ({
                      ...prev,
                      [req.id]: e.target.value,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-high text-on-surface font-[family-name:var(--font-geist-sans)] text-[12px] border border-outline/30 focus:outline-none focus:ring-1 focus:ring-tertiary"
                >
                  <option value="">Seleccionar chofer...</option>
                  {onlineDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — ★ {d.rating}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleAssign(req.id)}
                    disabled={!selectedDriver[req.id]}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      check
                    </span>
                    Asignar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      showToast(`Llamando a ${req.clientName}`)
                    }
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      call
                    </span>
                    Llamar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      showToast(`WhatsApp con ${req.clientName}`)
                    }
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      chat
                    </span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancel(req.id)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 border-t border-outline/20 pt-3">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setExpandedId(req.id)}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    assignment_ind
                  </span>
                  Asignar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    showToast(`Llamando a ${req.clientName}`)
                  }
                >
                  <span className="material-symbols-outlined text-[16px]">
                    call
                  </span>
                  Llamar
                </Button>
              </div>
            )}
          </div>
        ))}
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
