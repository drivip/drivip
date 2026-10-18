export const systemHealth = {
  overallStatus: "operational",
  latency: 24,
  latencyDelta: -3.2,
  uptime: 99.98,
  nodesAlive: 3,
  nodesTotal: 3,
};

export const infrastructureNodes = [
  {
    id: "postgresql",
    name: "PostgreSQL Cluster",
    subtitle: "Primary US-East Read/Write",
    icon: "database",
    status: "healthy",
    statusLabel: "SALUDABLE",
    color: "primary",
    metrics: [
      { label: "Disponibilidad", value: "100%", color: "secondary" },
      { label: "Latencia", value: "8.4 ms", color: "on-surface" },
      { label: "Conexiones", value: "142 / 300", color: "on-surface" },
    ],
    storage: {
      label: "Almacenamiento NVMe",
      used: 48.6,
      total: 120,
      unit: "GB",
    },
  },
  {
    id: "websockets",
    name: "WebSockets Fleet Engine",
    subtitle: "Telemetry Ingestion Layer",
    icon: "sensors",
    status: "optimal",
    statusLabel: "OPTIMO",
    color: "secondary",
    metrics: [
      { label: "Conductores en Vivo", value: "1,420 conectados", color: "on-surface" },
      { label: "Throughput", value: "18.4k msgs/s", color: "primary" },
    ],
    storage: null,
  },
  {
    id: "webpush",
    name: "Servicio WebPush VAPID",
    subtitle: "FCM & Safari APNs Relay",
    icon: "notifications_active",
    status: "active",
    statusLabel: "ACTIVO",
    color: "primary",
    metrics: [
      { label: "Despachos Hoy", value: "48,210", color: "on-surface" },
      { label: "Tasa Entrega", value: "99.4%", color: "secondary" },
      { label: "Tasa Error", value: "0.02%", color: "on-surface-variant" },
    ],
    storage: null,
  },
];

export const backups = [
  {
    id: "sql-snapshot",
    name: "Snapshot SQL Binario (.sql.gz)",
    lastRun: "Hoy, 04:00 AM (Automatico)",
    size: "1.42 GB",
    icon: "archive",
    color: "primary",
  },
  {
    id: "json-export",
    name: "Exportacion JSON Choferes",
    lastRun: "Ayer, 23:30 PM",
    size: "480 MB",
    icon: "code_blocks",
    color: "on-surface",
  },
];

export const maintenanceActions = [
  {
    id: "purge-gps",
    name: "Purgar Coordenadas GPS (>30 dias)",
    description: "Libera ~14.2 GB de disco en particiones",
    icon: "delete_sweep",
    estimatedSize: "14.2 GB",
  },
  {
    id: "clear-sessions",
    name: "Cerrar Sesiones Inactivas (>48 hrs)",
    description: "328 tokens zombies en cache Redis",
    icon: "key_off",
    estimatedSize: "328 tokens",
  },
];
