import { Drug, PharmacyPrescription, PharmacySale, PharmacyAnalytics } from '../types/pharmacy';

export const mockDrugs: Drug[] = [
  {
    id: '1',
    drugName: 'Paracetamol',
    genericName: 'Acetaminophen',
    brandName: 'Crocin',
    strength: '500mg',
    dosageForm: 'Tablet',
    expiryDate: '2025-12-31',
    stockQuantity: 500,
    unitPrice: 2.50,
    supplierInfo: 'MedSupply Corp',
    barcode: 'BAR001',
    category: 'Analgesic',
    batchNumber: 'BATCH001',
    manufacturingDate: '2024-01-15',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    drugName: 'Metformin',
    genericName: 'Metformin HCl',
    brandName: 'Glucophage',
    strength: '500mg',
    dosageForm: 'Tablet',
    expiryDate: '2025-06-30',
    stockQuantity: 15,
    unitPrice: 3.75,
    supplierInfo: 'PharmaCorp Ltd',
    barcode: 'BAR002',
    category: 'Antidiabetic',
    batchNumber: 'BATCH002',
    manufacturingDate: '2024-02-01',
    createdAt: '2024-02-01T10:00:00Z'
  },
  {
    id: '3',
    drugName: 'Lisinopril',
    genericName: 'Lisinopril',
    brandName: 'Prinivil',
    strength: '10mg',
    dosageForm: 'Tablet',
    expiryDate: '2024-03-15',
    stockQuantity: 0,
    unitPrice: 5.25,
    supplierInfo: 'CardioMed Inc',
    barcode: 'BAR003',
    category: 'Antihypertensive',
    batchNumber: 'BATCH003',
    manufacturingDate: '2023-03-01',
    createdAt: '2023-03-01T10:00:00Z'
  },
  {
    id: '4',
    drugName: 'Amoxicillin',
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    strength: '250mg',
    dosageForm: 'Capsule',
    expiryDate: '2025-09-30',
    stockQuantity: 200,
    unitPrice: 4.50,
    supplierInfo: 'AntiBio Pharma',
    barcode: 'BAR004',
    category: 'Antibiotic',
    batchNumber: 'BATCH004',
    manufacturingDate: '2024-01-20',
    createdAt: '2024-01-20T10:00:00Z'
  },
  {
    id: '5',
    drugName: 'Omeprazole',
    genericName: 'Omeprazole',
    brandName: 'Prilosec',
    strength: '20mg',
    dosageForm: 'Capsule',
    expiryDate: '2024-02-28',
    stockQuantity: 75,
    unitPrice: 6.00,
    supplierInfo: 'GastroMed Supply',
    barcode: 'BAR005',
    category: 'Proton Pump Inhibitor',
    batchNumber: 'BATCH005',
    manufacturingDate: '2023-02-15',
    createdAt: '2023-02-15T10:00:00Z'
  }
];

export const mockPharmacyPrescriptions: PharmacyPrescription[] = [
  {
    id: 'RX001',
    patientName: 'John Doe',
    uhid: 'HMS001',
    doctorName: 'Dr. Sarah Wilson',
    prescriptionDate: '2024-01-15T10:30:00Z',
    medications: [
      {
        id: 'MED001',
        drugName: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '5 days',
        instructions: 'After meals',
        quantity: 10,
        dispensed: false,
        unitPrice: 2.50
      },
      {
        id: 'MED002',
        drugName: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '30 days',
        instructions: 'Before meals',
        quantity: 60,
        dispensed: true,
        unitPrice: 3.75
      }
    ],
    status: 'Partially Dispensed',
    patientType: 'OPD',
    totalAmount: 250.00
  },
  {
    id: 'RX002',
    patientName: 'Emily Johnson',
    uhid: 'HMS002',
    doctorName: 'Dr. Michael Chen',
    prescriptionDate: '2024-01-15T11:15:00Z',
    medications: [
      {
        id: 'MED003',
        drugName: 'Amoxicillin',
        dosage: '250mg',
        frequency: 'Thrice daily',
        duration: '7 days',
        instructions: 'After meals',
        quantity: 21,
        dispensed: false,
        unitPrice: 4.50
      }
    ],
    status: 'Pending',
    patientType: 'OPD',
    totalAmount: 94.50
  }
];

export const mockPharmacySales: PharmacySale[] = [
  {
    id: 'SALE001',
    prescriptionId: 'RX001',
    patientName: 'John Doe',
    uhid: 'HMS001',
    medications: [
      {
        drugId: '2',
        drugName: 'Metformin',
        quantity: 60,
        unitPrice: 3.75,
        totalPrice: 225.00
      }
    ],
    totalAmount: 225.00,
    discount: 0,
    finalAmount: 225.00,
    paymentMethod: 'Insurance',
    saleDate: '2024-01-15T12:00:00Z',
    dispensedBy: 'Pharmacist John'
  }
];

export const mockPharmacyAnalytics: PharmacyAnalytics = {
  dailySales: 1250,
  totalRevenue: 45600,
  lowStockItems: 3,
  expiringItems: 2,
  topSellingDrugs: [
    { name: 'Paracetamol', quantity: 150, revenue: 375 },
    { name: 'Metformin', quantity: 120, revenue: 450 },
    { name: 'Amoxicillin', quantity: 80, revenue: 360 },
    { name: 'Omeprazole', quantity: 60, revenue: 360 },
    { name: 'Lisinopril', quantity: 45, revenue: 236 }
  ],
  salesTrend: [
    { date: '2024-01-10', amount: 1200 },
    { date: '2024-01-11', amount: 1350 },
    { date: '2024-01-12', amount: 980 },
    { date: '2024-01-13', amount: 1450 },
    { date: '2024-01-14', amount: 1100 },
    { date: '2024-01-15', amount: 1250 }
  ],
  stockStatus: {
    available: 245,
    lowStock: 15,
    outOfStock: 5
  },
  profitMargin: [
    { category: 'Analgesic', margin: 35 },
    { category: 'Antibiotic', margin: 42 },
    { category: 'Antidiabetic', margin: 28 },
    { category: 'Antihypertensive', margin: 38 }
  ]
};