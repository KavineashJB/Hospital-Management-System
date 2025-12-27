// src/components/registration/PatientRegistration.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  UserPlus,
  Save,
  CheckCircle,
  MapPin,
  HeartPulse,
  ListPlus,
  Plus,
  ChevronDown,
  Trash2,
  X,
  AlertCircle,
  Info,
  Loader,
  UserCog,
  Settings,
  Search,
} from "lucide-react";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  Timestamp,
  updateDoc,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  limit,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { StyledInput } from "../ui/FormComponents";
import { ManagePackageForm, PackageItem } from "./ManagePackageForm";
import { ConsultationPackagesSection } from "./ConsultationPackagesDropdown";
import { CorePatientDetails } from "./CorePatientDetails";

// --- Custom Field Persistence Constants (REQ 2) ---
const CUSTOM_LABELS_DOC_ID = "persistedCustomLabels";
const CUSTOM_LABELS_COLLECTION = "patientConfig";

// --- CONFIGURATION CONSTANTS ---
const REGISTRATION_FIELD_DEFINITIONS = [
  // Core (Passed to CorePatientDetails)
  { key: "salutation", label: "Salutation", group: "Core" },
  { key: "dob_age_gender", label: "DOB/Age/Gender Block", group: "Core" },
  { key: "registrationType", label: "Registration Type", group: "Core" },
  // 🚨 REMOVED: { key: "doctorAssigned", label: "Consulting Doctor", group: "Core" },

  // Address
  { key: "addressLine1", label: "Address Line 1", group: "Address" },
  { key: "area", label: "Area", group: "Address" },
  { key: "district_pinCode", label: "District/PIN Block", group: "Address" },
  { key: "state", label: "State", group: "Address" },

  // Additional Info
  { key: "alternateMobile", label: "Alternate Mobile", group: "Additional" },
  { key: "email", label: "Email", group: "Additional" },
  { key: "abhaId", label: "ABHA ID", group: "Additional" },
  { key: "bloodGroup", label: "Blood Group", group: "Additional" },
  { key: "occupation", label: "Occupation", group: "Additional" },
  { key: "maritalStatus", label: "Marital Status", group: "Additional" },
  {
    key: "preferredLanguage",
    label: "Preferred Language",
    group: "Additional",
  },
];

const INITIAL_VISIBLE_FIELDS: Record<string, boolean> = (() => {
  try {
    const saved = localStorage.getItem("registrationFieldsConfig");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to parse registrationFieldsConfig", e);
  }
  // Default config: all true
  const baseConfig = REGISTRATION_FIELD_DEFINITIONS.reduce(
    (acc, def) => {
      acc[def.key] = true;
      return acc;
    },
    {
      custom_fields_section: true, // Toggle for the Add/Permanent custom fields block
    } as Record<string, boolean>
  );
  // Ensure the removed field is not in the initial config loaded from disk
  delete baseConfig["doctorAssigned"];
  return baseConfig;
})();

// --- Custom Popup Component (UNCHANGED) ---

