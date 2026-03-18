import { useState, useEffect, useRef } from "react";
import Toasts, { useToast } from "../components/Shared/Toasts";
import { apiRequest } from "../utils/api";
import { DAYS, initials, fmtDur, formatDateForUi } from "../utils/helpers";
import { uploadStaffAvatar } from "../utils/supabase";

function BookingDetailModal({ booking, onClose, onUpdateStatus }) {
  if (!booking) return null;

  const bmap = { upcoming: "bu", completed: "bc", cancelled: "bx", active: "ba" };
  const hasExtension = (booking.additionalHours || 0) > 0;
  const originalDur = booking.originalDuration ? parseInt(booking.originalDuration) : 60;
  const totalDur = originalDur + (booking.additionalHours || 0) * 60;

  const now = new Date();
  const todayLabel = formatDateForUi(now);
  const isToday = booking.dt === todayLabel;

  const parseTime = (t) => {
    if (!t) return 0;
    const [time, period] = t.split(" ");
    let [h, m] = time.split(":").map(Number);
    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h * 60 + (m || 0);
  };

  const bookingTimeVal = parseTime(booking.t);
  const currentTimeVal = now.getHours() * 60 + now.getMinutes();
  const timePassed = isToday && currentTimeVal > bookingTimeVal;
  
  // Logic: Staff can Cancel anytime if upcoming. 
  // staff can only COMPLETE if same date and time has passed.
  // However, user requested "popup like admin" which usually shows all buttons. 
  // I will show all buttons but maybe dim "Completed" if not yet time? 
  // Actually, I'll just show all buttons to match the admin experience as requested.

  return (
    <div className="mov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 11, right: 11, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 19, width: 32, height: 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ✕
        </button>
        <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 5, letterSpacing: "-.02em" }}>Booking Details</div>
        <div style={{ marginBottom: 14, display: "flex", gap: 7, flexWrap: "wrap" }}>
          <span className={`badge ${bmap[booking.s]}`}>{booking.s[0].toUpperCase() + booking.s.slice(1)}</span>
          {booking.paid && <span style={{ color: "var(--success)", fontSize: 12, fontWeight: 600 }}>✓ Paid</span>}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 8 }}>BOOKING INFO</div>
        <div style={{ marginBottom: 18 }}>
          {[
            ["Booking ID", booking.id],
            ["Customer", booking.u],
            ["Service", booking.svc],
            ["Date", booking.dt],
            ["Time", booking.t],
            ["Amount", booking.p],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: 13 }}>
              <span style={{ color: "var(--muted)" }}>{l}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", margin: "14px 0 8px" }}>DURATION DETAILS</div>
        <div style={{ background: "var(--glass)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
          {[
            ["Original Duration", originalDur ? originalDur + " min" : "—"],
            ["Additional Hours", hasExtension ? `+${booking.additionalHours} hour${booking.additionalHours > 1 ? "s" : ""}` : "None"],
            ["Additional Cost", hasExtension ? `$${booking.additionalCost}` : "—"],
            ["Total Duration", totalDur ? totalDur + " min" : "—"],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: 13 }}>
              <span style={{ color: "var(--muted)" }}>{l}</span>
              <span style={{ fontWeight: 600, color: l === "Additional Cost" && hasExtension ? "var(--red)" : "var(--text)" }}>{v}</span>
            </div>
          ))}
          {!hasExtension && <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)", textAlign: "center" }}>No extension on this booking</div>}
        </div>

        {booking.notes && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 8 }}>NOTES</div>
            <div className="glass-inner" style={{ padding: 12, borderRadius: 10, fontSize: 13, color: "var(--muted2)", lineHeight: 1.5 }}>
              {booking.notes}
            </div>
          </div>
        )}

        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 10 }}>UPDATE STATUS</div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {["upcoming", "active", "completed", "cancelled"].map(s => {
              const isActive = booking.s === s;
              const isComp = s === "completed";
              const disabled = isComp && !timePassed && booking.s === "upcoming";

              return (
                <button 
                  key={s} 
                  disabled={disabled}
                  className={`btn btn-sm ${isActive ? "btn-p" : "btn-g"}`} 
                  style={{ 
                    flex: 1, 
                    minWidth: "calc(50% - 4px)",
                    opacity: disabled ? 0.4 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                    background: isActive ? "var(--red)" : "rgba(255,255,255,0.03)"
                  }} 
                  onClick={() => onUpdateStatus(booking.id, s)}
                >
                  {s[0].toUpperCase() + s.slice(1)}
                </button>
              );
            })}
          </div>
          {(!timePassed && booking.s === "upcoming") && (
             <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>* completion only allowed after session time</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StaffPortal({ staffUser, allStaff, setAllStaff, bookings, services, onSignOut, token, initialTab = 'schedule', onTabChange }) {
  const me = allStaff.find(s => s.email === staffUser?.email) || staffUser?.staffData || staffUser?.staffRef;
  const isPending = me?.status === "pending" || staffUser?.staffData?.status === "pending";
  const [tab, setTab] = useState(initialTab);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => { setTab(initialTab); }, [initialTab]);
  useEffect(() => { if (tab === "reviews") fetchReviews(); }, [tab]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await apiRequest(`/reviews/staff/${me?.id || staffUser?.staffId}`);
      setReviews(res || []);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await apiRequest(`/bookings/${bookingId}/status`, { method: "PATCH", token, body: { status } });
      toast(`Booking ${status}!`, "success");
      setSelectedBooking(null);
      // Small delay to ensure DB catchup before reload or state update
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast("Update failed: " + err.message, "error");
    }
  };

  const changeTab = t => { setTab(t); onTabChange?.(t); };
  const [prof, setProf] = useState({
    name: me?.name || staffUser?.name || "",
    role: me?.role || "",
    email: me?.email || staffUser?.email || "",
    profileImage: me?.profileImage || "",
    experience: me?.experience || "",
    totalWorkDone: me?.totalWorkDone || 0,
    bio: me?.bio || "",
    hourlyRate: me?.hourlyRate || 0,
  });
  const [saved, setSaved] = useState({ ...prof });
  const [avail, setAvail] = useState(me?.avail || [true, true, true, true, true, false, false]);
  const [myServices, setMyServices] = useState(me?.services || []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { toasts, toast } = useToast();
  const myBookings = bookings.filter(b => b.stf === me?.name || b.stf === staffUser?.name);
  const bmap = { upcoming: "bu", completed: "bc", cancelled: "bx", active: "ba" };

  const nav = [
    {
      id: "schedule",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
      l: "Schedule",
    },
    {
      id: "services",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      ),
      l: "My Services",
    },
    {
      id: "availability",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
      l: "Availability",
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
      id: "reviews",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
      l: "Reviews",
    },
  ];

  const toggleSvc = id => setMyServices(p => (p.includes(id) ? p.filter(s => s !== id) : [...p, id]));

  const saveAvail = async () => {
    try {
      const updated = await apiRequest("/staff/me/availability", { method: "PUT", token, body: { avail } });
      if (me?.id) setAllStaff(p => p.map(s => (s.id === me.id ? { ...s, ...updated } : s)));
      toast("Availability saved!", "success");
    } catch (e) {
      toast(e.message || "Failed to save availability", "error");
    }
  };

  const saveSvcs = async () => {
    try {
      const updated = await apiRequest("/staff/me/services", { method: "PUT", token, body: { services: myServices } });
      if (me?.id) setAllStaff(p => p.map(s => (s.id === me.id ? { ...s, ...updated } : s)));
      toast("Services updated!", "success");
    } catch (e) {
      toast(e.message || "Failed to save services", "error");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadStaffAvatar(file, me?.id || "staff");
      setProf(p => ({ ...p, profileImage: url }));
      toast("Image uploaded!", "success");
    } catch (err) {
      toast(err.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  if (isPending) {
    return (
      <div className="pending-wrap">
        <div className="pending-icon">⏳</div>
        <h2 style={{ fontSize: "clamp(20px,4vw,26px)", fontWeight: 900, marginBottom: 10, letterSpacing: "-.03em" }}>Admin Approval Required</h2>
        <p style={{ color: "var(--muted)", maxWidth: 380, lineHeight: 1.7, marginBottom: 20, fontSize: 14 }}>
          Your staff account is currently <strong style={{ color: "var(--text)" }}>inactive</strong> and awaiting admin review. You'll receive access once an administrator approves your application.
        </p>
        <div className="glass" style={{ padding: "clamp(14px,4vw,28px)", maxWidth: 380, textAlign: "left", marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 12 }}>APPLICATION STATUS</div>
          {[
            ["Name", staffUser?.name || me?.name],
            ["Email", staffUser?.email || me?.email],
            ["Role", me?.role || "Specialist"],
            ["Status", <span key="status" className="badge bc">Account: Inactive</span>],
            ["Approval", <span key="approval" className="badge bw">⏳ Pending</span>],
          ].map(([l, v]) => (
            <div key={l} className="srow">
              <span className="slbl">{l}</span>
              <span className="sval">{v}</span>
            </div>
          ))}
        </div>
        <p style={{ color: "var(--muted2)", fontSize: 12, marginBottom: 16 }}>The admin has been notified of your registration.</p>
        <button className="btn btn-danger btn-sm" onClick={onSignOut}>
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="dash">
      <div className="sidebar">
        <div style={{ padding: "9px 10px 13px", borderBottom: "1px solid var(--border)", marginBottom: 7 }}>
          {/* Sidebar avatar: show uploaded image or initials */}
          {saved.profileImage ? (
            <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", marginBottom: 7 }}>
              <img src={saved.profileImage} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : (
            <div className="avt" style={{ background: `linear-gradient(135deg,${me?.c || "#7c3aed"},rgba(0,0,0,.3))`, width: 36, height: 36, fontSize: 13, marginBottom: 7 }}>
              {me?.i || initials(saved.name)}
            </div>
          )}
          <div style={{ fontSize: 13, fontWeight: 700 }}>{saved.name}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{saved.role}</div>
        </div>
        {nav.map(n => (
          <div key={n.id} className={`sitem ${tab === n.id ? "act" : ""}`} onClick={() => changeTab(n.id)}>
            <span>{n.icon}</span>
            {n.l}
          </div>
        ))}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
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
        {tab === "schedule" && (
          <>
            <h1 className="sh">My Schedule</h1>
            <p className="ss">Your upcoming appointments</p>
            {myBookings.length === 0 ? (
              <div className="glass" style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Schedule is clear</div>
                <p style={{ color: "var(--muted)", fontSize: 13 }}>No upcoming bookings</p>
              </div>
            ) : (
              <div className="glass tw">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Client</th>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myBookings.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontFamily: "monospace", color: "var(--muted)", fontSize: 11 }}>{b.id}</td>
                        <td style={{ fontWeight: 600 }}>{b.u}</td>
                        <td>{b.svc}</td>
                        <td style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{b.dt}</td>
                        <td>{b.t}</td>
                        <td style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span className={`badge ${bmap[b.s]}`}>{b.s[0].toUpperCase() + b.s.slice(1)}</span>
                          <button 
                            className="btn btn-g btn-sm" 
                            style={{ padding: "3px 8px", fontSize: 10, height: "auto" }}
                            onClick={() => setSelectedBooking(b)}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {tab === "services" && (
          <>
            <h1 className="sh">My Services</h1>
            <p className="ss">Select the services you're qualified to perform</p>
            <div className="glass" style={{ padding: "clamp(14px,3vw,22px)", maxWidth: 600 }}>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 18 }}>
                {services
                  .filter(s => s.active)
                  .map(s => (
                    <div key={s.id} className={`svc-pill ${myServices.includes(s.id) ? "on" : ""}`} onClick={() => toggleSvc(s.id)}>
                      <div className="svc-thumb">{s.img && <img src={s.img} alt={s.name} />}</div>
                      {myServices.includes(s.id) ? "✓ " : ""}
                      {s.name}
                    </div>
                  ))}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
                Selected: <strong style={{ color: "var(--text)" }}>{myServices.length}</strong> service{myServices.length !== 1 ? "s" : ""}
              </div>
              <button className="btn btn-p btn-sm" onClick={saveSvcs}>
                Save My Services
              </button>
            </div>
          </>
        )}
        {tab === "availability" && (
          <>
            <h1 className="sh">Availability</h1>
            <p className="ss">Set your working days</p>
            <div className="glass" style={{ padding: "clamp(14px,3vw,22px)", maxWidth: 480 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                {DAYS.map((d, i) => (
                  <div
                    key={d}
                    onClick={() => {
                      const a = [...avail];
                      a[i] = !a[i];
                      setAvail(a);
                    }}
                    style={{
                      padding: "9px 16px",
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      background: avail[i] ? "var(--red-dim)" : "var(--glass)",
                      border: `1px solid ${avail[i] ? "var(--border-red)" : "var(--border)"}`,
                      color: avail[i] ? "var(--red)" : "var(--muted)",
                      transition: "all .15s",
                    }}
                  >
                    {d.slice(0, 3)}
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 14 }}>
                {DAYS.map((d, i) => (
                  <div key={d} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                    <span style={{ color: avail[i] ? "var(--text)" : "var(--muted)" }}>{d}</span>
                    <span style={{ color: avail[i] ? "var(--success)" : "var(--muted2)", fontWeight: 600 }}>{avail[i] ? "9:00 AM – 6:00 PM" : "Day off"}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-p btn-sm" onClick={saveAvail}>
                Save Availability
              </button>
            </div>
          </>
        )}
        {tab === "profile" && (
          <>
            <h1 className="sh">My Profile</h1>
            <p className="ss">Update your public profile</p>
            <div className="glass" style={{ padding: "clamp(13px,3vw,22px)", maxWidth: 460 }}>

              {/* ── Avatar upload section ── */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 22, paddingBottom: 18, borderBottom: "1px solid var(--border)", gap: 10 }}>
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  title="Click to upload profile image"
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: prof.profileImage
                      ? "transparent"
                      : `linear-gradient(135deg,${me?.c || "#7c3aed"},rgba(0,0,0,.3))`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 30,
                    fontWeight: 800,
                    cursor: "pointer",
                    border: "2.5px dashed rgba(255,255,255,.18)",
                    position: "relative",
                    transition: "opacity .15s",
                    opacity: uploading ? 0.6 : 1,
                  }}
                >
                  {prof.profileImage ? (
                    <img src={prof.profileImage} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    me?.i || initials(prof.name)
                  )}
                  {/* Hover overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,.45)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      opacity: 0,
                      transition: "opacity .15s",
                    }}
                    className="avatar-overlay"
                  >
                    📷
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarUpload}
                />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{saved.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{saved.role}</div>
                  <button
                    className="btn btn-g btn-sm"
                    style={{ fontSize: 11, padding: "4px 12px" }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading…" : prof.profileImage ? "Change Photo" : "Upload Photo"}
                  </button>
                </div>
              </div>

              {/* ── Form fields ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <div>
                  <label className="lbl">FULL NAME</label>
                  <input className="inp" type="text" value={prof.name || ""} onChange={e => setProf({ ...prof, name: e.target.value })} />
                </div>
                <div>
                  <label className="lbl">DESIGNATION</label>
                  <input className="inp" type="text" value={prof.role || ""} onChange={e => setProf({ ...prof, role: e.target.value })} />
                </div>
                <div>
                  <label className="lbl">EMAIL</label>
                  <input className="inp" type="email" value={prof.email || ""} onChange={e => setProf({ ...prof, email: e.target.value })} />
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 11 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 11 }}>PROFESSIONAL DETAILS</div>
                </div>

                <div>
                  <label className="lbl">WORK EXPERIENCE</label>
                  <input
                    className="inp"
                    type="text"
                    placeholder="e.g. 5 Years Experience"
                    value={prof.experience || ""}
                    onChange={e => setProf({ ...prof, experience: e.target.value })}
                  />
                </div>
                <div>
                  <label className="lbl">TOTAL WORK DONE (PROJECTS)</label>
                  <input
                    className="inp"
                    type="number"
                    min="0"
                    placeholder="e.g. 120"
                    value={prof.totalWorkDone || ""}
                    onChange={e => setProf({ ...prof, totalWorkDone: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div>
                  <label className="lbl">BIO</label>
                  <textarea
                    className="inp"
                    rows={4}
                    placeholder="Write a short professional description…"
                    value={prof.bio || ""}
                    onChange={e => setProf({ ...prof, bio: e.target.value })}
                    style={{ resize: "vertical", minHeight: 90 }}
                  />
                </div>

                <button
                  className="btn btn-p btn-sm"
                  style={{ marginTop: 4, alignSelf: "flex-start" }}
                  disabled={uploading}
                  onClick={async () => {
                    try {
                      const updated = await apiRequest("/staff/me/profile", {
                        method: "PUT",
                        token,
                        body: {
                          name: prof.name,
                          role: prof.role,
                          email: prof.email,
                          profileImage: prof.profileImage,
                          experience: prof.experience,
                          totalWorkDone: prof.totalWorkDone,
                          bio: prof.bio,
                        },
                      });
                      setSaved({ ...prof, ...updated });
                      setProf(p => ({ ...p, ...updated }));
                      if (me?.id) setAllStaff(p => p.map(s => (s.id === me.id ? { ...s, ...updated } : s)));
                      toast("Profile saved!", "success");
                    } catch (e) {
                      toast(e.message || "Failed to save profile", "error");
                    }
                  }}
                >
                  Save Changes
                </button>
              </div>

              {/* Hourly Rate card */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 11 }}>PRICING</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label className="lbl">HOURLY RATE ($/hr)</label>
                    <input
                      className="inp"
                      type="number"
                      min="0"
                      step="5"
                      placeholder="e.g. 80"
                      value={prof.hourlyRate || ""}
                      onChange={e => setProf({ ...prof, hourlyRate: parseFloat(e.target.value) || 0 })}
                    />
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                      A 15% admin commission will be added automatically. Client price = (Hourly Rate + 15%) × duration.
                    </div>
                  </div>
                  <button
                    className="btn btn-p btn-sm"
                    style={{ alignSelf: "flex-start" }}
                    onClick={async () => {
                      try {
                        const updated = await apiRequest("/staff/me/rate", {
                          method: "PUT",
                          token,
                          body: { hourlyRate: prof.hourlyRate },
                        });
                        setSaved(p => ({ ...p, hourlyRate: prof.hourlyRate }));
                        if (me?.id) setAllStaff(p => p.map(s => (s.id === me.id ? { ...s, ...updated } : s)));
                        toast("Rate saved!", "success");
                      } catch (e) {
                        toast(e.message || "Failed to save rate", "error");
                      }
                    }}
                  >
                    Save Rate
                  </button>
                </div>
              </div>
            </div>

            {/* Inline CSS for avatar hover overlay */}
            <style>{`
              .avatar-overlay { pointer-events: none; }
              div:hover > .avatar-overlay { opacity: 1 !important; }
            `}</style>
          </>
        )}
        {tab === "reviews" && (
          <>
            <h1 className="sh">Client Reviews</h1>
            <p className="ss">Feedback from your completed sessions</p>
            {loadingReviews ? (
              <div style={{ textAlign: "center", padding: 40 }}>Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="glass" style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>No reviews yet</div>
                <p style={{ color: "var(--muted)", fontSize: 13 }}>Completed bookings will appear here once clients leave feedback.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 600 }}>
                {reviews.map(r => (
                  <div key={r.id} className="glass" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{r.user_name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ fontSize: 14 }}>
                        {"⭐".repeat(r.rating)}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.8)" }}>
                      "{r.comment}"
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <div className="bnav">
        {nav.map(n => (
          <div key={n.id} className={`bni ${tab === n.id ? "act" : ""}`} onClick={() => changeTab(n.id)}>
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            <span>{n.l}</span>
          </div>
        ))}
      </div>
      <Toasts toasts={toasts} />
      {selectedBooking && (
        <BookingDetailModal 
          booking={selectedBooking} 
          onClose={() => setSelectedBooking(null)} 
          onUpdateStatus={handleUpdateStatus} 
        />
      )}
    </div>
  );
}
