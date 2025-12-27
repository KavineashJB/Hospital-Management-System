export interface Drug {
  id: string;
  drugName: string;
  genericName: string;
  brandName: string;
  strength: string;
  dosageForm: "Tablet" | "Capsule" | "Syrup" | "Injection" | "Cream" | "Drops";
  expiryDate: string;
  stockQuantity: number;
  unitPrice: number;
  supplierInfo: string;
  barcode?: string;
  category: string;
  batchNumber: string;
  manufacturingDate: string;
  createdAt: string;
}

export interface PrescriptionMedication {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  // Fields included for Pharmacy tracking
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  // Existing fields
  dispensed: boolean;
  substituteUsed?: string;
}

export interface PharmacyPrescription {
  id: string;
  patientName: string;
  uhid: string;
  doctorName: string;
  doctorId: string; // NEW: Store doctor's ID
  prescriptionDate: string;
  medications: PrescriptionMedication[];
  status: "Pending" | "Partially Dispensed" | "Completed";
  patientType: "OPD" | "IPD";
  consultationNotes?: string; // NEW: Doctor's final notes
  finalDiagnosis?: string; // NEW: Doctor's final diagnosis
  totalAmount: number;
  dispensedBy?: string;
  dispensedAt?: string;
}

export interface PharmacySale {
  id: string;
  prescriptionId: string;
  patientName: string;
  uhid: string;
  medications: SoldMedication[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMethod: "Cash" | "Card" | "Insurance" | "Online";
  saleDate: string;
  dispensedBy: string;
}

export interface SoldMedication {
  drugId: string;
  drugName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PharmacyAnalytics {
  dailySales: number;
  totalRevenue: number;
  lowStockItems: number;
  expiringItems: number;
  topSellingDrugs: { name: string; quantity: number; revenue: number }[];
  salesTrend: { date: string; amount: number }[];
  stockStatus: {
    available: number;
    lowStock: number;
    outOfStock: number;
  };
  profitMargin: {
    category: string;
    margin: number;
  }[];
}
