// src/components/DoctorForm.tsx
import React, { useState } from "react";
import {
  Save,
  X,
  CheckCircle,
  HeartPulse,
  UserCog,
  Mail,
  Lock,
} from "lucide-react";
import { db, auth } from "../../firebase"; // Import both db and auth
import { doc, setDoc } from "firebase/firestore"; // Use setDoc instead of addDoc
import { createUserWithEmailAndPassword } from "firebase/auth";

// Section Header Component
const SectionHeader: React.FC<{ icon: React.ElementType; title: string }> = ({
  icon: Icon,
  title,
}) => (
  <div className="flex items-center space-x-2 mb-4">
    <div className="bg-accent-blue/10 p-1.5 rounded-lg">
      <Icon className="w-5 h-5 text-accent-blue" />
    </div>
    <h2 className="text-lg font-bold text-primary-dark tracking-tight">
      {title}
    </h2>
  </div>
);

const DoctorForm: React.FC = () => {
  const [doctor, setDoctor] = useState({
    nmr_id: "",
    doc_id: "",
    doc_name: "",
    mobile: "",
    adhar: "",
    age: "",
    gender: "",
    address: "",
    experience: "",
    specialization: "",
    email: "",
    password: "",
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setDoctor({
      ...doctor,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Step 1: Create a new user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        doctor.email,
        doctor.password
      );

      const user = userCredential.user;

      // Step 2: Create a new object for Firestore, without the password
      const { password, ...doctorData } = doctor;

      // Add a role field for role-based access control
      const dataToStore = {
        ...doctorData,
        role: "doctor",
      };

      // Step 3: Use the user's UID to set the document in Firestore
      await setDoc(doc(db, "doctors", user.uid), dataToStore);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reset form
      setDoctor({
        nmr_id: "",
        doc_id: "",
        doc_name: "",
        mobile: "",
        adhar: "",
        age: "",
        gender: "",
        address: "",
        experience: "",
        specialization: "",
        email: "",
        password: "",
      });
    } catch (err: any) {
      console.error("Error adding doctor:", err);
      if (err.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please use a different one.");
      } else {
        alert("Failed to register doctor. Please try again.");
      }
    }
  };

  const clearForm = () => {
    setDoctor({
      nmr_id: "",
      doc_id: "",
      doc_name: "",
      mobile: "",
      adhar: "",
      age: "",
      gender: "",
      address: "",
      experience: "",
      specialization: "",
      email: "",
      password: "",
    });
    setShowSuccess(false);
  };

  const inputStyle =
    "p-2.5 border border-gray-300 rounded-lg w-full bg-gray-50 focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition duration-200 ease-in-out text-primary-light placeholder:text-gray-500 text-lg";

  return (
    <div className="p-4 bg-gray-100 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-4 bg-accent-blue/10 border-l-4 border-accent-blue text-blue-900 p-3 rounded-r-lg flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-accent-blue" />
            <span className="font-medium">Doctor registered successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Left Column - Personal Details */}
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 transition-shadow hover:shadow-md">
                <SectionHeader icon={UserCog} title="Personal Details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="NMR ID"
                    name="nmr_id"
                    className={inputStyle}
                    value={doctor.nmr_id}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Doc ID"
                    name="doc_id"
                    className={inputStyle}
                    value={doctor.doc_id}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Doctor's Name"
                    name="doc_name"
                    className={`${inputStyle} sm:col-span-2`}
                    value={doctor.doc_name}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Adhar"
                    name="adhar"
                    className={inputStyle}
                    value={doctor.adhar}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Mobile Number"
                    name="mobile"
                    className={inputStyle}
                    value={doctor.mobile}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    name="age"
                    className={inputStyle}
                    value={doctor.age}
                    onChange={handleChange}
                    required
                  />
                  <select
                    name="gender"
                    className={inputStyle}
                    value={doctor.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Login Credentials */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 transition-shadow hover:shadow-md">
                <SectionHeader icon={Mail} title="Credentials" />
                <div className="grid grid-cols-1 gap-3">
                  <input
                    type="email"
                    placeholder="Email"
                    name="email"
                    className={inputStyle}
                    value={doctor.email}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    name="password"
                    className={inputStyle}
                    value={doctor.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Professional Details */}
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 transition-shadow hover:shadow-md">
                <SectionHeader icon={HeartPulse} title="Professional Details" />
                <div className="grid grid-cols-1 gap-3">
                  <input
                    type="text"
                    placeholder="Specialization"
                    name="specialization"
                    className={inputStyle}
                    value={doctor.specialization}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Experience"
                    name="experience"
                    className={inputStyle}
                    value={doctor.experience}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    name="address"
                    className={inputStyle}
                    value={doctor.address}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="group flex items-center px-5 py-2.5 border border-accent-blue rounded-lg text-accent-blue bg-white hover:bg-accent-blue hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-blue transition-all duration-300 font-medium"
              onClick={clearForm}
            >
              <X className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-90" />
              Clear Form
            </button>
            <button
              type="submit"
              className="flex items-center px-6 py-2.5 bg-primary-dark text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-all duration-300"
            >
              <Save className="w-4 h-4 mr-2" />
              Register Doctor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorForm;
