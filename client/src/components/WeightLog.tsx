import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import api from "@/lib/api";

const WeightLog = () => {
  const [weightLogs, setWeightLogs] = useState<
    { id: number; weightInKgs: number; date: string }[]
  >([]);
  const [weightLogsLoading, setWeightLogsLoading] = useState(true);
  const [weightLogsError, setWeightLogsError] = useState<string | null>(null);
  const [newWeight, setNewWeight] = useState("");
  const [loggingWeight, setLoggingWeight] = useState(false);

  // Fetch weight logs only on mount
  useEffect(() => {
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
      // Controller returns { logs: {...} }
      const { status, data, message } = res.data;
      setWeightLogs((prev) => [
        {
          id: data.newWeightLog.id,
          weightInKgs: data.newWeightLog.weightInKgs,
          date: data.newWeightLog.date || new Date().toISOString(),
        },
        ...prev,
      ]);
      setNewWeight("");
    } catch {
      alert("Failed to log weight");
    } finally {
      setLoggingWeight(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mb-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 ml-2">Weight Log</h2>
      <div className="bg-white/70 border border-gray-200 rounded-3xl shadow-2xl p-6 glassmorphism flex flex-col gap-6">
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
            className="border border-gray-300 rounded-xl px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-full md:w-48 bg-white/80"
            placeholder="Enter new weight (kg)"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            required
            disabled={loggingWeight}
          />
          <Button
            type="submit"
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold px-6 py-2 rounded-xl shadow transition"
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
              <table className="min-w-full text-left">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-gray-700 font-semibold">
                      Date
                    </th>
                    <th className="px-4 py-2 text-gray-700 font-semibold">
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