const Popup: React.FC<any> = ({
  isOpen,
  onClose,
  title,
  message,
  type,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "warning":
        return <Info className="w-6 h-6 text-orange-600" />;
      default:
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case "error":
        return "bg-red-50 border-red-100 text-red-900";
      case "success":
        return "bg-green-50 border-green-100 text-green-900";
      case "warning":
        return "bg-orange-50 border-orange-100 text-orange-900";
      default:
        return "bg-blue-50 border-blue-100 text-blue-900";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden scale-100 transform transition-all">
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${getHeaderColor()}`}
        >
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className="font-semibold text-lg">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600 text-md leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          {onConfirm ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-md"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-4 py-2 bg-[#012e58] text-white font-medium rounded-lg hover:bg-[#1a4b7a] transition-colors shadow-md"
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-md"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- RegistrationSettingmdodal Component ---

interface RegistrationSettingmdodalProps {
  isOpen: boolean;
  onClose: () => void;
  visibleFields: Record<string, boolean>;
  onSaveConfig: (newConfig: Record<string, boolean>) => void;
}

const RegistrationSettingmdodal: React.FC<RegistrationSettingmdodalProps> = ({
  isOpen,
  onClose,
  visibleFields,
  onSaveConfig,
}) => {
  if (!isOpen) return null;

  const [localConfig, setLocalConfig] = useState(visibleFields);
  const [searchTerm, setSearchTerm] = useState("");

  const handleToggle = (key: string) => {
    setLocalConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredDefinitions = REGISTRATION_FIELD_DEFINITIONS.filter((def) =>
    def.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#0B2D4D] flex items-center gap-2">
            <Settings size={20} className="text-blue-600" />
            Configure Registration Fields
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-gray-50 border-b flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search field name..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-md focus:ring-2 focus:ring-[#012e58] focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50">
          <table className="w-full text-md text-left">
            <thead className="text-sm text-gray-700 uppercase bg-gray-100 border-b sticky top-0">
              <tr>
                <th className="px-6 py-3">Field Name</th>
                <th className="px-6 py-3 text-center">Group</th>
                <th className="px-6 py-3 text-center">Enable</th>
              </tr>
            </thead>
            <tbody>
              {filteredDefinitions.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No fields found matching "{searchTerm}".
                  </td>
                </tr>
              )}
              {filteredDefinitions.map((field) => (
                <tr
                  key={field.key}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {field.label}
                  </td>
                  <td className="px-6 py-3 text-center text-gray-500 text-sm">
                    {field.group}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-[#012e58] border-gray-300 rounded focus:ring-[#012e58] cursor-pointer"
                      checked={!!localConfig[field.key]}
                      onChange={() => handleToggle(field.key)}
                    />
                  </td>
                </tr>
              ))}
              {/* Special toggle for the permanent custom fields section */}
              <tr className="bg-white border-b hover:bg-gray-50 font-medium">
                <td className="px-6 py-3 text-gray-900">
                  Custom Fields Section (Add/Perm.)
                </td>
                <td className="px-6 py-3 text-center text-gray-500 text-sm">
                  Additional
                </td>
                <td className="px-6 py-3 text-center">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-[#012e58] border-gray-300 rounded focus:ring-[#012e58] cursor-pointer"
                    checked={!!localConfig["custom_fields_section"]}
                    onChange={() => handleToggle("custom_fields_section")}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-white border-t flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-md font-medium"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#012e58] text-white font-medium rounded-lg hover:bg-[#1a4b7a] shadow-md"
          >
            <Save size={16} className="inline mr-1" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

// Mock Initial Packages
const initialMockPackages: PackageItem[] = [
  {
    id: "pkg1",
    name: "General OPD",
    description: "Standard consultation with general physician.",
    price: "500",
    customFields: [{ id: "c1", label: "Validity", value: "7 Days" }],
  },
  {
    id: "pkg2",
    name: "Specialist Consultation",
    description: "Consultation with senior specialist.",
    price: "800",
    customFields: [{ id: "c2", label: "Includes", value: "BP Check" }],
  },
  {
    id: "pkg3",
    name: "Emergency",
    description: "Priority emergency care.",
    price: "1200",
    customFields: [],
  },
  {
    id: "pkg4",
    name: "Follow-up",
    description: "Routine follow-up within validity period.",
    price: "0",
    customFields: [],
  },
];

// --- Main PatientRegistration Component ---

export const PatientRegistration: React.FC = () => {
  const initialFormState = {
    salutation: "",
    fullName: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    contactNumber: "",
    registrationType: "",
    doctorAssigned: "",
    uhid: "",
    addressLine1: "",
    addressLine2: "",
    area: "",
    district: "",
    pinCode: "",
    state: "",
    alternateMobile: "",
    email: "",
    abhaId: "",
    bloodGroup: "",
    occupation: "",
    maritalStatus: "",
    patientType: "OPD",
    visitType: "Walk-in",
    paymentMethod: "Cash",
    consultationPackage: "",
    preferredLanguage: "English",
    chronicConditions: [] as string[],
    files: null as FileList | null,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [packages, setPackages] = useState(initialMockPackages);
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(
    null
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [actionStatus, setActionStatus] = useState<
    "idle" | "checking" | "drafting" | "registering"
  >("idle");
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [doctorError, setDoctorError] = useState("");

  const [popupState, setPopupState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info" | "warning",
    onConfirm: undefined as (() => void) | undefined,
    confirmLabel: undefined as string | undefined,
  });

  const [oneTimeCustomFields, setOneTimeCustomFields] = useState<
    { label: string; value: string }[]
  >([]);

  const [permanentFields, setPermanentFields] = useState<
    { label: string; value: string }[]
  >([]);

  const [availableCustomLabels, setAvailableCustomLabels] = useState<
    { label: string; placeholder: string }[]
  >([]);

  const [newCustomField, setNewCustomField] = useState({
    label: "",
    value: "",
    placeholder: "Enter value",
  });

  // --- Configuration State ---
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>(
    INITIAL_VISIBLE_FIELDS
  );
  const [isSettingmdodalOpen, setIsSettingmdodalOpen] = useState(false);

  // --- Registered Doctors State ---
  const [registeredDoctors, setRegisteredDoctors] = useState<string[]>([]);

  // --- VISIBILITY CHECK LOGIC (UPDATED IMPLEMENTATION) ---
  const isSectionVisible = useCallback(
    (groupKey: "Core" | "Address" | "Additional") => {
      // Core section is always visible as it contains mandatory patient identification fields.
      if (groupKey === "Core") return true;

      // Find all configurable field keys belonging to this group
      const keysInGroup = REGISTRATION_FIELD_DEFINITIONS.filter(
        (def) => def.group === groupKey
      ).map((def) => def.key);

      // Check the special key for the Additional section
      if (groupKey === "Additional") {
        keysInGroup.push("custom_fields_section");
      }

      // The section is visible if ANY of its configurable fields are ENABLED (true or undefined/missing).
      return keysInGroup.some((key) => visibleFields[key] !== false);
    },
    [visibleFields]
  );

  // --- FETCH REGISTERED DOCTORS (Reqt 2) ---
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const doctorsRef = collection(db, "doctors");
        const snapshot = await getDocs(doctorsRef);
        const doctorNames = snapshot.docs
          .map((doc) => doc.data().doc_name as string)
          .filter((name) => name);

        setRegisteredDoctors(doctorNames);
      } catch (error) {
        console.error("Error fetching registered doctors:", error);
        // Fallback to mock list if fetch fails
        setRegisteredDoctors([
          "Dr. Sarah Wilson",
          "Dr. Michael Chen",
          "Dr. John Doe",
        ]);
      }
    };
    fetchDoctors();
  }, []);

  const mockDoctorOptions =
    registeredDoctors.length > 0
      ? registeredDoctors
      : ["Dr. Sarah Wilson", "Dr. Michael Chen", "Dr. John Doe"];

  const handleSaveConfig = (newConfig: Record<string, boolean>) => {
    setVisibleFields(newConfig);
    localStorage.setItem("registrationFieldsConfig", JSON.stringify(newConfig));
  };

  const isFieldVisible = useCallback(
    (key: string) => visibleFields[key] !== false,
    [visibleFields]
  );

  // --- Form Handlers ---
  const showPopup = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
    onConfirm?: () => void,
    confirmLabel?: string
  ) => {
    setPopupState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      confirmLabel,
    });
  };
  const closePopup = () =>
    setPopupState((prev) => ({ ...prev, isOpen: false }));
  const salutationOptions = ["Mr", "Mrs", "Mr & Mrs", "Master", "Dr", "Ms"];
  const genderOptions = ["Male", "Female", "Other"];
  const registrationTypeOptions = ["New", "Review", "Referral", "Follow-up"];

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDOBChange = (e: React.ChangeEvent<any>) => {
    const dob = e.target.value;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    const ageStr = age >= 0 && age <= 120 ? String(age) : "";
    setFormData((prev) => ({ ...prev, dateOfBirth: dob, age: ageStr }));
  };

  const handleDoctorSelect = (doctorName: string) => {
    setDoctorError("");
    setFormData((prev) => ({ ...prev, doctorAssigned: doctorName }));
  };

  const updateAvailableCustomLabels = useCallback(
    async (newFields: { label: string; placeholder: string }[]) => {
      const uniqueNewFields = newFields.filter((f) => f.label.trim() !== "");

      const labelMap = new Map();
      uniqueNewFields.forEach((f) => labelMap.set(f.label, f));
      availableCustomLabels.forEach((f) => {
        if (!labelMap.has(f.label)) {
          labelMap.set(f.label, f);
        }
      });

      const finalLabels = Array.from(labelMap.values());
      setAvailableCustomLabels(finalLabels);

      try {
        const docRef = doc(db, CUSTOM_LABELS_COLLECTION, CUSTOM_LABELS_DOC_ID);
        await setDoc(
          docRef,
          { id: CUSTOM_LABELS_DOC_ID, labels: finalLabels },
          { merge: true }
        );
      } catch (error) {
        console.error("Error updating custom labels in Firestore:", error);
      }
    },
    [availableCustomLabels]
  );

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const q = query(
          collection(db, CUSTOM_LABELS_COLLECTION),
          where("id", "==", CUSTOM_LABELS_DOC_ID),
          limit(1)
        );
        const docSnap = await getDocs(q);

        if (!docSnap.empty) {
          const data = docSnap.docs[0].data();
          if (Array.isArray(data.labels) && data.labels.length > 0) {
            const fetchedLabels = data.labels as {
              label: string;
              placeholder: string;
            }[];
            setAvailableCustomLabels(fetchedLabels);
          }
        }
      } catch (error) {
        console.error("Error fetching custom labels:", error);
      }
    };
    fetchLabels();
  }, []);

  // --- DUAL SEARCH HANDLER (Mobile/UHID) ---
  const handleCheckPatient = async () => {
    if (actionStatus !== "idle") return;

    const searchValue = formData.contactNumber.trim();
    if (!searchValue || searchValue.length < 5) {
      showPopup(
        "Invalid Input",
        "Please enter a valid Mobile Number or UHID (min 5 characters) to check.",
        "warning"
      );
      return;
    }

    setActionStatus("checking");

    try {
      const patientsRef = collection(db, "patients");

      const qMobile = query(
        patientsRef,
        where("contactNumber", "==", searchValue),
        limit(1)
      );
      let existingData = (await getDocs(qMobile)).docs[0]?.data();

      if (!existingData) {
        const qUhid = query(
          patientsRef,
          where("uhid", "==", searchValue.toUpperCase()),
          limit(1)
        );
        existingData = (await getDocs(qUhid)).docs[0]?.data();
      }

      if (existingData) {
        const latestData = existingData;

        showPopup(
          "Patient Record Found",
          `Patient record found for "${latestData.fullName}" (UHID: ${latestData.uhid}). \nDo you want to autofill the details?`,
          "info",
          () => {
            setFormData((prev) => ({
              ...prev,
              uhid: latestData.uhid || prev.uhid,
              salutation: latestData.salutation || "",
              fullName: latestData.fullName || "",
              dateOfBirth: latestData.dateOfBirth || "",
              age: latestData.age || "",
              gender: latestData.gender || "",
              addressLine1: latestData.addressLine1 || "",
              addressLine2: latestData.addressLine2 || "",
              area: latestData.area || "",
              district: latestData.district || "",
              pinCode: latestData.pinCode || "",
              state: latestData.state || "",
              alternateMobile: latestData.alternateMobile || "",
              email: latestData.email || "",
              abhaId: latestData.abhaId || "",
              bloodGroup: latestData.bloodGroup || "",
              occupation: latestData.occupation || "",
              maritalStatus: latestData.maritalStatus || "",
              preferredLanguage: latestData.preferredLanguage || "English",
              registrationType: "Review",
              contactNumber: latestData.contactNumber || prev.contactNumber,
            }));

            const patientCustomFields = (latestData.customFields || []) as {
              label: string;
              value: string;
            }[];

            const permanentFieldDefinitions = new Map(
              availableCustomLabels.map((def) => [def.label, def])
            );

            const loadedPermanentFields: { label: string; value: string }[] =
              [];
            const loadedOneTimeFields: { label: string; value: string }[] = [];

            patientCustomFields.forEach((field) => {
              if (permanentFieldDefinitions.has(field.label)) {
                loadedPermanentFields.push(field);
              } else {
                loadedOneTimeFields.push(field);
              }
            });

            const initialPermanentFields = availableCustomLabels.map((def) => {
              const found = loadedPermanentFields.find(
                (lField) => lField.label === def.label
              );
              return {
                label: def.label,
                value: found?.value || "",
              };
            });

            setPermanentFields(initialPermanentFields);
            setOneTimeCustomFields(loadedOneTimeFields);
          },
          "Autofill"
        );
      } else {
        showPopup(
          "Not Found",
          `No existing patient found with "${searchValue}".`,
          "info"
        );
        const initialPermanentFields = availableCustomLabels.map((def) => ({
          label: def.label,
          value: "",
        }));
        setPermanentFields(initialPermanentFields);
      }
    } catch (error) {
      console.error("Error fetching patient details:", error);
      showPopup(
        "Error",
        "Failed to check for existing patient. Please ensure you have permission or try again.",
        "error"
      );
    } finally {
      setActionStatus("idle");
    }
  };

  const handleManagePackage = (newOrUpdatedPkg: PackageItem) => {
    if (packages.some((pkg) => pkg.id === newOrUpdatedPkg.id)) {
      setPackages((prev) =>
        prev.map((pkg) =>
          pkg.id === newOrUpdatedPkg.id ? newOrUpdatedPkg : pkg
        )
      );
    } else {
      setPackages((prev) => [...prev, newOrUpdatedPkg]);
    }
    setFormData((prev) => ({
      ...prev,
      consultationPackage: newOrUpdatedPkg.name,
    }));
    setShowAddPackageModal(false);
    setEditingPackage(null);
  };

  const handleRemovePackage = (id: string) => {
    showPopup(
      "Confirm Removal",
      "Are you sure you want to remove this package?",
      "warning",
      () => {
        setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
      },
      "Remove"
    );
  };

  // --- PERMANENT FIELD HANDLERS ---

  const handlePermanentFieldChange = (label: string, value: string) => {
    setPermanentFields(
      permanentFields.map((field) =>
        field.label === label ? { ...field, value } : field
      )
    );
  };

  const handleRemovePermanentField = (labelToRemove: string) => {
    showPopup(
      "Confirm Removal",
      `Are you sure you want to permanently remove "${labelToRemove}" from the custom fields list for ALL future registrations?`,
      "warning",
      () => {
        const newLabels = availableCustomLabels.filter(
          (f) => f.label !== labelToRemove
        );
        updateAvailableCustomLabels(newLabels);
        setPermanentFields(
          permanentFields.filter((f) => f.label !== labelToRemove)
        );
      },
      "Remove Permanently"
    );
  };

  const handleAddPermanentField = () => {
    if (newCustomField.label.trim()) {
      const newFieldDefinition = {
        label: newCustomField.label.trim(),
        placeholder: newCustomField.placeholder,
      };

      const isExistingDefinition = availableCustomLabels.some(
        (f) => f.label === newFieldDefinition.label
      );

      if (!isExistingDefinition) {
        updateAvailableCustomLabels([
          ...availableCustomLabels,
          newFieldDefinition,
        ]);
      }

      const existingPermanentFieldIndex = permanentFields.findIndex(
        (f) => f.label === newFieldDefinition.label
      );

      if (existingPermanentFieldIndex > -1) {
        handlePermanentFieldChange(
          newFieldDefinition.label,
          newCustomField.value
        );
      } else {
        setPermanentFields([
          ...permanentFields,
          { label: newFieldDefinition.label, value: newCustomField.value },
        ]);
      }

      setNewCustomField({ label: "", value: "", placeholder: "Enter value" });
    }
  };

  // --- ONE-TIME FIELD HANDLERS ---

  const addOneTimeCustomField = () => {
    if (newCustomField.label && newCustomField.value) {
      setOneTimeCustomFields([
        ...oneTimeCustomFields,
        { label: newCustomField.label, value: newCustomField.value },
      ]);
      setNewCustomField({ label: "", value: "", placeholder: "Enter value" });
    }
  };

  const removeOneTimeCustomField = (index: number) => {
    setOneTimeCustomFields(oneTimeCustomFields.filter((_, i) => i !== index));
  };

  const selectAvailableCustomLabel = (label: string) => {
    const fieldDefinition = availableCustomLabels.find(
      (f) => f.label === label
    );
    setNewCustomField({
      label: label,
      value: newCustomField.value,
      placeholder: fieldDefinition?.placeholder || "Enter value",
    });
  };

  // --- SUBMIT HANDLERS ---

  const handleSaveDraft = async () => {
    if (!formData.fullName || !formData.contactNumber) {
      showPopup(
        "Required Fields",
        "Please provide at least a Patient Name and Phone Number to save a draft.",
        "warning"
      );
      return;
    }

    setActionStatus("drafting");

    const combinedCustomFields = [
      ...permanentFields.filter((f) => f.value.trim() !== ""),
      ...oneTimeCustomFields,
    ];

    try {
      const draftData = {
        ...formData,
        customFields: combinedCustomFields,
        createdAt: Timestamp.now(),
        status: "Draft",
      };

      const newPatientRef = await addDoc(collection(db, "patients"), draftData);

      let finalUhid = formData.uhid;
      if (!finalUhid) {
        finalUhid = `DRAFT${newPatientRef.id.slice(0, 6).toUpperCase()}`;
      }

      await updateDoc(newPatientRef, {
        id: newPatientRef.id,
        uhid: finalUhid,
      });

      showPopup(
        "Draft Saved",
        "Patient details have been saved as a draft.",
        "success"
      );

      setFormData(initialFormState);
      setOneTimeCustomFields([]);
      setPermanentFields(permanentFields.map((f) => ({ ...f, value: "" })));
    } catch (error) {
      console.error(error);
      showPopup("Error", "Could not save draft.", "error");
    } finally {
      setActionStatus("idle");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actionStatus !== "idle") return;

    const missingFields = [];
    if (!formData.fullName) missingFields.push("Full Name");
    if (!formData.contactNumber) missingFields.push("Contact Number");

    // 🚨 REQT 1: Check if doctorAssigned is selected (Now mandatory)
    // isFieldVisible("doctorAssigned") is now always true in CorePatientDetails.
    if (!formData.doctorAssigned) {
      missingFields.push("Consulting Doctor");
    }

    if (missingFields.length > 0) {
      showPopup(
        "Missing Fields",
        `Please fill the following required fields: ${missingFields.join(
          ", "
        )}`,
        "error"
      );
      return;
    }

    setActionStatus("registering");

    const combinedCustomFields = [
      ...permanentFields.filter((f) => f.value.trim() !== ""),
      ...oneTimeCustomFields,
    ];

    try {
      const finalData = {
        ...formData,
        customFields: combinedCustomFields,
        createdAt: Timestamp.now(),
        status: "Waiting",
      };

      const newPatientRef = await addDoc(collection(db, "patients"), finalData);

      const fileUrls: string[] = [];
      if (formData.files) {
        const storage = getStorage();
        for (const file of Array.from(formData.files)) {
          const storageRef = ref(
            storage,
            `patients/${newPatientRef.id}/${file.name}`
          );
          const snapshot = await uploadBytes(storageRef, file);
          fileUrls.push(await getDownloadURL(snapshot.ref));
        }
      }

      let finalUhid = formData.uhid;
      if (!finalUhid) {
        finalUhid = `UHID${newPatientRef.id.slice(0, 8).toUpperCase()}`;
      }

      await updateDoc(newPatientRef, {
        id: newPatientRef.id,
        uhid: finalUhid,
        fileUrls,
      });

      setFormData((prev) => ({ ...prev, uhid: finalUhid }));
      setShowSuccess(true);
      setTimeout(() => {
        setFormData(initialFormState);
        setOneTimeCustomFields([]);
        setPermanentFields(permanentFields.map((f) => ({ ...f, value: "" })));
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error(error);
      showPopup(
        "Submission Error",
        "Error registering patient. Please try again.",
        "error"
      );
    } finally {
      setActionStatus("idle");
    }
  };

  const clearForm = () => {
    showPopup(
      "Confirm Clear",
      "Are you sure you want to clear the form? All entered data will be lost.",
      "warning",
      () => {
        setFormData(initialFormState);
        setOneTimeCustomFields([]);
        setPermanentFields(permanentFields.map((f) => ({ ...f, value: "" })));
      },
      "Clear Form"
    );
  };

  const isAnyActionInProgress = actionStatus !== "idle";

  return (
    <div className="bg-[#F8F9FA] flex flex-col min-h-screen p-6 relative">
      <div className="max-w-7xl mx-auto w-full bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <UserPlus className="w-6 h-6 text-[#012e58]" />
            <h1 className="text-2xl font-bold text-[#0B2D4D]">
              Patient Registration
            </h1>
          </div>
          <button
            onClick={() => setIsSettingmdodalOpen(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-[#012e58] hover:bg-gray-50 transition-colors shadow-md text-md font-medium"
          >
            <Settings className="w-4 h-4" />
            <span>Configure Fields</span>
          </button>
        </div>

        {showSuccess && (
          <div className="mb-4 bg-green-100 text-green-900 p-3 rounded-md flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" /> Registration Successful!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* -------------------- LEFT COLUMN -------------------- */}
            <div className="space-y-6">
              {/* 1. Core Details - ALWAYS VISIBLE */}
              {isSectionVisible("Core") && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-md p-4">
                  <div className="flex items-center space-x-3 select-none mb-4">
                    <div className="p-1.5 rounded-lg bg-[#e0f7fa]">
                      <UserCog className="w-5 h-5 text-[#012e58]" />
                    </div>
                    <h2 className="text-lg font-bold text-[#0B2D4D]">
                      Core Patient Details
                    </h2>
                  </div>
                  <div className="mt-4 pl-1">
                    <CorePatientDetails
                      formData={formData}
                      handleChange={handleChange}
                      handleDOBChange={handleDOBChange}
                      handleDoctorSelect={handleDoctorSelect}
                      doctorOptions={mockDoctorOptions}
                      salutationOptions={salutationOptions}
                      genderOptions={genderOptions}
                      registrationTypeOptions={registrationTypeOptions}
                      isSubmitting={isAnyActionInProgress}
                      doctorError={doctorError}
                      onCheckMobile={handleCheckPatient}
                      isChecking={actionStatus === "checking"}
                      visibleFields={visibleFields}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* -------------------- RIGHT COLUMN -------------------- */}
            <div className="space-y-6">
              {/* 🚨 REQT 1: CONSULTATION PACKAGE SECTION (MOVED HERE TO ENSURE RIGHT COLUMN IS NEVER EMPTY) */}
              <ConsultationPackagesSection
                packages={packages}
                value={formData.consultationPackage}
                onChange={(name) =>
                  setFormData({ ...formData, consultationPackage: name })
                }
                disabled={isAnyActionInProgress}
                onAddClick={() => {
                  setEditingPackage(null);
                  setShowAddPackageModal(true);
                }}
                onEditClick={(pkg) => {
                  setEditingPackage(pkg);
                  setShowAddPackageModal(true);
                }}
                onRemoveClick={handleRemovePackage}
              />

              {(showAddPackageModal || editingPackage) && (
                <ManagePackageForm
                  packageToEdit={editingPackage}
                  onSave={handleManagePackage}
                  onClose={() => {
                    setShowAddPackageModal(false);
                    setEditingPackage(null);
                  }}
                  disabled={isAnyActionInProgress}
                />
              )}

              {/* 2. Address Details - CONDITIONAL VISIBILITY */}
              {isSectionVisible("Address") && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-md p-4">
                  <div className="flex items-center space-x-3 select-none mb-4">
                    <div className="p-1.5 rounded-lg bg-[#e0f7fa]">
                      <MapPin className="w-5 h-5 text-[#012e58]" />
                    </div>
                    <h2 className="text-lg font-bold text-[#0B2D4D]">
                      Address Details
                    </h2>
                  </div>
                  <div className="mt-4 pl-1 space-y-3">
                    {isFieldVisible("addressLine1") && (
                      <StyledInput
                        name="addressLine1"
                        value={formData.addressLine1}
                        onChange={handleChange}
                        placeholder="Address Line 1"
                      />
                    )}
                    {isFieldVisible("area") && (
                      <StyledInput
                        name="area"
                        value={formData.area}
                        onChange={handleChange}
                        placeholder="Area"
                      />
                    )}
                    {isFieldVisible("district_pinCode") && (
                      <div className="grid grid-cols-2 gap-3">
                        <StyledInput
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          placeholder="District"
                        />
                        <StyledInput
                          name="pinCode"
                          value={formData.pinCode}
                          onChange={handleChange}
                          placeholder="PIN"
                        />
                      </div>
                    )}
                    {isFieldVisible("state") && (
                      <StyledInput
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="State"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* 3. Additional Info - CONDITIONAL VISIBILITY */}
              {isSectionVisible("Additional") && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-md p-4">
                  <div className="flex items-center space-x-3 select-none mb-4">
                    <div className="p-1.5 rounded-lg bg-[#e0f7fa]">
                      <HeartPulse className="w-5 h-5 text-[#012e58]" />
                    </div>
                    <h2 className="text-lg font-bold text-[#0B2D4D]">
                      Additional Info
                    </h2>
                  </div>
                  <div className="mt-4 pl-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {isFieldVisible("alternateMobile") && (
                        <StyledInput
                          name="alternateMobile"
                          value={formData.alternateMobile}
                          onChange={handleChange}
                          placeholder="Alt Mobile"
                        />
                      )}
                      {isFieldVisible("email") && (
                        <StyledInput
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Email"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {isFieldVisible("abhaId") && (
                        <StyledInput
                          name="abhaId"
                          value={formData.abhaId}
                          onChange={handleChange}
                          placeholder="ABHA ID"
                        />
                      )}
                      {isFieldVisible("bloodGroup") && (
                        <StyledInput
                          name="bloodGroup"
                          isSelect
                          value={formData.bloodGroup}
                          onChange={handleChange}
                          placeholder="Blood Group"
                        >
                          <option value="">Select</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </StyledInput>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {isFieldVisible("occupation") && (
                        <StyledInput
                          name="occupation"
                          value={formData.occupation}
                          onChange={handleChange}
                          placeholder="Occupation"
                        />
                      )}
                      {isFieldVisible("maritalStatus") && (
                        <StyledInput
                          name="maritalStatus"
                          isSelect
                          value={formData.maritalStatus}
                          onChange={handleChange}
                          placeholder="Marital Status"
                        >
                          <option value="">Select</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </StyledInput>
                      )}
                    </div>

                    {isFieldVisible("preferredLanguage") && (
                      <StyledInput
                        name="preferredLanguage"
                        isSelect
                        value={formData.preferredLanguage}
                        onChange={handleChange}
                        placeholder="Preferred Language"
                      >
                        <option value="">Select</option>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Tamil">Tamil</option>
                      </StyledInput>
                    )}

                    {/* --- Permanent Fields Section --- */}
                    {permanentFields.length > 0 &&
                      isFieldVisible("custom_fields_section") && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                          <h4 className="text-md font-semibold text-[#0B2D4D] uppercase tracking-wider">
                            Permanent Custom Fields
                          </h4>
                          {permanentFields.map((field) => {
                            const fieldDefinition = availableCustomLabels.find(
                              (f) => f.label === field.label
                            );

                            return (
                              <div key={field.label} className="relative">
                                <StyledInput
                                  name={`custom_${field.label}`}
                                  value={field.value}
                                  onChange={(e: any) =>
                                    handlePermanentFieldChange(
                                      field.label,
                                      e.target.value
                                    )
                                  }
                                  placeholder={
                                    fieldDefinition?.placeholder || field.label
                                  }
                                  label={field.label}
                                  isRequired={false}
                                  className="pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemovePermanentField(field.label)
                                  }
                                  className="absolute right-2 top-0 transform p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 transition-colors z-10"
                                  style={{
                                    top: "15px",
                                  }}
                                  title={`Remove permanent field: ${field.label}`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                    {/* --- Temporary/New Custom Fields Section Toggle --- */}
                    {isFieldVisible("custom_fields_section") && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => setShowMoreFields(!showMoreFields)}
                          className="flex items-center text-md font-medium text-[#1a4b7a]"
                        >
                          <ListPlus className="w-3 h-3 mr-1" />{" "}
                          {showMoreFields
                            ? "Hide Temporary/New Custom Fields"
                            : "Add Temporary or New Permanent Field"}{" "}
                          <ChevronDown
                            className={`w-3 h-3 ml-1 transition ${
                              showMoreFields ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {showMoreFields && (
                          <div className="mt-3 space-y-3 animate-fade-in">
                            {/* Quick Add from available labels */}
                            {availableCustomLabels.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-2 border border-gray-100 rounded-md bg-gray-50">
                                <span className="text-sm font-semibold text-gray-500 mr-1">
                                  Quick Add Label:
                                </span>
                                {availableCustomLabels.map((field, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() =>
                                      selectAvailableCustomLabel(field.label)
                                    }
                                    className="px-2 py-0.5 text-sm bg-blue-50 text-blue-800 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
                                  >
                                    {field.label}
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Label (e.g. Height)"
                                className="w-1/3 px-2 py-1 border rounded text-md"
                                value={newCustomField.label}
                                onChange={(e) =>
                                  setNewCustomField({
                                    ...newCustomField,
                                    label: e.target.value,
                                    placeholder: newCustomField.placeholder,
                                  })
                                }
                              />
                              <input
                                type="text"
                                placeholder="Value (e.g. 170cm)"
                                className="w-1/3 px-2 py-1 border rounded text-md"
                                value={newCustomField.value}
                                onChange={(e) =>
                                  setNewCustomField({
                                    ...newCustomField,
                                    value: e.target.value,
                                  })
                                }
                              />
                              <button
                                type="button"
                                onClick={addOneTimeCustomField}
                                disabled={
                                  !newCustomField.label || !newCustomField.value
                                }
                                className="p-1 bg-[#012e58] text-white rounded"
                                title="Add to Patient Record (One-time)"
                              >
                                <Plus className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={handleAddPermanentField}
                                disabled={
                                  !newCustomField.label ||
                                  !newCustomField.value ||
                                  permanentFields.some(
                                    (f) => f.label === newCustomField.label
                                  )
                                }
                                className="px-2 py-1 text-md bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                title="Add and make this field permanent for future registrations"
                              >
                                Make Permanent
                              </button>
                            </div>
                            <div className="space-y-1">
                              {/* Display temporary/one-time fields */}
                              {oneTimeCustomFields.map((field, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center bg-gray-50 p-2 rounded text-md"
                                >
                                  <span>
                                    <span className="font-bold">
                                      {field.label}:
                                    </span>{" "}
                                    {field.value}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeOneTimeCustomField(idx)
                                    }
                                    className="text-red-500"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-4 mt-8 pt-4 border-t bg-white sticky bottom-0 p-4 z-10">
            <button
              type="button"
              onClick={clearForm}
              disabled={isAnyActionInProgress}
              className="px-5 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isAnyActionInProgress}
              className="px-5 py-2 border border-[#012e58] text-[#012e58] rounded-lg hover:bg-blue-50 font-medium disabled:opacity-50 flex items-center"
            >
              {actionStatus === "drafting" ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" /> Saving to
                  Draft...
                </>
              ) : (
                "Save as Draft"
              )}
            </button>

            <button
              type="submit"
              disabled={isAnyActionInProgress}
              className="px-6 py-2 bg-[#012e58] text-white rounded-lg hover:bg-[#1a4b7a] flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionStatus === "registering" ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Registering...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Register
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* --- Modals --- */}
      <RegistrationSettingmdodal
        isOpen={isSettingmdodalOpen}
        onClose={() => setIsSettingmdodalOpen(false)}
        visibleFields={visibleFields}
        onSaveConfig={handleSaveConfig}
      />

      <Popup
        isOpen={popupState.isOpen}
        onClose={closePopup}
        title={popupState.title}
        message={popupState.message}
        type={popupState.type}
        onConfirm={popupState.onConfirm}
        confirmLabel={popupState.confirmLabel}
      />
    </div>
  );
};
