"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import TenantListTable from "@/components/tenants/TenantListTable";
import TenantDetailCard from "@/components/tenants/TenantDetailCard";
import PluginCatalogGrid from "@/components/plugins/PluginCatalogGrid";
import DeliveryB2BControl from "@/components/b2b/DeliveryB2BControl";
import BannerManager from "@/components/banners/BannerManager";
import CredentialsManager from "@/components/security/CredentialsManager";
import DevOpsSection from "@/components/devops/DevOpsSection";
import SystemHealthMonitor from "@/components/devops/SystemHealthMonitor";

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("tenants");
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const renderContent = () => {
    if (selectedTenant) {
      return (
        <TenantDetailCard
          tenant={selectedTenant}
          onBack={() => setSelectedTenant(null)}
        />
      );
    }

    switch (activeTab) {
      case "tenants":
        return <TenantListTable onSelectTenant={setSelectedTenant} />;
      case "plugins":
        return <PluginCatalogGrid />;
      case "b2b":
        return <DeliveryB2BControl />;
      case "banners":
        return <BannerManager />;
      case "security":
        return <CredentialsManager />;
      case "devops":
        return <DevOpsSection />;
      case "health":
        return <SystemHealthMonitor />;
      default:
        return <TenantListTable onSelectTenant={setSelectedTenant} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header activeTab={activeTab} onSearch={setSearchQuery} />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
