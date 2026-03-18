import { useState, useRef } from "react";
import BrandLogo from "../components/Shared/BrandLogo";
import { apiRequest } from "../utils/api";

export default function StaffAuthPage({ onLogin, onBack }) {
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState({ name: "", email: "", pass: "", designation: "", phone: "" });
  const [idFile, setIdFile] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const fileInputRef = useRef(null);

  const submit = async () => {
    setErr("");
    if (!f.email.includes("@")) {
      setErr("Enter a valid email");
      return;
    }
    if (f.pass.length < 6) {
      setErr("Password min 6 characters");
      return;
    }
    if (tab === "register") {
      if (!f.name.trim()) {
        setErr("Enter your full name");
        return;
      }
      if (!f.designation) {
        setErr("Select your staff role");
        return;
      }
      if (!idFile) {
        setErr("Please upload your ID image");
        return;
      }
    }
    setLoading(true);
    try {
      let payload;
      if (tab === "login") {
        payload = await apiRequest("/auth/login-staff", { 
          method: "POST", 
          body: { email: f.email, password: f.pass } 
        });
      } else {
        const formData = new FormData();
        formData.append("name", f.name);
        formData.append("email", f.email);
        formData.append("password", f.pass);
        formData.append("designation", f.designation);
        formData.append("phone", f.phone);
        if (idFile) formData.append("idDocument", idFile);

        payload = await apiRequest("/auth/register-staff", { 
          method: "POST", 
          body: formData 
        });
      }
      onLogin(payload);
    } catch (e) {
      setErr(e.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <div className="auth-brand">
          <div className="auth-logo"><BrandLogo /></div>
          <div className="auth-badge">💼 Staff Portal</div>
        </div>
        <div className="tabs">
          <div className={`tab ${tab === "login" ? "act" : ""}`} onClick={() => { setTab("login"); setErr(""); }}>
            Staff Login
          </div>
          <div className={`tab ${tab === "register" ? "act" : ""}`} onClick={() => { setTab("register"); setErr(""); }}>
            Register
          </div>
        </div>
        {tab === "register" && (
          <div style={{ padding: "10px 12px", background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.25)", borderRadius: 10, fontSize: 12, color: "var(--warn)", marginBottom: 13, lineHeight: 1.6 }}>
            ⚠️ Staff accounts require <strong>Admin approval</strong> before accessing the portal. You'll see a pending screen after registering.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tab === "register" && <input className="inp" placeholder="Full Name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />}
          {tab === "register" && (
            <select
              className="inp"
              value={f.designation}
              onChange={e => setF({ ...f, designation: e.target.value })}
              style={{ appearance: 'none', paddingRight: 30 }}
            >
              <option value="" disabled selected>Select Staff Role</option>
              <option value="Sound Designer">Sound Designer</option>
              <option value="Photographer">Photographer</option>
              <option value="Videographer">Videographer</option>
            </select>
          )}
          <input className="inp" type="email" placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
          <div style={{ position: "relative" }}>
            <input
              className="inp"
              type={showPass ? "text" : "password"}
              placeholder="Password"
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
          {tab === "register" && (
            <>
              <input className="inp" type="tel" placeholder="Phone (optional)" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 12, color: "var(--muted)", marginLeft: 4 }}>Provide your ID image</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed var(--border)",
                    borderRadius: 10,
                    padding: "12px",
                    textAlign: "center",
                    cursor: "pointer",
                    fontSize: 13,
                    color: idFile ? "var(--text)" : "var(--muted)",
                    background: "rgba(255,255,255,0.02)"
                  }}
                >
                  {idFile ? `📄 ${idFile.name}` : "Click to upload ID image"}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: "none" }} 
                  accept="image/*"
                  onChange={(e) => setIdFile(e.target.files[0])}
                />
              </div>
            </>
          )}
        </div>
        {err && (
          <div style={{ color: "var(--red)", fontSize: 12, marginTop: 9, padding: "9px 11px", background: "rgba(230,57,70,.08)", borderRadius: 8, whiteSpace: "pre-line" }}>
            ⚠ {err}
          </div>
        )}
        <button className="btn btn-p" style={{ width: "100%", marginTop: 14, padding: 13 }} onClick={submit} disabled={loading}>
          {loading ? <span className="ld"><span>●</span><span>●</span><span>●</span></span> : (tab === "login" ? "Sign In to Staff Portal →" : "Register & Submit for Approval →")}
        </button>
        <button className="btn btn-g" style={{ width: "100%", marginTop: 8 }} onClick={onBack}>
          ← Back to Homepage
        </button>
      </div>
    </div>
  );
}
