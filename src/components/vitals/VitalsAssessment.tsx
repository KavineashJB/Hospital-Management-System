// src/components/vitals/VitalsAssessment.tsx
import React, {
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  Activity,
  Heart,
  Thermometer,
  Upload,
  Bot,
  Save,
  ArrowLeft,
  AlertCircle,
  Loader,
  X,
  Gauge,
  Waves,
  Droplet,
  Plus,
  Trash2,
  Settings,
  Search,
  Info,
  Edit,
} from "lucide-react";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  Timestamp,
  getDocs,
  query,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

// --- TYPE DEFINITIONS ---

export interface Patient {
  id: string;
  uhid: string;
  fullName: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  chronicConditions?: string[];
}

export interface CustomVital {
  id: string;
  name: string;
  value: string;
  unit: string;
}

export interface VitalsState {
  weight: string;
  height: string;
  bmi: string;
  pulse: string;
  bpSystolic: string;
  bpDiastolic: string;
  temperature: string;
  spo2: string;
  respiratoryRate: string;
  painScore: string;
  gcsE: string;
  gcsV: string;
  gcsM: string;
  map: string;
  riskFlags: {
    diabetes: boolean;
    heartDisease: boolean;
    kidney: boolean;
  };
  customVitals: CustomVital[];
}

// Definition for the Configuration Modal
interface VitalDefinition {
  id: string;
  key: string;
  label: string;
  isCustom: boolean; // false for hardcoded system vitals
  unit?: string;
  minVal?: number; // New: Minimum normal value
  maxVal?: number; // New: Maximum normal value
}

// --- CONSTANTS ---
const INITIAL_VITALS_STATE: VitalsState = {
  weight: "",
  height: "",
  bmi: "",
  pulse: "",
  bpSystolic: "",
  bpDiastolic: "",
  temperature: "",
  spo2: "",
  respiratoryRate: "",
  painScore: "",
  gcsE: "",
  gcsV: "",
  gcsM: "",
  map: "",
  riskFlags: {
    diabetes: false,
    heartDisease: false,
    kidney: false,
  },
  customVitals: [],
};

const ACTIONS = {
  UPDATE_VITAL: "UPDATE_VITAL",
  TOGGLE_RISK_FLAG: "TOGGLE_RISK_FLAG",
  RESET_VITALS: "RESET_VITALS",
  ADD_CUSTOM_VITAL: "ADD_CUSTOM_VITAL",
  REMOVE_CUSTOM_VITAL: "REMOVE_CUSTOM_VITAL",
  UPDATE_CUSTOM_VITAL: "UPDATE_CUSTOM_VITAL",
  SET_CUSTOM_VITAL: "SET_CUSTOM_VITAL",
};

const GCS_OPTIONS = {
  E: [
    { value: "4", label: "Spontaneous" },
    { value: "3", label: "To Speech" },
    { value: "2", label: "To Pain" },
    { value: "1", label: "None" },
  ],
  V: [
    { value: "5", label: "Oriented" },
    { value: "4", label: "Confused" },
    { value: "3", label: "Inappropriate" },
    { value: "2", label: "Incomprehensible" },
    { value: "1", label: "None" },
  ],
  M: [
    { value: "6", label: "Obeys Commands" },
    { value: "5", label: "Localizes Pain" },
    { value: "4", label: "Withdraws" },
    { value: "3", label: "Flexion" },
    { value: "2", label: "Extension" },
    { value: "1", label: "None" },
  ],
};

// --- REDUCER FUNCTION ---
function vitalsReducer(
  state: VitalsState,
  action: { type: string; payload: any }
): VitalsState {
  switch (action.type) {
    case ACTIONS.UPDATE_VITAL: {
      const { field, value } = action.payload;
      return { ...state, [field]: value };
    }
    case ACTIONS.TOGGLE_RISK_FLAG: {
      const { flag } = action.payload;
      return {
        ...state,
        riskFlags: {
          ...state.riskFlags,
          [flag]: !state.riskFlags[flag as keyof VitalsState["riskFlags"]],
        },
      };
    }
    case ACTIONS.ADD_CUSTOM_VITAL: {
      const { name, unit } = action.payload || {};
      const newVital: CustomVital = {
        id: Date.now().toString(),
        name: name || "",
        value: "",
        unit: unit || "",
      };
      return {
        ...state,
        customVitals: [...state.customVitals, newVital],
      };
    }
    case ACTIONS.REMOVE_CUSTOM_VITAL: {
      const { id } = action.payload;
      return {
        ...state,
        customVitals: state.customVitals.filter((v) => v.id !== id),
      };
    }
    case ACTIONS.UPDATE_CUSTOM_VITAL: {
      const { id, field, value } = action.payload;
      return {
        ...state,
        customVitals: state.customVitals.map((v) =>
          v.id === id ? { ...v, [field]: value } : v
        ),
      };
    }
    case ACTIONS.SET_CUSTOM_VITAL: {
      const { id, name, value, unit } = action.payload;
      const exists = state.customVitals.find((v) => v.id === id);
      if (exists) {
        return {
          ...state,
          customVitals: state.customVitals.map((v) =>
            v.id === id ? { ...v, value, name, unit } : v
          ),
        };
      } else {
        return {
          ...state,
          customVitals: [...state.customVitals, { id, name, value, unit }],
        };
      }
    }
    case ACTIONS.RESET_VITALS:
      return INITIAL_VITALS_STATE;
    default:
      return state;
  }
}

const isValidNumber = (value: string) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

const getVitalCategory = (
  value: number | string,
  critRedLow: number | null,
  warnAmberLow: number | null,
  warnAmberHigh: number | null,
  critRedHigh: number | null
) => {
  const num = parseFloat(String(value));
  if (isNaN(num)) return { color: "text-gray-500", label: "" };

  if (
    (critRedLow !== null && num < critRedLow) ||
    (critRedHigh !== null && num >= critRedHigh)
  ) {
    return { color: "text-red-600", label: "Critical" };
  }

  if (
    warnAmberLow !== null &&
    num >= warnAmberLow &&
    warnAmberHigh !== null &&
    num < warnAmberHigh
  ) {
    return { color: "text-yellow-600", label: "Warning" };
  }

  return { color: "text-green-600", label: "Normal" };
};

