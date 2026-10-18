import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Drivip - Panel del Chofer",
  description: "Dashboard de operaciones - Drivip.app",
};

export default function ChoferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
