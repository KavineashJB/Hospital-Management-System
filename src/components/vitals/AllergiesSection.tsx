// --- ./vitals/AllergiesSection.tsx ---
import React, { useState, useMemo } from "react";
import { Syringe, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import {
  MOCK_MASTERS,
  InputStyle,
  Allergy,
  MedicationDetails,
} from "../../types/PreOPDIntake";

interface AllergiesSectionProps {
  data: Allergy;
  onChange: (data: Allergy) => void;
  allMeds: MedicationDetails[];
}

export const AllergiesSection: React.FC<AllergiesSectionProps> = ({
  data,
  onChange,
  allMeds,
}) => {
  const [isExpanded, setIsExpanded] = useState(data.hasAllergies);

  const toggleAllergies = (hasAllergies: boolean) => {
    onChange({ ...data, hasAllergies });
    setIsExpanded(hasAllergies);
  };

  const updateAllergyType = (type: "Drug" | "Food" | "Other") => {
    const newTypes = data.type.includes(type)
      ? data.type.filter((t) => t !== type)
      : [...data.type, type];
    onChange({ ...data, type: newTypes });
  };

  const drugConflicts = useMemo(() => {
    if (!data.hasAllergies || !data.type.includes("Drug") || !data.substance) {
      return [];
    }
    const allergySubstance = data.substance.toLowerCase();
    return allMeds.filter((med) =>
      med.name.toLowerCase().includes(allergySubstance)
    );
  }, [data, allMeds]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <Syringe className="w-5 h-5 text-[#012e58]" />
            <h2 className="text-lg font-semibold text-[#0B2D4D]">
              4. Allergies (Drug, Food, Other)
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                data.hasAllergies
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-green-100 text-green-700 border border-green-200"
              }`}
            >
              {data.hasAllergies ? "Yes" : "No"}
            </span>
            <div className="p-1 rounded-full bg-gray-200">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <label className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            checked={data.hasAllergies}
            onChange={(e) => toggleAllergies(e.target.checked)}
            className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
          />
          <span className="text-sm font-medium text-[#0B2D4D]">
            Patient has known allergies
          </span>
        </label>

        {isExpanded && data.hasAllergies && (
          <div className="space-y-4 pt-3 border-t border-gray-200">
            {/* Drug Conflict Banner */}
            {drugConflicts.length > 0 && (
              <div className="flex items-start bg-red-100 text-red-800 p-3 rounded-md border border-red-200">
                <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">
                    **Drug Conflict Detected!**
                  </p>
                  <p className="text-sm">
                    Patient is allergic to **"{data.substance}"** but is
                    currently prescribed: **
                    {drugConflicts.map((med) => med.name).join(", ")}**
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Allergy Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergy Type(s)
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["Drug", "Food", "Other"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateAllergyType(type)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        data.type.includes(type)
                          ? "bg-red-500 text-white border-red-600"
                          : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              {/* Substance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Substance/Allergen
                </label>
                <input
                  type="text"
                  value={data.substance}
                  onChange={(e) =>
                    onChange({ ...data, substance: e.target.value })
                  }
                  className={InputStyle}
                  placeholder="e.g., Penicillin, Peanuts, Latex"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reaction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reaction Description
                </label>
                <input
                  type="text"
                  value={data.reaction}
                  onChange={(e) =>
                    onChange({ ...data, reaction: e.target.value })
                  }
                  className={InputStyle}
                  placeholder="e.g., Hives, Swelling, Difficulty breathing"
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {data.reaction.length}/160 characters
                </p>
              </div>
              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity Level
                </label>
                <div className="flex space-x-2">
                  {MOCK_MASTERS.severity.map((severity) => (
                    <button
                      key={severity}
                      type="button"
                      onClick={() => onChange({ ...data, severity })}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        data.severity === severity
                          ? severity === "Severe"
                            ? "bg-red-500 text-white border-red-600"
                            : severity === "Moderate"
                            ? "bg-yellow-500 text-white border-yellow-600"
                            : "bg-green-500 text-white border-green-600"
                          : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {severity}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
