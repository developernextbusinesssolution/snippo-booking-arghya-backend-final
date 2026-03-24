import { useState, useEffect } from "react";
import Toasts, { useToast } from "../components/Shared/Toasts";
import { apiRequest, STATIC_BASE } from "../utils/api";
import Pagination from "../components/Shared/Pagination";

function UserBookingDetailModal({ booking, onClose, onExtend }) {
  const bmap = { upcoming: "bu", completed: "bc", cancelled: "bx", active: "ba" };
  const hasExtension = (booking.additionalHours || 0) > 0;
  const originalDur = booking.originalDuration ? parseInt(booking.originalDuration) : 60;
  const totalDur = originalDur + (booking.additionalHours || 0) * 60;
  return (
    <div className="mov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 11, right: 11, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 19, width: 32, height: 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ✕
        </button>
        <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 5, letterSpacing: "-.02em" }}>Booking Details</div>
        <div style={{ marginBottom: 16, display: "flex", gap: 7, flexWrap: "wrap" }}>
          <span className={`badge ${bmap[booking.s]}`}>{booking.s[0].toUpperCase() + booking.s.slice(1)}</span>
          {booking.paid && (
            <span style={{ color: "var(--success)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center" }}>✓ Paid</span>
          )}
          {hasExtension && <span className="badge bw">+{booking.additionalHours}h Extended</span>}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 8 }}>
          BOOKING INFO
        </div>
        {[
          ["Booking ID", booking.id],
          ["Service", booking.svc],
          ["Specialist", booking.stf],
          ["Date", booking.dt],
          ["Time", booking.t],
          ["Amount", booking.p],
        ].map(([l, v]) => (
          <div key={l} className="drow">
            <span style={{ color: "var(--muted)" }}>{l}</span>
            <span style={{ fontWeight: 600 }}>{v}</span>
          </div>
        ))}
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", margin: "14px 0 8px" }}>
          DURATION DETAILS
        </div>
        <div
          style={{ background: "var(--glass)", border: `1px solid ${hasExtension ? "var(--border-red)" : "var(--border)"}`, borderRadius: 12, padding: "12px 14px" }}
        >
          {[
            ["Original Duration", originalDur ? originalDur + " min" : "—"],
            ["Additional Hours", hasExtension ? `+${booking.additionalHours} hour${booking.additionalHours > 1 ? "s" : ""}` : <span key="1" style={{ color: "var(--muted2)" }}>None</span>],
            ["Additional Cost", hasExtension ? <span key="2" style={{ color: "var(--red)", fontWeight: 700 }}>${booking.additionalCost}</span> : <span key="3" style={{ color: "var(--muted2)" }}>—</span>],
            ["Total Duration", totalDur ? totalDur + " min" : "—"],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
              <span style={{ color: "var(--muted)" }}>{l}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          {!hasExtension && (
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "6px 0" }}>
              No extension added to this booking
            </div>
          )}
          {hasExtension && (
            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ fontWeight: 700 }}>Total Charged</span>
              <span style={{ fontWeight: 900, color: "var(--red)", fontSize: 16 }}>{booking.p} + ${booking.additionalCost}</span>
            </div>
          )}
        </div>
        {booking.notes && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", margin: "14px 0 6px" }}>
              NOTES
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", padding: "9px 12px", background: "var(--glass)", borderRadius: 9 }}>
              {booking.notes}
            </div>
          </>
        )}

        {/* Extension Action */}
        {(() => {
          const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" });
          const isToday = booking.dt === today && ["upcoming", "active"].includes(booking.s);
          const maxLeft = 4 - (booking.additionalHours || 0);
          
          if (!isToday && ["upcoming", "active"].includes(booking.s)) {
            return (
              <div style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "var(--muted2)" }}>
                💡 You can extend this booking for the same date only.
              </div>
            );
          }

          if (isToday && maxLeft > 0) {
            return (
              <div style={{ marginTop: 16 }}>
                <button 
                  className="btn btn-p" 
                  style={{ width: "100%", padding: "12px 14px" }}
                  onClick={() => onExtend?.(booking)}
                >
                  ⚡ Add Extra Hours
                </button>
                <div style={{ marginTop: 8, textAlign: "center", fontSize: 11, color: "var(--muted2)" }}>
                  You can extend this booking for the same date only.
                </div>
              </div>
            );
          }
          return null;
        })()}

        <button className="btn btn-g" style={{ width: "100%", marginTop: 16 }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function ExtensionModal({ b, onClose, onUpdated, token, toast }) {
  const [selHours, setSelHours] = useState(0);
  const [extending, setExtending] = useState(false);
  const [extErr, setExtErr] = useState("");
  const [card, setCard] = useState({ num: "", exp: "", cvc: "" });
  
  const currentExtra = b.additionalHours || 0;
  const maxLeft = 4 - currentExtra;
  const options = [1, 2, 3, 4].filter(h => h <= maxLeft);
  
  const originalDur = b.originalDuration ? parseInt(b.originalDuration) : 60;
  const currentDur = originalDur + currentExtra * 60;
  const predictedDur = currentDur + selHours * 60;

  const handleConfirm = async () => {
    if (!selHours) {
      setExtErr("Please select additional hours");
      return;
    }
    if (card.num.replace(/\s/g, "").length < 16) {
      setExtErr("Enter a valid 16-digit card number");
      return;
    }
    if (!card.exp.match(/^\d{2}\/\d{2}$/)) {
      setExtErr("Invalid expiry — use MM/YY");
      return;
    }
    if (card.cvc.length < 3) {
      setExtErr("Enter a valid CVC");
      return;
    }

    setExtending(true);
    setExtErr("");
    await new Promise(r => setTimeout(r, 800)); // Simulate processing
    try {
      const updated = await apiRequest(`/bookings/${b.id}/extend`, { 
        method: "PATCH", 
        token, 
        body: { additionalHours: selHours } 
      });
      onUpdated(updated);
      toast(`Booking extended by ${selHours} hour${selHours > 1 ? "s" : ""}!`, "success");
      onClose();
    } catch (e) {
      setExtErr(e.message || "Extension failed");
    } finally {
      setExtending(false);
    }
  };

  return (
    <div className="mov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 11, right: 11, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 19, width: 32, height: 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ✕
        </button>
        <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 4, letterSpacing: "-.02em" }}>Extend Appointment</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>
          Booking Date: <strong>{b.dt}</strong> · Current: {currentDur} min
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 10 }}>
          SELECT ADDITIONAL HOURS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {options.map(h => (
            <div
              key={h}
              onClick={() => setSelHours(h)}
              style={{
                padding: "12px",
                borderRadius: 12,
                cursor: "pointer",
                border: `2px solid ${selHours === h ? "var(--red)" : "var(--border)"}`,
                background: selHours === h ? "rgba(230,57,70,0.05)" : "var(--glass)",
                transition: "all .2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: selHours === h ? "var(--red)" : "var(--text)" }}>{h} Hour{h > 1 ? "s" : ""}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>+${h * 60}</div>
            </div>
          ))}
        </div>

        {selHours > 0 && (
          <div className="glass" style={{ padding: 16, borderRadius: 14, marginBottom: 20, borderColor: "var(--border-red)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: "var(--muted)" }}>Total Duration After Extension</span>
              <span style={{ fontWeight: 800 }}>{predictedDur} Minutes</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--muted)" }}>Additional Cost</span>
              <span style={{ fontWeight: 800, color: "var(--red)" }}>${selHours * 60}</span>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 10 }}>
          PAYMENT DETAILS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <input 
            className="sinp" 
            placeholder="Card Number" 
            value={card.num} 
            onChange={e => setCard({...card, num: e.target.value.replace(/\D/g,"").replace(/(.{4})/g,"$1 ").trim()})} 
            maxLength={19}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input 
              className="sinp" 
              placeholder="MM/YY" 
              value={card.exp} 
              onChange={e => {
                let v = e.target.value.replace(/\D/g, "");
                if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2, 4);
                setCard({ ...card, exp: v });
              }}
              maxLength={5}
            />
            <input 
              className="sinp" 
              placeholder="CVC" 
              type="password"
              value={card.cvc} 
              onChange={e => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "") })}
              maxLength={4}
            />
          </div>
        </div>

        {extErr && (
          <div style={{ padding: "10px 12px", background: "rgba(230,57,70,0.1)", borderRadius: 10, fontSize: 12, color: "var(--red)", marginBottom: 16, border: "1px solid rgba(230,57,70,0.2)" }}>
            ⚠ {extErr}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-p" 
            style={{ flex: 2 }} 
            onClick={handleConfirm}
            disabled={extending || !selHours}
          >
            {extending ? "Processing..." : `Confirm Extension · $${selHours * 60}`}
          </button>
        </div>
        <div style={{ marginTop: 12, textAlign: "center", fontSize: 11, color: "var(--muted2)" }}>
           Extensions are only allowed on the same booking date.
        </div>
      </div>
    </div>
  );
}



