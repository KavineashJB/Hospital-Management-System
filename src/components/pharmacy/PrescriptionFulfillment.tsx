import React, { useState, useEffect } from "react";
import {
  FileText,
  User,
  CheckCircle,
  AlertCircle,
  Printer,
  Mail,
  RefreshCw,
  Search,
  Filter,
  X, // Import X for the modal
} from "lucide-react";
// REMOVED: import { mockPharmacyPrescriptions } from "../../data/pharmacyData";
import {
  PharmacyPrescription,
  PrescriptionMedication,
} from "../../types/pharmacy";

import { db } from "../../firebase"; // ADDED IMPORT
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  Timestamp,
} from "firebase/firestore";

// --- Paste the PrescriptionDetailModal component code here if not in a separate file ---
// OR
import { PrescriptionDetailModal } from "./PrescriptionDetailModal";

export const PrescriptionFulfillment: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<PharmacyPrescription[]>(
    [] // Initialized with empty array
  );
  const [selectedPrescription, setSelectedPrescription] =
    useState<PharmacyPrescription | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "partial" | "completed"
  >("all");

  // NEW: Fetch Prescriptions from Firebase
  useEffect(() => {
    // Query the 'prescriptions' collection, ordered by most recent date
    const prescriptionsQuery = query(
      collection(db, "prescriptions"),
      orderBy("prescriptionDate", "desc") // Order by newest first
    );

    const unsubscribe = onSnapshot(
      prescriptionsQuery,
      (snapshot) => {
        const fetchedPrescriptions: PharmacyPrescription[] = snapshot.docs.map(
          (doc) => {
            const data = doc.data();

            // Safely map data and convert Firestore Timestamp to string
            const date = (data.prescriptionDate as Timestamp)?.toDate();

            return {
              id: doc.id,
              patientId: data.patientId as string,
              uhid: data.uhid as string,
              patientName: data.patientName as string,
              doctorName: data.doctorName as string,
              doctorId: data.doctorId as string,

              prescriptionDate: date ? date.toISOString() : "", // Use ISO string for consistency

              medications: data.medications as PrescriptionMedication[],

              status:
                (data.status as
                  | "Pending"
                  | "Partially Dispensed"
                  | "Completed") || "Pending",
              patientType: (data.patientType as "OPD" | "IPD") || "OPD",

              consultationNotes: data.consultationNotes as string,
              finalDiagnosis: data.finalDiagnosis as string,

              // Using default mock values if not available in DB yet
              totalAmount: (data.totalAmount as number) || 0,

              dispensedBy: data.dispensedBy as string,
              dispensedAt: (data.dispensedAt as Timestamp)
                ?.toDate()
                ?.toLocaleDateString(),
            } as PharmacyPrescription;
          }
        );

        setPrescriptions(fetchedPrescriptions);
      },
      (error) => {
        console.error("Error fetching prescriptions:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    // ... filtering logic remains the same
    const matchesSearch =
      prescription.patientName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      prescription.uhid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      prescription.status.toLowerCase().replace(" ", "") ===
        statusFilter.replace("partial", "partiallydispensed");

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: PharmacyPrescription["status"]) => {
    // ... getStatusColor logic remains the same
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Partially Dispensed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const toggleMedicationDispensed = (
    prescriptionId: string,
    medicationId: string
  ) => {
    // ... toggleMedicationDispensed logic remains the same
    const updatedPrescriptions = prescriptions.map((prescription) => {
      if (prescription.id === prescriptionId) {
        const updatedMedications = prescription.medications.map((med) =>
          med.id === medicationId ? { ...med, dispensed: !med.dispensed } : med
        );

        const allDispensed = updatedMedications.every((med) => med.dispensed);
        const someDispensed = updatedMedications.some((med) => med.dispensed);

        let newStatus: PharmacyPrescription["status"] = "Pending";
        if (allDispensed) newStatus = "Completed";
        else if (someDispensed) newStatus = "Partially Dispensed";

        const updatedPrescription = {
          ...prescription,
          medications: updatedMedications,
          status: newStatus,
        };

        // If this is the currently selected prescription, update the state for the modal
        if (selectedPrescription?.id === prescriptionId) {
          setSelectedPrescription(updatedPrescription);
        }

        return updatedPrescription;
      }
      return prescription;
    });
    setPrescriptions(updatedPrescriptions);
  };

  const PrescriptionCard: React.FC<{ prescription: PharmacyPrescription }> = ({
    prescription,
  }) => (
    // ... PrescriptionCard component remains the same
    <div
      className={`bg-white rounded-lg border p-4 hover:shadow-md transition-all cursor-pointer ${
        selectedPrescription?.id === prescription.id
          ? "ring-2 ring-[#012e58]"
          : "border-gray-200"
      }`}
      onClick={() => setSelectedPrescription(prescription)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#e0f7fa] rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-[#012e58]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#0B2D4D]">
              {prescription.patientName}
            </h3>
            <p className="text-lg text-[#1a4b7a]">
              UHID: {prescription.uhid} • {prescription.patientType}
            </p>
            <p className="text-lg text-[#1a4b7a]">
              Dr. {prescription.doctorName}
            </p>
          </div>
        </div>
        <span
          className={`px-2 py-1 text-md font-medium rounded-full border ${getStatusColor(
            prescription.status
          )}`}
        >
          {prescription.status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-lg">
          <span className="text-[#1a4b7a]">
            Medications: {prescription.medications.length}
          </span>
          <span className="text-[#1a4b7a]">
            Dispensed:{" "}
            {prescription.medications.filter((med) => med.dispensed).length}
          </span>
        </div>
        <div className="flex items-center justify-between text-lg">
          <span className="text-[#1a4b7a]">
            Total Amount: ${prescription.totalAmount.toFixed(2)}
          </span>
          <span className="text-[#1a4b7a]">
            {prescription.prescriptionDate.length < 20
              ? prescription.prescriptionDate
              : new Date(prescription.prescriptionDate).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-[#F8F9FA] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header section remains the same */}
        <div className="flex items-center justify-between mb-6">
          {/* ... */}
        </div>

        {/* --- MODIFIED LAYOUT --- */}
        {/* The main content area no longer needs a grid layout for a side panel */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0B2D4D]">
                Active Prescriptions
              </h3>
              {/* Filter and Search UI remains the same */}
              <div className="flex items-center space-x-4">
                {/* ... search and filter inputs ... */}
              </div>
            </div>

            <div className="space-y-4">
              {filteredPrescriptions.map((prescription) => (
                <PrescriptionCard
                  key={prescription.id}
                  prescription={prescription}
                />
              ))}
              {filteredPrescriptions.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">
                    No prescriptions found matching your criteria.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats section at the bottom remains the same */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          {/* ... */}
        </div>
      </div>

      {/* --- RENDER THE MODAL --- */}
      {/* This will render the modal component when a prescription is selected */}
      {selectedPrescription && (
        <PrescriptionDetailModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
          onToggleDispense={toggleMedicationDispensed}
        />
      )}
    </div>
  );
};
