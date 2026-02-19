import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface LogEntry {
  type: string;
  path: string;
  time: string;
  risk?: string;
  malware?: string;
}

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setHistory] = useState(false);
  const [history, setHistoryData] = useState<LogEntry[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);

  const navigate = useNavigate();

  const fetchLogs = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/logs")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onMouseDown = (e: MouseEvent) => {
      startY.current = e.clientY;
    };

    const onMouseUp = (e: MouseEvent) => {
      if (startY.current !== null) {
        const distance = e.clientY - startY.current;
        if (distance > 80) {
          fetchLogs();
        }
        startY.current = null;
      }
    };

    wrapper.addEventListener("mousedown", onMouseDown);
    wrapper.addEventListener("mouseup", onMouseUp);

    return () => {
      wrapper.removeEventListener("mousedown", onMouseDown);
      wrapper.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const renderRisk = (risk?: string, malware?: string) => {
    if (malware == 'malicious') return <span className="text-red-500">🔴 Malicious</span>;
    switch (risk) {
      case "high":
        return <span className="text-red-500">🔴 High</span>;
      case "medium":
        return <span className="text-yellow-400">🟡 Medium</span>;
      default:
        return <span className="text-green-400">🟢 Low</span>;
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative"
    >
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-md z-50"
      >
        ← Back to Dashboard
      </button>

      <div className="w-full max-w-7xl bg-gray-800 text-white rounded-xl shadow-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between items-center p-6 bg-gray-700 gap-4 pt-14 sm:pt-6">
          <h2 className="text-3xl font-bold text-center">
            {showHistory ? "Log History" : "📁 File Activity Log"}
          </h2>

          <div className="flex flex-row gap-4">
            {!showHistory && (
              <button
                onClick={fetchLogs}
                className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg w-full sm:w-auto"
              >
                🔄 Refresh
              </button>
            )}

            {!showHistory && (
              <button
                onClick={() => {
                  fetch("http://localhost:5000/api/logs/history")
                    .then((res) => res.json())
                    .then((data) => {
                      setHistoryData(data.history);
                      setHistory(true);
                    });
                }}
                className="bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded-lg w-full sm:w-auto"
              >
                Log History
              </button>
            )}

            {showHistory && (
              <button
                onClick={() => setHistory(false)}
                className="bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded-lg w-full sm:w-auto"
              >
                Back to Logs
              </button>
            )}
          </div>
        </div>

        <div className="pt-12" />

        {!showHistory && (
          <div className="p-6">
            <div
              className="overflow-auto border border-gray-700 rounded-lg"
              style={{ maxHeight: "70vh" }}
            >
              {loading ? (
                <div className="p-8 text-center text-gray-300">
                  <p className="text-xl">Loading logs...</p>
                  <p className="text-gray-400">Please hold on, it's getting there.</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center text-gray-300">
                  <p className="text-xl">No events detected</p>
                  <p className="text-gray-400">Looks like everything’s calm for now.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-700 sticky top-0 z-10">
                    <tr>
                      <th>Type</th>
                      <th>Path</th>
                      <th>Time</th>
                      <th>Risk</th>
                    </tr>
                  </thead>

                  <tbody>
                    {["add", "change", "delete"].map((logType) => {
                      const group = logs.filter((item) => item.type === logType);
                      if (!group.length) return null;

                      return (
                        <React.Fragment key={logType}>
                          <tr className="bg-gray-900">
                            <td colSpan={4} className="p-3 font-semibold border-b border-gray-600">
                              {logType === "add" && "📁 File Added"}
                              {logType === "change" && "✏️ File Changed"}
                              {logType === "delete" && "🗑️ File Deleted"}
                            </td>
                          </tr>
                          {group.map((log, i) => (
                            <tr key={i} className="hover:bg-gray-700 transition duration-150">
                              <td className="p-4 border-b border-gray-700">
                                {logType === "add" && "📁 File Added"}
                                {logType === "change" && "✏️ File Changed"}
                                {logType === "delete" && "🗑️ File Deleted"}
                              </td>
                              <td className="p-4 border-b border-gray-700 break-words font-mono">
                                {log.path}
                              </td>
                              <td className="p-4 border-b border-gray-700 text-gray-400">
                                {new Date(log.time).toLocaleString()}
                              </td>
                              <td className="p-4 border-b border-gray-700">
                                {renderRisk(log.risk, log.malware)}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {showHistory && (
          <div className="p-6">
            <div
              className="overflow-auto border border-gray-700 rounded-lg"
              style={{ maxHeight: "70vh" }}
            >
              {history.length === 0 ? (
                <div className="p-8 text-center text-gray-300">
                  <p className="text-xl">No history available</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-700 sticky top-0 z-10">
                    <tr>
                      <th>Type</th>
                      <th>Path</th>
                      <th>Time</th>
                      <th>Risk</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map((log, i) => (
                      <tr key={i} className="hover:bg-gray-700 transition duration-150">
                        <td className="p-4 border-b border-gray-700">{log.type}</td>
                        <td className="p-4 border-b border-gray-700 break-words font-mono">
                          {log.path}
                        </td>
                        <td className="p-4 border-b border-gray-700 text-gray-400">
                          {new Date(log.time).toLocaleString()}
                        </td>
                        <td className="p-4 border-b border-gray-700">
                          {renderRisk(log.risk)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogViewer;
