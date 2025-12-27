import React, { useState } from "react";
import {
  Package,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Info,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { SectionHeader } from "../ui/FormComponents";
import { PackageItem } from "./ManagePackageForm";

interface ConsultationPackagesProps {
  packages: PackageItem[];
  value: string;
  onChange: (packageName: string) => void;
  disabled: boolean;
  onAddClick: () => void;
  onEditClick: (pkg: PackageItem) => void;
  onRemoveClick: (id: string) => void;
}

export const ConsultationPackagesSection: React.FC<
  ConsultationPackagesProps
> = ({
  packages,
  value,
  onChange,
  disabled,
  onAddClick,
  onEditClick,
  onRemoveClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // State for the floating tooltip
  const [hoveredInfo, setHoveredInfo] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const displayPackages = showAll ? packages : packages.slice(0, 3);
  const hasMore = packages.length > 3;

  const selectedPackage = packages.find((p) => p.name === value);

  const handleMouseEnterInfo = (e: React.MouseEvent, description: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Position tooltip above the icon (top - 10px) and centered horizontally relative to icon
    setTooltipPos({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
    setHoveredInfo(description);
  };

  const handleMouseLeaveInfo = () => {
    setHoveredInfo(null);
    setTooltipPos(null);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader icon={Package} title="Consultation Package" />
        <button
          type="button"
          onClick={onAddClick}
          className="flex items-center space-x-2 px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
          disabled={disabled}
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg bg-white text-left transition-all ${
            isOpen
              ? "border-[#012e58] ring-1 ring-[#012e58]"
              : "border-gray-300"
          } ${
            disabled
              ? "bg-gray-50 cursor-not-allowed"
              : "hover:border-[#012e58]"
          }`}
        >
          <span
            className={`text-sm ${
              value ? "text-[#0B2D4D] font-medium" : "text-gray-500"
            }`}
          >
            {value ? value : "Select Consultation Package"}
          </span>

          <div className="flex items-center space-x-2">
            {value && !disabled && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-red-500 transition-colors z-10"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </div>
            )}

            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-20 w-full top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto custom-scrollbar">
            {packages.length === 0 ? (
              <div className="p-5 text-center text-sm text-gray-500">
                No packages available. Create one.
              </div>
            ) : (
              <>
                {displayPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => {
                      onChange(pkg.name);
                      setIsOpen(false);
                    }}
                    className={`p-4 cursor-pointer border-b border-gray-100 last:border-0 hover:bg-blue-50 transition-colors group relative hover:z-30 ${
                      value === pkg.name ? "bg-[#e0f7fa]" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5 w-full pr-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="font-semibold text-[#0B2D4D] text-base">
                              {pkg.name}
                            </span>
                            <div className="ml-2 cursor-help">
                              <Info
                                className="w-4 h-4 text-gray-400 hover:text-[#012e58] transition-colors"
                                onMouseEnter={(e) =>
                                  handleMouseEnterInfo(e, pkg.description)
                                }
                                onMouseLeave={handleMouseLeaveInfo}
                              />
                            </div>
                          </div>
                          {value === pkg.name && (
                            <CheckCircle className="w-5 h-5 text-[#012e58]" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                          ₹ {pkg.price}
                        </p>

                        {pkg.customFields.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {pkg.customFields.map((cf) => (
                              <span
                                key={cf.id}
                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 border border-gray-200"
                              >
                                <span className="font-bold mr-1">
                                  {cf.label}:
                                </span>{" "}
                                {cf.value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClick(pkg);
                            setIsOpen(false);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveClick(pkg.id);
                          }}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {hasMore && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAll(!showAll);
                    }}
                    className="w-full p-3 text-sm text-center text-[#012e58] font-medium bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    {showAll
                      ? "Show Less"
                      : `See More (${packages.length - 3} more)`}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Floating Tooltip (Fixed Position to avoid clipping and z-index issues) */}
      {hoveredInfo && tooltipPos && (
        <div
          className="fixed z-[9999] w-56 bg-gray-800 text-white text-xs rounded px-3 py-2 shadow-xl pointer-events-none"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: "translate(-50%, -100%)", // Center horizontally and move above
          }}
        >
          {hoveredInfo}
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}

      {/* Selected Item Summary */}
      {value && selectedPackage && !isOpen && (
        <div className="mt-3 p-4 bg-[#F8F9FA] rounded-lg border border-gray-100 text-sm space-y-2 animate-fade-in">
          <div className="flex justify-between">
            <span className="text-gray-500">Description:</span>
            <span className="font-medium text-gray-800">
              {selectedPackage.description}
            </span>
          </div>
          {selectedPackage.customFields.map((cf) => (
            <div
              key={cf.id}
              className="flex justify-between border-t border-gray-200 pt-1 mt-1"
            >
              <span className="text-gray-500">{cf.label}:</span>
              <span className="font-medium text-gray-800">{cf.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
