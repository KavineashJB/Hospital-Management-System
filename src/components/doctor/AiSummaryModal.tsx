// src/components/doctor/AiSummaryModal.tsx
import React from "react";
import { X, Bot, Loader } from "lucide-react";

interface FormattedAiSummaryProps {
  summary: string;
}

const FormattedAiSummary: React.FC<FormattedAiSummaryProps> = ({ summary }) => {
  const lines = summary.split("\n").filter((line) => line.trim() !== "");

  return (
    <div className="space-y-4 text-[#1a4b7a]">
      {lines.map((line, index) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <h3 key={index} className="text-lg font-bold text-[#0B2D4D] pt-2">
              {line.slice(2, -2)}
            </h3>
          );
        }
        if (line.startsWith("* ") || line.startsWith("- ")) {
          return (
            <ul key={index} className="list-disc list-inside pl-4">
              <li>{line.slice(2)}</li>
            </ul>
          );
        }
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

interface AiSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  isLoading: boolean;
}

export const AiSummaryModal: React.FC<AiSummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-[#F8F9FA] rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#e0f7fa] rounded-full">
              <Bot className="w-6 h-6 text-[#012e58]" />
            </div>
            <h2 className="text-xl font-bold text-[#0B2D4D]">
              AI-Generated Summary
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
                Analyzing History...
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
