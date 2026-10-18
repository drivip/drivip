export type TenantType = "chofer" | "linea";

export interface Tenant {
  slug: string;
  type: TenantType;
  name: string;
}

const tenants: Tenant[] = [
  { slug: "jose-olivares", type: "chofer", name: "Jose Olivares" },
  { slug: "silva-rides", type: "chofer", name: "Alejandro Silva" },
  { slug: "ramirez-tours", type: "chofer", name: "Pedro Ramirez" },
  { slug: "morales-fast", type: "chofer", name: "Luis Morales" },
  { slug: "linea-isabelica", type: "linea", name: "Linea Isabelica" },
  { slug: "linea-caracas", type: "linea", name: "Linea Caracas" },
];

export function resolveTenant(slug: string): Tenant | null {
  return tenants.find((t) => t.slug === slug) || null;
}

export function isSubdomain(hostname: string): boolean {
  const parts = hostname.split(".");
  return parts.length > 2 || (parts.length === 2 && parts[0] !== "www");
}

export function extractSlugFromHostname(hostname: string): string | null {
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}
