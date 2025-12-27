import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import {
  FlaskConical, // Lab icon
  Clock,
  Phone,
  UserCheck, // Icon for doctor assigned
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ArrowLeft,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
// Assuming Patient interface is imported from src/types/index.ts (which is implicitly available)
interface Patient {
  id: string;
  fullName: string;
  contactNumber: string;
}

// --- Type Definitions for Lab Request Data ---

interface LabRequest {
  id: string;
  patId: string;
  tests: string[];
  assignDoctorId: string;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  requestedAt: Date;
}

interface LabQueueItem extends LabRequest {
  fullName: string;
  contactNumber: string;
}

// --- Utility Functions ---

const getStatusColor = (status: LabRequest["status"]) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "In Progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "Cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// --- LabTestQueue Component ---

const LabTestQueue: React.FC = () => {
  const [queueItems, setQueueItems] = useState<LabQueueItem[]>([]);
  const [rawRequests, setRawRequests] = useState<LabRequest[]>([]);
  const [allPatients, setAllPatients] = useState<{ [key: string]: Patient }>(
    {} as { [key: string]: Patient }
  );
  // 泙 STATE: Map Doctor ID (UID/StaffID) to Name
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({});

  const [openRequestId, setOpenRequestId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailsToView, setDetailsToView] = useState<{
    patientName: string;
    tests: string[];
    assignDoctor: string;
    requestId: string;
    contactNumber: string;
  } | null>(null);

  // 1. Fetch all Doctor Names (UID -> doc_name)
  useEffect(() => {
    const doctorsQuery = query(collection(db, "doctors"));

    const unsubscribe = onSnapshot(
      doctorsQuery,
      (snapshot) => {
        const namesMap: Record<string, string> = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          // Assuming the document ID (which is the doctor's UID) is the key
          namesMap[doc.id] = (data.doc_name as string) || doc.id;
        });
        setDoctorNames(namesMap);
      },
      (error) => {
        console.error("Firebase Doctors query error:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Fetch all Lab Requests (Converting Timestamp to Date and defensively mapping fields)
  useEffect(() => {
    const requestsQuery = query(
      collection(db, "labRequests"),
      orderBy("requestedAt", "asc")
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const data = doc.data();
          const requestedAt =
            data.requestedAt instanceof Timestamp
              ? data.requestedAt.toDate()
              : new Date();

          return {
            id: doc.id,
            patId: (data.patId as string) || doc.id,
            tests: (data.tests as string[] | undefined) || [],
            assignDoctorId: (data.assignDoctorId as string) || "N/A",
            status: (data.status as LabRequest["status"]) || "Pending",
            requestedAt: requestedAt,
          } as LabRequest;
        });
        setRawRequests(data);
      },
      (error) => {
        console.error("Firebase Lab Requests query error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Fetch all Patient names/contacts
  useEffect(() => {
    const patientsQuery = query(collection(db, "patients"));

    const unsubscribe = onSnapshot(
      patientsQuery,
      (snapshot) => {
        const patientsMap: { [key: string]: Patient } = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          patientsMap[doc.id] = {
            id: doc.id,
            fullName: (data.fullName as string) || "Unknown Patient",
            contactNumber: (data.contactNumber as string) || "N/A",
          };
        });
        setAllPatients(patientsMap);
      },
      (error) => {
        console.error("Firebase Patients query error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // 4. Combine Requests and Patient Data (Resolving Doctor Name)
  useEffect(() => {
    const combinedData: LabQueueItem[] = rawRequests
      .map((req) => {
        const patient = allPatients[req.patId] || {
          fullName: "Unknown Patient",
          contactNumber: "N/A",
        };

        // 泙 FIX: Resolve Doctor Name using the mapped doctorNames state
        const resolvedDoctorName =
          doctorNames[req.assignDoctorId] || req.assignDoctorId;

        return {
          ...req,
          fullName: patient.fullName,
          contactNumber: patient.contactNumber,
          assignDoctorId: resolvedDoctorName, // This is now the resolved name or fallback ID
        };
      })
      .sort((a, b) => {
        return a.requestedAt.getTime() - b.requestedAt.getTime();
      });

    setQueueItems(combinedData);
  }, [rawRequests, allPatients, doctorNames]);

  // --- Handlers for Status Updates (Logic Unchanged) ---

  const handleStartTest = async (requestId: string) => {
    const requestRef = doc(db, "labRequests", requestId);
    await updateDoc(requestRef, {
      status: "In Progress",
    });
  };

  const handleCompleteTest = async (requestId: string) => {
    const requestRef = doc(db, "labRequests", requestId);
    await updateDoc(requestRef, {
      status: "Completed",
      completedBy: Cookies.get("userName"),
      completedAt: new Date(),
    });
  };

  const handleUploadClick = (e: React.MouseEvent, item: LabQueueItem) => {
    e.stopPropagation();
    const details = {
      patientName: item.fullName,
      tests: item.tests,
      assignDoctor: item.assignDoctorId,
      requestId: item.id,
      contactNumber: item.contactNumber,
    };

    setDetailsToView(details);
  };

  // --- Core UI Handlers (Logic Unchanged) ---

  const handleToggle = (id: string) => {
    setOpenRequestId(openRequestId === id ? null : id);
  };

  const handleBackToQueue = () => {
    setDetailsToView(null);
  };

  // --- Filtering Logic (Logic Unchanged) ---

  const filteredItems = queueItems.filter((item) => {
    const matchesSearch =
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.patId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      item.status.toLowerCase().replace(/\s+/g, "") ===
        statusFilter.toLowerCase().replace(/\s+/g, "") ||
      (statusFilter === "pending" && item.status === "Pending") ||
      (statusFilter === "inprogress" && item.status === "In Progress") ||
      (statusFilter === "completed" && item.status === "Completed");

    return matchesSearch && matchesStatus;
  });

  // --- Component for an individual Lab Request Card ---

  const LabRequestCard: React.FC<{
    item: LabQueueItem;
    isOpen: boolean;
    onToggle: () => void;
  }> = ({ item, isOpen, onToggle }) => {
    const isPending = item.status === "Pending";
    const isInProgress = item.status === "In Progress";

    // Heuristic: Check if the resolved name contains spaces (likely a full name) or is the fallback ID
    const isResolvedName =
      item.assignDoctorId.includes(" ") && !item.assignDoctorId.includes("_");
    const displayDoctorName = isResolvedName
      ? `Dr. ${item.assignDoctorId}`
      : item.assignDoctorId;

    return (
      <div
        className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer ${
          isOpen ? "ring-2 ring-[#7095b9]" : "border-gray-200"
        }`}
        onClick={onToggle}
      >
        <div className="flex justify-between gap-6 text-sm items-center">
          {/* Patient Info (Col 1 - Flexible Width) */}
          <div className="flex items-center space-x-3 w-2/5">
            <div className="w-10 h-10 bg-[#fce4ec] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[#a1005a] font-medium text-base">
                {item.fullName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div className="flex flex-col justify-center truncate">
              <h3 className="font-semibold text-[#0B2D4D] text-sm truncate">
                {item.fullName}
              </h3>
              <p className="text-xs text-[#1a4b7a] truncate">
                Patient ID: {item.patId}
              </p>
            </div>
          </div>

          {/* 泙 ALIGNED: Request Time (Col 2 - Fixed Width) */}
          <div className="flex flex-col min-w-[120px] items-start">
            <span className="text-xs font-medium text-gray-500">
              Request Time
            </span>
            <div className="flex items-center space-x-1 mt-0.5">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-sm text-[#1a4b7a] font-medium">
                {item.requestedAt.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* 泙 ALIGNED: Ordering Doctor (Col 3 - Fixed Width) */}
          <div className="flex flex-col min-w-[150px] items-start">
            <span className="text-xs font-medium text-gray-500">
              Ordering Doctor
            </span>
            <div className="flex items-center space-x-1 mt-0.5">
              <UserCheck className="w-3 h-3 text-gray-400" />
              <span className="text-sm text-[#1a4b7a] font-medium">
                {/* 泙 Displaying the correctly resolved name/alias */}
                {displayDoctorName}
              </span>
            </div>
          </div>

          {/* Status (Col 4 - Fixed Width) */}
          <div className="min-w-[80px] text-right">
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                item.status
              )}`}
            >
              {item.status || "Pending"}
            </span>
          </div>

          {/* Collapse Icon (Col 5 - Fixed Width) */}
          <div className="flex items-center justify-end w-10">
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>

        {/* --- Expanded Details --- */}
        <div
          className={`grid grid-cols-1 gap-4 text-sm overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen
              ? "max-h-96 opacity-100 pt-4 mt-3 border-t border-gray-200"
              : "max-h-0 opacity-0"
          }`}
        >
          {/* Requested Tests List */}
          <div className="col-span-1">
            <span className="font-medium text-[#0B2D4D]">Requested Tests:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {/* This is now safe because item.tests is guaranteed to be an array */}
              {item.tests.map((test, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full border border-purple-300"
                >
                  {test}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons & Contact */}
          <div className="col-span-1 flex gap-3 pt-2 border-t border-gray-100">
            {/* 泙 UPLOAD TEST BUTTON */}
            <button
              onClick={(e) => handleUploadClick(e, item)}
              className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
            >
              Upload Test Results
            </button>

            {/* START BUTTON (Visible only when Pending) */}
            {isPending && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartTest(item.id);
                }}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Start Processing
              </button>
            )}

            {/* Secondary Action: Mark as Completed (Only visible if In Progress) */}
            {isInProgress && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCompleteTest(item.id);
                }}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                Mark as Completed
              </button>
            )}

            {/* Contact Info (Always visible for context) */}
            <div className="flex items-center space-x-2 text-gray-500 ml-auto">
              <Phone className="w-4 h-4" />
              <span className="text-sm">{item.contactNumber}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PatientTestDetails: React.FC<{
    details: typeof detailsToView;
    onBack: () => void;
  }> = ({ details, onBack }) => {
    if (!details) return null;
    const [results, setResults] = useState<{ [key: string]: string }>({});

    const handleResultChange = (testName: string, value: string) => {
      setResults((prev) => ({
        ...prev,
        [testName]: value,
      }));
    };

    const handleSaveResults = () => {
      console.log("Final Results to Save:", {
        requestId: details.requestId,
        patientName: details.patientName,
        results: results,
      });
      alert(
        `Results saved locally for ${details.patientName}. Ready to send to server!`
      );
    };

    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200 min-h-screen">
        <button
          onClick={onBack}
          className="mb-6 flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 text-[#0B2D4D] rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> <span>Back to Lab Queue</span>
        </button>

        <h1 className="text-3xl font-bold text-[#0B2D4D] mb-4">
          Upload Results for {details.patientName}
        </h1>

        <p className="text-[#1a4b7a] mb-8">Request ID: {details.requestId}</p>

        <div className="space-y-6">
          {/* Patient Context Block */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg bg-indigo-50/50">
              <p className="text-xs text-gray-600">Patient</p>
              <h2 className="text-xl font-semibold text-indigo-900">
                {details.patientName}
              </h2>
            </div>

            <div className="p-3 border rounded-lg bg-yellow-50/50">
              <p className="text-xs text-gray-600">Ordering Doctor</p>
              <h2 className="text-xl font-semibold text-yellow-900">
                Dr. {details.assignDoctor}
              </h2>
            </div>

            <div className="p-3 border rounded-lg bg-gray-50/50">
              <p className="text-xs text-gray-600">Contact Number</p>
              <h2 className="text-xl font-semibold text-gray-900">
                {details.contactNumber}
              </h2>
            </div>
          </div>

          {/* 泙 ITERATE AND CREATE SEPARATE UPLOAD SECTIONS PER TEST */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#0B2D4D] border-b pb-2">
              Test Result Entry
            </h2>

            {details.tests.map((test, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg bg-white shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full border border-green-300">
                    {test}
                  </span>

                  <span className="text-xs text-gray-500">
                    Test {index + 1} of {details.tests.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Placeholder for Result Input */}
                  <label className="block text-sm font-medium text-gray-700">
                    Numeric Result / Finding:
                  </label>

                  <input
                    type="text"
                    placeholder={`Enter result for ${test}`}
                    value={results[test] || ""}
                    onChange={(e) => handleResultChange(test, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  />

                  {/* Optional: File Upload Placeholder */}
                  <label className="block text-sm font-medium text-gray-700 pt-2">
                    Upload Report (PDF/Image):
                  </label>

                  <div className="p-3 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-500 text-sm">
                    [File Upload Component]
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Final Save Button */}
          <div className="pt-4 border-t">
            <button
              onClick={handleSaveResults}
              className="w-full px-4 py-2 text-lg font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Save All Results & Complete Order
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-[#F8F9FA] min-h-screen">
      {detailsToView && (
        <PatientTestDetails
          details={detailsToView}
          onBack={handleBackToQueue}
        />
      )}
      {!detailsToView && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FlaskConical className="w-8 h-8 text-[#012e58]" />
              <div>
                <h1 className="text-3xl font-bold text-[#0B2D4D]">Lab Queue</h1>
                <p className="text-[#1a4b7a]">
                  Manage incoming lab test requests and track processing status.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Patient Name/ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="inprogress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              {filteredItems.length === 0 ? (
                <p className="text-gray-500 text-center py-10 bg-white rounded-xl border border-gray-200">
                  No lab requests match the current filters.
                </p>
              ) : (
                filteredItems.map((item) => (
                  <LabRequestCard
                    key={item.id}
                    item={item}
                    isOpen={openRequestId === item.id}
                    onToggle={() => handleToggle(item.id)}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LabTestQueue;
