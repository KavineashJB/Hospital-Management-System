import { useState } from "react";
import { Patient } from "../../types";
import { Brain, CheckCircle, Loader, Bot, AlertCircle } from "lucide-react";
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const AIAssistTab: React.FC<{
  consultation: any;
  selectedPatient: Patient;
}> = ({ consultation, selectedPatient }) => {
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!symptoms.trim() && !duration.trim()) {
      setDiagnosis("Please enter symptoms or duration to get a diagnosis.");
      return;
    }

    if (!OPENAI_API_KEY) {
      alert("Please set VITE_OPENAI_API_KEY in your .env file.");
      return;
    }

    setIsLoading(true);
    setDiagnosis("");

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content:
                  "You are a medical assistant. Given symptoms and duration, suggest a possible diagnosis and treatment plan and also generate a prescription. Format your response in a clear, structured manner with sections for Diagnosis, Treatment Plan, and Prescription.",
              },
              {
                role: "user",
                content: `Patient Information:
Name: ${selectedPatient.fullName}
Age: ${selectedPatient.age}
Gender: ${selectedPatient.gender}
Chronic Conditions: ${selectedPatient.chronicConditions?.join(", ") || "None"}

Current Symptoms: ${symptoms || "Not specified"}
Duration: ${duration || "Not specified"}
Additional Symptoms from examination: ${
                  consultation.symptoms?.join(", ") || "None"
                }`,
              },
            ],
          }),
        }
      );

      const data = await response.json();
      const content =
        data?.choices?.[0]?.message?.content?.trim() ||
        data?.choices?.[0]?.text?.trim() ||
        "Unable to generate diagnosis. Please try again.";

      setDiagnosis(content);
    } catch (err) {
      console.error("Error calling Groq:", err);
      setDiagnosis(
        "Error connecting to AI service. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFill = () => {
    if (consultation.symptoms?.length > 0) {
      setSymptoms(consultation.symptoms.join(", "));
    }
    if (consultation.duration) {
      setDuration(consultation.duration);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}{" "}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {" "}
        <div className="flex items-center justify-between mb-6">
          {" "}
          <div className="flex items-center space-x-3">
            {" "}
            <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-600" />{" "}
            </div>{" "}
            <div>
              {" "}
              <h3 className="text-lg font-semibold text-[#0B2D4D]">
                {" "}
                AI Diagnostic Assistant{" "}
              </h3>{" "}
              <p className="text-lg text-[#1a4b7a]">
                {" "}
                Get AI-powered insights and recommendations based on patient
                data{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <button
            onClick={handleAutoFill}
            className="flex items-center space-x-2 px-3 py-2 bg-[#e0f7fa] text-[#012e58] rounded-lg hover:bg-[#b3e5fc] transition-colors text-lg"
          >
            <CheckCircle className="w-4 h-4" />{" "}
            <span>Auto-fill from Examination</span>{" "}
          </button>{" "}
        </div>
        {/* Patient Context */}{" "}
        <div className="bg-[#F8F9FA] rounded-lg p-4 mb-6">
          {" "}
          <h4 className="font-medium text-[#0B2D4D] mb-2">
            Patient Context
          </h4>{" "}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-lg">
            {" "}
            <div>
              <span className="text-[#1a4b7a]">Name:</span>{" "}
              <p className="font-medium">{selectedPatient.fullName}</p>{" "}
            </div>{" "}
            <div>
              <span className="text-[#1a4b7a]">Age:</span>{" "}
              <p className="font-medium">{selectedPatient.age}Y</p>{" "}
            </div>{" "}
            <div>
              <span className="text-[#1a4b7a]">Gender:</span>{" "}
              <p className="font-medium">{selectedPatient.gender}</p>{" "}
            </div>{" "}
            <div>
              <span className="text-[#1a4b7a]">Type:</span>{" "}
              <p className="font-medium">{selectedPatient.patientType}</p>{" "}
            </div>{" "}
          </div>{" "}
          {selectedPatient.chronicConditions &&
            selectedPatient.chronicConditions.length > 0 && (
              <div className="mt-3">
                {" "}
                <span className="text-[#1a4b7a] text-lg">
                  {" "}
                  Chronic Conditions:{" "}
                </span>{" "}
                <div className="flex flex-wrap gap-2 mt-1">
                  {" "}
                  {selectedPatient.chronicConditions.map((condition, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-red-100 text-red-700 text-md rounded-full"
                    >
                      {" "}
                      {condition}{" "}
                    </span>
                  ))}{" "}
                </div>{" "}
              </div>
            )}{" "}
        </div>
        {/* Input Section */}{" "}
        <div className="space-y-4">
          {" "}
          <div>
            {" "}
            <label className="block text-lg font-medium text-[#0B2D4D] mb-2">
              {" "}
              Current Symptoms{" "}
            </label>{" "}
            <textarea
              rows={3}
              placeholder="Describe the patient's current symptoms in detail..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent resize-none"
            />{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-lg font-medium text-[#0B2D4D] mb-2">
              {" "}
              Duration & Timeline{" "}
            </label>{" "}
            <input
              type="text"
              placeholder="e.g., 3 days, 1 week, chronic for 2 months..."
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4b7a] focus:border-transparent"
            />{" "}
          </div>{" "}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-gradient-to-r from-[#012e58] to-[#1a4b7a] text-white rounded-lg hover:from-[#1a4b7a] hover:to-[#012e58] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {" "}
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />{" "}
                <span>Analyzing...</span>{" "}
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" /> <span>Generate AI Diagnosis</span>{" "}
              </>
            )}{" "}
          </button>{" "}
        </div>{" "}
      </div>
      {/* Results Section - Your original diagnosis display */}{" "}
      {diagnosis && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {" "}
          <div className="flex items-center space-x-3 mb-4">
            {" "}
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-green-600" />{" "}
            </div>{" "}
            <div>
              {" "}
              <h4 className="text-lg font-semibold text-[#0B2D4D]">
                {" "}
                Possible Diagnosis{" "}
              </h4>{" "}
              <p className="text-lg text-[#1a4b7a]">
                {" "}
                AI-generated diagnosis based on symptoms and duration{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <div className="bg-gradient-to-r from-[#e0f7fa] to-[#e0f2f1] border border-blue-200 rounded-lg p-6">
            {" "}
            <div className="whitespace-pre-wrap text-[#0B2D4D] leading-relaxed">
              {" "}
              {diagnosis}{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            {" "}
            <div className="flex items-center space-x-2 text-lg text-gray-500">
              <AlertCircle className="w-4 h-4" />{" "}
              <span>
                {" "}
                AI suggestions are for reference only. Always use clinical
                judgment.{" "}
              </span>{" "}
            </div>{" "}
            <div className="flex items-center space-x-3">
              {" "}
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                {" "}
                Copy Results{" "}
              </button>{" "}
              <button className="px-4 py-2 bg-[#012e58] text-white rounded-lg hover:bg-[#1a4b7a] transition-colors">
                {" "}
                Add to Notes{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}
    </div>
  );
};

export default AIAssistTab;
