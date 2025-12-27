import { X, RefreshCw, CheckCircle, Printer } from "lucide-react";
import {
  PharmacyPrescription,
  PrescriptionMedication,
} from "../../types/pharmacy";

// This function can be moved here if it's only used in the modal now
const suggestSubstitute = (medicationName: string) => {
  const substitutes: { [key: string]: string[] } = {
    Paracetamol: ["Acetaminophen", "Tylenol", "Calpol"],
    Metformin: ["Glucophage", "Fortamet", "Riomet"],
    Amoxicillin: ["Augmentin", "Trimox", "Amoxil"],
    Lisinopril: ["Prinivil", "Zestril", "Qbrelis"],
  };
  return substitutes[medicationName] || ["No substitutes available"];
};

interface PrescriptionDetailModalProps {
  prescription: PharmacyPrescription;
  onClose: () => void;
  onToggleDispense: (prescriptionId: string, medicationId: string) => void;
}

export const PrescriptionDetailModal: React.FC<
  PrescriptionDetailModalProps
> = ({ prescription, onClose, onToggleDispense }) => {
  return (
    // Modal Overlay
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      {/* Modal Content */}
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-[#0B2D4D]">
              Prescription Details
            </h2>
            <p className="text-lg text-[#1a4b7a]">
              Patient:{" "}
              <span className="font-medium">{prescription.patientName}</span>{" "}
              (UHID: {prescription.uhid})
            </p>
            <p className="text-lg text-[#1a4b7a]">
              Prescribed by Dr. {prescription.doctorName} on{" "}
              {new Date(prescription.prescriptionDate).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Modal Body with Table */}
        <div className="p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-[#0B2D4D] mb-4">
            Medications to Dispense
          </h3>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-lg text-left text-[#1a4b7a]">
              <thead className="text-md text-[#0B2D4D] uppercase bg-[#F8F9FA]">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Dispense
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Medication Details
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Instructions
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Qty & Price
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Substitutes
                  </th>
                </tr>
              </thead>
              <tbody>
                {prescription.medications.map((med) => (
                  <tr
                    key={med.id}
                    className="bg-white border-b hover:bg-[#e0f7fa]"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={med.dispensed}
                        onChange={() =>
                          onToggleDispense(prescription.id, med.id)
                        }
                        className="w-5 h-5 text-[#012e58] border-gray-300 rounded focus:ring-[#1a4b7a] focus:ring-2"
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-[#0B2D4D]">
                      {med.drugName}
                      <p className="text-md text-gray-500 font-normal">
                        {med.dosage}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {med.frequency} &bull; {med.duration}
                      <p className="text-md text-[#012e58]">
                        {med.instructions}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      Qty: {med.quantity}
                      <p className="text-md text-gray-500">
                        ${med.unitPrice.toFixed(2)} each
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {!med.dispensed ? (
                        <div className="flex items-center space-x-2">
                          <button className="flex items-center space-x-1 px-2 py-1 bg-[#e0f7fa] text-[#012e58] text-md rounded-full hover:bg-[#b3e5fc]">
                            <RefreshCw className="w-3 h-3" />
                            <span>Suggest</span>
                          </button>
                          <span className="text-md text-gray-500">
                            {suggestSubstitute(med.drugName)[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-md text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-[#F8F9FA] rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-lg font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 text-lg font-medium text-white bg-[#1a4b7a] rounded-lg hover:bg-[#012e58]">
            <Printer className="w-4 h-4" />
            <span>Print Slip</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 text-lg font-medium text-white bg-[#012e58] rounded-lg hover:bg-[#1a4b7a]">
            <CheckCircle className="w-4 h-4" />
            <span>Complete Dispensing</span>
          </button>
        </div>
      </div>
    </div>
  );
};
