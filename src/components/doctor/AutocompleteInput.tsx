// src/components/doctor/AutocompleteInput.tsx
import React, { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

interface AutocompleteInputProps {
  symptomId: number;
  value: string;
  onChange: (symptomId: number, value: string) => void;
  symptomOptions: string[];
  addSymptomOption: (symptom: string) => void;
  // ADDED: Optional placeholder prop
  placeholder?: string;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  symptomId,
  value,
  onChange,
  symptomOptions,
  addSymptomOption,
  // MODIFIED: Use passed placeholder or default to "Enter symptom"
  placeholder = "Enter symptom",
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const filteredSymptoms = symptomOptions.filter((s) =>
    s.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(symptomId, e.target.value);
    setShowDropdown(true);
  };

  const handleSelectSymptom = (symptom: string) => {
    setInputValue(symptom);
    onChange(symptomId, symptom);
    setShowDropdown(false);
  };

  const handleAddSymptom = () => {
    if (inputValue && !symptomOptions.includes(inputValue)) {
      addSymptomOption(inputValue);
      handleSelectSymptom(inputValue);
    }
  };

  const showAddButton =
    inputValue &&
    !symptomOptions.some((s) => s.toLowerCase() === inputValue.toLowerCase());

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          className="p-2 border border-gray-300 rounded-md w-full bg-gray-50 focus:ring-2 focus:ring-[#012e58] focus:border-[#012e58] transition duration-200 ease-in-out text-[#0B2D4D] placeholder:text-gray-500 text-lg"
          // MODIFIED: Use the passed placeholder
          placeholder={placeholder}
        />
        {showAddButton && (
          <button
            type="button"
            onClick={handleAddSymptom}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-gray-200 rounded-full hover:bg-gray-300"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
      {showDropdown && filteredSymptoms.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {filteredSymptoms.map((symptom, index) => (
            <div
              key={index}
              onClick={() => handleSelectSymptom(symptom)}
              className="px-4 py-2 text-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              {symptom}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
