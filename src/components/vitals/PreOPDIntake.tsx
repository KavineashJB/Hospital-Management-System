// src/components/vitals/PreOPDIntake.tsx
import React, { useState, useReducer, useCallback, useMemo } from "react";
import {
  FileText,
  Save,
  RotateCcw,
  ArrowLeft,
  Activity,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

// --- CORE DEPENDENCIES ---
import {
  VitalsAssessment,
  VitalsState as VitalsSnapshot,
} from "./VitalsAssessment"; // Assuming VitalsState is exported from VitalsAssessment.tsx
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  Patient,
  PreOPDIntakeData,
  Complaint,
  ChronicCondition,
  Allergy,
  PastHistory,
} from "../../types";

import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// 🚨🚨 CRITICAL FIX: IMPORTING MODULAR SECTIONS FROM INDIVIDUAL FILES 🚨🚨
import { PresentingComplaintsSection } from "./PresentingComplaintsSection";
import { ChronicConditionsSection } from "./ChronicConditionsSection";
import { AllergiesSection } from "./AllergiesSection";
import { PastHistorySection } from "./PastHistorySection";
import { RecordsUploadSection } from "./RecordsUploadSection";
import { AiClinicalSummarySection } from "./AiClinicalSummarySection";
import { PreviousMedicalHistorySummarySection } from "./PreviousMedicalHistorySummarySection";

// --- FILE UTILITIES & REDUCER LOGIC (Mocked/Pulled locally for context) ---

// --- FILE EXTRACTION MOCK/LOGIC ---
const extractTextFromFile = async (file: File): Promise<string> => {
  return Promise.resolve(`[Mock Extracted Text] Content from ${file.name}`);
};

