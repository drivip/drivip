import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Drivip - Central de Despacho",
  description: "Panel de operaciones - Drivip.app",
};

export default function LineaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
