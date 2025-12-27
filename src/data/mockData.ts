import { Patient, Analytics, Payment } from '../types';

export const mockPatients: Patient[] = [
  {
    id: '1',
    uhid: 'HMS001',
    fullName: 'John Doe',
    age: 45,
    dateOfBirth: '1979-03-15',
    gender: 'Male',
    contactNumber: '+1-555-0123',
    email: 'john.doe@email.com',
    address: '123 Main St, City, State 12345',
    abhaId: 'ABHA123456789',
    patientType: 'OPD',
    visitType: 'Appointment',
    paymentMethod: 'Insurance',
    consultationPackage: 'General Consultation',
    preferredLanguage: 'English',
    doctorAssigned: 'Dr. Sarah Wilson',
    chronicConditions: ['Diabetes', 'Hypertension'],
    waitTime: 15,
    status: 'Waiting',
    createdAt: '2024-01-15T09:30:00Z'
  },
  {
    id: '2',
    uhid: 'HMS002',
    fullName: 'Emily Johnson',
    age: 32,
    dateOfBirth: '1992-07-22',
    gender: 'Female',
    contactNumber: '+1-555-0124',
    email: 'emily.johnson@email.com',
    address: '456 Oak Ave, City, State 12345',
    patientType: 'OPD',
    visitType: 'Walk-in',
    paymentMethod: 'Card',
    consultationPackage: 'Specialist Consultation',
    preferredLanguage: 'English',
    doctorAssigned: 'Dr. Michael Chen',
    chronicConditions: [],
    waitTime: 8,
    status: 'In Progress',
    createdAt: '2024-01-15T10:15:00Z'
  },
  {
    id: '3',
    uhid: 'HMS003',
    fullName: 'Robert Smith',
    age: 67,
    dateOfBirth: '1957-11-08',
    gender: 'Male',
    contactNumber: '+1-555-0125',
    email: 'robert.smith@email.com',
    address: '789 Pine St, City, State 12345',
    abhaId: 'ABHA987654321',
    patientType: 'OPD',
    visitType: 'Appointment',
    paymentMethod: 'Cash',
    consultationPackage: 'Senior Care Package',
    preferredLanguage: 'English',
    doctorAssigned: 'Dr. Sarah Wilson',
    chronicConditions: ['Heart Disease', 'Kidney Disease'],
    waitTime: 22,
    status: 'Completed',
    createdAt: '2024-01-15T08:45:00Z'
  }
];

export const mockAnalytics: Analytics = {
  dailyAppointments: 47,
  totalPatients: 1247,
  completedConsultations: 38,
  pendingPayments: 5,
  topSymptoms: [
    { name: 'Fever', count: 15 },
    { name: 'Cough', count: 12 },
    { name: 'Back Pain', count: 8 },
    { name: 'Headache', count: 7 },
    { name: 'Fatigue', count: 5 }
  ],
  topDiagnoses: [
    { name: 'Common Cold', count: 18 },
    { name: 'Hypertension', count: 14 },
    { name: 'Diabetes', count: 11 },
    { name: 'Back Strain', count: 8 },
    { name: 'Migraine', count: 6 }
  ],
  topMedications: [
    { name: 'Paracetamol', count: 22 },
    { name: 'Ibuprofen', count: 16 },
    { name: 'Metformin', count: 14 },
    { name: 'Lisinopril', count: 12 },
    { name: 'Omeprazole', count: 9 }
  ],
  labTests: [
    { name: 'Blood Sugar', count: 28 },
    { name: 'Complete Blood Count', count: 24 },
    { name: 'Lipid Profile', count: 18 },
    { name: 'Liver Function', count: 15 },
    { name: 'Kidney Function', count: 12 }
  ],
  revenue: {
    today: 12450,
    thisMonth: 245600,
    trend: 8.5
  }
};

export const mockPayments: Payment[] = [
  {
    id: '1',
    patientId: '1',
    uhid: 'HMS001',
    services: ['General Consultation', 'Blood Test'],
    amount: 350,
    paymentMode: 'Insurance',
    status: 'Paid',
    date: '2024-01-15T09:30:00Z'
  },
  {
    id: '2',
    patientId: '2',
    uhid: 'HMS002',
    services: ['Specialist Consultation', 'X-Ray'],
    amount: 580,
    paymentMode: 'Card',
    status: 'Pending',
    date: '2024-01-15T10:15:00Z'
  },
  {
    id: '3',
    patientId: '3',
    uhid: 'HMS003',
    services: ['Senior Care Consultation', 'ECG', 'Blood Test'],
    amount: 425,
    paymentMode: 'Cash',
    status: 'Paid',
    date: '2024-01-15T08:45:00Z'
  }
];