// --- INITIAL STATE & REDUCER ---
const INITIAL_INTAKE_STATE: PreOPDIntakeData = {
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

function intakeReducer(
  state: PreOPDIntakeData,
  action: { type: string; payload: any }
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

// ------------------------------------------------------------------
// --- MAIN COMPONENT ---
// ------------------------------------------------------------------
interface PreOPDIntakeProps {
  selectedPatient?: Patient | null;
  onBack?: () => void;
}

export const PreOPDIntake: React.FC<PreOPDIntakeProps> = ({
  selectedPatient,
  onBack,
}) => {
  const [intakeData, dispatch] = useReducer(
    intakeReducer,
    INITIAL_INTAKE_STATE
  );
  const [status, setStatus] = useState({
    isSaving: false,
    showSuccess: false,
    errorMessage: "",
  });
  const [extractedRecords, setExtractedRecords] = useState<
    Record<string, string>
  >({});

  const [clinicalSummary, setClinicalSummary] = useState("");
  const [isClinicalLoading, setIsClinicalLoading] = useState(false);
  const [clinicalExpanded, setClinicalExpanded] = useState(false);
  const [historySummary, setHistorySummary] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // --- HANDLERS ---
  const handleComplaintsChange = useCallback((complaints: Complaint[]) => {
    dispatch({ type: "UPDATE_COMPLAINTS", payload: complaints });
  }, []);
  const handleChronicConditionsChange = useCallback(
    (conditions: ChronicCondition[]) => {
      dispatch({ type: "UPDATE_CHRONIC_CONDITIONS", payload: conditions });
    },
    []
  );
  const handleAllergiesChange = useCallback((allergies: Allergy) => {
    dispatch({ type: "UPDATE_ALLERGIES", payload: allergies });
  }, []);
  const handlePastHistoryChange = useCallback((pastHistory: PastHistory) => {
    dispatch({ type: "UPDATE_PAST_HISTORY", payload: pastHistory });
  }, []);
  const handleClearForm = useCallback(() => {
    dispatch({ type: "RESET_ALL", payload: null });
    setExtractedRecords({});
    setClinicalSummary("");
    setHistorySummary("");
    setClinicalExpanded(false);
    setHistoryExpanded(false);
  }, []);
  const handleExtractedRecordsChange = useCallback(
    (newRecords: Record<string, string>) => {
      setExtractedRecords(newRecords);
    },
    []
  );

  const fetchLatestVitals =
    useCallback(async (): Promise<VitalsSnapshot | null> => {
      // Mock implementation
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              pulse: 80,
              bpSystolic: 120,
              bpDiastolic: 80,
            } as VitalsSnapshot),
          100
        )
      );
    }, [selectedPatient]);

  // 1. AI Clinical Summary Generator
  const generateClinicalSummary = useCallback(async () => {
    if (!selectedPatient) {
      setClinicalSummary("Please select a patient first.");
      return;
    }
    setIsClinicalLoading(true);
    setClinicalSummary("");
    setClinicalExpanded(false);
    const latestVitals = await fetchLatestVitals();

    try {
      await new Promise((r) => setTimeout(r, 1000));
      const mockResponse = `**CLINICAL STATUS**\n- Patient presents with ${
        intakeData.complaints.length
      } active complaint(s).\n\n**Vitals Snapshot**\nPulse: ${
        latestVitals?.pulse || "N/A"
      } bpm.\n\n*Summary based on current triage inputs.*`;
      setClinicalSummary(mockResponse);
      setClinicalExpanded(true);
    } catch (error) {
      setClinicalSummary(
        "An error occurred while generating the clinical summary."
      );
    } finally {
      setIsClinicalLoading(false);
    }
  }, [selectedPatient, fetchLatestVitals, intakeData.complaints]);

  // 2. AI History Summary Generator
  const generateHistorySummary = useCallback(async () => {
    if (!selectedPatient) {
      setHistorySummary("Please select a patient first.");
      return;
    }
    setIsHistoryLoading(true);
    setHistorySummary("");
    setHistoryExpanded(false);

    try {
      await new Promise((r) => setTimeout(r, 1000));
      const mockResponse = `**COMPREHENSIVE HISTORY**\n- **Chronic Issues**: ${intakeData.chronicConditions.length} found.`;
      setHistorySummary(mockResponse);
      setHistoryExpanded(true);
    } catch (error) {
      setHistorySummary(
        "An error occurred while generating the medical history summary."
      );
    } finally {
      setIsHistoryLoading(false);
    }
  }, [
    selectedPatient,
    extractedRecords,
    intakeData.chronicConditions,
    intakeData.allergies,
    intakeData.pastHistory,
  ]);

  const handleSubmit = async () => {
    if (!selectedPatient) {
      setStatus({ ...status, errorMessage: "No patient selected!" });
      return;
    }
    setStatus({ isSaving: true, showSuccess: false, errorMessage: "" });

    try {
      await new Promise((r) => setTimeout(r, 1000));
      setStatus({ isSaving: false, showSuccess: true, errorMessage: "" });
      setTimeout(
        () => setStatus((prev) => ({ ...prev, showSuccess: false })),
        4000
      );
    } catch (error: any) {
      setStatus({
        isSaving: false,
        showSuccess: false,
        errorMessage: "Failed to save intake data.",
      });
    }
  };

  const allMedsForCheck = useMemo(
    () => [
      ...intakeData.chronicConditions.flatMap((c) => c.medications),
      ...intakeData.pastHistory.currentMedications,
    ],
    [intakeData.chronicConditions, intakeData.pastHistory.currentMedications]
  );

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header (Clean JSX Structure) */}
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
            <FileText className="w-8 h-8 text-[#012e58]" />
            <div>
              <h1 className="text-3xl font-bold text-[#0B2D4D]">
                Pre-OPD Intake Assessment
              </h1>
              <p className="text-[#1a4b7a]">
                Comprehensive patient intake and medical history
              </p>
            </div>
          </div>
          {/* Patient Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-right">
            <p className="text-sm text-[#1a4b7a]">Current Patient</p>
            <p className="font-semibold text-[#0B2D4D]">
              {selectedPatient?.fullName || "No Patient Selected"}
            </p>
          </div>
        </header>

        {/* Status Messages JSX */}
        {status.showSuccess && ""}
        {status.errorMessage && ""}

        <div className="space-y-6">
          {/* 1. Vitals Assessment (Editable section) */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-[#012e58]" />
                <h2 className="text-lg font-semibold text-[#0B2D4D]">
                  1. Vital Signs Assessment
                </h2>
              </div>
            </div>
            <div className="p-0">
              {/* VitalsAssessment component should contain the actual editable form */}
              <VitalsAssessment
                selectedPatient={selectedPatient}
                isSubcomponent={true}
              />
            </div>
          </div>

          {/* 2-6. Core Intake Sections */}
          <PresentingComplaintsSection
            data={intakeData.complaints}
            onChange={handleComplaintsChange}
          />
          <ChronicConditionsSection
            data={intakeData.chronicConditions}
            onChange={handleChronicConditionsChange}
          />
          <AllergiesSection
            data={intakeData.allergies}
            onChange={handleAllergiesChange}
            allMeds={allMedsForCheck}
          />
          <PastHistorySection
            data={intakeData.pastHistory}
            onChange={handlePastHistoryChange}
            chronicMeds={intakeData.chronicConditions.flatMap(
              (c) => c.medications
            )}
          />
          <RecordsUploadSection
            extractTextFromFile={extractTextFromFile}
            onRecordsChange={handleExtractedRecordsChange}
          />

          {/* 7. AI Clinical Summary (Vitals + Complaints) */}
          <AiClinicalSummarySection
            summary={clinicalSummary}
            isLoading={isClinicalLoading}
            isExpanded={clinicalExpanded}
            onToggleExpand={() => setClinicalExpanded(!clinicalExpanded)}
            onGenerate={generateClinicalSummary}
          />

          {/* 8. Previous Medical History Summary (Records + Past History) */}
          <PreviousMedicalHistorySummarySection
            summary={historySummary}
            isLoading={isHistoryLoading}
            isExpanded={historyExpanded}
            onToggleExpand={() => setHistoryExpanded(!historyExpanded)}
            onGenerate={generateHistorySummary}
          />
        </div>
      </div>

      {/* Fixed Bottom Submit Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
        {/* ... Submit Bar Content ... */}
      </div>
    </div>
  );
};

export default PreOPDIntake;
