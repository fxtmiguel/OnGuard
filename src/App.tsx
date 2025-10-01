import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./screens/Dashboard";
import LogViewer from "./screens/LogViewer"; 
import "./App.css";

function App() {
  return (
    <Router>
      <div
        className="container"
        style={{
          backgroundColor: "#121212",
          minHeight: "100vh",
          color: "#f5f5f5",
          padding: "2rem",
          fontFamily: "Segoe UI, sans-serif",
        }}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/LogViewer" element={<LogViewer/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
