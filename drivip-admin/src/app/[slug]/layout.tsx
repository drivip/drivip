import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Drivip",
  description: "Dashboard de operaciones - Drivip.app",
};

export default function SlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