// ----------------------------------------------------------------------
// SUB COMPONENTS (Defined before use)
// ----------------------------------------------------------------------

const O2Alert: React.FC<{ spo2: string }> = ({ spo2 }) => {
  const num = parseFloat(spo2);
  if (isNaN(num) || num >= 92) return null;
  return (
    <div
      className="absolute right-0 top-0 mt-1 mr-1 p-1 bg-red-500 rounded-full"
      title="O₂ required: SpO₂ < 92%"
    >
      <AlertCircle className="w-4 h-4 text-white" />
    </div>
  );
};

const PainScaleSlider: React.FC<{
  value: string;
  onChange: (value: string) => void;
  error?: string;
}> = ({ value, onChange, error }) => {
  const painEmojis = [
    "😊",
    "🙂",
    "😐",
    "😟",
    "😣",
    "😰",
    "😭",
    "😵",
    "😱",
    "💀",
    "☠️",
  ];
  const painValue = parseInt(value) || 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-md text-gray-500">
        <span>No Pain</span>
        <span>Worst Pain</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min="0"
          max="10"
          value={painValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-2 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-md mt-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <span
              key={num}
              className={
                num === painValue ? "font-bold text-[#012e58]" : "text-gray-400"
              }
            >
              {num}
            </span>
          ))}
        </div>
      </div>
      <div className="text-center">
        <span className="text-2xl" title={`Pain Level: ${painValue}/10`}>
          {painEmojis[painValue]}
        </span>
      </div>
      {error && (
        <span className="text-md text-red-600 flex items-center gap-1 font-medium">
          <AlertCircle size={12} />
          {error}
        </span>
      )}
    </div>
  );
};

const GCSDropdown: React.FC<{
  title: string;
  value: string;
  field: keyof Pick<VitalsState, "gcsE" | "gcsV" | "gcsM">;
  options: { value: string; label: string }[];
  onChange: (field: keyof VitalsState, value: string) => void;
  error?: string;
}> = ({ title, value, field, options, onChange, error }) => (
  <div
    className={`bg-white rounded-lg border p-3 transition-all ${
      error ? "border-red-400 shadow-sm shadow-red-100" : "border-gray-200"
    }`}
  >
    <h4 className="font-medium text-[#0B2D4D] mb-2 text-lg">{title}</h4>
    <select
      value={value}
      onChange={(e) => onChange(field, e.target.value)}
      className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#012e58] focus:border-[#012e58] text-lg"
    >
      <option value="">Select</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.value} - {opt.label}
        </option>
      ))}
    </select>
    {error && (
      <span className="text-md text-red-600 flex items-center gap-1 font-medium mt-1">
        <AlertCircle size={12} />
        {error}
      </span>
    )}
  </div>
);

