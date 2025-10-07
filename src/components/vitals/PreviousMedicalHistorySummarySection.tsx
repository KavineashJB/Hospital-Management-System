// --- ./vitals/PreviousMedicalHistorySummarySection.tsx ---
import React from "react";
import { Bot, Loader, ClipboardCopy, Eye, EyeOff } from "lucide-react";
import { FormattedAiSummary } from "./Utilities"; // Correct path for sibling file

export interface PreviousMedicalHistorySummarySectionProps {
  summary: string;
  isLoading: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onGenerate: () => void;
}

export const PreviousMedicalHistorySummarySection: React.FC<
  PreviousMedicalHistorySummarySectionProps
> = ({ summary, isLoading, isExpanded, onToggleExpand, onGenerate }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-[#0B2D4D]">
              8. Previous Medical History Summary (Records + History)
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {summary && (
              <>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                >
                  <ClipboardCopy className="w-4 h-4" />
                  <span>Copy to EMR</span>
                </button>
                <button
                  onClick={onToggleExpand}
                  className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                >
                  {isExpanded ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </>
            )}
            <button
              onClick={onGenerate}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-1 bg-[#012e58] text-white rounded-md hover:bg-[#1a4b7a] transition-colors text-sm disabled:bg-gray-400"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
              <span>
                {isLoading ? "Generating..." : "Generate History Summary"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {!summary && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No AI history summary generated yet</p>
            <p className="text-sm">
              Click "Generate History Summary" to summarize uploaded documents
              and structured history.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-8 h-8 animate-spin text-purple-600 mr-3" />
            <span className="text-gray-600">
              Analyzing uploaded records and generating summary...
            </span>
          </div>
        )}

        {summary && isExpanded && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <FormattedAiSummary summary={summary} />
          </div>
        )}

        {summary && !isExpanded && (
          <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 truncate">
              {summary.substring(0, 150)}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
