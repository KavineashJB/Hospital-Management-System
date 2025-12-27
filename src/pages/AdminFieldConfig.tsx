// src/pages/AdminFieldConfig.tsx
import React, { useState } from "react";
import {
  Plus,
  Check,
  X,
  SlidersHorizontal,
  Trash2,
  Save,
  RotateCcw,
  HelpCircle,
} from "lucide-react";
import Layout from "../components/layout/Layout";

// --- START: Copied/Redefined Reusable Components & Helpers ---

// Styled input for consistency
const inputStyle =
  "p-2.5 border border-blue-300 rounded-lg w-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out text-lg text-gray-800 placeholder:text-gray-500 shadow-sm";

// Helper component for mandatory fields
const FormLabel: React.FC<{
  htmlFor: string;
  label: string;
  isRequired?: boolean;
}> = ({ htmlFor, label, isRequired = false }) => (
  <label
    htmlFor={htmlFor}
    className="block text-lg font-medium text-gray-700 mb-1"
  >
    {label}
    {isRequired && <span className="text-red-500 ml-1">*</span>}
  </label>
);

// Generic Input Field Wrapper (for consistency) - simplified version for Admin config
const FormInput: React.FC<any> = ({
  label,
  id,
  type = "text",
  required = false,
  helpText,
  ...rest
}) => (
  <div>
    <FormLabel htmlFor={id} label={label} isRequired={required} />
    <div className="relative">
      <input
        id={id}
        type={type}
        required={required}
        className={inputStyle}
        {...rest}
      />
      {helpText && (
        <HelpCircle
          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer"
          title={helpText}
        />
      )}
    </div>
  </div>
);

// --- END: Reusable Components & Helpers ---

interface FieldConfig {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "dropdown" | "boolean";
  include: boolean;
  mandatory: boolean;
  order: number;
}

const initialFieldConfig: FieldConfig[] = [
  {
    id: "pinCode",
    label: "PIN Code",
    type: "number",
    include: true,
    mandatory: false,
    order: 1,
  },
  {
    id: "district",
    label: "District",
    type: "text",
    include: true,
    mandatory: true,
    order: 2,
  },
  {
    id: "emergencyContact",
    label: "Emergency Contact",
    type: "text",
    include: true,
    mandatory: false,
    order: 3,
  },
  {
    id: "alternateMobile",
    label: "Alternate Phone",
    type: "number",
    include: true,
    mandatory: false,
    order: 4,
  },
  {
    id: "email",
    label: "Email",
    type: "text",
    include: true,
    mandatory: false,
    order: 5,
  },
  {
    id: "bloodGroup",
    label: "Blood Group",
    type: "dropdown",
    include: true,
    mandatory: false,
    order: 6,
  },
  {
    id: "occupation",
    label: "Occupation",
    type: "text",
    include: true,
    mandatory: false,
    order: 7,
  },
  {
    id: "language",
    label: "Language",
    type: "text",
    include: true,
    mandatory: false,
    order: 8,
  },
  {
    id: "maritalStatus",
    label: "Marital Status",
    type: "dropdown",
    include: true,
    mandatory: false,
    order: 9,
  },
  {
    id: "referredByDoctor",
    label: "Referred by Doctor",
    type: "text",
    include: false,
    mandatory: false,
    order: 10,
  },
  // ... more fields
];

const AdminFieldConfig: React.FC = () => {
  const [config, setConfig] = useState(initialFieldConfig);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newField, setNewField] = useState({
    label: "",
    type: "text" as "text" | "number" | "date" | "dropdown" | "boolean",
    include: true,
    mandatory: false,
  });

  const handleToggle = (id: string, key: "include" | "mandatory") => {
    setConfig((prev) =>
      prev.map((field) =>
        field.id === id ? { ...field, [key]: !field[key] } : field
      )
    );
  };

  const handleSave = () => {
    console.log("Saving Configuration:", config);
    alert("Configuration saved successfully!");
  };

  const handleAddField = () => {
    const newId = newField.label.toLowerCase().replace(/\s/g, "");
    if (config.some((f) => f.id === newId)) {
      alert("Field with this name already exists.");
      return;
    }
    setConfig((prev) => [
      ...prev,
      {
        ...newField,
        id: newId,
        order: prev.length + 1,
      },
    ]);
    setIsModalOpen(false);
    setNewField({ label: "", type: "text", include: true, mandatory: false });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this field?")) {
      setConfig((prev) => prev.filter((field) => field.id !== id));
    }
  };

  return (
    <Layout defaultSection="Admin Settings">
      <div className="p-8 w-full max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <SlidersHorizontal className="w-6 h-6 mr-3 text-blue-600" />
          Patient Registration Field Configuration
        </h2>

        {/* Action Buttons */}
        <div className="flex justify-between mb-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition"
          >
            <Plus className="w-4 h-4 mr-2" /> Add New Field
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
          >
            <Save className="w-4 h-4 mr-2" /> Save Configuration
          </button>
        </div>

        {/* Configuration Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Field
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Include (Show)
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mandatory
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {config
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-lg font-medium text-gray-900">
                      {field.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg text-center text-gray-500 capitalize">
                      {field.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <ToggleSwitch
                        checked={field.include}
                        onChange={() => handleToggle(field.id, "include")}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <ToggleSwitch
                        checked={field.mandatory}
                        onChange={() => handleToggle(field.id, "mandatory")}
                        disabled={!field.include} // Cannot be mandatory if not included
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-medium">
                      <button
                        onClick={() => handleDelete(field.id)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                        title="Delete Field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Add New Field Modal (Mock) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Add New Custom Field</h3>
              <div className="space-y-4">
                <FormInput
                  label="Field Name"
                  id="newFieldLabel"
                  value={newField.label}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewField({ ...newField, label: e.target.value })
                  }
                  required
                />
                <div>
                  <FormLabel htmlFor="newFieldType" label="Field Type" />
                  <select
                    id="newFieldType"
                    value={newField.type}
                    onChange={(e) =>
                      setNewField({
                        ...newField,
                        type: e.target.value as FieldConfig["type"],
                      })
                    }
                    className={inputStyle}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="dropdown">Dropdown/Select</option>
                    <option value="boolean">Boolean/Checkbox</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-2 border rounded-lg bg-gray-50">
                  <FormLabel
                    htmlFor="newFieldInclude"
                    label="Include in Form"
                  />
                  <ToggleSwitch
                    checked={newField.include}
                    onChange={() =>
                      setNewField({ ...newField, include: !newField.include })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-2 border rounded-lg bg-gray-50">
                  <FormLabel
                    htmlFor="newFieldMandatory"
                    label="Make Mandatory"
                  />
                  <ToggleSwitch
                    checked={newField.mandatory}
                    onChange={() =>
                      setNewField({
                        ...newField,
                        mandatory: !newField.mandatory,
                      })
                    }
                    disabled={!newField.include}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddField}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Simplified Toggle Switch Component (Copied/Redefined)
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => (
  <label
    className={`relative inline-flex items-center cursor-pointer ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    }`}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="sr-only peer"
      disabled={disabled}
    />
    <div
      className={`w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
        checked ? "bg-blue-600" : "bg-red-600"
      }`}
    ></div>
    <span className="ml-3 text-lg font-medium text-gray-900 dark:text-gray-300">
      {checked ? (
        <Check className="w-4 h-4 text-white p-0.5 bg-green-500 rounded-full" />
      ) : (
        <X className="w-4 h-4 text-white p-0.5 bg-red-500 rounded-full" />
      )}
    </span>
  </label>
);

export default AdminFieldConfig;