const VitalCard: React.FC<{
  title: string;
  value: string;
  unit: string;
  icon: React.ComponentType<any>;
  field: keyof Omit<VitalsState, "riskFlags" | "bmi" | "map" | "customVitals">;
  onChange: (
    field: keyof Omit<
      VitalsState,
      "riskFlags" | "bmi" | "map" | "customVitals"
    >,
    value: string
  ) => void;
  error?: string;
  category: { color: string; label: string };
  customContent?: React.ReactNode;
}> = ({
  title,
  value,
  unit,
  icon: Icon,
  field,
  onChange,
  error,
  category,
  customContent,
}) => {
  const getChipStyle = (label: string) => {
    switch (label) {
      case "Critical":
        return "bg-red-100 text-red-700 border border-red-200";
      case "Warning":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "Normal":
        return "bg-green-100 text-green-700 border border-green-200";
      default:
        return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };
  return (
    <div
      className={`bg-white rounded-lg border p-4 transition-all relative ${
        error ? "border-red-400 shadow-sm shadow-red-100" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon className="w-5 h-5 text-[#012e58]" />
          <h3 className="font-medium text-[#0B2D4D]">{title}</h3>
        </div>
        {category.label && (
          <span
            className={`px-2 py-0.5 text-md font-semibold rounded-full ${getChipStyle(
              category.label
            )}`}
          >
            {category.label}
          </span>
        )}
      </div>
      {customContent}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full text-3xl font-bold text-[#0B2D4D] bg-transparent border-0 p-0 focus:ring-0 focus:outline-none"
          placeholder="—"
          autoComplete="off"
        />
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-lg text-gray-500">
          {unit}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2 h-4">
        {error && (
          <span className="text-md text-red-600 flex items-center gap-1 font-medium">
            <AlertCircle size={12} />
            {error}
          </span>
        )}
      </div>
    </div>
  );
};

const BPVitalCard: React.FC<{
  systolic: string;
  diastolic: string;
  onChange: (field: keyof VitalsState, value: string) => void;
  errors: { systolic?: string; diastolic?: string };
  sysCategory: { color: string; label: string };
  diaCategory: { color: string; label: string };
  diastolicRef?: React.RefObject<HTMLInputElement>;
}> = ({
  systolic,
  diastolic,
  onChange,
  errors,
  sysCategory,
  diaCategory,
  diastolicRef,
}) => {
  let label = "";
  let colorClass = "bg-gray-100 text-gray-600 border-gray-200";
  if (sysCategory.label === "Critical" || diaCategory.label === "Critical") {
    label = "Critical";
    colorClass = "bg-red-100 text-red-700 border-red-200";
  } else if (
    sysCategory.label === "Warning" ||
    diaCategory.label === "Warning"
  ) {
    label = "Warning";
    colorClass = "bg-yellow-100 text-yellow-700 border-yellow-200";
  } else if (sysCategory.label === "Normal" && diaCategory.label === "Normal") {
    label = "Normal";
    colorClass = "bg-green-100 text-green-700 border-green-200";
  }
  const hasError = !!errors.systolic || !!errors.diastolic;
  return (
    <div
      className={`bg-white rounded-lg border p-4 transition-all relative ${
        hasError ? "border-red-400 shadow-sm shadow-red-100" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-[#012e58]" />
          <h3 className="font-medium text-[#0B2D4D]">Blood Pressure</h3>
        </div>
        {label && (
          <span
            className={`px-2 py-0.5 text-md font-semibold rounded-full border ${colorClass}`}
          >
            {label}
          </span>
        )}
      </div>
      <div className="flex items-baseline relative">
        <input
          type="text"
          value={systolic}
          onChange={(e) => onChange("bpSystolic", e.target.value)}
          className="w-16 text-3xl font-bold text-[#0B2D4D] bg-transparent border-0 p-0 focus:ring-0 focus:outline-none text-right"
          placeholder="---"
        />
        <span className="text-3xl text-gray-400 font-light mx-1">/</span>
        <input
          ref={diastolicRef}
          type="text"
          value={diastolic}
          onChange={(e) => onChange("bpDiastolic", e.target.value)}
          className="w-16 text-3xl font-bold text-[#0B2D4D] bg-transparent border-0 p-0 focus:ring-0 focus:outline-none"
          placeholder="---"
        />
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-lg text-gray-500">
          mmHg
        </span>
      </div>
      <div className="flex items-center justify-between mt-2 h-4">
        {hasError && (
          <span className="text-md text-red-600 flex items-center gap-1 font-medium">
            <AlertCircle size={12} />
            {errors.systolic || errors.diastolic}
          </span>
        )}
      </div>
    </div>
  );
};

const PainScoreCard: React.FC<{
  value: string;
  onChange: (value: string) => void;
  error?: string;
}> = ({ value, onChange, error }) => (
  <div
    className={`bg-white rounded-lg border p-4 transition-all ${
      error ? "border-red-400 shadow-sm shadow-red-100" : "border-gray-200"
    }`}
  >
    <div className="flex items-center space-x-2 mb-3">
      <Waves className="w-5 h-5 text-[#012e58]" />
      <h3 className="font-medium text-[#0B2D4D]">Pain Score</h3>
    </div>
    <PainScaleSlider value={value} onChange={onChange} error={error} />
  </div>
);

const BMIResultCard: React.FC<{
  bmi: string;
  category: { category: string; color: string } | null;
}> = ({ bmi, category }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-center space-x-2 mb-3">
      <Activity className="w-5 h-5 text-[#012e58]" />
      <h3 className="font-medium text-[#0B2D4D]">BMI</h3>
    </div>
    <div className="relative">
      <div className="text-3xl font-bold text-[#0B2D4D]">{bmi || "—"}</div>
      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-lg text-gray-500">
        kg/m²
      </span>
    </div>
    <div className="flex items-center justify-end mt-2 h-4">
      {category && (
        <span
          className={`text-md font-semibold px-2 py-0.5 rounded-full ${category.color
            .replace("text-", "bg-")
            .replace("-600", "-100")} ${category.color}`}
        >
          {category.category}
        </span>
      )}
    </div>
  </div>
);

const MAPResultCard: React.FC<{ map: string }> = ({ map }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-center space-x-2 mb-3">
      <Gauge className="w-5 h-5 text-[#012e58]" />
      <h3 className="font-medium text-[#0B2D4D]">MAP</h3>
    </div>
    <div className="relative">
      <div className="text-3xl font-bold text-[#0B2D4D]">{map || "—"}</div>
      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-lg text-gray-500">
        mmHg
      </span>
    </div>
    <div className="flex items-center justify-end mt-2 h-4"></div>
  </div>
);

const FormattedAiSummary: React.FC<{ summary: string }> = ({ summary }) => {
  const lines = summary.split("\n").filter((line) => line.trim() !== "");
  return (
    <div className="space-y-4 text-[#1a4b7a]">
      {lines.map((line, index) => {
        if (line.startsWith("**") && line.endsWith("**"))
          return (
            <h3 key={index} className="text-lg font-bold text-[#0B2D4D] pt-2">
              {line.slice(2, -2)}
            </h3>
          );
        if (line.startsWith("* ") || line.startsWith("- "))
          return (
            <ul key={index} className="list-disc list-inside pl-4">
              <li>{line.slice(2)}</li>
            </ul>
          );
        if (line.includes(":")) {
          const parts = line.split(":");
          const key = parts[0];
          const value = parts.slice(1).join(":");
          return (
            <div key={index} className="flex">
              <span className="font-semibold w-1/3">{key}:</span>
              <span className="w-2/3">{value}</span>
            </div>
          );
        }
        return <p key={index}>{line}</p>;
      })}
    </div>
  );
};

const AiSummaryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  isLoading: boolean;
}> = ({ isOpen, onClose, summary, isLoading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in-fast">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-95 animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-[#F8F9FA] rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#e0f7fa] rounded-full">
              <Bot className="w-6 h-6 text-[#012e58]" />
            </div>
            <h2 className="text-xl font-bold text-[#0B2D4D]">
              AI-Generated Vitals Analysis
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center">
              <Loader className="w-12 h-12 text-[#012e58] animate-spin mb-4" />
              <p className="text-lg font-semibold text-[#0B2D4D]">
                Analyzing Vitals...
              </p>
              <p className="text-lg text-[#1a4b7a]">
                Please wait while our AI processes the information.
              </p>
            </div>
          ) : (
            <FormattedAiSummary summary={summary} />
          )}
        </div>
        <div className="flex items-center justify-end p-4 border-t border-gray-200 bg-[#F8F9FA] rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2 text-lg font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a4b7a] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// COMPONENT: VitalEditInfoModal
// ----------------------------------------------------------------------
interface VitalEditInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  vital: VitalDefinition;
  isEditMode: boolean;
  onUpdateDefinition: (
    id: string,
    newLabel: string,
    newUnit: string,
    newMin: string,
    newMax: string,
    isCustom: boolean
  ) => Promise<void>;
}

const VitalEditInfoModal: React.FC<VitalEditInfoModalProps> = ({
  isOpen,
  onClose,
  vital,
  isEditMode,
  onUpdateDefinition,
}) => {
  if (!isOpen || !vital) return null;

  const [label, setLabel] = useState(vital.label);
  const [unit, setUnit] = useState(vital.unit || "");
  const [minVal, setMinVal] = useState(vital.minVal?.toString() || "");
  const [maxVal, setMaxVal] = useState(vital.maxVal?.toString() || "");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setLabel(vital.label);
    setUnit(vital.unit || "");
    setMinVal(vital.minVal?.toString() || "");
    setMaxVal(vital.maxVal?.toString() || "");
  }, [vital]);

  const handleSave = async () => {
    if (!label.trim()) {
      alert("Vital name cannot be empty.");
      return;
    }

    setIsProcessing(true);
    try {
      await onUpdateDefinition(
        vital.id,
        label,
        unit,
        minVal,
        maxVal,
        vital.isCustom
      );
      onClose();
    } catch (error) {
      console.error("Error updating vital definition:", error);
      alert("Failed to update vital definition.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStandardInfo = (key: string) => {
    switch (key) {
      case "bmi":
        return { range: "18.5 - 24.9", notes: "Calculated: Weight / Height²" };
      case "bp":
        return {
          range: "Systolic: <120, Diastolic: <80",
          notes: "Normal blood pressure.",
        };
      case "pulse":
        return {
          range: "60 - 100 bpm",
          notes: "Standard adult resting heart rate.",
        };
      case "spo2":
        return {
          range: "94% - 100%",
          notes: "Saturation below 92% is critical.",
        };
      case "temperature":
        return { range: "97.8°F - 99°F", notes: "Normal body temperature." };
      case "respiratoryRate":
        return { range: "12 - 20 breaths/min", notes: "Breaths per minute." };
      case "painScore":
        return {
          range: "0 - 10",
          notes: "Subjective patient rating on a scale of 0 to 10.",
        };
      case "gcs":
        return {
          range: "3 - 15",
          notes: "Total score of Eye, Verbal, and Motor response.",
        };
      case "map":
        return {
          range: "70 - 110 mmHg",
          notes: "Calculated Mean Arterial Pressure.",
        };
      default:
        return null;
    }
  };

  const info = getStandardInfo(vital.key);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#0B2D4D] flex items-center gap-2">
            {isEditMode ? <Edit size={20} /> : <Info size={20} />}
            {isEditMode ? "Edit Vital" : "Vital Details"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vital Name
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-[#012e58] focus:border-[#012e58]"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={!isEditMode}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit (e.g., kg, cm, bpm)
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-[#012e58] focus:border-[#012e58]"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              disabled={!isEditMode}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Normal
              </label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-[#012e58] focus:border-[#012e58]"
                value={minVal}
                onChange={(e) => setMinVal(e.target.value)}
                disabled={!isEditMode}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Normal
              </label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-[#012e58] focus:border-[#012e58]"
                value={maxVal}
                onChange={(e) => setMaxVal(e.target.value)}
                disabled={!isEditMode}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-semibold mb-1">Vital Type:</p>
            <p>{vital.isCustom ? "Custom Definition" : "System Standard"}</p>
          </div>

          {info && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <Info size={16} /> Reference Info:
              </p>
              <p>
                <strong>Range:</strong> {info.range}
              </p>
              <p>
                <strong>Notes:</strong> {info.notes}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
          >
            Close
          </button>
          {isEditMode && (
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-sm disabled:opacity-50"
            >
              {isProcessing ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// UPDATED VITALS SETTINGS MODAL
// ----------------------------------------------------------------------
const VitalsSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  config: Record<string, boolean>;
  onToggle: (key: string) => void;
  onSaveConfig: (newConfig: Record<string, boolean>) => void;
  customDefinitions: VitalDefinition[];
}> = ({ isOpen, onClose, config, onSaveConfig, customDefinitions }) => {
  if (!isOpen) return null;

  const standardVitals: VitalDefinition[] = [
    { id: "v1", key: "bmi", label: "BMI", isCustom: false },
    { id: "v2", key: "bp", label: "Blood Pressure (Sys/Dia)", isCustom: false },
    { id: "v3", key: "pulse", label: "Pulse Rate", isCustom: false },
    { id: "v4", key: "spo2", label: "SpO2", isCustom: false },
    { id: "v5", key: "temperature", label: "Temperature", isCustom: false },
    {
      id: "v6",
      key: "respiratoryRate",
      label: "Respiratory Rate",
      isCustom: false,
    },
    { id: "v7", key: "weight", label: "Weight", isCustom: false },
    { id: "v8", key: "height", label: "Height", isCustom: false },
    {
      id: "v9",
      key: "gcs",
      label: "GCS (Glasgow Coma Scale)",
      isCustom: false,
    },
    { id: "v10", key: "painScore", label: "Pain Score", isCustom: false },
    { id: "v11", key: "map", label: "MAP", isCustom: false },
    {
      id: "v12",
      key: "custom",
      label: "Additional Vitals Section",
      isCustom: false,
    },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [localConfig, setLocalConfig] = useState(config);
  const [isAdding, setIsAdding] = useState(false);
  const [newVitalName, setNewVitalName] = useState("");
  const [newVitalUnit, setNewVitalUnit] = useState("");
  const [newVitalMin, setNewVitalMin] = useState("");
  const [newVitalMax, setNewVitalMax] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedVital, setSelectedVital] = useState<VitalDefinition | null>(
    null
  );
  const [isModalEditMode, setIsModalEditMode] = useState(false);

  const allVitalsList = useMemo(() => {
    return [...standardVitals, ...customDefinitions];
  }, [customDefinitions]);

  const handleAddCustomVital = async () => {
    if (!newVitalName.trim()) return;
    setIsProcessing(true);
    try {
      const key = newVitalName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const newDef = {
        label: newVitalName,
        key: key,
        isCustom: true,
        unit: newVitalUnit || "",
        minVal: newVitalMin ? parseFloat(newVitalMin) : undefined,
        maxVal: newVitalMax ? parseFloat(newVitalMax) : undefined,
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, "vitalDefinitions"), newDef);
      setLocalConfig((prev) => ({ ...prev, [key]: true }));
      setNewVitalName("");
      setNewVitalUnit("");
      setNewVitalMin("");
      setNewVitalMax("");
      setIsAdding(false);
    } catch (err) {
      console.error("Error adding vital:", err);
      alert("Failed to add custom vital");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteVital = async (id: string, isCustom: boolean) => {
    if (isCustom) {
      if (!window.confirm("Delete this custom vital definition permanently?"))
        return;
      try {
        await deleteDoc(doc(db, "vitalDefinitions", id));
        const vitalToRemove = allVitalsList.find((v) => v.id === id);
        if (vitalToRemove) {
          setLocalConfig((prev) => {
            const newConfig = { ...prev };
            delete newConfig[vitalToRemove.key];
            return newConfig;
          });
        }
      } catch (err) {
        console.error("Error deleting:", err);
      }
    } else {
      if (
        !window.confirm(
          "Standard vitals cannot be permanently deleted from the system database. Do you want to disable it from the view instead?"
        )
      )
        return;
      const vitalToDisable = allVitalsList.find((v) => v.id === id);
      if (vitalToDisable) {
        setLocalConfig((prev) => ({ ...prev, [vitalToDisable.key]: false }));
      }
    }
  };

  const handleUpdateDefinition = async (
    id: string,
    newLabel: string,
    newUnit: string,
    newMin: string,
    newMax: string,
    isCustom: boolean
  ) => {
    if (isCustom) {
      const vitalRef = doc(db, "vitalDefinitions", id);
      await updateDoc(vitalRef, {
        label: newLabel,
        unit: newUnit,
        minVal: newMin ? parseFloat(newMin) : null,
        maxVal: newMax ? parseFloat(newMax) : null,
        updatedAt: Timestamp.now(),
      });
    } else {
      alert(
        "Note: Updates to standard system vitals are not persisted to the database in this version. They will revert on reload."
      );
    }
  };

  const handleOpenInfoModal = (vital: VitalDefinition) => {
    setSelectedVital(vital);
    setIsModalEditMode(false);
    setIsDetailsModalOpen(true);
  };

  const handleOpenEditModal = (vital: VitalDefinition) => {
    setSelectedVital(vital);
    setIsModalEditMode(true);
    setIsDetailsModalOpen(true);
  };

  const filteredVitals = allVitalsList.filter((v) =>
    v.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#0B2D4D]">
              Configure Vitals
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search vitals..."
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#012e58] focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-4 py-2 bg-[#012e58] text-white rounded-lg hover:bg-[#1a4b7a] text-sm font-medium transition-colors flex items-center gap-1"
            >
              <Plus size={16} /> Add Custom
            </button>
          </div>

          {isAdding && (
            <div className="flex flex-col gap-2 animate-fade-in bg-gray-50 p-3 rounded-lg border">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Vital Name (e.g. Waist)"
                  className="flex-1 px-3 py-2 border rounded text-sm"
                  value={newVitalName}
                  onChange={(e) => setNewVitalName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Unit (e.g. cm)"
                  className="w-24 px-3 py-2 border rounded text-sm"
                  value={newVitalUnit}
                  onChange={(e) => setNewVitalUnit(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min Normal"
                  className="flex-1 px-3 py-2 border rounded text-sm"
                  value={newVitalMin}
                  onChange={(e) => setNewVitalMin(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max Normal"
                  className="flex-1 px-3 py-2 border rounded text-sm"
                  value={newVitalMax}
                  onChange={(e) => setNewVitalMax(e.target.value)}
                />
                <button
                  onClick={handleAddCustomVital}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {isProcessing ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b sticky top-0">
              <tr>
                <th className="px-6 py-3">Vital Name</th>
                <th className="px-6 py-3 text-center">Enable</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVitals.map((vital) => (
                <tr
                  key={vital.id}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {vital.label}
                    {vital.unit && (
                      <span className="text-gray-500 font-normal ml-1">
                        ({vital.unit})
                      </span>
                    )}
                    {vital.isCustom && (
                      <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                        Custom
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-[#012e58] border-gray-300 rounded focus:ring-[#012e58] cursor-pointer"
                      checked={!!localConfig[vital.key]}
                      onChange={() =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          [vital.key]: !prev[vital.key],
                        }))
                      }
                    />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenInfoModal(vital)}
                        className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded"
                        title="Info"
                      >
                        <Info size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(vital)}
                        className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteVital(vital.id, vital.isCustom)
                        }
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredVitals.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No vitals found. Add a custom vital above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-white border-t flex justify-end gap-3">
          <button
            onClick={() => {
              const defaultConfig = {
                weight: true,
                height: true,
                bmi: true,
                pulse: true,
                temperature: true,
                bp: true,
                spo2: true,
                respiratoryRate: true,
                painScore: true,
                gcs: true,
                custom: true,
              };
              setLocalConfig(defaultConfig);
            }}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
          >
            Reset to Default
          </button>
          <button
            onClick={() => onSaveConfig(localConfig)}
            className="px-6 py-2 bg-[#012e58] text-white font-medium rounded-lg hover:bg-[#1a4b7a] shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>

      {selectedVital && (
        <VitalEditInfoModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          vital={selectedVital}
          isEditMode={isModalEditMode}
          onUpdateDefinition={handleUpdateDefinition}
        />
      )}
    </div>
  );
};

// --- MAIN COMPONENT: VitalsAssessment ---

interface VitalsAssessmentProps {
  selectedPatient?: Patient | null;
  onBack?: () => void;
  isSubcomponent?: boolean;
}

export const VitalsAssessment: React.FC<VitalsAssessmentProps> = ({
  selectedPatient,
  onBack,
  isSubcomponent = false,
}) => {
  const [vitals, dispatch] = useReducer(vitalsReducer, INITIAL_VITALS_STATE);
  const [status, setStatus] = useReducer((s: any, a: any) => ({ ...s, ...a }), {
    isSaving: false,
    showSuccess: false,
    errorMessage: "",
    validationErrors: {} as Record<string, string>,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customDefinitions, setCustomDefinitions] = useState<VitalDefinition[]>(
    []
  );

  useEffect(() => {
    const q = query(collection(db, "vitalDefinitions"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const defs = snapshot.docs.map((doc) => ({
        id: doc.id,
        key: doc.data().key || doc.id,
        label: doc.data().label,
        isCustom: true,
        unit: doc.data().unit,
        minVal: doc.data().minVal,
        maxVal: doc.data().maxVal,
      }));
      setCustomDefinitions(defs);
    });
    return () => unsubscribe();
  }, []);

  const [visibleFields, setVisibleFields] = useState(() => {
    const savedConfig = localStorage.getItem("vitalsConfig");
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (e) {
        console.error("Failed to parse vitals config from local storage", e);
      }
    }
    return {
      weight: true,
      height: true,
      bmi: true,
      pulse: true,
      temperature: true,
      bp: true,
      spo2: true,
      respiratoryRate: true,
      painScore: true,
      gcs: true,
      custom: true,
    };
  });

  const handleSaveConfig = (newConfig: Record<string, boolean>) => {
    setVisibleFields(newConfig);
    localStorage.setItem("vitalsConfig", JSON.stringify(newConfig));
    setIsSettingsOpen(false);
  };

  const diastolicInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const heightM = parseFloat(vitals.height) / 100;
    const weightKg = parseFloat(vitals.weight);
    const systolic = parseFloat(vitals.bpSystolic);
    const diastolic = parseFloat(vitals.bpDiastolic);
    let newBmi = vitals.bmi;
    let newMap = vitals.map;

    if (heightM > 0 && weightKg > 0) {
      const calculatedBmi = (weightKg / (heightM * heightM)).toFixed(1);
      if (calculatedBmi !== vitals.bmi) newBmi = calculatedBmi;
    } else if (vitals.bmi !== "") newBmi = "";

    if (isValidNumber(vitals.bpSystolic) && isValidNumber(vitals.bpDiastolic)) {
      if (systolic > diastolic) {
        const calculatedMap = (
          diastolic +
          (1 / 3) * (systolic - diastolic)
        ).toFixed(0);
        if (calculatedMap !== vitals.map) newMap = calculatedMap;
      } else if (vitals.map !== "") newMap = "";
    } else if (vitals.map !== "") newMap = "";

    if (newBmi !== vitals.bmi)
      dispatch({
        type: ACTIONS.UPDATE_VITAL,
        payload: { field: "bmi", value: newBmi },
      });
    if (newMap !== vitals.map)
      dispatch({
        type: ACTIONS.UPDATE_VITAL,
        payload: { field: "map", value: newMap },
      });
  }, [
    vitals.height,
    vitals.weight,
    vitals.bpSystolic,
    vitals.bpDiastolic,
    vitals.bmi,
    vitals.map,
  ]);

  const getBMICategory = useCallback((bmi: number) => {
    if (bmi < 18.5) return { category: "Underweight", color: "text-blue-600" };
    if (bmi < 25) return { category: "Normal", color: "text-green-600" };
    if (bmi < 30) return { category: "Overweight", color: "text-yellow-600" };
    return { category: "Obese", color: "text-red-600" };
  }, []);

  const bmiCategory = useMemo(() => {
    const bmiValue = parseFloat(vitals.bmi);
    if (!isNaN(bmiValue) && bmiValue > 0) return getBMICategory(bmiValue);
    return null;
  }, [vitals.bmi, getBMICategory]);

  const handleVitalChange = useCallback(
    (field: keyof VitalsState, value: string) => {
      if (field === "bpSystolic" && value.includes("/")) {
        const parts = value.split("/");
        dispatch({
          type: ACTIONS.UPDATE_VITAL,
          payload: {
            field: "bpSystolic",
            value: parts[0].replace(/[^0-9]/g, ""),
          },
        });
        if (parts.length > 1) {
          dispatch({
            type: ACTIONS.UPDATE_VITAL,
            payload: {
              field: "bpDiastolic",
              value: parts[1].replace(/[^0-9]/g, ""),
            },
          });
        }
        if (diastolicInputRef.current) diastolicInputRef.current.focus();
        return;
      }

      let sanitizedValue = value;
      if (
        [
          "weight",
          "height",
          "temperature",
          "spo2",
          "pulse",
          "bpSystolic",
          "bpDiastolic",
          "respiratoryRate",
        ].includes(field)
      ) {
        sanitizedValue = value.replace(/[^0-9.]/g, "");
        const parts = sanitizedValue.split(".");
        if (parts.length > 2)
          sanitizedValue = `${parts[0]}.${parts.slice(1).join("")}`;
      }
      if (["painScore", "gcsE", "gcsV", "gcsM"].includes(field)) {
        sanitizedValue = value.replace(/[^0-9]/g, "");
      }

      dispatch({
        type: ACTIONS.UPDATE_VITAL,
        payload: { field, value: sanitizedValue },
      });
    },
    []
  );

  const handleAddCustomVital = () => {
    dispatch({ type: ACTIONS.ADD_CUSTOM_VITAL, payload: {} });
  };

  const handleRemoveCustomVital = (id: string) => {
    dispatch({ type: ACTIONS.REMOVE_CUSTOM_VITAL, payload: { id } });
  };

  const handleUpdateCustomVital = (
    id: string,
    field: keyof CustomVital,
    value: string
  ) => {
    dispatch({
      type: ACTIONS.UPDATE_CUSTOM_VITAL,
      payload: { id, field, value },
    });
  };

  const handleConfiguredCustomVitalChange = (
    id: string,
    name: string,
    unit: string,
    value: string
  ) => {
    dispatch({
      type: ACTIONS.SET_CUSTOM_VITAL,
      payload: { id, name, unit, value },
    });
  };

  const handleSaveVitals = async () => {
    if (!selectedPatient) {
      setStatus({ errorMessage: "No patient selected!" });
      return;
    }
    setStatus({ errorMessage: "", isSaving: true, showSuccess: false });

    try {
      const vitalsData = {
        patientId: selectedPatient.id,
        patientUhid: selectedPatient.uhid || "",
        patientName: selectedPatient.fullName || "",
        weight: visibleFields.weight ? vitals.weight : "",
        height: visibleFields.height ? vitals.height : "",
        bmi: visibleFields.bmi ? vitals.bmi : "",
        pulse: visibleFields.pulse ? vitals.pulse : "",
        bpSystolic: visibleFields.bp ? vitals.bpSystolic : "",
        bpDiastolic: visibleFields.bp ? vitals.bpDiastolic : "",
        temperature: visibleFields.temperature ? vitals.temperature : "",
        spo2: visibleFields.spo2 ? vitals.spo2 : "",
        respiratoryRate: visibleFields.respiratoryRate
          ? vitals.respiratoryRate
          : "",
        painScore: visibleFields.painScore ? vitals.painScore : "",
        gcsE: visibleFields.gcs ? vitals.gcsE : "",
        gcsV: visibleFields.gcs ? vitals.gcsV : "",
        gcsM: visibleFields.gcs ? vitals.gcsM : "",
        map: visibleFields.bp ? vitals.map : "",
        riskFlags: vitals.riskFlags,
        customVitals: vitals.customVitals,
        recordedAt: Timestamp.now(),
        recordedBy: "Medical Staff",
        status: "completed",
      };

      await addDoc(collection(db, "vitals"), vitalsData);
      setStatus({ showSuccess: true });
      setTimeout(() => setStatus({ showSuccess: false }), 4000);
    } catch (error: any) {
      console.error("Detailed error saving vitals:", error);
      setStatus({ errorMessage: "Failed to save vitals." });
    } finally {
      setStatus({ isSaving: false });
    }
  };

  const handleAiAssist = async () => {
    if (!selectedPatient) {
      setAiSummary("Please select a patient first.");
      setIsModalOpen(true);
      return;
    }
    setIsModalOpen(true);
    setIsAiLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setAiSummary(
      "**Vitals Analysis Summary**\n\n" +
        `BMI: ${vitals.bmi || "N/A"}. ${bmiCategory?.category || ""}\n` +
        `Pulse: ${vitals.pulse || "N/A"} bpm.\n` +
        `BP: ${vitals.bpSystolic || "N/A"} / ${
          vitals.bpDiastolic || "N/A"
        } mmHg.\n` +
        `SpO2: ${vitals.spo2 || "N/A"}%.\n\n` +
        "**Key Recommendations**\n" +
        "* Patient vitals appear stable within normal limits.\n" +
        "* Recommend further investigation into 'Weight' as it is slightly above range for age.\n" +
        "* Monitor blood pressure during consultation."
    );
    setIsAiLoading(false);
  };

  return (
    <div
      className={
        isSubcomponent ? "p-4" : "p-6 bg-[#F8F9FA] min-h-screen font-sans"
      }
    >
      <div className={isSubcomponent ? "" : "max-w-7xl mx-auto"}>
        {!isSubcomponent && (
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-white rounded-lg border border-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-[#1a4b7a]" />
                </button>
              )}
              <Activity className="w-8 h-8 text-[#012e58]" />
              <div>
                <h1 className="text-3xl font-bold text-[#0B2D4D]">
                  Vitals & Assessment
                </h1>
                <p className="text-[#1a4b7a]">
                  Record patient vital signs and health metrics
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-right">
              <p className="text-lg text-[#1a4b7a]">Current Patient</p>
              <p className="font-semibold text-[#0B2D4D]">
                {selectedPatient?.fullName || "No Patient Selected"}
              </p>
            </div>
          </header>
        )}

        {!isSubcomponent && status.showSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800">Vitals saved successfully!</span>
          </div>
        )}

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-[#012e58] hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            <span>Configure Vitals</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
          {visibleFields.weight && (
            <VitalCard
              title="Weight"
              value={vitals.weight}
              unit="kg"
              icon={Activity}
              field="weight"
              onChange={handleVitalChange}
              error={status.validationErrors.weight}
              category={getVitalCategory(
                parseFloat(vitals.weight),
                1,
                1,
                351,
                351
              )}
            />
          )}
          {visibleFields.height && (
            <VitalCard
              title="Height"
              value={vitals.height}
              unit="cm"
              icon={Activity}
              field="height"
              onChange={handleVitalChange}
              error={status.validationErrors.height}
              category={getVitalCategory(
                parseFloat(vitals.height),
                30,
                30,
                251,
                251
              )}
            />
          )}
          {visibleFields.bmi && (
            <BMIResultCard bmi={vitals.bmi} category={bmiCategory} />
          )}
          {visibleFields.pulse && (
            <VitalCard
              title="Pulse"
              value={vitals.pulse}
              unit="bpm"
              icon={Heart}
              field="pulse"
              onChange={handleVitalChange}
              error={status.validationErrors.pulse}
              category={getVitalCategory(
                parseFloat(vitals.pulse),
                40,
                100,
                120,
                120
              )}
            />
          )}
          {visibleFields.temperature && (
            <VitalCard
              title="Temperature"
              value={vitals.temperature}
              unit="°F"
              icon={Thermometer}
              field="temperature"
              onChange={handleVitalChange}
              error={status.validationErrors.temperature}
              category={getVitalCategory(
                parseFloat(vitals.temperature),
                95,
                100.5,
                102,
                102
              )}
            />
          )}
          {visibleFields.bp && (
            <>
              <BPVitalCard
                systolic={vitals.bpSystolic}
                diastolic={vitals.bpDiastolic}
                onChange={handleVitalChange}
                errors={{
                  systolic: status.validationErrors.bpSystolic,
                  diastolic: status.validationErrors.bpDiastolic,
                }}
                sysCategory={getVitalCategory(
                  parseFloat(vitals.bpSystolic),
                  90,
                  140,
                  160,
                  160
                )}
                diaCategory={getVitalCategory(
                  parseFloat(vitals.bpDiastolic),
                  null,
                  90,
                  100,
                  100
                )}
                diastolicRef={diastolicInputRef}
              />
              <MAPResultCard map={vitals.map} />
            </>
          )}
          {visibleFields.spo2 && (
            <VitalCard
              title="SPO₂"
              value={vitals.spo2}
              unit="%"
              icon={Activity}
              field="spo2"
              onChange={handleVitalChange}
              error={status.validationErrors.spo2}
              category={getVitalCategory(
                parseFloat(vitals.spo2),
                90,
                90,
                94,
                101
              )}
              customContent={<O2Alert spo2={vitals.spo2} />}
            />
          )}
          {visibleFields.respiratoryRate && (
            <VitalCard
              title="Resp. Rate"
              value={vitals.respiratoryRate}
              unit="breaths/min"
              icon={Waves}
              field="respiratoryRate"
              onChange={handleVitalChange}
              error={status.validationErrors.respiratoryRate}
              category={getVitalCategory(
                parseFloat(vitals.respiratoryRate),
                8,
                22,
                30,
                30
              )}
            />
          )}
          {visibleFields.painScore && (
            <PainScoreCard
              value={vitals.painScore}
              onChange={(value) => handleVitalChange("painScore", value)}
              error={status.validationErrors.painScore}
            />
          )}

          {customDefinitions.map((def) => {
            if (!visibleFields[def.key]) return null;
            const stateItem = vitals.customVitals.find((v) => v.id === def.key);
            const currentValue = stateItem ? stateItem.value : "";

            // Calculate category based on min/max limits
            const category = (() => {
              if (
                def.minVal === undefined ||
                def.maxVal === undefined ||
                def.minVal === null ||
                def.maxVal === null
              )
                return { color: "text-gray-600", label: "" };
              const val = parseFloat(currentValue);
              if (isNaN(val)) return { color: "text-gray-600", label: "" };
              if (val < def.minVal || val > def.maxVal)
                return { color: "text-yellow-600", label: "Warning" };
              return { color: "text-green-600", label: "Normal" };
            })();

            return (
              <VitalCard
                key={def.key}
                title={def.label}
                value={currentValue}
                unit={def.unit || ""}
                icon={Activity}
                // @ts-ignore
                field="custom"
                onChange={(_, val) =>
                  handleConfiguredCustomVitalChange(
                    def.key,
                    def.label,
                    def.unit || "",
                    val
                  )
                }
                category={category}
              />
            );
          })}
        </div>

        {visibleFields.gcs && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-[#0B2D4D] mb-4 flex items-center space-x-2">
              <Droplet className="w-5 h-5 text-[#012e58]" />
              <span>Glasgow Coma Scale (GCS)</span>
              {vitals.gcsE && vitals.gcsV && vitals.gcsM && (
                <div className="ml-4 flex items-center space-x-2">
                  <span className="text-2xl font-bold text-[#1a4b7a]">
                    Total:{" "}
                    {parseInt(vitals.gcsE) +
                      parseInt(vitals.gcsV) +
                      parseInt(vitals.gcsM)}
                  </span>
                </div>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GCSDropdown
                title="Eye Opening (E)"
                value={vitals.gcsE}
                field="gcsE"
                options={GCS_OPTIONS.E}
                onChange={handleVitalChange}
                error={status.validationErrors.gcsE}
              />
              <GCSDropdown
                title="Verbal Response (V)"
                value={vitals.gcsV}
                field="gcsV"
                options={GCS_OPTIONS.V}
                onChange={handleVitalChange}
                error={status.validationErrors.gcsV}
              />
              <GCSDropdown
                title="Motor Response (M)"
                value={vitals.gcsM}
                field="gcsM"
                options={GCS_OPTIONS.M}
                onChange={handleVitalChange}
                error={status.validationErrors.gcsM}
              />
            </div>
          </div>
        )}

        {visibleFields.custom && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0B2D4D] flex items-center space-x-2">
                <Activity className="w-5 h-5 text-[#012e58]" />
                <span>Additional / Custom Vitals</span>
              </h3>
              <button
                onClick={handleAddCustomVital}
                className="flex items-center space-x-1 px-3 py-1.5 bg-[#012e58] text-white rounded-md hover:bg-[#1a4b7a] transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Vital</span>
              </button>
            </div>
            {/* Filter out vitals that are 'configured' to avoid duplication if user adds ad-hoc */}
            {vitals.customVitals.filter(
              (v) => !customDefinitions.some((def) => def.key === v.id)
            ).length === 0 ? (
              <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <p>No ad-hoc custom vitals added.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vitals.customVitals
                  .filter(
                    (v) => !customDefinitions.some((def) => def.key === v.id)
                  )
                  .map((vital) => (
                    <div
                      key={vital.id}
                      className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1 min-w-[200px]">
                        <input
                          type="text"
                          placeholder="Vital Name"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#012e58]"
                          value={vital.name}
                          onChange={(e) =>
                            handleUpdateCustomVital(
                              vital.id,
                              "name",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="text"
                          placeholder="Value"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#012e58]"
                          value={vital.value}
                          onChange={(e) =>
                            handleUpdateCustomVital(
                              vital.id,
                              "value",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="text"
                          placeholder="Unit"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#012e58]"
                          value={vital.unit}
                          onChange={(e) =>
                            handleUpdateCustomVital(
                              vital.id,
                              "unit",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveCustomVital(vital.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {!isSubcomponent && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-[#0B2D4D] mb-4">
                Risk Assessment Flags
              </h3>
              <div className="space-y-4">
                {Object.entries({
                  diabetes: "Diabetes",
                  heartDisease: "Heart Disease",
                  kidney: "Kidney Disease",
                }).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={
                        vitals.riskFlags[key as keyof typeof vitals.riskFlags]
                      }
                      onChange={() =>
                        dispatch({
                          type: ACTIONS.TOGGLE_RISK_FLAG,
                          payload: { flag: key },
                        })
                      }
                      className="h-4 w-4 text-[#012e58] rounded border-gray-300 focus:ring-[#1a4b7a]"
                    />
                    <span className="text-[#1a4b7a]">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col space-y-4">
              <button
                onClick={handleSaveVitals}
                disabled={status.isSaving || !selectedPatient}
                className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed bg-[#012e58] text-white hover:bg-[#1a4b7a]"
              >
                <Save className="w-5 h-5" />
                <span>{status.isSaving ? "Saving..." : "Save Vitals"}</span>
              </button>
              <div className="flex space-x-4">
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Upload Report</span>
                </button>
                <button
                  onClick={handleAiAssist}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-colors"
                >
                  <Bot className="w-4 h-4" />
                  <span>AI Assist</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {isSubcomponent && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
            <button
              onClick={handleSaveVitals}
              disabled={status.isSaving || !selectedPatient}
              className="flex items-center justify-center space-x-2 w-full px-4 py-2 rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-700 shadow-md"
            >
              <Save className="w-5 h-5" />
              <span>
                {status.isSaving ? "Saving Vitals..." : "Save Vitals"}
              </span>
            </button>
          </div>
        )}
      </div>

      <VitalsSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={visibleFields}
        onToggle={(key) =>
          setVisibleFields((prev) => ({
            ...prev,
            [key]: !prev[key as keyof typeof prev],
          }))
        }
        onSaveConfig={handleSaveConfig}
        customDefinitions={customDefinitions}
      />

      {!isSubcomponent && (
        <AiSummaryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          summary={aiSummary}
          isLoading={isAiLoading}
        />
      )}
    </div>
  );
};

export default VitalsAssessment;
