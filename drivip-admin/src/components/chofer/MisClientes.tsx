"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { clientesData, clienteStats } from "@/mockData/clientesData";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import FilterPills from "@/components/ui/FilterPills";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import SlideOver from "@/components/ui/SlideOver";

type Cliente = (typeof clientesData)[number];

type SortKey = "name" | "totalTrips" | "lastTrip";

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "name", label: "Nombre" },
  { id: "totalTrips", label: "Carreras" },
  { id: "lastTrip", label: "Última carrera" },
];

const FILTER_OPTIONS = [
  { id: "todos", label: "Todos" },
  { id: "frecuentes", label: "Frecuentes" },
  { id: "sin-calificar", label: "Sin calificar" },
  { id: "con-deuda", label: "Con deuda" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer"
          )}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange?.(star)}
        >
          <span
            className={cn(
              "material-symbols-outlined text-lg",
              (hover || value) >= star
                ? "text-[#ffb3ad]"
                : "text-gray-600"
            )}
          >
            star
          </span>
        </button>
      ))}
    </div>
  );
}

export default function MisClientes() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailClient, setDetailClient] = useState<Cliente | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newRating, setNewRating] = useState(0);

  function showToast(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
  }

  function resetForm() {
    setNewName("");
    setNewPhone("");
    setNewAddress("");
    setNewNotes("");
    setNewRating(0);
  }

  function handleSubmit() {
    if (!newName.trim()) return;
    showToast("Cliente agregado");
    setAddModalOpen(false);
    resetForm();
  }

  const filteredClients = useMemo(() => {
    let result = [...clientesData];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q)
      );
    }

    switch (activeFilter) {
      case "frecuentes":
        result = result.filter((c) => c.totalTrips > 20);
        break;
      case "sin-calificar":
        result = result.filter((c) => c.rating === 0);
        break;
      case "con-deuda":
        result = result.filter((c) => c.totalSpent < 1000);
        break;
    }

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "totalTrips") return b.totalTrips - a.totalTrips;
      return 0;
    });

    return result;
  }, [search, activeFilter, sortBy]);

  const filterCounts = useMemo(
    () => ({
      todos: clientesData.length,
      frecuentes: clientesData.filter((c) => c.totalTrips > 20).length,
      "sin-calificar": clientesData.filter((c) => c.rating === 0).length,
      "con-deuda": clientesData.filter((c) => c.totalSpent < 1000).length,
    }),
    []
  );

  return (
    <div className="min-h-screen bg-surface p-6">
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />

      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white">
            Mis Clientes
          </h1>
          <Badge variant="active">
            {clienteStats.total} clientes
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-[family-name:var(--font-geist-mono)] transition-colors",
                  sortBy === opt.id
                    ? "bg-primary-container text-on-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button onClick={() => setAddModalOpen(true)}>
            <span className="material-symbols-outlined text-lg mr-1">person_add</span>
            Agregar
          </Button>
        </div>
      </header>

      <div className="mb-4">
        <SearchInput
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={setSearch}
        />
      </div>

      <div className="mb-6">
        <FilterPills
          options={FILTER_OPTIONS.map((f) => ({
            ...f,
            count: filterCounts[f.id as keyof typeof filterCounts],
          }))}
          activeId={activeFilter}
          onChange={setActiveFilter}
        />
      </div>

      <div className="space-y-3">
        {filteredClients.length === 0 && (
          <div className="bg-surface-container rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-500 mb-2">
              search_off
            </span>
            <p className="text-gray-400 font-[family-name:var(--font-geist-sans)]">
              No se encontraron clientes
            </p>
          </div>
        )}

        {filteredClients.map((cliente) => (
          <div
            key={cliente.id}
            className="bg-surface-container rounded-xl p-4 cursor-pointer transition-all hover:bg-surface-container-high"
            onClick={() =>
              setExpandedId(expandedId === cliente.id ? null : cliente.id)
            }
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-white font-bold font-[family-name:var(--font-space-grotesk)]">
                {getInitials(cliente.name)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold font-[family-name:var(--font-space-grotesk)] truncate">
                    {cliente.name}
                  </h3>
                  {cliente.rating === 0 && (
                    <Badge variant="warning">Sin calificar</Badge>
                  )}
                  {cliente.totalSpent < 1000 && (
                    <Badge variant="overdue">Con deuda</Badge>
                  )}
                </div>
                <p className="text-gray-400 text-sm font-[family-name:var(--font-geist-sans)] truncate">
                  {cliente.phone} · {cliente.address}
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-[#ffb3ad]">
                  <span className="material-symbols-outlined text-sm">star</span>
                  <span className="text-sm font-[family-name:var(--font-geist-mono)]">
                    {cliente.rating > 0 ? cliente.rating : "—"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-[family-name:var(--font-geist-mono)]">
                  {cliente.totalTrips} carreras
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-[#4edea3] font-bold font-[family-name:var(--font-geist-mono)]">
                  {cliente.totalSpent.toLocaleString()} Bs
                </p>
                <p className="text-xs text-gray-500 font-[family-name:var(--font-geist-mono)]">
                  {cliente.lastTrip}
                </p>
              </div>
            </div>

            {expandedId === cliente.id && (
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                {cliente.notes && (
                  <p className="text-gray-400 italic text-sm mb-3 font-[family-name:var(--font-geist-sans)]">
                    &ldquo;{cliente.notes}&rdquo;
                  </p>
                )}
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e?.stopPropagation();
                      window.open(
                        `https://wa.me/${cliente.phone.replace(/[^0-9]/g, "")}`,
                        "_blank"
                      );
                    }}
                  >
                    <span className="material-symbols-outlined text-lg mr-1">
                      chat
                    </span>
                    WhatsApp
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e?.stopPropagation();
                      window.open(`tel:${cliente.phone}`, "_blank");
                    }}
                  >
                    <span className="material-symbols-outlined text-lg mr-1">
                      call
                    </span>
                    Llamar
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e?.stopPropagation();
                      setDetailClient(cliente);
                    }}
                  >
                    <span className="material-symbols-outlined text-lg mr-1">
                      open_in_new
                    </span>
                    Ver detalle
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          resetForm();
        }}
      >
        <h2 className="text-lg font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-1">
          Agregar Cliente
        </h2>
        <p className="text-sm text-gray-400 font-[family-name:var(--font-geist-sans)] mb-3">
          Registra un nuevo cliente frecuente
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-gray-400 mb-1 font-[family-name:var(--font-geist-mono)]">
              Nombre
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre completo"
              className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-[12px] text-on-surface w-full focus:outline-none focus:border-primary-container"
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1 font-[family-name:var(--font-geist-mono)]">
              Teléfono
            </label>
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+58 414-555-0000"
              className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-[12px] text-on-surface w-full focus:outline-none focus:border-primary-container"
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1 font-[family-name:var(--font-geist-mono)]">
              Dirección habitual
            </label>
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Dirección de recogida frecuente"
              className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-[12px] text-on-surface w-full focus:outline-none focus:border-primary-container"
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1 font-[family-name:var(--font-geist-mono)]">
              Notas
            </label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Preferencias, horarios, etc."
              rows={2}
              className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-[12px] text-on-surface w-full focus:outline-none focus:border-primary-container resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1 font-[family-name:var(--font-geist-mono)]">
              Calificación inicial
            </label>
            <StarRating value={newRating} onChange={setNewRating} />
          </div>

          <Button onClick={handleSubmit} className="w-full mt-2">
            <span className="material-symbols-outlined text-lg mr-1">check</span>
            Agregar cliente
          </Button>
        </div>
      </Modal>

      <SlideOver
        open={!!detailClient}
        onClose={() => setDetailClient(null)}
      >
        {detailClient && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center text-white text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
                {getInitials(detailClient.name)}
              </div>
              <div>
                <h2 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] text-white">
                  {detailClient.name}
                </h2>
                <p className="text-gray-400 text-sm font-[family-name:var(--font-geist-sans)]">
                  {detailClient.phone}
                </p>
              </div>
            </div>

            <div className="bg-surface-container rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-gray-400">
                  location_on
                </span>
                <span className="text-sm text-on-surface font-[family-name:var(--font-geist-sans)]">
                  {detailClient.address}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-gray-400">
                  schedule
                </span>
                <span className="text-sm text-on-surface font-[family-name:var(--font-geist-sans)]">
                  Última carrera: {detailClient.lastTrip}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-container rounded-xl p-3 text-center">
                <p className="text-[11px] text-gray-400 font-[family-name:var(--font-geist-mono)]">
                  Carreras
                </p>
                <p className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                  {detailClient.totalTrips}
                </p>
              </div>
              <div className="bg-surface-container rounded-xl p-3 text-center">
                <p className="text-[11px] text-gray-400 font-[family-name:var(--font-geist-mono)]">
                  Calificación
                </p>
                <div className="flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#ffb3ad]">
                    star
                  </span>
                  <p className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                    {detailClient.rating > 0 ? detailClient.rating : "—"}
                  </p>
                </div>
              </div>
              <div className="bg-surface-container rounded-xl p-3 text-center">
                <p className="text-[11px] text-gray-400 font-[family-name:var(--font-geist-mono)]">
                  Total gastado
                </p>
                <p className="text-2xl font-bold text-[#4edea3] font-[family-name:var(--font-geist-mono)]">
                  {detailClient.totalSpent.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-500 font-[family-name:var(--font-geist-mono)]">
                  Bs
                </p>
              </div>
            </div>

            {detailClient.notes && (
              <div className="bg-surface-container rounded-xl p-4">
                <p className="text-[11px] text-gray-400 font-[family-name:var(--font-geist-mono)] mb-1">
                  Notas
                </p>
                <p className="text-sm text-on-surface italic font-[family-name:var(--font-geist-sans)]">
                  &ldquo;{detailClient.notes}&rdquo;
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() =>
                  window.open(
                    `https://wa.me/${detailClient.phone.replace(/[^0-9]/g, "")}`,
                    "_blank"
                  )
                }
              >
                <span className="material-symbols-outlined text-lg mr-1">
                  chat
                </span>
                WhatsApp
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() =>
                  window.open(`tel:${detailClient.phone}`, "_blank")
                }
              >
                <span className="material-symbols-outlined text-lg mr-1">
                  call
                </span>
                Llamar
              </Button>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
