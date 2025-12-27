// InPatients.tsx
import React, { useState, FormEvent } from 'react';
import { db } from '../../firebase';// 🚨 IMPORTANT: Replace with your actual Firebase config path
import { collection, addDoc } from 'firebase/firestore';

// Define the shape of the data for type safety
interface InPatientFormData {
  patId: string;
  roomNo: string;
  roomCategory: 'General' | 'Semi-Private' | 'Private' | 'ICU' | '';
  diagnosis: string;
}

const InPatientsForm: React.FC = () => {
  // 1. State to hold the form data
  const [formData, setFormData] = useState<InPatientFormData>({
    patId: '',
    roomNo: '',
    roomCategory: '', // Default to empty/placeholder
    diagnosis: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. Handler for input/select changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  /**
   * Submits the form data to the 'inPatients' collection in Firestore.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation check for room category selection
    if (formData.roomCategory === '') {
        setError('Please select a valid Room Category.');
        setLoading(false);
        return;
    }

    try {
      // 1. Get a reference to the 'inPatients' collection
      const inPatientsCollection = collection(db, 'inPatients');

      // 2. Add the document to Firestore
      await addDoc(inPatientsCollection, {
        ...formData,
        admissionDate: new Date(), // Add a server-side timestamp for admission
      });

      console.log('Inpatient record successfully written!');
      alert('Inpatient record submitted successfully!');

      // 3. Reset the form
      setFormData({
        patId: '',
        roomNo: '',
        roomCategory: '',
        diagnosis: '',
      });
    } catch (e) {
      console.error('Error adding document: ', e);
      setError('Failed to submit inpatient record. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2>🏨 Inpatient Admission Form</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
        
        {/* Patient ID */}
        <div>
          <label htmlFor="patId" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Patient ID:</label>
          <input
            type="text"
            id="patId"
            name="patId"
            value={formData.patId}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px' }}
            disabled={loading}
          />
        </div>

        {/* Room Number */}
        <div>
          <label htmlFor="roomNo" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Room Number:</label>
          <input
            type="text"
            id="roomNo"
            name="roomNo"
            value={formData.roomNo}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px' }}
            disabled={loading}
          />
        </div>

        {/* Room Category */}
        <div>
          <label htmlFor="roomCategory" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Room Category:</label>
          <select
            id="roomCategory"
            name="roomCategory"
            value={formData.roomCategory}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px' }}
            disabled={loading}
          >
            <option value="" disabled>Select a Category</option>
            <option value="General">General Ward</option>
            <option value="Semi-Private">Semi-Private</option>
            <option value="Private">Private Room</option>
            <option value="ICU">ICU</option>
          </select>
        </div>

        {/* Diagnosis */}
        <div>
          <label htmlFor="diagnosis" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Initial Diagnosis:</label>
          <input
            type="text"
            id="diagnosis"
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px' }}
            disabled={loading}
          />
        </div>

        {/* Error Message */}
        {error && <p style={{ color: 'red', margin: 0 }}>Error: {error}</p>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{ 
            padding: '10px 15px', 
            backgroundColor: loading ? '#6c757d' : '#28a745', // Green for admission
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold' 
          }}
        >
          {loading ? 'Admitting Patient...' : 'Admit Patient'}
        </button>
      </form>
    </div>
  );
};

export default InPatientsForm;