import React, { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Upload,
  Edit,
  Trash2,
  Scan,
  Download,
  AlertTriangle,
} from "lucide-react";
import { mockDrugs } from "../../data/pharmacyData";
import { Drug } from "../../types/pharmacy";

export const DrugInventory: React.FC = () => {
  const [drugs, setDrugs] = useState<Drug[]>(mockDrugs);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<
    "all" | "available" | "low" | "out"
  >("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);

  const [newDrug, setNewDrug] = useState<Partial<Drug>>({
    drugName: "",
    genericName: "",
    brandName: "",
    strength: "",
    dosageForm: "Tablet",
    expiryDate: "",
    stockQuantity: 0,
    unitPrice: 0,
    supplierInfo: "",
    category: "",
    batchNumber: "",
    manufacturingDate: "",
  });

  const categories = [...new Set(drugs.map((drug) => drug.category))];

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

  const filteredDrugs = drugs.filter((drug) => {
    const matchesSearch =
      drug.drugName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.brandName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || drug.category === categoryFilter;

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "available" && drug.stockQuantity > 20) ||
      (stockFilter === "low" &&
        drug.stockQuantity > 0 &&
        drug.stockQuantity <= 20) ||
      (stockFilter === "out" && drug.stockQuantity === 0);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleAddDrug = () => {
    const drug: Drug = {
      ...newDrug,
      id: (drugs.length + 1).toString(),
      createdAt: new Date().toISOString(),
    } as Drug;

    setDrugs([...drugs, drug]);
    setNewDrug({
      drugName: "",
      genericName: "",
      brandName: "",
      strength: "",
      dosageForm: "Tablet",
      expiryDate: "",
      stockQuantity: 0,
      unitPrice: 0,
      supplierInfo: "",
      category: "",
      batchNumber: "",
      manufacturingDate: "",
    });
    setShowAddForm(false);
  };

  const handleDeleteDrug = (id: string) => {
    setDrugs(drugs.filter((drug) => drug.id !== id));
  };

  const DrugForm: React.FC<{
    drug: Partial<Drug>;
    onChange: (drug: Partial<Drug>) => void;
    onSubmit: () => void;
    onCancel: () => void;
    title: string;
  }> = ({ drug, onChange, onSubmit, onCancel, title }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-[#0B2D4D] mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Drug Name"
          value={drug.drugName || ""}
          onChange={(e) => onChange({ ...drug, drugName: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
        />
        <input
          type="text"
          placeholder="Generic Name"
          value={drug.genericName || ""}
          onChange={(e) => onChange({ ...drug, genericName: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
        />
        <input
          type="text"
          placeholder="Brand Name"
          value={drug.brandName || ""}
          onChange={(e) => onChange({ ...drug, brandName: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
        />
        <input
          type="text"
          placeholder="Strength (e.g., 500mg)"
          value={drug.strength || ""}
          onChange={(e) => onChange({ ...drug, strength: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
        />
        <select
          value={drug.dosageForm || "Tablet"}
          onChange={(e) =>
            onChange({
              ...drug,
              dosageForm: e.target.value as Drug["dosageForm"],
            })
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
        >
          <option value="Tablet">Tablet</option>
          <option value="Capsule">Capsule</option>
          <option value="Syrup">Syrup</option>
          <option value="Injection">Injection</option>
          <option value="Cream">Cream</option>
          <option value="Drops">Drops</option>
        </select>
        <input
          type="date"
          placeholder="Expiry Date"
          value={drug.expiryDate || ""}
          onChange={(e) => onChange({ ...drug, expiryDate: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
        />
        <input
          type="number"
          placeholder="Stock Quantity"
          value={drug.stockQuantity || ""}
          onChange={(e) =>
            onChange({ ...drug, stockQuantity: parseInt(e.target.value) || 0 })
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Unit Price ($)"
          value={drug.unitPrice || ""}
          onChange={(e) =>
            onChange({ ...drug, unitPrice: parseFloat(e.target.value) || 0 })
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
        />
        <input
          type="text"
          placeholder="Supplier Info"
          value={drug.supplierInfo || ""}
          onChange={(e) => onChange({ ...drug, supplierInfo: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
        />
        <input
          type="text"
          placeholder="Category"
          value={drug.category || ""}
          onChange={(e) => onChange({ ...drug, category: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
        />
        <input
          type="text"
          placeholder="Batch Number"
          value={drug.batchNumber || ""}
          onChange={(e) => onChange({ ...drug, batchNumber: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
        />
        <input
          type="date"
          placeholder="Manufacturing Date"
          value={drug.manufacturingDate || ""}
          onChange={(e) =>
            onChange({ ...drug, manufacturingDate: e.target.value })
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
        />
      </div>
      <div className="flex items-center justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="px-4 py-2 bg-[#012e58] text-white rounded-lg hover:bg-[#1a4b7a] transition-colors"
        >
          {title.includes("Add") ? "Add Drug" : "Update Drug"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-[#F8F9FA] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8 text-[#012e58]" />
            <div>
              <h1 className="text-3xl font-bold text-[#0B2D4D]">
                Drug Inventory
              </h1>
              <p className="text-[#1a4b7a]">
                Manage medicine stock and inventory
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#012e58] text-white rounded-lg hover:bg-[#1a4b7a] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medicine</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-[#1a4b7a] text-white rounded-lg hover:bg-[#012e58] transition-colors">
              <Upload className="w-4 h-4" />
              <span>Bulk Upload</span>
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="mb-6">
            <DrugForm
              drug={newDrug}
              onChange={setNewDrug}
              onSubmit={handleAddDrug}
              onCancel={() => setShowAddForm(false)}
              title="Add New Medicine"
            />
          </div>
        )}

        {editingDrug && (
          <div className="mb-6">
            <DrugForm
              drug={editingDrug}
              onChange={setEditingDrug}
              onSubmit={() => {
                setDrugs(
                  drugs.map((d) =>
                    d.id === editingDrug.id ? (editingDrug as Drug) : d
                  )
                );
                setEditingDrug(null);
              }}
              onCancel={() => setEditingDrug(null)}
              title="Edit Medicine"
            />
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#0B2D4D]">
              Medicine Inventory
            </h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
                >
                  <option value="all">All Stock</option>
                  <option value="available">Available</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-[#1a4b7a] text-white rounded-lg hover:bg-[#012e58] transition-colors">
                <Scan className="w-4 h-4" />
                <span>Scan Barcode</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-[#1a4b7a]">
                    Medicine Details
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[#1a4b7a]">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[#1a4b7a]">
                    Stock
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[#1a4b7a]">
                    Price
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[#1a4b7a]">
                    Expiry
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[#1a4b7a]">
                    Supplier
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[#1a4b7a]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDrugs.map((drug) => (
                  <tr
                    key={drug.id}
                    className="border-b border-gray-100 hover:bg-[#e0f7fa]"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-[#0B2D4D]">
                          {drug.drugName}
                        </p>
                        <p className="text-lg text-[#1a4b7a]">
                          {drug.genericName} • {drug.brandName}
                        </p>
                        <p className="text-md text-gray-500">
                          {drug.strength} • {drug.dosageForm}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-[#e0f7fa] text-[#012e58] text-md rounded-full">
                        {drug.category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-[#0B2D4D]">
                          {drug.stockQuantity}
                        </span>
                        <span
                          className={`px-2 py-1 text-md font-medium rounded-full border ${
                            getStockStatus(drug.stockQuantity).color
                          }`}
                        >
                          {getStockStatus(drug.stockQuantity).status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-[#0B2D4D]">
                        ${drug.unitPrice.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg text-[#1a4b7a]">
                          {new Date(drug.expiryDate).toLocaleDateString()}
                        </span>
                        {isExpiringSoon(drug.expiryDate) && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-lg text-[#1a4b7a]">
                        {drug.supplierInfo}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingDrug(drug)}
                          className="p-1 text-[#012e58] hover:text-[#1a4b7a]"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDrug(drug.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDrugs.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-[#1a4b7a]">
                No medicines found matching your criteria
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#0B2D4D] mb-4">
            Bulk Operations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#1a4b7a] transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-lg text-[#1a4b7a] mb-1">Upload CSV/Excel</p>
              <p className="text-md text-gray-500">Bulk import inventory</p>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#1a4b7a] transition-colors cursor-pointer">
              <Scan className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-lg text-[#1a4b7a] mb-1">Barcode Scanner</p>
              <p className="text-md text-gray-500">Quick stock updates</p>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#1a4b7a] transition-colors cursor-pointer">
              <Download className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-lg text-[#1a4b7a] mb-1">Export Data</p>
              <p className="text-md text-gray-500">Download inventory report</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
