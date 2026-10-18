import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Drivip - SuperAdmin",
  description: "Central de Control SaaS - Drivip.app",
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
