import React, { useState } from "react";
import {
  CreditCard,
  Receipt,
  Search,
  Filter,
  DollarSign,
  Percent,
  Gift,
  TrendingUp,
  FileText,
  Download,
} from "lucide-react";
import { mockPharmacySales } from "../../data/pharmacyData";
import { PharmacySale } from "../../types/pharmacy";

export const PharmacyBilling: React.FC = () => {
  const [sales] = useState<PharmacySale[]>(mockPharmacySales);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<
    "all" | "cash" | "card" | "insurance" | "online"
  >("all");
  const [selectedSale, setSelectedSale] = useState<PharmacySale | null>(null);

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.uhid.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPayment =
      paymentFilter === "all" ||
      sale.paymentMethod.toLowerCase() === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.finalAmount, 0);
  const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);
  const averageOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;

  const getPaymentModeColor = (mode: PharmacySale["paymentMethod"]) => {
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
          <p className="text-lg font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-lg text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Pharmacy Billing
              </h1>
              <p className="text-gray-600">Manage medicine sales and billing</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Receipt className="w-4 h-4" />
              <span>New Sale</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="bg-green-500"
            subtitle="All sales today"
          />
          <StatCard
            title="Total Discounts"
            value={`₹${totalDiscount.toLocaleString()}`}
            icon={Percent}
            color="bg-blue-500"
            subtitle="Discounts given"
          />
          <StatCard
            title="Average Order"
            value={`₹${averageOrderValue.toFixed(2)}`}
            icon={TrendingUp}
            color="bg-purple-500"
            subtitle="Per transaction"
          />
          <StatCard
            title="Total Sales"
            value={sales.length.toString()}
            icon={Receipt}
            color="bg-orange-500"
            subtitle="Transactions today"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Sales Records
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search sales..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value as any)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="all">All Payments</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="insurance">Insurance</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Patient
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Items
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Payment
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {sale.patientName}
                            </p>
                            <p className="text-lg text-gray-600">{sale.uhid}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-lg text-gray-600">
                            {sale.medications.length} items
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-1 text-md font-medium rounded-full ${getPaymentModeColor(
                              sale.paymentMethod
                            )}`}
                          >
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              ₹{sale.finalAmount.toFixed(2)}
                            </p>
                            {sale.discount > 0 && (
                              <p className="text-md text-green-600">
                                -₹{sale.discount.toFixed(2)} discount
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-blue-600 hover:text-blue-800">
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
            </div>
          </div>

          <div className="space-y-6">
            {selectedSale ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sale Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-lg text-gray-600">
                      Patient: {selectedSale.patientName}
                    </p>
                    <p className="text-lg text-gray-600">
                      UHID: {selectedSale.uhid}
                    </p>
                    <p className="text-lg text-gray-600">
                      Date:{" "}
                      {new Date(selectedSale.saleDate).toLocaleDateString()}
                    </p>
                    <p className="text-lg text-gray-600">
                      Dispensed by: {selectedSale.dispensedBy}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Medications
                    </h4>
                    <div className="space-y-2">
                      {selectedSale.medications.map((med, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-lg"
                        >
                          <span className="text-gray-700">
                            {med.drugName} x{med.quantity}
                          </span>
                          <span className="font-medium">
                            ₹{med.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>₹{selectedSale.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">Discount:</span>
                      <span className="text-green-600">
                        -₹{selectedSale.discount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>₹{selectedSale.finalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  Select a sale record to view details
                </p>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Gift className="w-4 h-4" />
                  <span>Apply Discount</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Receipt className="w-4 h-4" />
                  <span>Generate Receipt</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Export Sales</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
