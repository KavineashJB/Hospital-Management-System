import React from "react";
import {
  Pill,
  TrendingUp,
  AlertTriangle,
  Package,
  DollarSign,
  Calendar,
  BarChart3,
  Clock,
} from "lucide-react";
import { mockPharmacyAnalytics, mockDrugs } from "../../data/pharmacyData";

export const PharmacyDashboard: React.FC = () => {
  const analytics = mockPharmacyAnalytics;
  const drugs = mockDrugs;

  const getStockStatus = (quantity: number) => {
    if (quantity === 0)
      return {
        status: "Out of Stock",
        color: "bg-red-100 text-red-800 border-red-200",
      };
    if (quantity <= 20)
      return {
        status: "Low Stock",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    return {
      status: "Available",
      color: "bg-green-100 text-green-800 border-green-200",
    };
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  // 🟢 Simplified StatCard for the compact design (used for Low Stock/Expiring Soon inside the main box)
  const CompactAlertCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    colorClass: string;
    description: string;
    iconBgClass: string;
  }> = ({ title, value, icon: Icon, colorClass, description, iconBgClass }) => (
    <div
      className={`p-3 rounded-lg border flex flex-col items-center justify-center space-y-1 ${colorClass}`}
    >
      <div className={`p-1.5 rounded-full ${iconBgClass}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-[#0B2D4D]">{value}</p>
      <p className="text-md text-[#1a4b7a] font-medium text-center">{title}</p>
      <p className="text-[10px] text-gray-500 text-center">{description}</p>
    </div>
  );

  const StockAndTopSellingSection = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* 🟢 COLUMN 1: Combined Stock Status Overview and Alert Cards */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Package className="w-5 h-5 text-[#012e58]" />
          <h3 className="text-lg font-semibold text-[#0B2D4D]">
            Stock Status Overview
          </h3>
        </div>

        {/* Stock Status List (Top Half) */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-[#1a4b7a]">Available</span>
            </div>
            <span className="font-semibold text-[#0B2D4D]">
              {analytics.stockStatus.available}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-[#1a4b7a]">Low Stock</span>
            </div>
            <span className="font-semibold text-[#0B2D4D]">
              {analytics.stockStatus.lowStock}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-[#1a4b7a]">Out of Stock</span>
            </div>
            <span className="font-semibold text-[#0B2D4D]">
              {analytics.stockStatus.outOfStock}
            </span>
          </div>
        </div>

        {/* 🟢 Consolidated Alert Cards (Bottom Half) */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
          <div className="col-span-2 text-lg font-semibold text-[#0B2D4D]">
            Actionable Alerts:
          </div>
          <CompactAlertCard
            title="Low Stock Items"
            value={analytics.lowStockItems}
            description="Need restocking"
            icon={AlertTriangle}
            colorClass="border-yellow-300 bg-yellow-50"
            iconBgClass="bg-yellow-500"
          />
          <CompactAlertCard
            title="Expiring Soon"
            value={analytics.expiringItems}
            description="Within 30 days"
            icon={Clock}
            colorClass="border-red-300 bg-red-50"
            iconBgClass="bg-red-500"
          />
        </div>
      </div>

      {/* COLUMN 2: Top Selling Medicines */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Pill className="w-5 h-5 text-[#012e58]" />
          <h3 className="text-lg font-semibold text-[#0B2D4D]">
            Top Selling Medicines
          </h3>
        </div>
        <div className="space-y-3">
          {analytics.topSellingDrugs.map((drug, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-[#0B2D4D]">{drug.name}</p>
                <p className="text-lg text-[#1a4b7a]">
                  {drug.quantity} units sold
                </p>
              </div>
              <span className="font-semibold text-green-600">
                ₹{drug.revenue}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AlertsAndProfitSection = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Alerts & Notifications */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-[#0B2D4D]">
            Alerts & Notifications
          </h3>
        </div>
        <div className="space-y-3">
          {drugs
            .filter(
              (drug) =>
                drug.stockQuantity <= 20 || isExpiringSoon(drug.expiryDate)
            )
            .map((drug) => (
              <div
                key={drug.id}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <div>
                  <p className="font-medium text-[#0B2D4D]">{drug.drugName}</p>
                  <p className="text-lg text-red-600">
                    {drug.stockQuantity === 0
                      ? "Out of stock"
                      : drug.stockQuantity <= 20
                      ? `Low stock: ${drug.stockQuantity} units`
                      : "Expiring soon"}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-md font-medium rounded-full border ${
                    getStockStatus(drug.stockQuantity).color
                  }`}
                >
                  {getStockStatus(drug.stockQuantity).status}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Profit Margin by Category */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#012e58]" />
          <h3 className="text-lg font-semibold text-[#0B2D4D]">
            Profit Margin by Category
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.profitMargin.map((item, index) => (
            <div
              key={index}
              className="text-center p-4 bg-[#e0f7fa] rounded-lg"
            >
              <p className="text-lg text-[#1a4b7a] mb-1">{item.category}</p>
              <p className="text-xl font-bold text-[#012e58]">{item.margin}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-[#F8F9FA] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <p className="text-[#1a4b7a]">
              Monitor inventory, sales, and prescription fulfillment
            </p>
          </div>
        </div>

        {/* ROW 1: Stock Status Overview (Combined) and Top Selling Medicines */}
        {StockAndTopSellingSection}

        {/* ROW 2: Alerts & Notifications and Profit Margin */}
        <div className="mt-8">{AlertsAndProfitSection}</div>
      </div>
    </div>
  );
};
