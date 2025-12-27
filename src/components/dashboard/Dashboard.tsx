import React, { useState } from "react";
import {
  Calendar,
  CheckCircle,
  Activity,
  Pill,
  TestTube,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type CategoryType =
  | "symptoms"
  | "diagnoses"
  | "medications"
  | "labTests"
  | null;

export const Dashboard: React.FC = () => {
  // Mock analytics data
  const analytics = {
    topSymptoms: [
      { name: "Fever", count: 145 },
      { name: "Headache", count: 132 },
      { name: "Fatigue", count: 128 },
      { name: "Nausea", count: 98 },
      { name: "Cough", count: 87 },
    ],
    topDiagnoses: [
      { name: "Hypertension", count: 234 },
      { name: "Diabetes", count: 198 },
      { name: "Anxiety", count: 156 },
      { name: "Depression", count: 142 },
      { name: "Asthma", count: 134 },
    ],
    topMedications: [
      { name: "Lisinopril", count: 189 },
      { name: "Metformin", count: 167 },
      { name: "Amlodipine", count: 145 },
      { name: "Omeprazole", count: 123 },
      { name: "Atorvastatin", count: 98 },
    ],
    labTests: [
      { name: "CBC", count: 298 },
      { name: "Lipid Panel", count: 267 },
      { name: "HbA1c", count: 234 },
      { name: "TSH", count: 198 },
      { name: "Creatinine", count: 176 },
    ],
  };

  // const [userName, setUserName] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(null);

  // Mock data for daily appointments vs treatment
  const dailyAppointmentsVsTreatment = [
    { date: "Jan 01", appointments: 120, treatments: 98 },
    { date: "Jan 02", appointments: 132, treatments: 105 },
    { date: "Jan 03", appointments: 101, treatments: 87 },
    { date: "Jan 04", appointments: 134, treatments: 112 },
    { date: "Jan 05", appointments: 145, treatments: 128 },
    { date: "Jan 06", appointments: 165, treatments: 142 },
    { date: "Jan 07", appointments: 178, treatments: 156 },
  ];

  // useEffect(() => {
  //   // Mock cookie reading - in real implementation would use Cookies.get("userName")
  //   setUserName("Dr. Smith");
  // }, []);

  const getCategoryData = (category: CategoryType) => {
    switch (category) {
      case "symptoms":
        return analytics.topSymptoms;
      case "diagnoses":
        return analytics.topDiagnoses;
      case "medications":
        return analytics.topMedications;
      case "labTests":
        return analytics.labTests;
      default:
        return [];
    }
  };

  const getCategoryTitle = (category: CategoryType) => {
    switch (category) {
      case "symptoms":
        return "Top Symptoms";
      case "diagnoses":
        return "Top Diagnoses";
      case "medications":
        return "Top 5 Drugs";
      case "labTests":
        return "Top Lab Tests";
      default:
        return "";
    }
  };

  const getCategoryIcon = (category: CategoryType) => {
    switch (category) {
      case "symptoms":
        return Activity;
      case "diagnoses":
        return CheckCircle;
      case "medications":
        return Pill;
      case "labTests":
        return TestTube;
      default:
        return Activity;
    }
  };

  const formatChartData = (data: { name: string; count: number }[]) => {
    return data.slice(0, 5).map((item) => ({
      name: item.name,
      value: item.count,
    }));
  };

  const FilterButton: React.FC<{
    category: CategoryType;
    label: string;
    icon: React.ComponentType<any>;
  }> = ({ category, label, icon: Icon }) => (
    <button
      onClick={() => setSelectedCategory(category)}
      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
        selectedCategory === category
          ? "bg-[#012e58] text-white shadow-md"
          : "bg-gray-100 text-[#1a4b7a] hover:bg-gray-200"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-md font-medium">{label}</span>
    </button>
  );

  return (
    <div className="h-screen bg-gray-50 p-3 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-4xl h-full bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex flex-col">
        {/* Header */}
        <div className="text-center mb-4 flex-shrink-0">
          <h1 className="text-xl font-bold text-[#0B2D4D] mb-1">
            Basic Analytics
          </h1>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 mb-3 min-h-0" style={{ maxHeight: "60vh" }}>
          {selectedCategory === null ? (
            /* Default Line Chart */
            <div className="bg-gray-50 rounded-lg p-3 h-full flex flex-col">
              <div className="flex items-center space-x-2 mb-2 flex-shrink-0">
                <Calendar className="w-5 h-5 text-[#012e58]" />
                <h3 className="text-lg font-semibold text-[#0B2D4D]">
                  Daily Appointments vs Treatment
                </h3>
              </div>

              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyAppointmentsVsTreatment}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      stroke="#6b7280"
                    />
                    <YAxis tick={{ fontSize: 10 }} stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="appointments"
                      stroke="#012e58"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#012e58" }}
                      name="Appointments"
                    />
                    <Line
                      type="monotone"
                      dataKey="treatments"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#3b82f6" }}
                      name="Treatments"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            /* Bar Chart Area */
            <div className="bg-gray-50 rounded-lg p-3 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  {React.createElement(getCategoryIcon(selectedCategory), {
                    className: "w-5 h-5 text-[#012e58]",
                  })}
                  <h3 className="text-lg font-semibold text-[#0B2D4D]">
                    {getCategoryTitle(selectedCategory)}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center space-x-1 px-2 py-1 rounded-md bg-gray-200 text-[#1a4b7a] hover:bg-gray-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="text-md">Back</span>
                </button>
              </div>

              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={formatChartData(getCategoryData(selectedCategory))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      stroke="#6b7280"
                    />
                    <YAxis tick={{ fontSize: 10 }} stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="value" fill="#012e58" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-3 flex-shrink-0">
          <FilterButton
            category="symptoms"
            label="Top Symptoms"
            icon={Activity}
          />
          <FilterButton
            category="diagnoses"
            label="Top Diagnoses"
            icon={CheckCircle}
          />
          <FilterButton
            category="medications"
            label="Top 5 Drugs"
            icon={Pill}
          />
          <FilterButton
            category="labTests"
            label="Top Lab Tests"
            icon={TestTube}
          />
        </div>

        {/* Footer Info */}
        <div className="pt-2 border-t border-gray-200 text-center flex-shrink-0">
          <p className="text-md text-[#1a4b7a]">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
};
