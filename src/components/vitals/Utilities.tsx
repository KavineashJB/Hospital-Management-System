// --- ./vitals/Utilities.tsx ---
import React from "react";
import { ClipboardCopy } from "lucide-react"; // Assuming import of icons from main file

/**
 * Helper component for rendering standardized section headers.
 */
export const SectionHeader: React.FC<{
  icon: React.ElementType;
  title: string;
}> = ({ icon: Icon, title }) => (
  <div className="flex items-center space-x-2 mb-4">
    <div className="p-1.5 rounded-lg bg-[#e0f7fa]">
      <Icon className="w-5 h-5 text-[#012e58]" />
    </div>
    <h2 className="text-lg font-bold text-[#0B2D4D] tracking-tight">{title}</h2>
  </div>
);

/**
 * Renders the AI summary using structured markdown elements.
 */
export const FormattedAiSummary: React.FC<{ summary: string }> = ({
  summary,
}) => {
  const lines = summary.split("\n").filter((line) => line.trim() !== "");
  return (
    <div className="space-y-3 text-[#1a4b7a]">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        // **Heading**
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return (
            <h3 key={index} className="text-base font-bold text-[#0B2D4D] pt-1">
              {trimmed.slice(2, -2)}
            </h3>
          );
        }
        // # Heading or ## Subheading
        if (trimmed.startsWith("# ") || trimmed.startsWith("## ")) {
          return (
            <h3 key={index} className="text-base font-bold text-[#0B2D4D] pt-1">
              {trimmed.replace(/^#+\s*/, "")}
            </h3>
          );
        }
        // - List or * List
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <ul key={index} className="list-disc list-inside pl-4">
              <li>{trimmed.slice(2)}</li>
            </ul>
          );
        }
        // Key: Value
        if (trimmed.includes(":")) {
          const parts = trimmed.split(":");
          const key = parts[0];
          const value = parts.slice(1).join(":");
          return (
            <div key={index} className="flex">
              <span className="font-semibold w-1/3">{key}:</span>
              <span className="w-2/3">{value}</span>
            </div>
          );
        }
        // Normal text
        return (
          <p key={index} className="text-sm text-gray-800">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
};
