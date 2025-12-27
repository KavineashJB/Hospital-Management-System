// src/contexts/PrescriptionContext.tsx
import React, { createContext, useState, useContext, ReactNode } from "react";
import { Medication } from "../types";

interface PrescriptionContextType {
  medications: Medication[];
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
  addMedications: (newMedications: Omit<Medication, "id">[]) => void;
}

const PrescriptionContext = createContext<PrescriptionContextType | undefined>(
  undefined
);

export const usePrescription = () => {
  const context = useContext(PrescriptionContext);
  if (!context) {
    throw new Error(
      "usePrescription must be used within a PrescriptionProvider"
    );
  }
  return context;
};

export const PrescriptionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [medications, setMedications] = useState<Medication[]>([]);

  const addMedications = (newMedications: Omit<Medication, "id">[]) => {
    const formattedNewMeds = newMedications.map((med, index) => ({
      ...med, // This spreads 'source', 'name', etc.
      id: `${Date.now()}-${medications.length + index}`,
    }));

    setMedications((prevMeds) => [...prevMeds, ...formattedNewMeds]);
  };

  return (
    <PrescriptionContext.Provider
      value={{ medications, setMedications, addMedications }}
    >
      {children}
    </PrescriptionContext.Provider>
  );
};
