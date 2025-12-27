import React, { useState } from "react";
import { PharmacyDashboard } from "./PharmacyDashboard";
import { DrugInventory } from "./DrugInventory";
import { PrescriptionFulfillment } from "./PrescriptionFulfillment";
import { PharmacyBilling } from "./PharmacyBilling";
import { Pill, Package, FileText, CreditCard, BarChart3 } from "lucide-react";

type PharmacyTab =
  | "dashboard"
  | "inventory"
  | "prescriptions"
  | "billing"
  | "analytics";

export const PharmacyModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PharmacyTab>("dashboard");

  const tabs = [
    { id: "dashboard" as PharmacyTab, label: "Dashboard", icon: BarChart3 },
    { id: "inventory" as PharmacyTab, label: "Inventory", icon: Package },
    {
      id: "prescriptions" as PharmacyTab,
      label: "Prescriptions",
      icon: FileText,
    },
    { id: "billing" as PharmacyTab, label: "Billing", icon: CreditCard },
  ];

  const TabButton: React.FC<{
    id: PharmacyTab;
    label: string;
    icon: React.ComponentType<any>;
  }> = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
        activeTab === id
          ? "bg-[#012e58] text-white shadow-sm"
          : "text-[#1a4b7a] hover:bg-[#e0f7fa]"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </button>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <PharmacyDashboard />;
      case "inventory":
        return <DrugInventory />;
      case "prescriptions":
        return <PrescriptionFulfillment />;
      case "billing":
        return <PharmacyBilling />;
      default:
        return <PharmacyDashboard />;
    }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Pill className="w-8 h-8 text-[#012e58]" />
            {/* 🟢 NEW: Main Dashboard Title is now here, removed subtitle */}
            <div>
              <h1 className="text-2xl font-bold text-[#0B2D4D]">
                Pharmacy Dashboard
              </h1>
              {/* <p className="text-[#1a4b7a]">
                Complete pharmacy operations and inventory control
              </p> */}
            </div>
          </div>
          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <TabButton key={tab.id} {...tab} />
            ))}
          </div>
        </div>
      </div>

      <div className="p-0">{renderActiveTab()}</div>
    </div>
  );
};