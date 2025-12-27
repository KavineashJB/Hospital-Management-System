// src/components/queue/IPDQueue.tsx (New File)

import React, { useEffect, useState } from "react";
import {
  Users,
  Bed,
  Clock,
  Phone,
  Tag,
  Filter,
  Loader,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";

// NOTE: Assuming the Patient interface is imported from "../../types"
interface Patient {
  id: string;
  uhid: string;
  fullName: string;
  patientType: "OPD" | "IPD" | "Emergency";
  status: string;
  // Add other required fields...
}

const PatientCard: React.FC<{ patient: Patient }> = ({ patient }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-center">
      <div>
        <h3 className="font-semibold text-lg text-[#0B2D4D]">
          {patient.fullName}
        </h3>
        <p className="text-lg text-gray-500">
          Room: N/A | Ward: N/A (Data needs to be fetched from IPD record)
        </p>
      </div>
      <span className="px-3 py-1 text-md font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
        Admitted
      </span>
    </div>
    {/* You can add a detailed accordion here similar to PatientQueue.tsx */}
  </div>
);

const IPDQueue: React.FC = () => {
  const [ipdPatients, setIpdPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch patients filtered by patientType: 'IPD'
  useEffect(() => {
    const ipdQuery = query(
      collection(db, "patients"),
      // Filter only patients marked as In-Patient
      where("patientType", "==", "IPD"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(ipdQuery, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Patient)
      );
      setIpdPatients(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6 bg-[#F8F9FA] min-h-screen">
      <div className="flex items-center space-x-3 mb-6 border-b pb-4">
        <Bed className="w-8 h-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-[#0B2D4D]">
            In-Patient (IPD) Queue
          </h1>
          <p className="text-gray-500">
            Tracking all currently admitted patients. Total:{" "}
            {ipdPatients.length}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader className="w-8 h-8 text-[#012e58] animate-spin" />
          <span className="ml-3 text-lg text-gray-600">
            Loading In-Patients...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {ipdPatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
          {ipdPatients.length === 0 && (
            <div className="text-center p-10 text-gray-500 border border-dashed rounded-lg">
              No patients are currently admitted (IPD).
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IPDQueue;
