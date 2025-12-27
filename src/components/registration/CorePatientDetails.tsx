// src/components/registration/CorePatientDetails.tsx
import React from "react";
import { Smartphone, Search, Loader } from "lucide-react"; // Plus icon REMOVED
import { StyledInput } from "../ui/FormComponents";

interface CorePatientDetailsProps {
  formData: any;
  handleChange: (e: any) => void;
  handleDOBChange: (e: any) => void;
  handleDoctorSelect: (doctorName: string) => void;
  doctorOptions: string[];
  salutationOptions: string[];
  genderOptions: string[];
  registrationTypeOptions: string[];
  isSubmitting: boolean;
  doctorError: string;
  onCheckMobile: () => void;
  isChecking?: boolean;
  visibleFields: Record<string, boolean>;
}

export const CorePatientDetails: React.FC<CorePatientDetailsProps> = ({
  formData,
  handleChange,
  handleDOBChange,
  handleDoctorSelect,
  doctorOptions,
  salutationOptions,
  genderOptions,
  registrationTypeOptions,
  isSubmitting,
  doctorError,
  onCheckMobile,
  isChecking = false,
  visibleFields,
}) => {
  // 🚨 UPDATED: Make Consulting Doctor always visible within this section, regardless of external config
  const isFieldVisible = (key: string) => {
    if (key === "doctorAssigned") return true; // Reqt 3: Mandatory and always visible
    return visibleFields[key] !== false;
  };

  const formatDoctorName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <div className="space-y-4">
      {/* Read-Only Info (Always visible, excluded from configuration) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-md font-medium text-[#1a4b7a] mb-1 block">
            Reg Date & Time
          </label>
          <StyledInput
            type="text"
            className="bg-gray-100 cursor-not-allowed text-gray-700 font-medium"
            value={new Date().toLocaleString()}
            readOnly
          />
        </div>
        <div>
          <label className="text-md font-medium text-[#1a4b7a] mb-1 block">
            UHID
          </label>
          <StyledInput
            type="text"
            className="bg-gray-100 cursor-not-allowed text-gray-700 font-medium"
            value={formData.uhid || "Generate UHID (Auto)"}
            readOnly
          />
        </div>
      </div>

      {/* Salutation & Full Name (Full Name is mandatory/always visible) */}
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1">
          {isFieldVisible("salutation") && (
            <StyledInput
              isSelect
              name="salutation"
              value={formData.salutation}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Title"
            >
              {salutationOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </StyledInput>
          )}
        </div>
        <div
          className={isFieldVisible("salutation") ? "col-span-3" : "col-span-4"}
        >
          <StyledInput
            type="text"
            placeholder="Full Name (Required)"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* DOB | Age | Sex (Block visibility control) */}
      {isFieldVisible("dob_age_gender") && (
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div>
            <label className="text-md font-medium text-[#1a4b7a] mb-1 block">
              DOB (Optional)
            </label>
            <StyledInput
              type="date"
              name="dateOfBirth"
              className="pr-2"
              value={formData.dateOfBirth}
              onChange={handleDOBChange}
              disabled={isSubmitting}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div>
            <label className="text-md font-medium text-[#1a4b7a] mb-1 block">
              Age
            </label>
            <StyledInput
              type="number"
              placeholder="0-120"
              name="age"
              value={formData.age}
              onChange={(e: any) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 0 && val <= 120) {
                  handleChange(e);
                } else if (e.target.value === "") {
                  handleChange(e);
                }
              }}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="text-md font-medium text-[#1a4b7a] mb-1 block">
              Gender
            </label>
            <StyledInput
              isSelect
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Sex"
            >
              {genderOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </StyledInput>
          </div>
        </div>
      )}

      {/* Mobile Number with Check Button (Mandatory/always visible) */}
      <div className="mt-3">
        <label className="text-md font-medium text-[#1a4b7a] mb-1 block">
          Primary Mobile Number (Required)
        </label>
        <div className="flex items-start gap-2">
          <div className="flex-grow">
            <StyledInput
              type="tel"
              placeholder="Enter 10-digit number"
              name="contactNumber"
              icon={Smartphone}
              value={formData.contactNumber}
              onChange={handleChange}
              pattern="[0-9]{10,15}"
              required
              disabled={isSubmitting}
            />
          </div>
          <button
            type="button"
            onClick={onCheckMobile}
            disabled={isSubmitting || isChecking}
            className="mt-[1px] px-4 py-3 bg-[#e0f7fa] text-[#012e58] rounded-lg hover:bg-[#b3e5fc] transition-colors font-medium flex items-center border border-[#012e58]/20 disabled:opacity-50"
            title="Check if patient already exists"
          >
            {isChecking ? (
              <>
                <Loader className="w-4 h-4 mr-1.5 animate-spin" /> Checking...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-1.5" /> Check
              </>
            )}
          </button>
        </div>
      </div>

      {/* Registration Type & Doctor */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        {isFieldVisible("registrationType") && (
          <div>
            <label className="text-md font-medium text-[#1a4b7a] mb-1 block">
              Type
            </label>
            <StyledInput
              isSelect
              name="registrationType"
              value={formData.registrationType}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Select"
            >
              {registrationTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </StyledInput>
          </div>
        )}
        {/* 🚨 REQT 1, 2, 3: MANDATORY DROPDOWN, REMOVED FROM CONFIG */}
        {isFieldVisible("doctorAssigned") && (
          <div>
            <label className="block text-md font-medium text-[#1a4b7a] mb-1">
              Consulting Doctor (Required)
            </label>
            <StyledInput
              isSelect
              name="doctorAssigned"
              value={formData.doctorAssigned}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Select Doctor"
              required // REQT 1: MANDATORY
            >
              {/* REQT 2: Populated from fetched doctorOptions */}
              {doctorOptions.map((docName) => (
                <option key={docName} value={docName}>
                  Dr. {formatDoctorName(docName)}
                </option>
              ))}
            </StyledInput>
          </div>
        )}
      </div>
    </div>
  );
};
