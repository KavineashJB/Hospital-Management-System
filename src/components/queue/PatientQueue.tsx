import Cookies from "js-cookie";
import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  Clock,
  Phone,
  Tag,
  Car as IdCard,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Loader,
  ChevronUp as ChevronUpIcon,
  ChevronDown as ChevronDownIcon,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ClipboardList,
  FileText,
  Brain,
  X,
  Trash2, // ✅ NEW: Import Trash icon
} from "lucide-react";
import {
  collection,
  onSnapshot,
  query,
  doc,
  setDoc,
  deleteDoc, // ✅ NEW: Import deleteDoc
  orderBy,
  Timestamp,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "../../firebase";
import { PreOPDIntake } from "../vitals/PreOPDIntake";
import { DoctorModule } from "../doctor/DoctorModule";
import { Patient } from "../../types";

// --- Date & Time Helper Functions (UNCHANGED) ---

const getStartOfDay = (date: Date | string): number => {
  const d = new Date(date);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

const isDateInFilter = (
  createdAt: Timestamp,
  filter: TimeFilter,
  specificDate: string,
  dateRange: { start: string; end: string },
  monthYear: string
): boolean => {
  const date = createdAt.toDate();
  const now = new Date();

  const today = getStartOfDay(now);

  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStart = yesterday.getTime();

  const dateToCompare = getStartOfDay(date);

  switch (filter) {
    case "today":
      return dateToCompare === today;
    case "yesterday":
      return dateToCompare === yesterdayStart;
    case "week":
      const last7Days = new Date(today);
      last7Days.setUTCDate(last7Days.getUTCDate() - 6);
      return dateToCompare >= last7Days.getTime();
    case "month":
      const last30Days = new Date(today);
      last30Days.setUTCDate(last30Days.getUTCDate() - 29);
      return dateToCompare >= last30Days.getTime();
    case "specific":
      if (!specificDate) return true;
      return dateToCompare === getStartOfDay(specificDate);
    case "range":
      if (!dateRange.start || !dateRange.end) return true;
      const rangeStart = getStartOfDay(dateRange.start);
      const rangeEnd = getStartOfDay(dateRange.end);
      return dateToCompare >= rangeStart && dateToCompare <= rangeEnd;
    case "monthYear":
      if (!monthYear) return true;
      const [year, month] = monthYear.split("-").map(Number);
      return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1;
    case "all":
    default:
      return true;
  }
};

const formatTimeAdded = (createdAt: Timestamp): string => {
  const date = createdAt.toDate();
  const now = new Date();

  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateToCompare = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (dateToCompare.getTime() === today.getTime()) {
    return `Today, ${time}`;
  }
  if (dateToCompare.getTime() === yesterday.getTime()) {
    return `Yesterday, ${time}`;
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeName = (name: string | undefined | null) => {
  if (!name) return "";
  return name
    .replace(/^(Dr\.\s*|dr\.\s*)/i, "")
    .trim()
    .toLowerCase();
};

const getStatusColor = (status: Patient["status"]) => {
  switch (status) {
    case "Waiting":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "In Progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Completed":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const StatusCard: React.FC<{
  label: string;
  count: number;
  colorClass: string;
}> = ({ label, count, colorClass }) => (
  <div
    className={`p-3 rounded-lg shadow-sm w-full md:w-auto md:min-w-[120px] ${colorClass}`}
  >
    <p className="text-md font-medium text-gray-700 truncate">{label}</p>
    <p className="text-2xl font-bold mt-0.5">{count}</p>
  </div>
);

type SearchField = "patientName" | "doctorName" | "token" | "phone" | "uhid";
type TimeFilter =
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "specific"
  | "range"
  | "monthYear"
  | "all";

const getPlaceholderText = (field: SearchField) => {
  switch (field) {
    case "patientName":
      return "Search by patient name...";
    case "doctorName":
      return "Search by doctor name...";
    case "token":
      return "Search by token (e.g., T001)...";
    case "phone":
      return "Search by phone number...";
    case "uhid":
      return "Search by UHID...";
    default:
      return "Search...";
  }
};

const PATIENTS_PER_PAGE = 10;

const PaginationControls: React.FC<{
  currentPage: number;
  totalPatients: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPatients, onPageChange }) => {
  const totalPages = Math.ceil(totalPatients / PATIENTS_PER_PAGE);
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * PATIENTS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * PATIENTS_PER_PAGE, totalPatients);

  const getPaginationItems = () => {
    const pageItems: (number | string)[] = [];
    const siblingCount = 1;
    const totalPageNumbers = 7;

    if (totalPages <= totalPageNumbers) {
      for (let i = 1; i <= totalPages; i++) {
        pageItems.push(i);
      }
    } else {
      const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
      const rightSiblingIndex = Math.min(
        currentPage + siblingCount,
        totalPages
      );

      const shouldShowLeftDots = leftSiblingIndex > 2;
      const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

      if (leftSiblingIndex !== 1) pageItems.push(1);

      if (shouldShowLeftDots) {
        pageItems.push("...");
      }

      const start = shouldShowLeftDots ? leftSiblingIndex : 2;
      const end = shouldShowRightDots ? rightSiblingIndex : totalPages - 1;

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) pageItems.push(i);
      }

      if (shouldShowRightDots) {
        pageItems.push("...");
      }

      if (rightSiblingIndex !== totalPages) pageItems.push(totalPages);
    }
    return [...new Set(pageItems)];
  };

  const pageItems = getPaginationItems();

  return (
    <div className="flex items-center justify-between mt-6">
      <span className="text-sm text-gray-600">
        Showing {startItem} to {endItem} of {totalPatients} patients
      </span>
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageItems.map((item, index) =>
          typeof item === "number" ? (
            <button
              key={index}
              onClick={() => onPageChange(item)}
              disabled={currentPage === item}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                currentPage === item
                  ? "bg-[#012e58] text-white"
                  : "bg-white border hover:bg-gray-50"
              }`}
            >
              {item}
            </button>
          ) : (
            <span key={index} className="px-3 py-1.5 text-sm text-gray-500">
              ...
            </span>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const FormattedAiSummary: React.FC<{ summary: string }> = ({ summary }) => {
  const lines = summary.split("\n").filter((line) => line.trim() !== "");
  return (
    <div className="space-y-3 text-[#1a4b7a]">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return (
            <h3 key={index} className="text-base font-bold text-[#0B2D4D] pt-1">
              {trimmed.slice(2, -2)}
            </h3>
          );
        }
        if (trimmed.startsWith("# ") || trimmed.startsWith("## ")) {
          return (
            <h3 key={index} className="text-base font-bold text-[#0B2D4D] pt-1">
              {trimmed.replace(/^#+\s*/, "")}
            </h3>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <ul key={index} className="list-disc list-inside pl-4">
              <li>{trimmed.slice(2)}</li>
            </ul>
          );
        }
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
        return (
          <p key={index} className="text-lg text-gray-800">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
};

interface PreviousVisitSummaryModalProps {
  patient: Patient;
  onClose: () => void;
}

const PreviousVisitSummaryModal: React.FC<PreviousVisitSummaryModalProps> = ({
  patient,
  onClose,
}) => {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!patient.uhid) {
        setSummary(
          "Patient UHID is missing. Cannot fetch previous visit data."
        );
        setIsLoading(false);
        return;
      }

      try {
        const intakeQuery = query(
          collection(db, "preOPDIntake"),
          where("patientUhid", "==", patient.uhid)
        );

        const querySnapshot = await getDocs(intakeQuery);

        if (!querySnapshot.empty) {
          const docs = querySnapshot.docs
            .map((d) => d.data() as any)
            .map((d) => ({
              ...d,
              recordedAt:
                d.recordedAt?.toDate?.() ??
                (typeof d.recordedAt === "string"
                  ? new Date(d.recordedAt)
                  : new Date(0)),
            }))
            .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());

          const latest = docs[0];

          setSummary(
            latest?.aiClinicalSummary ||
              "AI Clinical Summary was not generated for this visit."
          );
        } else {
          setSummary(
            "No previous Pre-OPD Intake record found for this patient."
          );
        }
      } catch (error) {
        console.error("Error fetching previous visit summary:", error);
        setSummary("An error occurred while fetching the visit summary.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [patient.uhid]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-[#F8F9FA] rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <ClipboardList className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-[#0B2D4D]">
              Latest Clinical Summary
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
          <p className="text-lg text-[#1a4b7a] mb-4">
            Summary for <span className="font-medium">{patient.fullName}</span>{" "}
            (UHID: {patient.uhid})
          </p>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
              <Loader className="w-8 h-8 text-purple-600 animate-spin mb-3" />
              <p className="text-lg font-semibold text-[#0B2D4D]">
                Fetching Previous Visit Data...
              </p>
            </div>
          ) : (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <FormattedAiSummary summary={summary} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end p-4 border-t border-gray-200 bg-[#F8F9FA] rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2 text-lg font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const PatientQueue: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [paginatedPatients, setPaginatedPatients] = useState<Patient[]>([]);
  const [filteredAndSortedPatients, setFilteredAndSortedPatients] = useState<
    Patient[]
  >([]);
  const [openPatientId, setOpenPatientId] = useState<string | null>(null);
  const [showVitals, setShowVitals] = useState(false);
  const [vitalsPatient, setVitalsPatient] = useState<Patient | null>(null);
  const [showDoctor, setShowDoctor] = useState(false);
  const [doctorPatient, setDoctorPatient] = useState<Patient | null>(null);

  const [selectedPatientForSummary, setSelectedPatientForSummary] =
    useState<Patient | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isSearching, setIsSearching] = useState(false);
  const [searchBy, setSearchBy] = useState<SearchField>("patientName");
  const [currentPage, setCurrentPage] = useState(1);

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [specificDate, setSpecificDate] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [monthYear, setMonthYear] = useState("");

  const name = Cookies.get("userName");
  const storedRole = Cookies.get("userRole");
  const currentUserRole =
    storedRole === "doctor"
      ? "Doctor"
      : storedRole === "staff-nurse"
      ? "Nurse"
      : storedRole === "receptionist"
      ? "Receptionist"
      : storedRole === "admin"
      ? "Admin"
      : "";

  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    return debouncedValue;
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // 1. Fetch Patients from Firestore
  useEffect(() => {
    const patientsQuery = query(
      collection(db, "patients"),
      orderBy("createdAt", "desc")
    );

    const normalizedDoctorName = normalizeName(name);

    const unsubscribe = onSnapshot(
      patientsQuery,
      (snapshot) => {
        let data = snapshot.docs.map(
          (doc, index) =>
            ({
              id: doc.id,
              ...doc.data(),
              token: `T${String(index + 1).padStart(3, "0")}`,
            } as Patient)
        );

        data = data.filter((patient) => patient.status !== "Draft");

        if (storedRole === "doctor" && name) {
          data = data.filter(
            (patient) =>
              normalizeName(patient.doctorAssigned) === normalizedDoctorName
          );
        }
        setPatients(data);
      },
      (error) => {
        console.error("Firebase query error:", error);
      }
    );

    return () => unsubscribe();
  }, [storedRole, name]);

  // 2. Client-Side Filtering
  useEffect(() => {
    setIsSearching(true);
    const term = debouncedSearchTerm.toLowerCase();

    const results = patients.filter((patient) => {
      if (!patient.createdAt || !(patient.createdAt instanceof Timestamp)) {
        return false;
      }
      const matchesTime = isDateInFilter(
        patient.createdAt,
        timeFilter,
        specificDate,
        dateRange,
        monthYear
      );
      if (!matchesTime) return false;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "Not Visited" && patient.status === "Waiting") ||
        (statusFilter === "Pending" && patient.status === "In Progress") ||
        (statusFilter === "Completed" && patient.status === "Completed");
      if (!matchesStatus) return false;

      let matchesSearch;
      const termForToken = term.replace("t", "");

      switch (searchBy) {
        case "patientName":
          matchesSearch = (patient.fullName ?? "").toLowerCase().includes(term);
          break;
        case "doctorName":
          matchesSearch = normalizeName(patient.doctorAssigned).includes(term);
          break;
        case "token":
          matchesSearch = (patient.token ?? "")
            .toLowerCase()
            .includes(termForToken);
          break;
        case "phone":
          matchesSearch = (patient.contactNumber ?? "")
            .toLowerCase()
            .includes(term);
          break;
        case "uhid":
          matchesSearch = (patient.uhid ?? "").toLowerCase().includes(term);
          break;
        default:
          matchesSearch = true;
      }
      return matchesSearch;
    });

    setFilteredAndSortedPatients(results);
    setCurrentPage(1);
    setIsSearching(false);
  }, [
    patients,
    debouncedSearchTerm,
    statusFilter,
    searchBy,
    timeFilter,
    specificDate,
    dateRange,
    monthYear,
  ]);

  // 3. Client-Side Pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * PATIENTS_PER_PAGE;
    const endIndex = startIndex + PATIENTS_PER_PAGE;
    setPaginatedPatients(filteredAndSortedPatients.slice(startIndex, endIndex));
  }, [currentPage, filteredAndSortedPatients]);

  // Status Counts
  const statusCounts = patients.reduce(
    (acc, patient) => {
      if (patient.status === "Completed") acc.completed++;
      else if (patient.status === "In Progress") acc.inProgress++;
      else if (patient.status === "Waiting") acc.waiting++;
      return acc;
    },
    { completed: 0, inProgress: 0, waiting: 0 }
  );

  const handleVitalsClick = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation();
    setVitalsPatient(patient);
    setShowVitals(true);
  };

  const handleDoctorClick = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation();
    if (patient.status === "Waiting") {
      const patientRef = doc(db, "patients", patient.id);
      setDoc(patientRef, { status: "In Progress" }, { merge: true }).catch(
        (error) => {
          console.error("Failed to update status with setDoc/merge:", error);
        }
      );
    }
    setDoctorPatient(patient);
    setShowDoctor(true);
  };

  const handleBackFromVitals = () => {
    setShowVitals(false);
    setVitalsPatient(null);
  };

  const handleBackFromDoctor = () => {
    setShowDoctor(false);
    setDoctorPatient(null);
  };

  const handleCompleteConsultation = async (patientId: string) => {
    const patientRef = doc(db, "patients", patientId);
    await setDoc(
      patientRef,
      {
        status: "Completed",
      },
      { merge: true }
    );
    setShowDoctor(false);
    setDoctorPatient(null);
  };

  const handlePreviousVisitClick = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!patient.uhid) {
      alert("Patient UHID is missing. Cannot fetch previous visit summary.");
      return;
    }
    setSelectedPatientForSummary(patient);
  };

  // ✅ NEW: Delete Patient Logic
  const handleDeletePatient = async (
    patientId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (
      window.confirm("Are you sure you want to delete this patient record?")
    ) {
      try {
        await deleteDoc(doc(db, "patients", patientId));
        // You might want to delete associated records (vitals, prescriptions) here too,
        // but for now we'll stick to the patient record itself.
      } catch (error) {
        console.error("Error deleting patient:", error);
        alert("Failed to delete patient.");
      }
    }
  };

  const PatientCard: React.FC<{
    patient: Patient;
    isOpen: boolean;
    onToggle: () => void;
  }> = ({ patient, isOpen, onToggle }) => (
    <div
      className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer ${
        isOpen ? "ring-2 ring-[#012e58]" : "border-gray-200"
      }`}
      onClick={onToggle}
    >
      <div className="flex justify-between gap-6 text-sm items-center">
        <div className="col-span-2 rounded-none flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#e0f7fa] rounded-full flex items-center justify-center">
            <span className="text-[#012e58] font-medium text-sm">
              {patient.fullName
                ?.split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-[#0B2D4D]">{patient.fullName}</h3>
            <p className="text-md text-[#1a4b7a]">
              Token: {patient.token} • ID: {patient.uhid || "N/A"}
            </p>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-md font-medium text-gray-500">Doctor</span>
          <span className="text-sm text-[#1a4b7a] font-medium">
            Dr. {patient.doctorAssigned || "Not Assigned"}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-md font-medium text-gray-500">Time Added</span>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-[#1a4b7a] font-medium">
              {patient.createdAt ? formatTimeAdded(patient.createdAt) : "N/A"}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-2">
          <span
            className={`px-2 py-1 text-md font-medium rounded-full border ${getStatusColor(
              patient.status
            )}`}
          >
            {patient.status || "Waiting"}
          </span>
        </div>

        {/* ✅ NEW: Admin Delete Button */}
        {storedRole === "admin" && (
          <button
            onClick={(e) => handleDeletePatient(patient.id, e)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Delete Patient"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center space-x-5">
          {isOpen ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </div>
      <div
        className={`grid grid-cols-3 justify-a gap-4 text-sm overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen
            ? "max-h-96 opacity-100 pt-4 mt-3 border-t border-gray-200"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="text-[#1a4b7a]">{patient.contactNumber}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-gray-400" />
          <span className="text-[#1a4b7a]">{patient.visitType}</span>
        </div>
        <div className="flex items-center space-x-2">
          <IdCard className="w-4 h-4 text-gray-400" />
          <span
            className={`text-md px-2 py-1 rounded ${
              patient.abhaId
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {patient.abhaId ? "ABHA Linked" : "No ABHA"}
          </span>
        </div>
        <div
          className={`flex gap-2 transition-all duration-300 ease-in-out ${
            isOpen ? "mt-3 pt-3 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {patient.status === "Completed" && (
            <button
              onClick={(e) => handlePreviousVisitClick(patient, e)}
              className="flex-1 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
            >
              <div className="flex items-center justify-center space-x-1">
                <Brain className="w-4 h-4" />
                <span>Previous Visit</span>
              </div>
            </button>
          )}

          {(currentUserRole === "Nurse" ||
            currentUserRole === "Receptionist" ||
            currentUserRole === "Admin") && ( // Allow Admin to see vitals button too if needed
            <button
              onClick={(e) => handleVitalsClick(patient, e)}
              className="flex-1 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
            >
              Vitals
            </button>
          )}
          {(currentUserRole === "Doctor" || currentUserRole === "Admin") &&
            patient.status !== "Completed" && ( // Allow Admin to start consultation
              <button
                onClick={(e) => handleDoctorClick(patient, e)}
                className="flex-1 px-3 py-1 text-sm bg-[#e0f7fa] text-[#012e58] rounded-lg hover:bg-[#b3e5fc]"
              >
                {patient.status === "Waiting" ? "Start Consultation" : "Resume"}
              </button>
            )}
        </div>
      </div>
    </div>
  );

  if (showVitals) {
    return (
      <PreOPDIntake
        selectedPatient={vitalsPatient}
        onBack={handleBackFromVitals}
      />
    );
  }

  if (showDoctor) {
    return (
      <DoctorModule
        selectedPatient={doctorPatient}
        onBack={handleBackFromDoctor}
        onCompleteConsultation={handleCompleteConsultation}
      />
    );
  }

  return (
    <div className="p-6 bg-[#F8F9FA] min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-6">
        <div className="flex flex-col space-y-4 w-full lg:w-auto">
          <div className="flex items-center space-x-3 mt-4">
            <Users className="w-8 h-8 text-[#012e58]" />
            <div>
              <h1 className="text-3xl font-bold text-[#0B2D4D]">OPD Queue</h1>
              <p className="text-[#1a4b7a]">
                Manage patient queue and appointments
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <StatusCard
              label="Waiting"
              count={statusCounts.waiting}
              colorClass="bg-yellow-50 border border-yellow-200"
            />
            <StatusCard
              label="In Progress"
              count={statusCounts.inProgress}
              colorClass="bg-blue-50 border border-blue-200"
            />
            <StatusCard
              label="Completed"
              count={statusCounts.completed}
              colorClass="bg-green-50 border border-green-200"
            />
          </div>
        </div>

        <div className="flex flex-col mt-4 lg:mt-0 md:flex-row items-stretch md:items-center space-y-3 md:space-y-0 md:space-x-4 w-full lg:w-auto">
          <div className="flex items-center space-x-2 order-1 md:order-1">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent text-sm"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="specific">Specific Date</option>
              <option value="range">Date Range</option>
              <option value="monthYear">Month/Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 order-2 md:order-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="Not Visited">Waiting</option>
              <option value="Pending">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 order-3 md:order-3">
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value as SearchField)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent text-sm"
            >
              <option value="patientName">Patient Name</option>
              <option value="doctorName">Doctor Name</option>
              <option value="token">Token</option>
              <option value="phone">Phone</option>
              <option value="uhid">UHID</option>
            </select>

            <div className="relative w-full md:w-56">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder={getPlaceholderText(searchBy)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent w-full"
              />
              {debouncedSearchTerm.length > 0 && isSearching && (
                <Loader className="w-4 h-4 text-[#012e58] absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        {timeFilter === "specific" && (
          <div className="flex items-center space-x-2">
            <label htmlFor="specificDate" className="text-sm font-medium">
              Select Date:
            </label>
            <input
              type="date"
              id="specificDate"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}
        {timeFilter === "range" && (
          <div className="flex items-center space-x-2">
            <label htmlFor="startDate" className="text-sm font-medium">
              From:
            </label>
            <input
              type="date"
              id="startDate"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <label htmlFor="endDate" className="text-sm font-medium">
              To:
            </label>
            <input
              type="date"
              id="endDate"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}
        {timeFilter === "monthYear" && (
          <div className="flex items-center space-x-2">
            <label htmlFor="monthYear" className="text-sm font-medium">
              Select Month:
            </label>
            <input
              type="month"
              id="monthYear"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          {isSearching && paginatedPatients.length === 0 && (
            <div className="text-center p-10 text-gray-500">
              <Loader className="w-6 h-6 mx-auto animate-spin" />
              <p>Searching...</p>
            </div>
          )}

          {!isSearching && paginatedPatients.length === 0 && (
            <div className="text-center p-10 text-gray-500">
              {searchTerm.length > 0 ? (
                <span>No patients found matching "{searchTerm}".</span>
              ) : (
                <span>No patients found for the selected filters.</span>
              )}
            </div>
          )}

          {!isSearching &&
            paginatedPatients.length > 0 &&
            paginatedPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                isOpen={openPatientId === patient.id}
                onToggle={() =>
                  setOpenPatientId(
                    openPatientId === patient.id ? null : patient.id
                  )
                }
              />
            ))}
        </div>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPatients={filteredAndSortedPatients.length}
        onPageChange={setCurrentPage}
      />

      {selectedPatientForSummary && (
        <PreviousVisitSummaryModal
          patient={selectedPatientForSummary}
          onClose={() => setSelectedPatientForSummary(null)}
        />
      )}
    </div>
  );
};

export default PatientQueue;
