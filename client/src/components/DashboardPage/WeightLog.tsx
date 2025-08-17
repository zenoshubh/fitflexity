import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const WeightLog = ({ onWeightLogged }: { onWeightLogged?: (weight: number) => void }) => {
  const [weightLogs, setWeightLogs] = useState<
    { id: number; weightInKgs: number; date: string }[]
  >([]);
  const [weightLogsLoading, setWeightLogsLoading] = useState(true);
  const [weightLogsError, setWeightLogsError] = useState<string | null>(null);
  const [newWeight, setNewWeight] = useState("");
  const [loggingWeight, setLoggingWeight] = useState(false);

  // Notification state from backend
  const [progressNotification, setProgressNotification] = useState<
    string | null
  >(null);
  const { refetch } = useAuth();

  const fetchLogs = async () => {
    setWeightLogsLoading(true);
    setWeightLogsError(null);
    try {
      const res = await api.get("/weight-log/fetch-weight-logs");
      const { status, data, message } = res.data;
      if (data.logs && data.logs.length == 0) setWeightLogsError(message);
      setWeightLogs(data.logs || []);
    } catch (error: any) {
      setWeightLogsError(
        error.response?.data?.message || "Failed to load weight logs"
      );
    } finally {
      setWeightLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Handle new weight log
  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;
    setLoggingWeight(true);
    try {
      const res = await api.post("/weight-log/add-weight-log", {
        weightInKgs: parseFloat(newWeight),
      });
      const { data } = res.data;
      setWeightLogsError(null);

      if (data.notification?.message) {
        setProgressNotification(data.notification.message);
      } else {
        setProgressNotification(null);
      }

      await fetchLogs();
      setNewWeight("");

      // Call parent to update current weight
      if (onWeightLogged) {
        onWeightLogged(parseFloat(newWeight));
      }

      // Refetch user data so UserSummaryCard updates automatically
      if (refetch) refetch();
    } catch {
      alert("Failed to log weight");
    } finally {
      setLoggingWeight(false);
    }
  };

  // Placeholder for updating plans
  const handleUpdatePlans = () => {
    // TODO: Implement actual update logic
    setProgressNotification(null);
    alert("Your plans will be updated! (Implement logic here)");
  };

  return (
    <div className="w-full max-w-[95vw] sm:max-w-5xl mx-auto mb-6">
      {/* Progress Notification */}
      {progressNotification && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-orange-100 border border-orange-400 rounded-xl shadow-lg px-6 py-4 flex flex-col md:flex-row items-center gap-4"
          style={{ maxWidth: "90vw", width: "100%" }}
        >
          <div className="flex-1 text-orange-700 font-medium text-sm whitespace-normal">
            {progressNotification}
          </div>
          <div className="flex gap-2">
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow transition"
              onClick={handleUpdatePlans}
            >
              Yes, Update my plan
            </button>
            <button
              className="bg-white border border-orange-200 hover:bg-orange-50 text-orange-500 px-4 py-2 rounded-full font-bold text-sm shadow transition"
              onClick={() => setProgressNotification(null)}
            >
              Ignore
            </button>
          </div>
        </div>
      )}
      <div className="bg-[#fffefc] border border-orange-100 rounded-3xl shadow-lg p-6 flex flex-col gap-6">
        <h2 className="text-2xl font-extrabold text-orange-500 mb-4 ml-2">
          Weight Log
        </h2>
        {/* Log new weight */}
        <form
          onSubmit={handleLogWeight}
          className="flex flex-col md:flex-row gap-4 items-center"
        >
          <input
            type="number"
            step="0.1"
            min="1"
            max="500"
            className="border border-orange-200 rounded-xl px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-full md:w-48 bg-white"
            placeholder="Enter new weight (kg)"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            required
            disabled={loggingWeight}
          />
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-full shadow transition"
            disabled={loggingWeight}
          >
            {loggingWeight ? "Logging..." : "Log Weight"}
          </Button>
        </form>
        {/* Show logs */}
        <div>
          {weightLogsLoading ? (
            <div className="text-gray-500 text-center py-4">Loading...</div>
          ) : weightLogsError ? (
            <div className="text-red-500 text-center py-4">
              {weightLogsError}
            </div>
          ) : weightLogs.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No weight logs yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left rounded-xl overflow-hidden bg-white">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-orange-500 font-semibold">
                      Date
                    </th>
                    <th className="px-4 py-2 text-orange-500 font-semibold">
                      Weight (kg)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {weightLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-2 text-gray-600">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-orange-500 font-bold">
                        {log.weightInKgs}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeightLog;
