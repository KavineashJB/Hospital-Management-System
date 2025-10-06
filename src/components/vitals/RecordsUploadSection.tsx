// --- ./vitals/RecordsUploadSection.tsx ---
import React, { useState, useRef } from "react";
import { Upload, Loader, Trash2 } from "lucide-react";
// No other imports needed from types/constants for this file

interface RecordsUploadSectionProps {
  extractTextFromFile: (file: File) => Promise<string>;
  onRecordsChange: (records: Record<string, string>) => void;
}

const categories = [
  { id: "lab-reports", label: "Lab Reports", icon: "🧪" },
  { id: "radiology", label: "Radiology", icon: "🩻" },
  { id: "prescriptions", label: "Prescriptions", icon: "💊" },
  { id: "discharge-summaries", label: "Discharge", icon: "📋" },
  { id: "other", label: "Other", icon: "📄" },
];

export const RecordsUploadSection: React.FC<RecordsUploadSectionProps> = ({
  extractTextFromFile,
  onRecordsChange,
}) => {
  const [activeTab, setActiveTab] = useState("lab-reports");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{
    [key: string]: Array<{
      id: string;
      name: string;
      type: string;
      size: number;
    }>;
  }>({
    "lab-reports": [],
    radiology: [],
    prescriptions: [],
    "discharge-summaries": [],
    other: [],
  });
  const [extractedContents, setExtractedContents] = useState<
    Record<string, string>
  >({});

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);

    try {
      const textContent = await extractTextFromFile(file);
      const newFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
      };

      setUploadedFiles((prev) => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), newFile],
      }));

      const newExtractedContents = {
        ...extractedContents,
        [activeTab]:
          (extractedContents[activeTab] || "") +
          `\n\n--- FILE: ${newFile.name} ---\n${textContent}`,
      };
      setExtractedContents(newExtractedContents);
      onRecordsChange(newExtractedContents);
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (categoryId: string, fileId: string) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId].filter((file) => file.id !== fileId),
    }));

    const simplerNewContents = { ...extractedContents, [categoryId]: "" };
    setExtractedContents(simplerNewContents);
    onRecordsChange(simplerNewContents);
  };

  const currentFileCount = uploadedFiles[activeTab]?.length || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Upload className="w-5 h-5 text-[#012e58]" />
          <h2 className="text-lg font-semibold text-[#0B2D4D]">
            6. Previous Records Upload (OCR + NLP)
          </h2>
        </div>
      </div>

      <div className="p-4">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.docx,.txt,image/*"
        />

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200">
          {categories.map((category) => {
            const fileCount = uploadedFiles[category.id]?.length || 0;
            return (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-t-md border-b-2 transition-colors ${
                  activeTab === category.id
                    ? "border-[#012e58] text-[#012e58] bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
                {fileCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {fileCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Upload Area */}
        <div className="mb-4">
          <div
            className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 transition-colors cursor-pointer ${
              isProcessing ? "bg-blue-100" : "hover:bg-gray-100"
            }`}
            onClick={!isProcessing ? triggerFileUpload : undefined}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <Loader className="w-8 h-8 text-[#012e58] mx-auto mb-2 animate-spin" />
                <p className="text-sm text-[#012e58] mb-1 font-medium">
                  Processing File...
                </p>
                <p className="text-xs text-gray-500">
                  Extracting text content (OCR/Embedded)
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2 font-medium">
                  Upload {categories.find((c) => c.id === activeTab)?.label}{" "}
                  files
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Drag and drop or **click to browse** • PDF, DOCX, JPG, PNG
                </p>
                <div className="px-4 py-2 bg-[#012e58] text-white rounded-md hover:bg-[#1a4b7a] transition-colors text-sm inline-block">
                  Browse Files
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Files */}
        {currentFileCount > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-[#0B2D4D]">
              Uploaded Files ({currentFileCount})
            </h4>
            {uploadedFiles[activeTab]?.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">📄</div>
                  <div>
                    <p className="text-sm font-medium text-[#0B2D4D]">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => removeFile(activeTab, file.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Text Preview Box */}
            <div className="mt-4 p-3 bg-gray-100 border border-gray-200 rounded-lg">
              <h5 className="text-xs font-semibold text-[#0B2D4D] mb-2">
                Extracted Content Preview (Last Upload)
              </h5>
              <p className="text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {extractedContents[activeTab]
                  ?.split("\n\n")
                  .pop()
                  ?.substring(0, 500) ||
                  "No text extracted yet for the last file."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
