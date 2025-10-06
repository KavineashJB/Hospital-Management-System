// --- ../../types/PreOPDIntake.ts ---
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Placeholder Interfaces (Based on usage in components)
export interface Duration {
  value: string;
  unit: "h" | "d" | "w" | "mo" | "yr";
}
export interface MedicationDetails {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  route: string;
  duration: string;
  compliance: string;
  notes: string;
}
export interface Complaint {
  id: string;
  complaint: string;
  severity: string;
  duration: Duration;
  specialty: string;
  redFlagTriggered: boolean;
}
export interface ChronicCondition {
  id: string;
  name: string;
  duration: string | { years: number; months: number };
  onMedication: "Yes" | "No" | "Unknown";
  medications: MedicationDetails[];
}
export interface Allergy {
  hasAllergies: boolean;
  type: Array<"Drug" | "Food" | "Other">;
  substance: string;
  reaction: string;
  severity: string;
}
export interface PastHistory {
  illnesses: string[];
  surgeries: { name: string; year: string }[];
  hospitalizations: { reason: string; year: string }[];
  currentMedications: MedicationDetails[];
  overallCompliance: string;
}
export interface Patient {
  id: string;
  uhid: string;
  fullName: string;
  age: number;
  gender: "Male" | "Female" | "Other";
}
export interface PreOPDIntakeData {
  complaints: Complaint[];
  chronicConditions: ChronicCondition[];
  allergies: Allergy;
  pastHistory: PastHistory;
}

// --- CONSTANTS & MOCK DATA ---
export const MOCK_MASTERS = {
  complaints: [
    { label: "Chest Pain", redFlag: true, specialty: "Cardiology" },
    { label: "Shortness of Breath", redFlag: true, specialty: "Cardiology" },
    { label: "Severe Headache", redFlag: true, specialty: "Neurology" },
    { label: "High Fever", redFlag: true, specialty: "General Medicine" },
    { label: "Abdominal Pain", redFlag: false, specialty: "Gastroenterology" },
    { label: "Fever", redFlag: false, specialty: "General Medicine" },
    { label: "Cough", redFlag: false, specialty: "Pulmonology" },
    { label: "Headache", redFlag: false, specialty: "Neurology" },
    { label: "Diarrhea", redFlag: false, specialty: "Gastroenterology" },
    { label: "Back Pain", redFlag: false, specialty: "Orthopedics" },
  ],
  chronicConditions: [
    "Diabetes Mellitus",
    "Hypertension",
    "Asthma",
    "COPD",
    "Chronic Kidney Disease",
    "Coronary Artery Disease",
    "Hyperthyroidism",
    "Hypothyroidism",
    "Rheumatoid Arthritis",
    "Osteoarthritis",
  ],
  medications: [
    "Metformin",
    "Insulin",
    "Amlodipine",
    "Lisinopril",
    "Atorvastatin",
    "Aspirin",
    "Levothyroxine",
    "Salbutamol",
    "Prednisolone",
    "Paracetamol",
  ],
  frequencies: ["OD", "BD", "TDS", "QHS", "QID", "PRN", "Weekly", "Monthly"],
  routes: ["Oral", "SC", "IV", "IM", "Inhaled", "Topical", "Sublingual"],
  severity: ["Mild", "Moderate", "Severe"],
  compliance: ["Taking", "Missed", "Ran out", "Unknown"],
};

export const InputStyle =
  "p-2 border border-gray-300 rounded-md w-full bg-white focus:ring-2 focus:ring-[#012e58] focus:border-[#012e58] transition duration-200 ease-in-out text-[#0B2D4D] placeholder:text-gray-500 text-sm";

// --- REDUCER LOGIC ---
export const INITIAL_INTAKE_STATE: PreOPDIntakeData = {
  complaints: [],
  chronicConditions: [],
  allergies: {
    hasAllergies: false,
    type: [],
    substance: "",
    reaction: "",
    severity: "",
  },
  pastHistory: {
    illnesses: [],
    surgeries: [],
    hospitalizations: [],
    currentMedications: [],
    overallCompliance: "Unknown",
  },
};

type IntakeAction =
  | { type: "UPDATE_COMPLAINTS"; payload: Complaint[] }
  | { type: "UPDATE_CHRONIC_CONDITIONS"; payload: ChronicCondition[] }
  | { type: "UPDATE_ALLERGIES"; payload: Allergy }
  | { type: "UPDATE_PAST_HISTORY"; payload: PastHistory }
  | { type: "RESET_ALL"; payload?: null };

export function intakeReducer(
  state: PreOPDIntakeData,
  action: IntakeAction
): PreOPDIntakeData {
  switch (action.type) {
    case "UPDATE_COMPLAINTS":
      return { ...state, complaints: action.payload };
    case "UPDATE_CHRONIC_CONDITIONS":
      return { ...state, chronicConditions: action.payload };
    case "UPDATE_ALLERGIES":
      return { ...state, allergies: action.payload };
    case "UPDATE_PAST_HISTORY":
      return { ...state, pastHistory: action.payload };
    case "RESET_ALL":
      return INITIAL_INTAKE_STATE;
    default:
      return state;
  }
}

// --- FILE EXTRACTION UTILITY ---
(
  pdfjsLib as any
).GlobalWorkerOptions.standardFontDataUrl = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/standard_fonts/`;
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

export const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        let text = "";
        const result = event.target?.result;

        if (file.type === "application/pdf") {
          const loadingTask = pdfjsLib.getDocument(result as ArrayBuffer);
          const pdf = await loadingTask.promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text +=
              content.items.map((item: any) => item.str).join(" ") +
              "\n--- Page Break ---\n";
          }
          resolve(`[PDF Embedded Text Extracted]\n${text}`);
        } else if (
          file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          const arrayBuffer = result as ArrayBuffer;
          const mammothResult = await mammoth.extractRawText({ arrayBuffer });
          resolve(`[DOCX Text Content Extracted]\n${mammothResult.value}`);
        } else if (file.type === "text/plain") {
          resolve(`[Plain Text Content]\n${result as string}`);
        } else if (file.type.startsWith("image/")) {
          const mockResolution = `[Image OCR Required] File: ${file.name} *** To enable OCR, Tesseract.js implementation is required. ***`;
          resolve(mockResolution);
        } else {
          reject(
            new Error(
              `Unsupported file type: ${file.type}. Text extraction failed.`
            )
          );
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };

    if (
      file.type === "application/pdf" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      reader.readAsArrayBuffer(file);
    } else if (file.type.startsWith("image/")) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
};
