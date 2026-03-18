import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./assets/global.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[React Error Boundary]", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: "#0a0a0a", color: "#e63946", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, fontFamily: "monospace" }}>
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ marginBottom: 16 }}>App Error</h2>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#aaa" }}>{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);