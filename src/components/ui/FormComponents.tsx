// src/components/ui/FormComponents.tsx
import React from "react";
import { ChevronDown } from "lucide-react";

// Helper component for section headers
export const SectionHeader: React.FC<{
  icon: React.ElementType;
  title: string;
}> = ({ icon: Icon, title }) => (
  <div className="flex items-center space-x-3 mb-5">
    <div className="p-2 rounded-lg bg-[#e0f7fa]">
      <Icon className="w-5 h-5 text-[#012e58]" />
    </div>
    <h2 className="text-lg font-bold text-[#0B2D4D] tracking-tight">{title}</h2>
  </div>
);

// ✅ Collapsible Section component (available but not used in PatientRegistration anymore)
export const CollapsibleSection: React.FC<{
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, icon: Icon, isOpen, onToggle, children }) => (
  <div
    className={`bg-white rounded-xl border transition-all duration-200 ${
      isOpen ? "border-gray-200 shadow-sm p-4" : "border-transparent p-0"
    }`}
  >
    <div
      className="flex items-center space-x-3 cursor-pointer select-none"
      onClick={onToggle}
    >
      <input
        type="checkbox"
        checked={isOpen}
        readOnly
        className="w-5 h-5 text-[#012e58] rounded focus:ring-[#1a4b7a] cursor-pointer"
      />
      <div className="flex items-center space-x-2">
        <div
          className={`p-1.5 rounded-lg transition-colors ${
            isOpen ? "bg-[#e0f7fa]" : "bg-gray-100"
          }`}
        >
          <Icon className="w-5 h-5 text-[#012e58]" />
        </div>
        <h2
          className={`text-lg font-bold ${
            isOpen ? "text-[#0B2D4D]" : "text-gray-500"
          }`}
        >
          {title}
        </h2>
      </div>
    </div>
    {/* Render children only if checked */}
    {isOpen && <div className="mt-4 animate-fade-in pl-1">{children}</div>}
  </div>
);

// Custom styled input/select
export const StyledInput: React.FC<any> = ({
  placeholder,
  isSelect,
  children,
  icon: Icon,
  className = "",
  isRequired = false,
  error,
  label,
  ...props
}) => (
  <div className="relative w-full">
    {/* RENDER LABEL if provided */}
    {label && (
      <label className="text-md font-medium text-[#1a4b7a] mb-1 block">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    {Icon && (
      <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#1a4b7a]" />
    )}
    {isSelect ? (
      <select
        className={`w-full px-4 py-3 border rounded-lg bg-white focus:ring-1 focus:ring-[#1a4b7a] focus:border-[#1a4b7a] transition-all duration-200 text-md appearance-none ${
          Icon ? "pl-11" : ""
        } ${error ? "border-red-500" : "border-gray-300"} ${className} ${
          props.value === "" ? "text-gray-500" : "text-[#0B2D4D]"
        }`}
        {...props}
      >
        <option value="" disabled className="text-gray-500">
          {placeholder}
        </option>
        {children}
      </select>
    ) : (
      <input
        type={props.type || "text"}
        placeholder={placeholder + (isRequired ? " *" : "")}
        className={`w-full px-4 py-3 border rounded-lg bg-white focus:ring-1 focus:ring-[#1a4b7a] focus:border-[#1a4b7a] transition-all duration-200 text-md ${
          Icon ? "pl-11" : ""
        } ${error ? "border-red-500" : "border-gray-300"} ${className}`}
        {...props}
      />
    )}
    {isSelect && (
      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#1a4b7a] pointer-events-none" />
    )}
    {error && <p className="text-md text-red-500 mt-1 ml-1">{error}</p>}
  </div>
);
