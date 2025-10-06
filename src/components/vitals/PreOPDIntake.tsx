// --- ./vitals/PreOPDIntake.tsx ---
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

// MOCK DEPENDENCIES
const VitalsAssessment: React.FC<any> = ({
  selectedPatient,
  isSubcomponent,
}) => (
  <div className="p-4 text-sm text-gray-500">
    VitalsAssessment Component (Patient: {selectedPatient?.fullName || "N/A"})
  </div>
);
const db: any = {};
const Timestamp: any = { now: () => Date.now() }; // Mock implementation

// 🚨 CORRECTED IMPORTS: All core logic (types, reducer, utils) from the single types file.
import {
  Patient,
  PreOPDIntakeData,
  intakeReducer,
  INITIAL_INTAKE_STATE,
  extractTextFromFile,
} from "../../types/PreOPDIntake";

// 🚨 CORRECTED IMPORTS: Section components imported directly from the current directory.
import { PresentingComplaintsSection } from "./PresentingComplaintsSection";
import { ChronicConditionsSection } from "./ChronicConditionsSection";
import { AllergiesSection } from "./AllergiesSection";
import { PastHistorySection } from "./PastHistorySection";
import { RecordsUploadSection } from "./RecordsUploadSection";
import { AiClinicalSummarySection } from "./AiClinicalSummarySection";

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
  const [aiSummary, setAiSummary] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);

  // --- HANDLERS ---
  const handleComplaintsChange = useCallback((complaints) => {
    dispatch({ type: "UPDATE_COMPLAINTS", payload: complaints });
  }, []);
  const handleChronicConditionsChange = useCallback((conditions) => {
    dispatch({ type: "UPDATE_CHRONIC_CONDITIONS", payload: conditions });
  }, []);
  const handleAllergiesChange = useCallback((allergies) => {
    dispatch({ type: "UPDATE_ALLERGIES", payload: allergies });
  }, []);
  const handlePastHistoryChange = useCallback((pastHistory) => {
    dispatch({ type: "UPDATE_PAST_HISTORY", payload: pastHistory });
  }, []);
  const handleClearForm = useCallback(() => {
    dispatch({ type: "RESET_ALL", payload: null });
    setExtractedRecords({});
    setAiSummary("");
  }, []);
  const handleExtractedRecordsChange = useCallback(
    (newRecords: Record<string, string>) => {
      setExtractedRecords(newRecords);
    },
    []
  );

  // --- AI LOGIC (MOCK) ---
  const generateAiSummary = useCallback(async () => {
    if (!selectedPatient) {
      setAiSummary("Please select a patient first.");
      return;
    }
    setIsAiLoading(true);
    setAiSummary("");
    setAiExpanded(false);

    const combinedData = `/* Patient Data: ${selectedPatient.fullName}. Complaints: ${intakeData.complaints.length} */`;

    try {
      // MOCK API Call
      await new Promise((r) => setTimeout(r, 1500)); // Simulate latency
      const mockSummaryContent = `**CLINICAL SUMMARY**\n- Patient has ${
        intakeData.complaints.length
      } presenting complaints.\n\n**Key Findings**\nChronic: ${
        intakeData.chronicConditions.map((c) => c.name).join(", ") || "None"
      }\nAllergies: ${
        intakeData.allergies.substance || "None"
      }\n\n**Assessment Note**\n- This summary is generated from captured data and uploaded records. Requires medical review.`;
      setAiSummary(mockSummaryContent);
      setAiExpanded(true);
    } catch (error) {
      setAiSummary("An error occurred while generating the summary.");
    } finally {
      setIsAiLoading(false);
    }
  }, [selectedPatient, intakeData, extractedRecords]);

  // --- SUBMIT LOGIC (MOCK) ---
  const handleSubmit = async () => {
    if (!selectedPatient) {
      setStatus({ ...status, errorMessage: "No patient selected!" });
      return;
    }
    setStatus({ isSaving: true, showSuccess: false, errorMessage: "" });

    try {
      // MOCK: Replace with actual Firebase call (addDoc, etc.)
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

  // Combine all medications for the allergy check (Memoized calculation)
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
        <header className="flex items-center justify-between mb-6">
          {/* ... Header/Patient Info JSX ... */}
        </header>
        {/* Status Messages JSX */}

        <div className="space-y-6">
          {/* 1. Vitals Assessment */}
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
              <VitalsAssessment
                selectedPatient={selectedPatient}
                isSubcomponent={true}
              />
            </div>
          </div>

          {/* 2. Presenting Complaints */}
          <PresentingComplaintsSection
            data={intakeData.complaints}
            onChange={handleComplaintsChange}
          />
          {/* 3. Chronic Conditions */}
          <ChronicConditionsSection
            data={intakeData.chronicConditions}
            onChange={handleChronicConditionsChange}
          />
          {/* 4. Allergies */}
          <AllergiesSection
            data={intakeData.allergies}
            onChange={handleAllergiesChange}
            allMeds={allMedsForCheck}
          />
          {/* 5. Past & Medication History */}
          <PastHistorySection
            data={intakeData.pastHistory}
            onChange={handlePastHistoryChange}
            chronicMeds={intakeData.chronicConditions.flatMap(
              (c) => c.medications
            )}
          />
          {/* 6. Previous Records Uploads */}
          <RecordsUploadSection
            extractTextFromFile={extractTextFromFile}
            onRecordsChange={handleExtractedRecordsChange}
          />
          {/* 7. AI Clinical Summary */}
          <AiClinicalSummarySection
            summary={aiSummary}
            isLoading={isAiLoading}
            isExpanded={aiExpanded}
            onToggleExpand={() => setAiExpanded(!aiExpanded)}
            onGenerate={generateAiSummary}
          />
        </div>
      </div>

      {/* Fixed Bottom Submit Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                **{intakeData.complaints.length}** complaints, **
                {intakeData.chronicConditions.length}** conditions recorded
              </span>
              {intakeData.complaints.some((c) => c.redFlagTriggered) && (
                <span className="flex items-center text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs font-semibold">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Red Flag Alert
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleClearForm}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear Form</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={status.isSaving || !selectedPatient}
                className="flex items-center space-x-2 px-6 py-2 rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed bg-[#012e58] text-white hover:bg-[#1a4b7a]"
              >
                <Save className="w-4 h-4" />
                <span>{status.isSaving ? "Saving..." : "Submit Intake"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreOPDIntake;
