import { useState, useEffect } from "react";
import { MNS, DS, TIMES, cal, fmtDur } from "../../utils/helpers";
import Progress from "../Shared/Progress";
import StaffDetailsModal from "../Shared/StaffDetailsModal";
import { apiRequest } from "../../utils/api";

function StepDate({ sel, onSel }) {
  const now = new Date();
  const [mn, setMn] = useState(now.getMonth());
  const [yr, setYr] = useState(now.getFullYear());
  const days = cal(yr, mn);
  const selStr = sel ? `${sel.getFullYear()}-${sel.getMonth()}-${sel.getDate()}` : "";

  return (
    <div className="se anim-fade-in">
      <div className="glass" style={{ padding: 24, maxWidth: 450, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button className="btn btn-g btn-sm btn-icon" onClick={() => (mn === 0 ? (setMn(11), setYr(y => y - 1)) : setMn(m => m - 1))}>‹</button>
          <span style={{ fontWeight: 800, fontSize: 16 }}>{MNS[mn]} {yr}</span>
          <button className="btn btn-g btn-sm btn-icon" onClick={() => (mn === 11 ? (setMn(0), setYr(y => y + 1)) : setMn(m => m + 1))}>›</button>
        </div>
        <div className="calg">
          {DS.map(d => <div key={d} className="cdn">{d}</div>)}
          {days.map((d, i) => {
            if (!d) return <div key={i} className="cd cem" />;
            const date = new Date(yr, mn, d);
            const past = date < new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const today = d === now.getDate() && mn === now.getMonth() && yr === now.getFullYear();
            return (
              <div
                key={i}
                className={`cd${past ? " cpast" : ""}${today ? " ctoday" : ""}${selStr === `${yr}-${mn}-${d}` ? " csel" : ""}`}
                onClick={() => !past && onSel(date)}
              >
                {d}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepTime({ sel, onSel, busySlots, stf, date, onBackToDate }) {
  const blockedTimes = (busySlots || [])
    .filter(b => (!stf || b.staffId === stf.id) && b.dt === (date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }) : ""))
    .map(b => b.t);

  if (TIMES.every(t => blockedTimes.includes(t))) {
    return (
      <div className="se anim-fade-in" style={{ textAlign: "center", padding: 40 }}>
        <div className="glass" style={{ padding: 40, borderRadius: 24, background: "rgba(230,57,70,0.05)" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
          <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, color: "var(--red)" }}>Fully Booked</h3>
          <p style={{ color: "var(--muted)", maxWidth: 350, margin: "0 auto 24px" }}>
            All slots are booked for {date?.toLocaleDateString("en-US", { month: "long", day: "numeric" })}.
          </p>
          <button className="btn btn-g" onClick={() => onBackToDate()}>Return to Calendar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="se anim-fade-in">
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 16, textAlign: "center" }}>SELECT A TIME SLOT</div>
        <div className="tg">
          {TIMES.map(t => {
            const disabled = blockedTimes.includes(t);
            return (
              <div
                key={t}
                className={`ts${disabled ? " tbk" : ""}${sel === t ? " tsel" : ""}`}
                onClick={() => !disabled && onSel(t)}
              >
                {t}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepService({ sel, onSel, services }) {
  return (
    <div className="se anim-fade-in">
      <div className="sg">
        {services.filter(s => s.active).map(s => (
          <div key={s.id} className={`scard ${sel?.id === s.id ? "sel" : ""}`} onClick={() => onSel(s)}>
            <div className="simg">
              {s.img ? <img src={s.img} alt={s.name} /> : <div className="simg-fb">🧖</div>}
            </div>
            <div className="sbody">
              <div className="sname">{s.name}</div>
              <div className="sdesc">{s.desc}</div>
              <div className="smeta">
                <span className="sprice">${s.price}</span>
                <span className="sdur">⏱ {fmtDur(s.dur)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepStaff({ sel, onSel, staff, svcId, onDetails, onBackToSvc, onBackToTime }) {
  const list = staff.filter(s => s.active && (!svcId || s.services.includes(svcId)));
  if (list.length === 0) {
    return (
      <div className="se anim-fade-in" style={{ textAlign: "center", padding: 40 }}>
        <div className="glass" style={{ padding: 40 }}>
          <h3>No Specialists Available</h3>
          <button className="btn btn-g" onClick={onBackToSvc}>Change Service</button>
        </div>
      </div>
    );
  }
  return (
    <div className="se anim-fade-in">
      <div className="staffg" style={{ gap: 16 }}>
        {list.map(s => (
          <div key={s.id} className={`stcard ${sel?.id === s.id ? "sel" : ""}`} style={{ padding: 16 }}>
            <div onClick={() => onSel(s)} style={{ cursor: "pointer" }}>
              <div className="avt" style={{ width: 64, height: 64, margin: "0 auto 12px", background: `linear-gradient(135deg,${s.c},rgba(0,0,0,.3))` }}>
                {s.profileImage ? <img src={s.profileImage} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : s.i}
              </div>
              <div style={{ fontWeight: 800 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.role}</div>
            </div>
            <button className="btn btn-g btn-sm" style={{ marginTop: 12, width: "100%" }} onClick={() => onDetails(s)}>Details</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepAccount({ det, onChange, user, onLoginClick }) {
  if (user) return (
    <div className="se anim-fade-in" style={{ maxWidth: 500, margin: "0 auto" }}>
      <div className="glass" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Profile Details</h3>
        <p style={{ fontWeight: 700, marginBottom: 20 }}>{user.name} ({user.email})</p>
        
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 12 }}>BILLING ADDRESS (Required for Stripe India)</div>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
            <input className="inp" style={{ gridColumn: "span 2" }} placeholder="Street Address" value={det.address || ""} onChange={e => onChange({ ...det, address: e.target.value })} />
            <input className="inp" placeholder="City" value={det.city || ""} onChange={e => onChange({ ...det, city: e.target.value })} />
            <input className="inp" placeholder="Zip / Postal Code" value={det.zip || ""} onChange={e => onChange({ ...det, zip: e.target.value })} />
            <input className="inp" placeholder="State / Province" value={det.state || ""} onChange={e => onChange({ ...det, state: e.target.value })} />
            <input className="inp" placeholder="Country (e.g., US, IN)" value={det.country || ""} onChange={e => onChange({ ...det, country: e.target.value.toUpperCase().slice(0, 2) })} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="se anim-fade-in" style={{ maxWidth: 500, margin: "0 auto" }}>
      <div className="glass" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontWeight: 800 }}>Create Your Account</h3>
          <button className="btn btn-g btn-sm" onClick={onLoginClick}>Sign In Instead</button>
        </div>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
          <input className="inp" style={{ gridColumn: "span 2" }} placeholder="Full Name" value={det.name || ""} onChange={e => onChange({ ...det, name: e.target.value })} />
          <input className="inp" style={{ gridColumn: "span 2" }} type="email" placeholder="Email" value={det.email || ""} onChange={e => onChange({ ...det, email: e.target.value })} />
          <input className="inp" type="password" placeholder="Password" value={det.password || ""} onChange={e => onChange({ ...det, password: e.target.value })} />
          <input className="inp" placeholder="Phone" value={det.phone || ""} onChange={e => onChange({ ...det, phone: e.target.value })} />
          
          <div style={{ gridColumn: "span 2", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16, marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 12 }}>BILLING ADDRESS (Required for Stripe India)</div>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
              <input className="inp" style={{ gridColumn: "span 2" }} placeholder="Street Address" value={det.address || ""} onChange={e => onChange({ ...det, address: e.target.value })} />
              <input className="inp" placeholder="City" value={det.city || ""} onChange={e => onChange({ ...det, city: e.target.value })} />
              <input className="inp" placeholder="Zip / Postal Code" value={det.zip || ""} onChange={e => onChange({ ...det, zip: e.target.value })} />
              <input className="inp" placeholder="State / Province" value={det.state || ""} onChange={e => onChange({ ...det, state: e.target.value })} />
              <input className="inp" placeholder="Country (2-letter code, e.g., US, IN)" value={det.country || ""} onChange={e => onChange({ ...det, country: e.target.value.toUpperCase().slice(0, 2) })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepIdentity({ det, onChange, user }) {
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onChange({ ...det, idImage: reader.result });
    reader.readAsDataURL(file);
  };

  if (user?.idDocument) {
    return (
      <div className="se anim-fade-in" style={{ textAlign: "center", padding: 40 }}>
        <div className="glass" style={{ padding: 32 }}>
          <h3 style={{ fontWeight: 800 }}>Identity Verified</h3>
          <img src={user.idDocument} alt="ID" style={{ width: 120, height: 80, borderRadius: 8, marginTop: 20 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="se anim-fade-in" style={{ maxWidth: 500, margin: "0 auto" }}>
      <div className="glass" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 20, fontWeight: 800 }}>Identity Verification</h3>
        <div 
          style={{ border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 12, padding: 24, textAlign: "center", cursor: "pointer" }}
          onClick={() => document.getElementById('id-upload').click()}
        >
          {det.idImage ? <img src={det.idImage} alt="ID" style={{ maxWidth: "100%", maxHeight: 180 }} /> : <div>Upload ID Image</div>}
          <input id="id-upload" type="file" hidden accept="image/*" onChange={handleFile} />
        </div>
      </div>
    </div>
  );
}

export default function BookingForm({ services, staff, bookings, onUserAuth, onNavigateToPayment, user, onLoginClick }) {
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [svc, setSvc] = useState(null);
  const [stf, setStf] = useState(null);
  const [det, setDet] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const back = () => setStep(s => Math.max(0, s - 1));
  const next = () => setStep(s => s + 1);

  const handleContinueFromAccount = async () => {
    if (user) {
      if (user.idDocument) handleFinishSummary();
      else setStep(5);
      return;
    }
    if (!det.name || !det.email || !det.password) return alert("Required fields missing");
    setLoading(true);
    try {
      const res = await apiRequest("/auth/check-email", { method: "POST", body: { email: det.email } });
      if (res.exists) {
        if (confirm("Email exists. Sign in?")) onLoginClick();
        setLoading(false);
        return;
      }
      setStep(5);
    } catch (err) { alert("Check failed"); }
    finally { setLoading(false); }
  };

  const handleFinishSummary = (overrideDet) => {
    const summary = {
      serviceId: svc?.id, staffId: stf?.id, svc: svc?.name, stf: stf?.name,
      dt: date?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }),
      t: time, p: svc?.price, det: overrideDet || det
    };
    sessionStorage.setItem("last_booking_summary", JSON.stringify(summary));
    onNavigateToPayment("summary");
  };

  const handleFinishRegistration = async () => {
    if (!user) {
      if (!det.idImage) return alert("ID required");
      setLoading(true);
      try {
        const res = await apiRequest("/auth/register-user", { method: "POST", body: det });
        if (res.token && res.user && onUserAuth) onUserAuth({ token: res.token, user: res.user });
      } catch (err) {
        alert(err.message || "Registration failed");
        setLoading(false);
        return;
      }
    }
    handleFinishSummary();
    setLoading(false);
  };

  useEffect(() => {
    if (user && (!det.name || !det.email)) {
      setDet(prev => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
        address: prev.address || user.address || "",
        city: prev.city || user.city || "",
        state: prev.state || user.state || "",
        zip: prev.zip || user.zip || "",
        country: prev.country || user.country || ""
      }));
    }
  }, [user, det.name, det.email]);

  useEffect(() => {
    if (user && (step === 4 || step === 5)) {
      // If address is missing and we are on the account step, don't auto-skip
      const hasAddress = det.address && det.city && det.zip && det.country;
      if (step === 4 && !hasAddress) return;

      if (user.idDocument) {
        const updated = {
          ...det,
          name: det.name || user.name || "",
          email: det.email || user.email || "",
          phone: det.phone || user.phone || "",
          address: det.address || user.address || "",
          city: det.city || user.city || "",
          state: det.state || user.state || "",
          zip: det.zip || user.zip || "",
          country: det.country || user.country || ""
        };
        setDet(updated);
        handleFinishSummary(updated);
      }
      else if (step === 4) setStep(5);
    }
  }, [user, step]);

  const steps = ["Date", "Time", "Service", "Staff", "Account", "Identity"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <Progress step={step} steps={steps} />
      <div style={{ minHeight: 400 }}>
        {step === 0 && <StepDate sel={date} onSel={d => { setDate(d); next(); }} />}
        {step === 1 && <StepTime sel={time} onSel={t => { setTime(t); next(); }} busySlots={bookings} stf={stf} date={date} onBackToDate={back} />}
        {step === 2 && <StepService sel={svc} onSel={s => { setSvc(s); next(); }} services={services} />}
        {step === 3 && <StepStaff sel={stf} onSel={s => { setStf(s); next(); }} staff={staff} svcId={svc?.id} onDetails={setSelectedStaff} onBackToSvc={back} onBackToTime={() => setStep(1)} />}
        {step === 4 && <StepAccount det={det} onChange={setDet} user={user} onLoginClick={onLoginClick} />}
        {step === 5 && <StepIdentity det={det} onChange={setDet} user={user} />}
      </div>
      <div className="bfoot" style={{ justifyContent: "center", gap: 16 }}>
        {step > 0 && <button className="btn btn-g" onClick={back}>← Back</button>}
        {step === 4 && <button className="btn btn-p" onClick={handleContinueFromAccount} disabled={loading}>{loading ? "Checking..." : "Continue →"}</button>}
        {step === 5 && <button className="btn btn-p" onClick={handleFinishRegistration} disabled={loading}>{loading ? "Processing..." : (user ? "Review Summary →" : "Create Profile →")}</button>}
      </div>
      {selectedStaff && <StaffDetailsModal member={selectedStaff} onClose={() => setSelectedStaff(null)} />}
      <style>{`.anim-fade-in { animation: fadeIn 0.4s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
