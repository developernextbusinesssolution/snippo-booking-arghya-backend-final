import { useState } from "react";
import BrandLogo from "../components/Shared/BrandLogo";
import { apiRequest } from "../utils/api";

export default function AdminLoginPage({ onLogin, onBack }) {
  const [f, setF] = useState({ email: "", pass: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPass, setShowPass] = useState(false);

  const submit = async () => {
    setErr("");
    if (!f.email || !f.pass) {
      setErr("Enter email and password");
      return;
    }
    setLoading(true);
    try {
      const payload = await apiRequest("/auth/login-admin", { method: "POST", body: { email: f.email, password: f.pass } });
      onLogin(payload);
    } catch (e) {
      setErr(e.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo"><BrandLogo /></div>
          <div className="auth-badge">🛡 Admin Portal</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <div>
            <label className="lbl">ADMIN EMAIL</label>
            <input
              className="inp"
              type="email"
              placeholder="admin@snippo.com"
              value={f.email}
              onChange={e => setF({ ...f, email: e.target.value })}
            />
          </div>
          <div>
            <label className="lbl">PASSWORD</label>
            <div style={{ position: "relative" }}>
              <input
                className="inp"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={f.pass}
                onChange={e => setF({ ...f, pass: e.target.value })}
                onKeyDown={e => e.key === "Enter" && submit()}
                style={{ width: "100%", paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted)",
                  opacity: 0.7
                }}
                title={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>
        </div>
        {err && (
          <div style={{ color: "var(--red)", fontSize: 12, marginTop: 9, padding: "9px 11px", background: "rgba(230,57,70,.08)", borderRadius: 8, whiteSpace: "pre-line" }}>
            ⚠ {err}
          </div>
        )}
        <button
          className="btn btn-p"
          style={{ width: "100%", marginTop: 14, padding: 13 }}
          onClick={submit}
          disabled={loading}
        >
          {loading ? <span className="ld"><span>●</span><span>●</span><span>●</span></span> : "Access Admin Dashboard →"}
        </button>
        <button className="btn btn-g" style={{ width: "100%", marginTop: 8 }} onClick={onBack}>
          ← Back to Homepage
        </button>
      </div>
    </div>
  );
}
