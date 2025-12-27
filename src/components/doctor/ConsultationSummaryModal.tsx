// src/components/doctor/ConsultationSummaryModal.tsx
import React, { useMemo } from "react";
import {
  X,
  FileText,
  Download,
  CheckCircle,
  Brain,
  Pill,
  Activity,
} from "lucide-react";
import { createPortal } from "react-dom";
import { Patient, Medication } from "../../types";

interface ConsultationData {
  symptoms: Array<{
    id: number;
    symptom: string;
    duration: string;
    factors: string;
  }>;
  diagnosis: string;
  notes: string;
  generalExamination: string[];
  systemicExamination: string[];
}

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinalComplete: () => void;
  patient: Patient;
  consultation: ConsultationData;
  medications: Medication[];
}

const ConsultationSummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  onFinalComplete,
  patient,
  consultation,
  medications,
}) => {
  if (!isOpen) return null;

  const now = useMemo(() => new Date(), []);

  const handleDownloadPdf = () => {
    // We simply call print; the portal-rendered print-only copy (outside modal)
    // is what will be included in the PDF.
    window.print();
  };

  // Print CSS: show print-only copy, hide everything else (including modal shell)
  const printStyles = `
    @page { size: A4; margin: 12mm; }

    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

      .print-only { display: block !important; }
      .screen-only,
      .modal-overlay,
      .modal-header,
      .modal-footer { display: none !important; }

      thead { display: table-header-group !important; }
      tfoot { display: table-footer-group !important; }

      .print-card { page-break-inside: avoid !important; break-inside: avoid !important; }

      .print-root table { width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; }
      .print-root th, .print-root td { border: 1px solid #ccc !important; padding: 6px !important; word-wrap: break-word !important; }

      .print-header { position: fixed; top: 0; left: 0; right: 0; padding: 8mm 0; border-bottom: 1px solid #ddd; }
      .print-footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 6mm 0; border-top: 1px solid #ddd; font-size: 9pt; }
      .print-body   { margin-top: 22mm; margin-bottom: 18mm; }
      .page-number:after { counter-increment: page; content: counter(page); }
      .total-pages:after { content: counter(pages); }
    }

    /* On screen, hide the print clone */
    .print-only { display: none; }
  `;

  // ---- SUMMARY BODY (used twice: in modal for screen, and in portal for print) ----
  const SummaryBody = (
    <div className="print-root print-body p-6">
      <h3 className="text-xl font-bold text-[#0B2D4D] border-b pb-2 flex items-center space-x-2">
        <FileText className="w-5 h-5 text-green-600" />
        <span>
          Consultation Summary — {patient.fullName} (UHID: {patient.uhid})
        </span>
      </h3>

      {/* Patient Info */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 print-card">
        <p className="text-lg font-semibold text-[#1a4b7a]">Patient Details</p>
        <p className="text-lg">
          Age: {patient.age}Y, Gender: {patient.gender}, Phone:{" "}
          {patient.contactNumber}
        </p>
        <p className="text-lg">Assigned Doctor: {patient.doctorAssigned}</p>
        <p className="text-lg">Visit Date/Time: {now.toLocaleString()}</p>
      </div>

      {/* Diagnosis */}
      <div className="space-y-2 mt-4 print-card">
        <h4 className="font-semibold text-[#0B2D4D] flex items-center space-x-2">
          <Brain className="w-4 h-4 text-purple-600" />
          Diagnosis
        </h4>
        <p className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-lg">
          {consultation.diagnosis?.trim() || "No formal diagnosis entered."}
        </p>
      </div>

      {/* Complaints & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2 print-card">
          <h4 className="font-semibold text-[#0B2D4D] flex items-center space-x-2">
            <Activity className="w-4 h-4 text-red-600" />
            Chief Complaints
          </h4>
          <ul className="list-disc list-inside p-3 bg-gray-50 rounded-lg border border-gray-200 text-lg">
            {consultation.symptoms?.filter((s) => s.symptom?.trim()).length ? (
              consultation.symptoms
                .filter((s) => s.symptom?.trim())
                .map((s) => (
                  <li key={s.id ?? `${s.symptom}-${s.duration}`}>
                    {s.symptom} {s.duration ? `(${s.duration})` : ""}{" "}
                    {s.factors ? `- ${s.factors}` : ""}
                  </li>
                ))
            ) : (
              <li>No chief complaints recorded.</li>
            )}
          </ul>
        </div>
        <div className="space-y-2 print-card">
          <h4 className="font-semibold text-[#0B2D4D] flex items-center space-x-2">
            <Activity className="w-4 h-4 text-green-600" />
            Doctor Notes
          </h4>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-lg">
            <p>{consultation.notes?.trim() || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Medications */}
      <div className="space-y-2 mt-4 print-card">
        <h4 className="font-semibold text-[#0B2D4D] flex items-center space-x-2">
          <Pill className="w-4 h-4 text-orange-600" />
          Medications
        </h4>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 text-md uppercase text-gray-600">
              <tr>
                <th className="px-6 py-3 text-left">Medicine</th>
                <th className="px-6 py-3 text-left">Dosage</th>
                <th className="px-6 py-3 text-left">Schedule</th>
                <th className="px-6 py-3 text-left">Instructions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-lg">
              {medications?.length ? (
                medications.map((med) => (
                  <tr
                    key={
                      (med as any).id ??
                      `${med.name}-${med.dosage}-${med.duration}`
                    }
                  >
                    <td className="px-6 py-3 font-medium">{med.name}</td>
                    <td className="px-6 py-3">{med.dosage}</td>
                    <td className="px-6 py-3">
                      {med.frequency}{" "}
                      {med.duration ? `for ${med.duration}` : ""}
                    </td>
                    <td className="px-6 py-3">{med.instructions}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-3 text-center text-gray-500"
                  >
                    No medications prescribed.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="px-6 py-2 text-md">
                  * Please follow up if symptoms persist or worsen.
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );

  // PRINT-ONLY WRAPPER rendered via portal (outside the modal/overlay)
  const PrintClone = (
    <div className="print-only">
      <div className="print-header text-center">
        <div className="font-bold text-lg">Clinexa Multispeciality Clinic</div>
        <div className="text-md">
          123 Health Ave, Coimbatore · +91-98765-43210 · hello@clinexa.health
        </div>
      </div>
      {SummaryBody}
      <div className="print-footer flex items-center justify-between px-2">
        <div>Generated: {now.toLocaleString()}</div>
        <div>UHID: {patient.uhid}</div>
        <div>
          Page <span className="page-number" /> of{" "}
          <span className="total-pages" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 modal-overlay">
      <style>{printStyles}</style>

      {/* Screen modal */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="modal-header flex items-center justify-between p-5 border-b border-gray-200 bg-[#F8F9FA] rounded-t-xl">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-[#012e58]" />
            <h2 className="text-xl font-bold text-[#0B2D4D]">
              Final Consultation Summary
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Screen-only copy */}
        <div className="screen-only">{SummaryBody}</div>

        <div className="modal-footer flex items-center justify-between p-4 border-t border-gray-200 bg-[#F8F9FA] rounded-b-xl">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center space-x-2 px-4 py-2 text-lg font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF / Print</span>
          </button>

          <button
            onClick={onFinalComplete}
            className="flex items-center space-x-2 px-6 py-2 text-lg font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Complete Consultation</span>
          </button>
        </div>
      </div>

      {/* Print-only clone rendered OUTSIDE modal/overlay */}
      {createPortal(PrintClone, document.body)}
    </div>
  );
};

export default ConsultationSummaryModal;
