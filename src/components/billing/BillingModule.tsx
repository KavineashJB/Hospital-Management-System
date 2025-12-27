import React, { useState } from "react";
import {
  CreditCard,
  Receipt,
  FileText,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
} from "lucide-react";
import { mockPayments } from "../../data/mockData";
import { Payment } from "../../types";

export const BillingModule: React.FC = () => {
  const [payments] = useState<Payment[]>(mockPayments);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "paid" | "pending" | "partial"
  >("all");

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.uhid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.services.some((service) =>
        service.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus =
      statusFilter === "all" || payment.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = payments.reduce(
    (sum, payment) => (payment.status === "Paid" ? sum + payment.amount : sum),
    0
  );

  const pendingAmount = payments.reduce(
    (sum, payment) => (payment.status !== "Paid" ? sum + payment.amount : sum),
    0
  );

  const getStatusColor = (status: Payment["status"]) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Partial":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentModeColor = (mode: Payment["paymentMode"]) => {
    switch (mode) {
      case "Cash":
        return "bg-green-50 text-green-700";
      case "Card":
        return "bg-blue-50 text-blue-700";
      case "Insurance":
        return "bg-purple-50 text-purple-700";
      case "Online":
        return "bg-orange-50 text-orange-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ComponentType<any>;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-[#1a4b7a]">{title}</p>
          <p className="text-2xl font-bold text-[#0B2D4D] mt-1">{value}</p>
          {subtitle && <p className="text-lg text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-[#F8F9FA] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-8 h-8 text-[#012e58]" />
            <div>
              <h1 className="text-3xl font-bold text-[#0B2D4D]">
                Payments & Billing
              </h1>
              <p className="text-[#1a4b7a]">
                Manage payments, receipts, and financial records
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-[#012e58] text-white rounded-lg hover:bg-[#1a4b7a] transition-colors">
              <Receipt className="w-4 h-4" />
              <span>New Payment</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Today's Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="bg-green-500"
            subtitle="Total collected today"
          />
          <StatCard
            title="Pending Payments"
            value={`$${pendingAmount.toLocaleString()}`}
            icon={Clock}
            color="bg-yellow-500"
            subtitle={`${
              payments.filter((p) => p.status === "Pending").length
            } pending`}
          />
          <StatCard
            title="Completed Payments"
            value={payments
              .filter((p) => p.status === "Paid")
              .length.toString()}
            icon={CheckCircle}
            color="bg-[#012e58]"
            subtitle="Successfully processed"
          />
          <StatCard
            title="Revenue Growth"
            value="+8.5%"
            icon={TrendingUp}
            color="bg-[#1a4b7a]"
            subtitle="Compared to last month"
          />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#0B2D4D]">
              Payment Records
            </h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by UHID or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-[#1a4b7a]">
                    UHID
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[#1a4b7a]">
                    Services
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[#1a4b7a]">
                    Payment Mode
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[#1a4b7a]">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[#1a4b7a]">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[#1a4b7a]">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[#1a4b7a]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-gray-100 hover:bg-[#e0f7fa]"
                  >
                    <td className="py-4 px-4">
                      <span className="font-medium text-[#0B2D4D]">
                        {payment.uhid}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {payment.services.map((service, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-[#e0f7fa] text-[#012e58] text-md rounded-full"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 text-md font-medium rounded-full ${getPaymentModeColor(
                          payment.paymentMode
                        )}`}
                      >
                        {payment.paymentMode}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-[#0B2D4D]">
                        ${payment.amount}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 text-md font-medium rounded-full border ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-lg text-[#1a4b7a]">
                        {new Date(payment.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-[#012e58] hover:text-[#1a4b7a]">
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-600 hover:text-gray-800">
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-[#1a4b7a]">No payment records found</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-[#0B2D4D] mb-4">
              Payment Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#1a4b7a]">Total Billed Amount</span>
                <span className="font-semibold text-[#0B2D4D]">
                  ₹{(totalRevenue + pendingAmount).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#1a4b7a]">Amount Collected</span>
                <span className="font-semibold text-green-600">
                  ₹{totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#1a4b7a]">Pending Collection</span>
                <span className="font-semibold text-yellow-600">
                  ₹{pendingAmount.toLocaleString()}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-[#0B2D4D] font-medium">
                    Collection Rate
                  </span>
                  <span className="font-bold text-[#012e58]">
                    {(
                      (totalRevenue / (totalRevenue + pendingAmount)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-[#0B2D4D] mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-[#e0f7fa] transition-colors">
                <Receipt className="w-5 h-5 text-[#012e58]" />
                <span className="text-lg font-medium text-[#0B2D4D]">
                  Quick Receipt
                </span>
              </button>
              <button className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-[#e0f7fa] transition-colors">
                <FileText className="w-5 h-5 text-green-600" />
                <span className="text-lg font-medium text-[#0B2D4D]">
                  Full Receipt
                </span>
              </button>
              <button className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-[#e0f7fa] transition-colors">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <span className="text-lg font-medium text-[#0B2D4D]">
                  Record Payment
                </span>
              </button>
              <button className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-[#e0f7fa] transition-colors">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="text-lg font-medium text-[#0B2D4D]">
                  Revenue Report
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
