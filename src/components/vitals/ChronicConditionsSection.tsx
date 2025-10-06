// --- ./vitals/ChronicConditionsSection.tsx ---
import React, { useState } from "react";
import {
  HeartPulse,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Pill,
} from "lucide-react";
import {
  MOCK_MASTERS,
  InputStyle,
  ChronicCondition,
  MedicationDetails,
} from "../../types/PreOPDIntake";

interface ChronicConditionsSectionProps {
  data: ChronicCondition[];
  onChange: (data: ChronicCondition[]) => void;
}

export const ChronicConditionsSection: React.FC<
  ChronicConditionsSectionProps
> = ({ data, onChange }) => {
  const [selectedCondition, setSelectedCondition] = useState<string | null>(
    null
  );
  const [showAddForm, setShowAddForm] = useState(false);

  const addCondition = (conditionName: string) => {
    const newCondition: ChronicCondition = {
      id: Date.now().toString(),
      name: conditionName,
      duration: "Unknown",
      onMedication: "Unknown",
      medications: [],
    };
    onChange([...data, newCondition]);
    setSelectedCondition(newCondition.id);
    setShowAddForm(false);
  };

  const updateCondition = (id: string, updates: Partial<ChronicCondition>) => {
    onChange(data.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeCondition = (id: string) => {
    onChange(data.filter((c) => c.id !== id));
    if (selectedCondition === id) {
      setSelectedCondition(null);
    }
  };

  const addMedicationToCondition = (conditionId: string) => {
    const newMedication: MedicationDetails = {
      id: Date.now().toString(),
      name: "",
      dose: "",
      frequency: "OD",
      route: "Oral",
      duration: "Unknown",
      compliance: "Unknown",
      notes: "",
    };

    updateCondition(conditionId, {
      medications: [
        ...(data.find((c) => c.id === conditionId)?.medications || []),
        newMedication,
      ],
    });
  };

  const updateMedication = (
    conditionId: string,
    medicationId: string,
    updates: Partial<MedicationDetails>
  ) => {
    const condition = data.find((c) => c.id === conditionId);
    if (condition) {
      const updatedMedications = condition.medications.map((m) =>
        m.id === medicationId ? { ...m, ...updates } : m
      );
      updateCondition(conditionId, { medications: updatedMedications });
    }
  };

  const removeMedication = (conditionId: string, medicationId: string) => {
    const condition = data.find((c) => c.id === conditionId);
    if (condition) {
      const updatedMedications = condition.medications.filter(
        (m) => m.id !== medicationId
      );
      updateCondition(conditionId, { medications: updatedMedications });
    }
  };

  const getUncontrolledWarning = (condition: ChronicCondition) => {
    if (
      (condition.name.toLowerCase().includes("diabetes") ||
        condition.name.toLowerCase().includes("hypertension")) &&
      condition.medications.length === 0
    ) {
      return "⚠️ No medications recorded - suggests possible poor control or unmanaged condition.";
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HeartPulse className="w-5 h-5 text-[#012e58]" />
            <h2 className="text-lg font-semibold text-[#0B2D4D]">
              3. Chronic Conditions {data.length > 0 && `(${data.length})`}
            </h2>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-1 px-3 py-1 bg-[#012e58] text-white rounded-md hover:bg-[#1a4b7a] transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Condition</span>
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Quick Add from Master List */}
        {showAddForm && (
          <div className="mb-4 p-3 border border-blue-200 rounded-lg bg-blue-50">
            <h4 className="font-medium text-[#0B2D4D] mb-2">
              Select from common conditions:
            </h4>
            <div className="flex flex-wrap gap-2">
              {MOCK_MASTERS.chronicConditions
                .filter((condition) => !data.some((d) => d.name === condition))
                .map((condition) => (
                  <button
                    key={condition}
                    onClick={() => addCondition(condition)}
                    className="px-3 py-1 text-sm bg-white text-blue-800 rounded-full border border-blue-300 hover:bg-blue-100 transition-colors"
                  >
                    {condition}
                  </button>
                ))}
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Or type custom condition..."
                className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    addCondition(e.currentTarget.value.trim());
                    e.currentTarget.value = "";
                  }
                }}
              />
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Condition Cards */}
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HeartPulse className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No chronic conditions recorded</p>
            <p className="text-sm">Click "Add Condition" to start</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((condition) => {
              const uncontrolledWarning = getUncontrolledWarning(condition);
              const isExpanded = selectedCondition === condition.id;

              return (
                <div
                  key={condition.id}
                  className={`border rounded-lg transition-all ${
                    isExpanded ? "border-blue-300 shadow-md" : "border-gray-200"
                  }`}
                >
                  {/* Condition Header (including toggle and delete button) */}
                  <div
                    className={`p-4 cursor-pointer ${
                      isExpanded ? "bg-blue-50" : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() =>
                      setSelectedCondition(isExpanded ? null : condition.id)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-[#0B2D4D]">
                          {condition.name}
                        </h4>
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                          {condition.medications.length} med
                          {condition.medications.length !== 1 ? "s" : ""}
                        </span>
                        {uncontrolledWarning && (
                          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                            May be uncontrolled
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCondition(condition.id);
                          }}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="p-1 rounded">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-4 border-t border-gray-200 bg-white">
                      {/* Condition Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration
                          </label>
                          <select
                            value={
                              typeof condition.duration === "string"
                                ? condition.duration
                                : "Custom"
                            }
                            onChange={(e) =>
                              updateCondition(condition.id, {
                                duration:
                                  e.target.value === "Unknown"
                                    ? "Unknown"
                                    : {
                                        years: parseInt(e.target.value) || 0,
                                        months: 0,
                                      },
                              })
                            }
                            className={InputStyle}
                          >
                            <option value="Unknown">Unknown</option>
                            <option value="< 1 year">Less than 1 year</option>
                            <option value="1-5 years">1-5 years</option>
                            <option value="5-10 years">5-10 years</option>
                            <option value="> 10 years">
                              More than 10 years
                            </option>
                            <option value="Custom">Custom</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            On Medication
                          </label>
                          <select
                            value={condition.onMedication}
                            onChange={(e) =>
                              updateCondition(condition.id, {
                                onMedication: e.target.value as any,
                              })
                            }
                            className={InputStyle}
                          >
                            <option value="Unknown">Unknown</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() =>
                              addMedicationToCondition(condition.id)
                            }
                            className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Medication</span>
                          </button>
                        </div>
                      </div>

                      {uncontrolledWarning && (
                        <div className="mb-4 p-3 bg-orange-100 border border-orange-200 rounded-md">
                          <p className="text-sm text-orange-800">
                            {uncontrolledWarning}
                          </p>
                        </div>
                      )}

                      {/* Medications Table */}
                      {condition.medications.length > 0 && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                            <h5 className="font-medium text-[#0B2D4D] flex items-center space-x-2">
                              <Pill className="w-4 h-4" />
                              <span>
                                Medications ({condition.medications.length})
                              </span>
                            </h5>
                          </div>
                          <div className="overflow-x-auto">
                            {/* Full table implementation from original logic would go here */}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