function ReviewModal({ booking, onClose, onSubmitted, token, toast }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiRequest("/reviews", {
        method: "POST",
        token,
        body: { bookingId: booking.id, rating, comment }
      });
      toast("Review submitted! Thank you.", "success");
      onSubmitted();
      onClose();
    } catch (err) {
      toast("Failed to submit review: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <button 
          onClick={onClose} 
          style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18 }}
        >✕</button>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 5, letterSpacing: "-.02em" }}>Add Review</div>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>How was your session with <strong>{booking.stf}</strong>?</p>
        
        <div style={{ textAlign: "center", marginBottom: 25 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <span 
                key={star} 
                onClick={() => setRating(star)}
                style={{ fontSize: 32, cursor: "pointer", filter: rating >= star ? "none" : "grayscale(1) opacity(0.3)", transition: "all .2s" }}
              >
                ⭐
              </span>
            ))}
          </div>
          <div style={{ marginTop: 10, fontWeight: 700, color: "var(--red)" }}>
            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 8 }}>TELL US MORE</div>
        <textarea 
          className="inp" 
          rows={4} 
          placeholder="What did you like? Anything we can improve?" 
          value={comment} 
          onChange={e => setComment(e.target.value)}
          style={{ marginBottom: 20, width: "100%", boxSizing: "border-box" }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>Not now</button>
          <button className="btn btn-p" style={{ flex: 2 }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserDash({ user, onSignOut, bookings, services, staff, onGoHome, token, onUserUpdated, initialTab = "bookings", embedded = false, embedHeader = null, onTabChange, setBookings }) {
  const [tab, setTab] = useState(initialTab);
  const changeTab = t => {
    setTab(t);
    onTabChange?.(t);
  };
  const [prof, setProf] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
  const [saved, setSaved] = useState({ ...prof });
  const [settings, setSettings] = useState({ email: true, sms: false, marketing: false });
  const [bDetail, setBDetail] = useState(null);
  const [extBooking, setExtBooking] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userBookings, setUserBookings] = useState([]);
  const [revBooking, setRevBooking] = useState(null);
  const { toasts, toast } = useToast();
  const getPLimit = () => window.innerWidth < 640 ? 6 : 8;

  const loadBookings = async () => {
    try {
      const limit = getPLimit();
      const res = await apiRequest(`/bookings?page=${page}&limit=${limit}`, { token });
      setUserBookings(res.data || []);
      setTotalPages(res.pages || 1);
    } catch (e) {
      toast(e.message || "Failed to load bookings", "error");
    }
  };

  useEffect(() => {
    loadBookings();
  }, [page]);

  useEffect(() => {
    setTab(initialTab || "bookings");
  }, [initialTab]);

  const myBookings = userBookings;
  const bmap = { upcoming: "bu", completed: "bc", cancelled: "bx", active: "ba" };

  const nav = [
    {
      id: "bookings",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
      l: "My Bookings",
    },
    {
      id: "profile",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      l: "Profile",
    },
    {
      id: "settings",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
      l: "Settings",
    },
  ];

  function ExtendCard({ b }) {
    const [selHours, setSelHours] = useState(0);
    const [extending, setExtending] = useState(false);
    const [extErr, setExtErr] = useState("");
    const [extOk, setExtOk] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [card, setCard] = useState({ num: "", exp: "", cvc: "" });
    const maxLeft = 4 - (b.additionalHours || 0);
    const options = [1, 2, 3, 4].filter(h => h <= maxLeft);

    const handleExtend = async () => {
      if (!selHours) {
        setExtErr("Please select additional hours");
        return;
      }
      if (card.num.replace(/\s/g, "").length < 16) {
        setExtErr("Enter a valid 16-digit card number");
        return;
      }
      if (!card.exp.match(/^\d{2}\/\d{2}$/)) {
        setExtErr("Invalid expiry — use MM/YY");
        return;
      }
      if (card.cvc.length < 3) {
        setExtErr("Enter a valid CVC");
        return;
      }
      setExtending(true);
      setExtErr("");
      await new Promise(r => setTimeout(r, 800));
      try {
        const updated = await apiRequest(`/bookings/${b.id}/extend`, { method: "PATCH", token, body: { additionalHours: selHours } });
        setBookings?.(p => p.map(bk => bk.id === b.id ? { ...bk, ...updated } : bk));
        setExtOk(true);
        toast(`Booking extended by ${selHours} hour${selHours > 1 ? "s" : ""}!`, "success");
      } catch (e) {
        setExtErr(e.message || "Extension failed");
      } finally {
        setExtending(false);
      }
    };

    return (
      <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--border)", borderRadius: 14, padding: "clamp(12px,3vw,18px)", marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{b.svc}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>with {b.stf} · {b.t}</div>
            {(b.additionalHours || 0) > 0 && (
              <div style={{ fontSize: 11, color: "var(--red)", marginTop: 3 }}>
                Already extended: +{b.additionalHours}h (${b.additionalCost})
              </div>
            )}
          </div>
          <span className={`badge ${bmap[b.s]}`}>{b.s[0].toUpperCase() + b.s.slice(1)}</span>
        </div>

        {extOk ? (
          <div style={{ padding: "10px 14px", background: "rgba(34,211,160,.1)", border: "1px solid rgba(34,211,160,.25)", borderRadius: 10, fontSize: 13, color: "var(--success)", fontWeight: 600, textAlign: "center" }}>
            ✓ Booking extended successfully!
          </div>
        ) : maxLeft === 0 ? (
          <div style={{ fontSize: 12, color: "var(--muted)", padding: "8px 12px", background: "rgba(255,255,255,.04)", borderRadius: 8, textAlign: "center" }}>
            Maximum 4 hours extension reached
          </div>
        ) : !showPayment ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 8 }}>
              SELECT ADDITIONAL HOURS
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
              {options.map(h => (
                <div
                  key={h}
                  onClick={() => setSelHours(selHours === h ? 0 : h)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 11,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all .15s",
                    background: selHours === h ? "var(--red)" : "var(--glass)",
                    border: `1px solid ${selHours === h ? "var(--red)" : "var(--border)"}`,
                    color: selHours === h ? "#fff" : "var(--text)",
                    boxShadow: selHours === h ? "0 0 14px var(--red-glow)" : "none",
                  }}
                >
                  +{h}h — ${h * 60}
                </div>
              ))}
            </div>
            {selHours > 0 && (
              <div style={{ padding: "10px 14px", background: "var(--glass)", borderRadius: 10, marginBottom: 12, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "var(--muted)" }}>Additional hours</span>
                  <span style={{ fontWeight: 700 }}>+{selHours} hour{selHours > 1 ? "s" : ""}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "var(--muted)" }}>Rate</span>
                  <span style={{ fontWeight: 700 }}>$60 / hour</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontWeight: 700 }}>Total charge</span>
                  <span style={{ fontWeight: 900, color: "var(--red)", fontSize: 15 }}>${selHours * 60}</span>
                </div>
              </div>
            )}
            <button
              className="btn btn-p btn-sm"
              onClick={() => {
                if (!selHours) {
                  setExtErr("Please select hours first");
                  return;
                }
                setExtErr("");
                setShowPayment(true);
              }}
              disabled={!selHours}
              style={{ width: "100%" }}
            >
              {selHours ? `Proceed to Payment — $${selHours * 60} →` : "Select hours to continue"}
            </button>
            {extErr && (
              <div style={{ color: "var(--red)", fontSize: 12, marginTop: 8, padding: "8px 11px", background: "rgba(230,57,70,.08)", borderRadius: 8 }}>
                ⚠ {extErr}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ padding: "10px 14px", background: "var(--glass)", borderRadius: 10, marginBottom: 12, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "var(--muted)" }}>Extending</span>
                <span style={{ fontWeight: 700 }}>+{selHours} hour{selHours > 1 ? "s" : ""}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                <span style={{ fontWeight: 700 }}>Amount due</span>
                <span style={{ fontWeight: 900, color: "var(--red)", fontSize: 15 }}>${selHours * 60}</span>
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 8 }}>
              PAYMENT DETAILS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 11 }}>
              <div>
                <label className="lbl">CARD NUMBER</label>
                <input
                  className="sinp"
                  placeholder="•••• •••• •••• ••••"
                  maxLength={19}
                  value={card.num}
                  onChange={e => setCard({ ...card, num: e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim() })}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                <div>
                  <label className="lbl">EXPIRY</label>
                  <input
                    className="sinp"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={card.exp}
                    onChange={e => {
                      let v = e.target.value.replace(/\D/g, "");
                      if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2, 4);
                      setCard({ ...card, exp: v });
                    }}
                  />
                </div>
                <div>
                  <label className="lbl">CVC</label>
                  <input
                    className="sinp"
                    placeholder="•••"
                    maxLength={4}
                    value={card.cvc}
                    onChange={e => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "") })}
                  />
                </div>
              </div>
            </div>
            {extErr && (
              <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 9, padding: "8px 11px", background: "rgba(230,57,70,.08)", borderRadius: 8 }}>
                ⚠ {extErr}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-g btn-sm"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowPayment(false);
                  setCard({ num: "", exp: "", cvc: "" });
                  setExtErr("");
                }}
              >
                ← Back
              </button>
              <button className="btn btn-p btn-sm" style={{ flex: 2 }} onClick={handleExtend} disabled={extending}>
                {extending ? <span className="ld"><span>●</span><span>●</span><span>●</span></span> : `🔒 Pay $${selHours * 60} & Extend`}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="dash" style={embedded ? { minHeight: "100vh" } : { paddingTop: "var(--nh)", minHeight: "100vh" }}>
      <div className="sidebar" style={embedded ? { top: 0, height: "100vh" } : undefined}>
        <div style={{ padding: "9px 10px 14px", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#E63946,#7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 15,
              marginBottom: 7,
            }}
          >
            {saved.name[0] || "?"}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{saved.name}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{saved.email}</div>
        </div>
        {nav.map(n => (
          <div key={n.id} className={`sitem ${tab === n.id ? "act" : ""}`} onClick={() => changeTab(n.id)}>
            <span>{n.icon}</span>
            {n.l}
          </div>
        ))}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <div className="sitem" style={{ color: "var(--red)" }} onClick={onSignOut}>
            <span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span>
            Sign Out
          </div>
        </div>
      </div>

      <div className="ca">
        {embedded && embedHeader}

        {tab === "bookings" && (
          <>
            <h1 className="sh">My Bookings</h1>
            <p className="ss">Your upcoming and past appointments</p>
            <button className="btn btn-p btn-sm" style={{ marginBottom: 16 }} onClick={onGoHome}>
              {embedded ? "Back to Booking Form" : "Book New Appointment"}
            </button>



            {myBookings.length === 0 ? (
              <div className="glass" style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>No bookings yet</div>
                <p style={{ color: "var(--muted)", fontSize: 13 }}>Book your first appointment to see it here</p>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>💡 Click any row to view full details</div>
                <div className="glass tw">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Service</th>
                        <th>Specialist</th>
                        <th>Date & Time</th>
                        <th>Amount</th>
                        <th>Extra</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myBookings.map(b => (
                        <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => setBDetail(b)}>
                          <td style={{ fontFamily: "monospace", color: "var(--muted)", fontSize: 11 }}>{b.id}</td>
                          <td style={{ fontWeight: 600 }}>{b.svc}</td>
                          <td style={{ color: "var(--muted)" }}>{b.stf}</td>
                          <td style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{b.dt} - {b.t}</td>
                          <td style={{ fontWeight: 700 }}>{b.p}</td>
                          <td>
                            {(b.additionalHours || 0) > 0 ? (
                              <span style={{ color: "var(--red)", fontWeight: 700 }}>+{b.additionalHours}h Extra</span>
                            ) : (
                              (() => {
                                const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" });
                                const isToday = b.dt === today && ["upcoming", "active"].includes(b.s);
                                const maxLeft = 4 - (b.additionalHours || 0);
                                if (isToday && maxLeft > 0) {
                                  return (
                                    <button 
                                      className="btn btn-p btn-sm" 
                                      style={{ padding: "4px 8px", fontSize: 10, background: "linear-gradient(135deg, #E63946, #d62839)" }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExtBooking(b);
                                      }}
                                    >
                                      ⚡ Add Extra Hours
                                    </button>
                                  );
                                }
                                return <span style={{ color: "var(--muted2)" }}>—</span>;
                              })()
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <span className={`badge ${bmap[b.s]}`}>{b.s[0].toUpperCase() + b.s.slice(1)}</span>
                              {b.s === "completed" && (
                                <button 
                                  className="btn btn-p btn-sm" 
                                  style={{ padding: "4px 8px", fontSize: 10, background: "var(--success)", border: "none" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRevBooking(b);
                                  }}
                                >
                                  Add Review
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination current={page} total={totalPages} onPage={setPage} />
              </>
            )}
            {bDetail && <UserBookingDetailModal booking={bDetail} onClose={() => setBDetail(null)} onExtend={setExtBooking} />}
            {extBooking && (
              <ExtensionModal 
                b={extBooking} 
                onClose={() => setExtBooking(null)} 
                onUpdated={(upd) => setBookings?.(p => p.map(bk => bk.id === upd.id ? { ...bk, ...upd } : bk))}
                token={token}
                toast={toast}
              />
            )}
            {revBooking && (
              <ReviewModal 
                booking={revBooking} 
                onClose={() => setRevBooking(null)} 
                onSubmitted={loadBookings}
                token={token}
                toast={toast}
              />
            )}
          </>
        )}



        {tab === "profile" && (
          <>
            <h1 className="sh">Profile</h1>
            <p className="ss">Update your personal information</p>
            <div className="glass" style={{ padding: "clamp(14px,4vw,24px)", maxWidth: 480 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#E63946,#7c3aed)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {saved.name[0] || "?"}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{saved.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Customer account</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { l: "FULL NAME", k: "name", t: "text" },
                  { l: "EMAIL", k: "email", t: "email" },
                  { l: "PHONE", k: "phone", t: "tel" },
                ].map(fi => (
                  <div key={fi.k}>
                    <label className="lbl">{fi.l}</label>
                    <input className="inp" type={fi.t} value={prof[fi.k] || ""} onChange={e => setProf({ ...prof, [fi.k]: e.target.value })} />
                  </div>
                ))}
                {saved.idDocument && (
                  <div style={{ marginTop: 15, paddingTop: 15, borderTop: "1px solid var(--border)" }}>
                    <label className="lbl">ID VERIFICATION DOCUMENT</label>
                    <div style={{ marginTop: 8, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", background: "#000" }}>
                      <img 
                        src={saved.idDocument.startsWith("http") || saved.idDocument.startsWith("data:") ? saved.idDocument : `${STATIC_BASE}/uploads/ids/${saved.idDocument}`} 
                        alt="ID Proof" 
                        style={{ width: "100%", maxHeight: 200, objectFit: "contain", display: "block" }} 
                      />
                    </div>
                  </div>
                )}
                <button

                  className="btn btn-p"
                  style={{ marginTop: 5 }}
                  onClick={async () => {
                    if (!prof.name.trim()) {
                      toast("Name cannot be empty", "error");
                      return;
                    }
                    try {
                      const res = await apiRequest("/users/me", { method: "PUT", token, body: prof });
                      setSaved({ ...res.user });
                      setProf({ ...res.user });
                      onUserUpdated?.(res.user);
                      toast("Profile saved!", "success");
                    } catch (e) {
                      toast(e.message || "Profile update failed", "error");
                    }
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </>
        )}

        {tab === "settings" && (
          <>
            <h1 className="sh">Settings</h1>
            <p className="ss">Notification preferences</p>
            <div className="glass" style={{ padding: "clamp(13px,3vw,20px)", maxWidth: 480 }}>
              {[
                { k: "email", l: "Email Notifications", d: "Confirmations and reminders" },
                { k: "sms", l: "SMS Reminders", d: "Text before appointments" },
                { k: "marketing", l: "Marketing Emails", d: "Offers and promotions" },
              ].map((item, i) => (
                <div key={item.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{item.l}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{item.d}</div>
                  </div>
                  <div
                    className={`tog ${settings[item.k] ? "on" : ""}`}
                    onClick={() => {
                      setSettings(s => ({ ...s, [item.k]: !s[item.k] }));
                      toast(`${item.l} ${!settings[item.k] ? "enabled" : "disabled"}`, "info");
                    }}
                  />
                </div>
              ))}
              <button className="btn btn-p" style={{ marginTop: 16 }} onClick={() => toast("Settings saved!", "success")}>
                Save Preferences
              </button>
            </div>
          </>
        )}
      </div>

      <div className="bnav">
        {nav.map(n => (
          <div key={n.id} className={`bni ${tab === n.id ? "act" : ""}`} onClick={() => changeTab(n.id)}>
            <span style={{ fontSize: 12 }}>{n.icon}</span>
            <span>{n.l}</span>
          </div>
        ))}
      </div>
      <Toasts toasts={toasts} />
    </div>
  );
}
