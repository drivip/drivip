export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("es-VE", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function getStatusColor(status: string) {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "PAST_DUE":
      return "overdue";
    case "WARNING":
      return "warning";
    case "SUSPENDED":
      return "offline";
    default:
      return "offline";
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "ACTIVO";
    case "PAST_DUE":
      return "VENCIDO";
    case "WARNING":
      return "POR VENCER";
    case "SUSPENDED":
      return "SUSPENDIDO";
    default:
      return "DESCONOCIDO";
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
