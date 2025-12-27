// LabForm.tsx (renamed from Lab.tsx)
import React, { useState, FormEvent } from "react";
import { db } from "../../firebase"; // 🚨 IMPORTANT: Replace with your actual Firebase config path
import { collection, addDoc } from "firebase/firestore";

// Define the shape of the data for type safety
interface LabFormData {
  patId: string;
  testType: string;
  dateTime: string;
  status: "Pending" | "In Progress" | "Completed";
  staffId: string;
}

// 🚨 Mock Firebase Config Import (You must use your actual file)
// Assume 'db' is the Firestore instance imported from a config file.
// For example:
/*
// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
 // Your config details here
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
*/

const LabForm: React.FC = () => {
  const [formData, setFormData] = useState<LabFormData>({
    patId: "",
    testType: "",
    dateTime: new Date().toISOString().slice(0, 16), // Set default to current time for convenience
    status: "Pending",
    staffId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  /**
   * Submits the form data to the 'labRequests' collection in Firestore.
   */

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Get a reference to the 'labRequests' collection
      const labRequestsCollection = collection(db, "labRequests"); // 2. Add the document to Firestore

      await addDoc(labRequestsCollection, {
        ...formData,
        timestamp: new Date(), // Add a server-side timestamp
      });

      console.log("Document successfully written!");
      alert("Lab request submitted successfully!"); // 3. Reset the form

      setFormData({
        patId: "",
        testType: "",
        dateTime: new Date().toISOString().slice(0, 16),
        status: "Pending",
        staffId: "",
      });
    } catch (e) {
      console.error("Error adding document: ", e);
      setError("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}
    >
      <h2>🧪 Lab Test Request Form</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "15px" }}>
        {/* Patient ID */}
        <div>
          <label
            htmlFor="patId"
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Patient ID:
          </label>

          <input
            type="text"
            id="patId"
            name="patId"
            value={formData.patId}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
            disabled={loading}
          />
        </div>
        {/* Test Type */}
        <div>
          <label
            htmlFor="testType"
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Test Type:
          </label>

          <input
            type="text"
            id="testType"
            name="testType"
            value={formData.testType}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
            disabled={loading}
          />
        </div>
        {/* Date and Time */}
        <div>
          <label
            htmlFor="dateTime"
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Time/Date:
          </label>

          <input
            type="datetime-local"
            id="dateTime"
            name="dateTime"
            value={formData.dateTime}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
            disabled={loading}
          />
        </div>
        {/* Status */}
        <div>
          <label
            htmlFor="status"
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Status:
          </label>

          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
            disabled={loading}
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        {/* Staff ID */}
        <div>
          <label
            htmlFor="staffId"
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Staff ID:
          </label>

          <input
            type="text"
            id="staffId"
            name="staffId"
            value={formData.staffId}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
            disabled={loading}
          />
        </div>
        {/* Error Message */}
        {error && <p style={{ color: "red", margin: 0 }}>Error: {error}</p>}
        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 15px",
            backgroundColor: loading ? "#6c757d" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Submitting..." : "Submit Lab Request"}
        </button>
      </form>
    </div>
  );
};

export default LabForm;
