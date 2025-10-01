import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleViewLogs = () => {
    navigate("/LogViewer");
  };

  return (
    <>
      <div className="absolute inset-0 z-0 animated-bg" />


      <div
        style={{
          position: "relative",  
          zIndex: 10,
          minHeight: "100vh",
          backgroundColor: "rgba(18, 18, 18, 0.85)", 
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          padding: "2rem",
        }}
      >
        <div
          style={{
            backgroundColor: "#1E1E1E",
            padding: "3rem 4rem",
            borderRadius: "20px",
            boxShadow: "0 0 30px rgba(0, 255, 128, 0.2)",
            maxWidth: "600px",
            width: "100%",
            textAlign: "center",
            border: "1px solid #00c85344",
          }}
        >
          <h1
            style={{
              fontSize: "2.5rem",
              color: "#00ff94",
              marginBottom: "1rem",
              textShadow: "0 0 10px rgba(0, 255, 128, 0.6)",
            }}
          >
            🛡️ OnGuard Dashboard
          </h1>

          <p
            style={{
              color: "#cccccc",
              fontSize: "1.1rem",
              marginBottom: "2.5rem",
              lineHeight: "1.6",
            }}
          >
            Real-time ransomware detection and automatic threat mitigation.
            <br />
            Stay one step ahead of malicious activity.
          </p>



          <button
            onClick={handleViewLogs}
            style={{
              padding: "0.8rem 2rem",
              backgroundColor: "#00C853",
              border: "none",
              borderRadius: "12px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              color: "#000",
              cursor: "pointer",
              boxShadow: "0 0 12px rgba(0, 200, 83, 0.4)",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#00e676";
              e.currentTarget.style.boxShadow = "0 0 16px rgba(0, 255, 100, 0.6)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#00C853";
              e.currentTarget.style.boxShadow = "0 0 12px rgba(0, 200, 83, 0.4)";
            }}
          >
            🔍 View Activity Logs
          </button>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
