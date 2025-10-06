// --- ./vitals/PastHistorySection.tsx ---
import React from "react";
import { User, Pill, Copy, Trash2 } from "lucide-react";
import {
  MOCK_MASTERS,
  InputStyle,
  PastHistory,
  MedicationDetails,
} from "../../types/PreOPDIntake";

interface PastHistorySectionProps {
  data: PastHistory;
  onChange: (data: PastHistory) => void;
  chronicMeds: MedicationDetails[];
}

export const PastHistorySection: React.FC<PastHistorySectionProps> = ({
  data,
  onChange,
  chronicMeds,
}) => {
  const copyFromChronic = () => {
    onChange({ ...data, currentMedications: [...chronicMeds] });
  };

  const handleAddIllness = (value: string) => {
    const newIllness = value.trim();
    if (
      data.illnesses.length < 5 &&
      newIllness &&
      !data.illnesses.includes(newIllness)
    ) {
      onChange({ ...data, illnesses: [...data.illnesses, newIllness] });
      return true;
    }
    return false;
  };

  const handleRemoveIllness = (illness: string) => {
    onChange({
      ...data,
      illnesses: data.illnesses.filter((i) => i !== illness),
    });
  };

  // Simplified handlers for Surgeries and Hospitalizations
  const updateSurgeryText = (value: string) => {
    const parts = value.split(/\s+/);
    const year = parts.pop()?.match(/\d{4}/)?.[0] || "Unknown";
    const name = parts.join(" ").trim();
    onChange({
      ...data,
      surgeries: name ? [{ name: name || value, year }] : [],
    });
  };

  const updateHospitalizationText = (value: string) => {
    const parts = value.split(/\s+/);
    const year = parts.pop()?.match(/\d{4}/)?.[0] || "Unknown";
    const reason = parts.join(" ").trim();
    onChange({
      ...data,
      hospitalizations: reason ? [{ reason: reason || value, year }] : [],
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-[#012e58]" />
          <h2 className="text-lg font-semibold text-[#0B2D4D]">
            5. Past & Medication History
          </h2>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Past History Items as Chips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Past Illnesses (Max 5)
            </label>
            <div className="flex flex-wrap gap-1 mb-2 min-h-[2.5rem]">
              {data.illnesses.map((illness, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200"
                >
                  {illness}
                  <button
                    onClick={() => handleRemoveIllness(illness)}
                    className="ml-1 text-blue-600 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              className={InputStyle}
              placeholder="Add illness (press Enter)"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  if (handleAddIllness(e.currentTarget.value)) {
                    e.currentTarget.value = "";
                  }
                }
              }}
              disabled={data.illnesses.length >= 5}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Past Surgeries
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {data.surgeries.map((surgery, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full border border-purple-200"
                >
                  {surgery.name} ({surgery.year})
                </span>
              ))}
            </div>
            <input
              type="text"
              className={InputStyle}
              placeholder="Surgery name + year (e.g., Appy 2020)"
              onChange={(e) => updateSurgeryText(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Past Hospitalizations
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {data.hospitalizations.map((hosp, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full border border-orange-200"
                >
                  {hosp.reason} ({hosp.year})
                </span>
              ))}
            </div>
            <input
              type="text"
              className={InputStyle}
              placeholder="Reason + year (e.g., Pneumonia 2019)"
              onChange={(e) => updateHospitalizationText(e.target.value)}
            />
          </div>
        </div>

        {/* Current Medications */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Pill className="w-5 h-5 text-[#012e58]" />
              <h3 className="text-md font-semibold text-[#0B2D4D]">
                Current Medications
              </h3>
            </div>
            {chronicMeds.length > 0 && (
              <button
                onClick={copyFromChronic}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                <Copy className="w-4 h-4" />
                <span>Copy from Chronic ({chronicMeds.length})</span>
              </button>
            )}
          </div>

          <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 text-sm text-gray-700 rounded-r-md">
            <p className="font-semibold text-yellow-800 mb-1">
              Medication Table Implementation Note:
            </p>
            <p>
              The medications currently listed below are for calculation (e.g.,
              allergy check) only. The interactive table UI is complex and is
              pending full implementation here.
            </p>
            {data.currentMedications.length > 0 && (
              <p className="mt-2 text-xs text-gray-600">
                Currently displaying:{" "}
                {data.currentMedications.map((m) => m.name).join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Overall Compliance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall Medication Compliance
          </label>
          <select
            value={data.overallCompliance}
            onChange={(e) =>
              onChange({ ...data, overallCompliance: e.target.value })
            }
            className={`${InputStyle} w-full md:w-1/3`}
          >
            {MOCK_MASTERS.compliance.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
