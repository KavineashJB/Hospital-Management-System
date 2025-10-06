// --- ./vitals/PresentingComplaintsSection.tsx ---
import React from "react";
import { List, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { MOCK_MASTERS, InputStyle, Complaint } from "../../types/PreOPDIntake";

interface PresentingComplaintsSectionProps {
  data: Complaint[];
  onChange: (data: Complaint[]) => void;
}

export const PresentingComplaintsSection: React.FC<
  PresentingComplaintsSectionProps
> = ({ data, onChange }) => {
  const addComplaint = () => {
    if (data.length >= 5) return;
    onChange([
      ...data,
      {
        id: Date.now().toString(),
        complaint: "",
        severity: "",
        duration: { value: "", unit: "d" },
        specialty: "",
        redFlagTriggered: false,
      },
    ]);
  };

  const updateComplaint = (id: string, field: keyof Complaint, value: any) => {
    onChange(
      data.map((c) => {
        if (c.id === id) {
          const updated = { ...c, [field]: value };
          const masterComplaint = MOCK_MASTERS.complaints.find(
            (m) => m.label.toLowerCase() === updated.complaint.toLowerCase()
          );
          if (masterComplaint) {
            updated.specialty = masterComplaint.specialty;
            updated.redFlagTriggered =
              masterComplaint.redFlag && updated.severity === "Severe";
          } else if (field === "complaint") {
            updated.specialty = "";
            updated.redFlagTriggered = false;
          }
          return updated;
        }
        return c;
      })
    );
  };

  const removeComplaint = (id: string) => {
    onChange(data.filter((c) => c.id !== id));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <List className="w-5 h-5 text-[#012e58]" />
            <h2 className="text-lg font-semibold text-[#0B2D4D]">
              2. Presenting Complaint(s){" "}
              {data.length > 0 && `(${data.length}/5)`}
            </h2>
          </div>
          <button
            onClick={addComplaint}
            disabled={data.length >= 5}
            className="flex items-center space-x-1 px-3 py-1 bg-[#012e58] text-white rounded-md hover:bg-[#1a4b7a] transition-colors text-sm disabled:bg-gray-400"
          >
            <Plus className="w-4 h-4" />
            <span>Add Complaint</span>
          </button>
        </div>
      </div>

      <div className="p-4">
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <List className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No complaints recorded yet</p>
            <p className="text-sm">Click "Add Complaint" to start</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((complaint) => (
              <div
                key={complaint.id}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Chief Complaint
                    </label>
                    <input
                      type="text"
                      list={`complaint-list-${complaint.id}`}
                      value={complaint.complaint}
                      onChange={(e) =>
                        updateComplaint(
                          complaint.id,
                          "complaint",
                          e.target.value
                        )
                      }
                      className={InputStyle}
                      placeholder="e.g., Chest Pain"
                    />
                    <datalist id={`complaint-list-${complaint.id}`}>
                      {MOCK_MASTERS.complaints.map((m) => (
                        <option key={m.label} value={m.label} />
                      ))}
                    </datalist>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Severity
                    </label>
                    <select
                      value={complaint.severity}
                      onChange={(e) =>
                        updateComplaint(
                          complaint.id,
                          "severity",
                          e.target.value
                        )
                      }
                      className={InputStyle}
                    >
                      <option value="">Select</option>
                      {MOCK_MASTERS.severity.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Duration
                    </label>
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        value={complaint.duration.value}
                        className={`${InputStyle} flex-1`}
                        placeholder="3"
                        onChange={(e) =>
                          updateComplaint(complaint.id, "duration", {
                            ...complaint.duration,
                            value: e.target.value,
                          })
                        }
                      />
                      <select
                        value={complaint.duration.unit}
                        className={`${InputStyle} w-16`}
                        onChange={(e) =>
                          updateComplaint(complaint.id, "duration", {
                            ...complaint.duration,
                            unit: e.target.value,
                          })
                        }
                      >
                        <option value="h">hrs</option>
                        <option value="d">days</option>
                        <option value="w">wks</option>
                        <option value="mo">mos</option>
                        <option value="yr">yrs</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Specialty
                    </label>
                    <div className="p-2 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-700">
                      {complaint.specialty || "Auto-derived"}
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => removeComplaint(complaint.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {complaint.redFlagTriggered && (
                    <div className="col-span-12 mt-2">
                      <div className="flex items-center bg-red-100 text-red-800 p-2 rounded-md text-sm font-semibold">
                        <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                        🚨 **RED FLAG**: Severe{" "}
                        {complaint.complaint.toLowerCase()} requires immediate
                        attention!
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
