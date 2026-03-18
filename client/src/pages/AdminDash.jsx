import { useState, useEffect } from "react";
import Toasts, { useToast } from "../components/Shared/Toasts";
import Confirm from "../components/Shared/Confirm";
import { apiRequest, STATIC_BASE } from "../utils/api";
import { DAYS, COLORS, initials, fmtDur } from "../utils/helpers";
import Pagination from "../components/Shared/Pagination";



function ServiceModal({ svc, onSave, onClose, services: _ }) {
  const [f, setF] = useState(svc || { name: "", desc: "", price: "", dur: "60", img: "", active: true });
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="mov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 11, right: 11, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 19, width: 32, height: 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          X
        </button>
        <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 18, letterSpacing: "-.02em" }}>{svc ? "Edit Service" : "Add New Service"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div>
            <label className="lbl">SERVICE NAME</label>
            <input className="inp" placeholder="e.g. Hot Stone Massage" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          </div>
          <div>
            <label className="lbl">DESCRIPTION</label>
            <textarea className="inp" placeholder="Brief description..." value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} />
          </div>
          <div>
            <label className="lbl">SERVICE IMAGE URL</label>
            <input className="inp" placeholder="https://images.unsplash.com/..." value={f.img} onChange={e => { setF({ ...f, img: e.target.value }); setImgErr(false); }} />
            {f.img && (
              <div style={{ marginTop: 9, borderRadius: 11, overflow: "hidden", height: 120, background: "#0d0d1a", border: "1px solid var(--border)" }}>
                {!imgErr ? (
                  <img src={f.img} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImgErr(true)} />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red)", fontSize: 13 }}>Invalid image URL</div>
                )}
              </div>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            <div>
              <label className="lbl">PRICE ($)</label>
              <input className="inp" type="number" placeholder="120" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} />
            </div>
            <div>
              <label className="lbl">DURATION</label>
              <select className="inp" value={f.dur} onChange={e => setF({ ...f, dur: e.target.value })}>
                {[["30", "30 min"], ["45", "45 min"], ["60", "1 hour"], ["90", "1h 30m"], ["120", "2 hours"], ["150", "2h 30m"], ["180", "3 hours"]].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div className={`tog ${f.active ? "on" : ""}`} onClick={() => setF({ ...f, active: !f.active })} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Service is {f.active ? "Active" : "Inactive"}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 9, marginTop: 20 }}>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-p" style={{ flex: 1 }} onClick={() => { if (!f.name || !f.price) return; onSave(f); }}>
            {svc ? "Save Changes" : "Add Service"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StaffModal({ member, services, onSave, onClose }) {
  const [f, setF] = useState(member || { name: "", role: "", email: "", i: "", c: COLORS[0], services: [], avail: [true, true, true, true, true, false, false] });
  const tSvc = id => setF(p => ({ ...p, services: p.services.includes(id) ? p.services.filter(s => s !== id) : [...p.services, id] }));
  const tDay = i => setF(p => { const a = [...p.avail]; a[i] = !a[i]; return { ...p, avail: a }; });
  return (
    <div className="mov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 11, right: 11, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 19, width: 32, height: 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          X
        </button>
        <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 18, letterSpacing: "-.02em" }}>{member ? "Edit Staff Member" : "Add Staff Member"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            <div>
              <label className="lbl">FULL NAME</label>
              <input className="inp" placeholder="e.g. Aria Chen" value={f.name} onChange={e => setF({ ...f, name: e.target.value, i: initials(e.target.value) })} />
            </div>
            <div>
              <label className="lbl">DESIGNATION</label>
              <input className="inp" placeholder="e.g. Senior Aesthetician" value={f.role} onChange={e => setF({ ...f, role: e.target.value })} />
            </div>
            <div>
              <label className="lbl">HOURLY RATE ($)</label>
              <input className="inp" type="number" placeholder="100" value={f.hourlyRate || ""} onChange={e => setF({ ...f, hourlyRate: parseFloat(e.target.value || 0) })} />
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                +15% admin commission will be added automatically.
              </div>
            </div>
          </div>
          <div>
            <label className="lbl">EMAIL</label>
            <input className="inp" type="email" placeholder="staff@snippoentertainment.com" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
          </div>
          <div>
            <label className="lbl">AVATAR COLOR</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setF({ ...f, c })} style={{ width: 30, height: 30, borderRadius: "50%", background: c, cursor: "pointer", border: f.c === c ? "3px solid white" : "3px solid transparent", transition: "all .15s" }} />
              ))}
            </div>
          </div>
          <div>
            <label className="lbl">ASSIGNED SERVICES</label>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {services.map(s => (
                <div
                  key={s.id}
                  onClick={() => tSvc(s.id)}
                  style={{
                    padding: "5px 11px",
                    borderRadius: 18,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: f.services.includes(s.id) ? "var(--red-dim)" : "var(--glass)",
                    border: `1px solid ${f.services.includes(s.id) ? "var(--border-red)" : "var(--border)"}`,
                    color: f.services.includes(s.id) ? "var(--red)" : "var(--muted)",
                    transition: "all .15s",
                  }}
                >
                  {s.name}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="lbl">AVAILABILITY</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {DAYS.map((d, i) => (
                <div
                  key={d}
                  onClick={() => tDay(i)}
                  style={{
                    padding: "5px 11px",
                    borderRadius: 18,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: f.avail[i] ? "var(--red-dim)" : "var(--glass)",
                    border: `1px solid ${f.avail[i] ? "var(--border-red)" : "var(--border)"}`,
                    color: f.avail[i] ? "var(--red)" : "var(--muted2)",
                    transition: "all .15s",
                  }}
                >
                  {d.slice(0, 3)}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 9, marginTop: 20 }}>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-p" style={{ flex: 1 }} onClick={() => { if (!f.name || !f.role) return; onSave(f); }}>
            {member ? "Save Changes" : "Add Staff Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingDetailModal({ booking, onClose, onStatusChange }) {
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
        <div style={{ marginBottom: 14, display: "flex", gap: 7, flexWrap: "wrap" }}>
          <span className={`badge ${bmap[booking.s]}`}>{booking.s[0].toUpperCase() + booking.s.slice(1)}</span>
          {booking.paid && <span style={{ color: "var(--success)", fontSize: 12, fontWeight: 600 }}>✓ Paid</span>}
          {hasExtension && <span className="badge bw">+{booking.additionalHours}h Extended</span>}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 8 }}>BOOKING INFO</div>
        {[
          ["Booking ID", booking.id],
          ["Customer", booking.u],
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

        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", margin: "14px 0 8px" }}>DURATION DETAILS</div>
        <div style={{ background: "var(--glass)", border: `1px solid ${hasExtension ? "var(--border-red)" : "var(--border)"}`, borderRadius: 12, padding: "12px 14px" }}>
          {[
            ["Original Duration", originalDur ? originalDur + " min" : "—"],
            ["Additional Hours", hasExtension ? `+${booking.additionalHours} hour${booking.additionalHours > 1 ? "s" : ""}` : "None"],
            ["Additional Cost", hasExtension ? `$${booking.additionalCost}` : "—"],
            ["Total Duration", totalDur ? totalDur + " min" : "—"],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
              <span style={{ color: "var(--muted)" }}>{l}</span>
              <span style={{ fontWeight: 600, color: l === "Additional Cost" && hasExtension ? "var(--red)" : "var(--text)" }}>{v}</span>
            </div>
          ))}
          {!hasExtension && <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)", textAlign: "center" }}>No extension on this booking</div>}
          {hasExtension && (
            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ fontWeight: 700 }}>Total Charged</span>
              <span style={{ fontWeight: 900, color: "var(--red)" }}>
                {booking.p} + ${booking.additionalCost}
              </span>
            </div>
          )}
        </div>

        <div style={{ marginTop: 18 }}>
          <label className="lbl">UPDATE STATUS</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["upcoming", "active", "completed", "cancelled"].map(s => (
              <button key={s} className={`btn btn-sm ${booking.s === s ? "btn-p" : "btn-g"}`} onClick={() => onStatusChange(booking.id, s)}>
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-g" style={{ width: "100%", marginTop: 14 }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function ApprovalDetailsModal({ staff, onApprove, onReject, onClose }) {
  return (
    <div className="mov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ maxWidth: 500 }}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 11, right: 11, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 19, width: 32, height: 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          X
        </button>
        <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 18, letterSpacing: "-.02em" }}>Staff Application Details</div>
        
        <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg,${staff.c || "#E63946"},rgba(0,0,0,.35))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, flexShrink: 0 }}>
            {staff.i}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{staff.name}</div>
            <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 6 }}>{staff.role}</div>
            <div style={{ fontSize: 13, background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: 6, display: "inline-block" }}>{staff.email}</div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="lbl">PHONE NUMBER</label>
          <div style={{ fontSize: 14, color: "var(--text)" }}>{staff.phone || "Not provided"}</div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="lbl">ID DOCUMENT IMAGE</label>
          {staff.idDocument ? (
            <div style={{ marginTop: 8, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", background: "#000" }}>
              <img 
                src={staff.idDocument.startsWith("data:") ? staff.idDocument : `${STATIC_BASE}/uploads/ids/${staff.idDocument}`} 
                alt="ID Document" 
                style={{ width: "100%", maxHeight: 300, objectFit: "contain", display: "block" }} 
              />
              <div style={{ padding: 10, textAlign: "center", background: "rgba(255,255,255,0.03)" }}>
                <a 
                  href={staff.idDocument.startsWith("data:") ? staff.idDocument : `${STATIC_BASE}/uploads/ids/${staff.idDocument}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ fontSize: 12, color: "var(--red)", fontWeight: 600, textDecoration: "none" }}
                >
                  View Full Image ↗
                </a>
              </div>
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: 12, color: "var(--muted)", fontSize: 13 }}>
              No ID image uploaded
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
            Back
          </button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { onReject(staff.id); onClose(); }}>
            Reject Application
          </button>
          <button className="btn btn-success" style={{ flex: 1.5 }} onClick={() => { onApprove(staff); onClose(); }}>
            Approve & Activate
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplateEditor({ templates, onSave }) {
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState({ subject: "", body: "" });

  const startEdit = (t) => {
    setEditing(t.id);
    setF({ subject: t.subject, body: t.body });
  };

  const save = () => {
    onSave(editing, f);
    setEditing(null);
  };

  const tLabels = {
    welcome_user: "Welcome (New User)",
    user_booking_confirmation: "Booking Confirmation (User)",
    staff_booking_notification: "New Booking (Staff)",
    admin_booking_alert: "New Booking (Admin)",
    staff_application_received: "Application Received (Staff)",
    admin_staff_application_alert: "New Application (Admin)",
    staff_account_approved: "Account Approved (Staff)",
    admin_user_registration: "New User Registration (Admin)",
    booking_extension_user: "Booking Extension (User)",
    booking_extension_staff: "Booking Extension (Staff)",
    booking_extension_admin: "Booking Extension (Admin)"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
      {templates.map(t => (
        <div key={t.id} className="glass" style={{ padding: 18 }}>
          {editing === t.id ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "var(--red)" }}>Editing: {tLabels[t.id] || t.id}</div>
              <div>
                <label className="lbl">SUBJECT LINE</label>
                <input className="inp" value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })} />
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>Placeholders: {'{{name}}'}, {'{{bookingId}}'}, {'{{service}}'}</div>
              </div>
              <div>
                <label className="lbl">EMAIL BODY (HTML)</label>
                <textarea className="inp" style={{ minHeight: 200, fontFamily: "monospace", fontSize: 13 }} value={f.body} onChange={e => setF({ ...f, body: e.target.value })} />
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>Placeholders: {'{{name}}'}, {'{{bookingId}}'}, {'{{service}}'}, {'{{staff}}'}, {'{{date}}'}, {'{{time}}'}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-p btn-sm" onClick={save}>Save Changes</button>
                <button className="btn btn-g btn-sm" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{tLabels[t.id] || t.id}</div>
                <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>Subject: <span style={{ fontWeight: 400, color: "var(--muted)" }}>{t.subject}</span></div>
                <div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 6, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {t.body.replace(/<[^>]*>?/gm, '')}
                </div>
              </div>
              <button className="btn btn-g btn-sm" onClick={() => startEdit(t)}>Edit Template</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function UserDetailsModal({ user, onClose }) {
  return (
    <div className="mov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ maxWidth: 500 }}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 11, right: 11, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 19, width: 32, height: 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          X
        </button>
        <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 18, letterSpacing: "-.02em" }}>User Details</div>
        
        <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg,${user.c || COLORS[0]},rgba(0,0,0,.35))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, flexShrink: 0 }}>
            {initials(user.name)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{user.name}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className={`badge ${user.role === "admin" ? "bu" : user.role === "staff" ? "ba" : "bc"}`}>{user.role}</span>
              <span style={{ fontSize: 13, color: user.status === "active" ? "var(--success)" : "var(--muted)" }}>● {user.status}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div>
            <label className="lbl">EMAIL ADDRESS</label>
            <div style={{ fontSize: 14, color: "var(--text)", wordBreak: "break-all" }}>{user.email}</div>
          </div>
          <div>
            <label className="lbl">PHONE NUMBER</label>
            <div style={{ fontSize: 14, color: "var(--text)" }}>{user.phone || "Not provided"}</div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="lbl">USER ID</label>
          <div style={{ fontSize: 13, fontFamily: "monospace", color: "var(--muted)" }}>{user.id}</div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="lbl">ID DOCUMENT IMAGE</label>
          {user.idDocument ? (
            <div style={{ marginTop: 8, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", background: "#000" }}>
              <img 
                src={user.idDocument.startsWith("data:") ? user.idDocument : `${STATIC_BASE}/uploads/ids/${user.idDocument}`} 
                alt="ID Document" 
                style={{ width: "100%", maxHeight: 300, objectFit: "contain", display: "block" }} 
              />
              <div style={{ padding: 10, textAlign: "center", background: "rgba(255,255,255,0.03)" }}>
                <a 
                  href={user.idDocument.startsWith("data:") ? user.idDocument : `${STATIC_BASE}/uploads/ids/${user.idDocument}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ fontSize: 12, color: "var(--red)", fontWeight: 600, textDecoration: "none" }}
                >
                  View Full Image ↗
                </a>
              </div>
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: 12, color: "var(--muted)", fontSize: 13 }}>
              No ID image uploaded
            </div>
          )}
        </div>

        <button className="btn btn-g" style={{ width: "100%" }} onClick={onClose}>
          Close Details
        </button>
      </div>
    </div>
  );
}

export default function AdminDash({ services, setServices, staff, setStaff, bookings, setBookings, pendingStaff, setPendingStaff, onSignOut, token, embedUrl, initialSec = "overview", onSecChange }) {
  const [sec, setSec] = useState(initialSec);
  const [viewingStaff, setViewingStaff] = useState(null);
  const [viewingUserDetail, setViewingUserDetail] = useState(null);
  useEffect(() => { setSec(initialSec); }, [initialSec]);
  const changeSec = s => { setSec(s); onSecChange?.(s); };
  const [svcModal, setSvcModal] = useState(null);
  const [staffModal, setStaffModal] = useState(null);
  const [delConfirm, setDelConfirm] = useState(null);
  const [bDetail, setBDetail] = useState(null);
  const [bFilter, setBFilter] = useState("all");
  const [copied, setCopied] = useState(false);
  const [stripeConfig, setStripeConfig] = useState({ publishableKey: "", secretKey: "", connected: false });
  const [isSavingStripe, setIsSavingStripe] = useState(false);
  const [pages, setPages] = useState({ bookings: 1, staff: 1, users: 1 });
  const [curPages, setCurPages] = useState({ bookings: 1, staff: 1, users: 1 });
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const { toasts, toast } = useToast();
  const bmap = { upcoming: "bu", completed: "bc", cancelled: "bx", active: "ba" };
  const filtered = bookings.filter(b => bFilter === "all" || b.s === bFilter);
  const todayKey = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
  const todayBookings = bookings.filter(b => b.dt.includes(todayKey));
  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="900" style="border:0;max-width:100%;" loading="lazy" title="Snippo Entertainment Booking"></iframe>`;
  const getPLimit = () => window.innerWidth < 640 ? 6 : 8;

  const reloadAdminData = async (targetTab, pageNum = 1) => {
    const limit = getPLimit();
    const query = new URLSearchParams({ tab: targetTab || sec, page: pageNum, limit });
    const data = await apiRequest(`/admin/data?${query}`, { token });
    setServices(data.services || []);
    setStaff(data.staff || []);
    setPendingStaff(data.pendingStaff || []);
    
    // Load stripe config if entering payments tab
    if ((targetTab || sec) === "payments") {
      try {
        const sc = await apiRequest("/admin/stripe-config", { token });
        setStripeConfig(sc);
      } catch (e) {
        console.error("Failed to load stripe config", e);
      }
    }
    
    if (data.data) {
      if (sec === "bookings") setBookings(data.data);
      if (sec === "staff") setStaff(data.data);
      if (sec === "users") setUsers(data.data);
      setPages(p => ({ ...p, [sec]: data.pages }));
    } else if (data.templates) {
      setTemplates(data.templates);
    } else {
      setBookings(data.bookings || []);
    }
  };

  useEffect(() => {
    if (["bookings", "staff", "users", "payments", "emails"].includes(sec)) {
      reloadAdminData(sec, curPages[sec]);
    }
  }, [sec, curPages]);

  const saveSvc = async f => {
    try {
      if (svcModal === "add") {
        await apiRequest("/admin/services", { method: "POST", token, body: { ...f, price: parseFloat(f.price) } });
        toast("Service added!", "success");
      } else {
        await apiRequest(`/admin/services/${svcModal.id}`, { method: "PUT", token, body: { ...f, price: parseFloat(f.price) } });
        toast("Service updated!", "success");
      }
      await reloadAdminData();
      setSvcModal(null);
    } catch (e) {
      toast(e.message || "Action failed", "error");
    }
  };

  const saveStaff = async f => {
    try {
      if (staffModal === "add") {
        await apiRequest("/admin/staff", { method: "POST", token, body: { ...f, active: true } });
        toast("Staff added!", "success");
      } else {
        await apiRequest(`/admin/staff/${staffModal.id}`, { method: "PUT", token, body: { ...f, active: staffModal.active ?? true } });
        toast("Staff updated!", "success");
      }
      await reloadAdminData();
      setStaffModal(null);
    } catch (e) {
      toast(e.message || "Action failed", "error");
    }
  };

  const doDelete = async () => {
    try {
      if (delConfirm.type === "service") {
        await apiRequest(`/admin/services/${delConfirm.id}`, { method: "DELETE", token });
        toast("Service deleted", "info");
      } else if (delConfirm.type === "staff") {
        await apiRequest(`/admin/staff/${delConfirm.id}`, { method: "DELETE", token });
        toast("Staff removed", "info");
      } else if (delConfirm.type === "user") {
        await apiRequest(`/admin/users/${delConfirm.id}`, { method: "DELETE", token });
        toast("User account deleted", "info");
      }
      await reloadAdminData();
      setDelConfirm(null);
    } catch (e) {
      toast(e.message || "Delete failed", "error");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await apiRequest(`/admin/bookings/${id}/status`, { method: "PATCH", token, body: { status } });
      setBookings(p => p.map(b => (b.id === id ? { ...b, s: status } : b)));
      setBDetail(p => (p ? { ...p, s: status } : null));
      toast(`Status -> ${status}`, "success");
    } catch (e) {
      toast(e.message || "Status update failed", "error");
    }
  };

  const approveStaff = async p => {
    try {
      await apiRequest(`/admin/pending/${p.id}/approve`, { method: "POST", token });
      await reloadAdminData();
      toast(`${p.name} approved and activated!`, "success");
    } catch (e) {
      toast(e.message || "Approval failed", "error");
    }
  };

  const rejectStaff = async id => {
    try {
      await apiRequest(`/admin/pending/${id}/reject`, { method: "POST", token });
      await reloadAdminData();
      toast("Application rejected", "info");
    } catch (e) {
      toast(e.message || "Rejection failed", "error");
    }
  };

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast("Embed code copied!", "success");
    } catch {
      toast("Copy failed. Select and copy manually.", "error");
    }
  };

  const saveStripeKeys = async () => {
    setIsSavingStripe(true);
    try {
      const res = await apiRequest("/admin/stripe-config", {
        method: "PUT",
        token,
        body: { publishableKey: stripeConfig.publishableKey, secretKey: stripeConfig.secretKey }
      });
      setStripeConfig(p => ({ ...p, connected: res.connected }));
      toast(res.connected ? "Stripe connected successfully!" : "Stripe settings updated", "success");
    } catch (e) {
      toast(e.message || "Failed to save Stripe config", "error");
    } finally {
      setIsSavingStripe(false);
    }
  };

  const saveTemplate = async (id, { subject, body }) => {
    try {
      await apiRequest(`/admin/templates/${id}`, { method: "POST", token, body: { subject, body } });
      setTemplates(p => p.map(t => (t.id === id ? { ...t, subject, body } : t)));
      toast("Template saved!", "success");
    } catch (e) {
      toast(e.message || "Failed to save template", "error");
    }
  };

  const nav = [
    {
      id: "overview",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
      l: "Overview",
    },
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
      l: "Bookings",
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
      l: "Services",
    },
    {
      id: "staff",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      l: "Staff",
    },
    {
      id: "users",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      l: "Users",
    },
    {
      id: "approvals",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      ),
      l: "Approvals",
      badge: pendingStaff.length,
    },
    {
      id: "emails",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      ),
      l: "Email Template",
    },
    {
      id: "embed",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      ),
      l: "Embed",
    },
  ];

  const stats = [
    { l: "Today's Bookings", v: todayBookings.length, c: "Live overview", col: "var(--red)" },
    { l: "Total Services", v: services.length, c: "Active + inactive", col: "#7c3aed" },
    { l: "Revenue Today", v: "$" + todayBookings.filter(b => b.paid).reduce((a, b) => a + parseInt(String(b.p || "$0").replace("$", "")), 0), c: "From paid bookings", col: "var(--success)" },
    { l: "Pending Approvals", v: pendingStaff.length, c: pendingStaff.length > 0 ? "Requires action" : "All clear", col: "var(--warn)" },
  ];

  return (
    <div className="dash">
      <div className="sidebar">
        <div style={{ padding: "9px 10px 13px", borderBottom: "1px solid var(--border)", marginBottom: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>ADMIN PANEL</span>
        </div>
        <div className="ssec">MANAGEMENT</div>
        {nav.map(n => (
          <div key={n.id} className={`sitem ${sec === n.id ? "act" : ""}`} onClick={() => changeSec(n.id)}>
            <span>{n.icon}</span>
            {n.l}
            {n.badge > 0 && (
              <span style={{ marginLeft: "auto", background: "var(--warn)", color: "#000", borderRadius: 20, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
                {n.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="ca">
        {sec === "overview" && (
          <>
            <h1 className="sh">Dashboard</h1>
            <p className="ss">Admin overview</p>
            <div className="g4" style={{ marginBottom: 20 }}>
              {stats.map((s, i) => (
                <div key={i} className="stat">
                  <div className="stat-v" style={{ color: s.col }}>
                    {s.v}
                  </div>
                  <div className="stat-l">{s.l}</div>
                  <div className="stat-c">{s.c}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 10 }}>TODAY'S BOOKINGS</div>
            <div className="glass tw">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Staff</th>
                    <th>Time</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: 28 }}>
                        No bookings scheduled for today
                      </td>
                    </tr>
                  ) : (
                    todayBookings.map(b => (
                      <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => setBDetail(b)}>
                        <td style={{ fontFamily: "monospace", color: "var(--muted)", fontSize: 11 }}>{b.id}</td>
                        <td style={{ fontWeight: 600 }}>{b.u}</td>
                        <td>{b.svc}</td>
                        <td style={{ color: "var(--muted)" }}>{b.stf}</td>
                        <td>{b.t}</td>
                        <td style={{ fontWeight: 700 }}>
                          {b.p}
                          {(b.additionalHours || 0) > 0 && (
                            <div style={{ fontSize: 10, color: "var(--red)", marginTop: 2 }}>
                              +{b.additionalHours}h Extra
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${bmap[b.s]}`}>{b.s[0].toUpperCase() + b.s.slice(1)}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {sec === "bookings" && (
          <>
            <h1 className="sh">All Bookings</h1>
            <p className="ss">Click a row to view details and update status</p>
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              {["all", "upcoming", "active", "completed", "cancelled"].map(f => (
                <div key={f} className={`filter-pill ${bFilter === f ? "on" : ""}`} onClick={() => setBFilter(f)}>
                  {f[0].toUpperCase() + f.slice(1)}
                  {f !== "all" && <span style={{ opacity: 0.6 }}> ({bookings.filter(b => b.s === f).length})</span>}
                </div>
              ))}
            </div>
            <div className="glass tw">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Staff</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: 28 }}>
                        No bookings
                      </td>
                    </tr>
                  ) : (
                    bookings.map(b => (
                      <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => setBDetail(b)}>
                        <td style={{ fontFamily: "monospace", color: "var(--muted)", fontSize: 11 }}>{b.id}</td>
                        <td style={{ fontWeight: 600 }}>{b.u}</td>
                        <td>{b.svc}</td>
                        <td style={{ color: "var(--muted)" }}>{b.stf}</td>
                        <td style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{b.dt}</td>
                        <td style={{ fontWeight: 700 }}>
                          {b.p}
                          {(b.additionalHours || 0) > 0 && (
                            <div style={{ fontSize: 10, color: "var(--red)", marginTop: 2 }}>
                              +{b.additionalHours}h Extra
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${bmap[b.s]}`}>{b.s[0].toUpperCase() + b.s.slice(1)}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination current={curPages.bookings} total={pages.bookings} onPage={p => setCurPages(cp => ({ ...cp, bookings: p }))} />
          </>
        )}

        {sec === "services" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h1 className="sh">Services</h1>
                <p className="ss" style={{ marginBottom: 0 }}>
                  Manage your offerings
                </p>
              </div>
              <button className="btn btn-p btn-sm" onClick={() => setSvcModal("add")}>
                + Add Service
              </button>
            </div>
            <div className="glass tw">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Duration</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                          <div style={{ width: 50, height: 40, borderRadius: 7, overflow: "hidden", flexShrink: 0, background: "#0d0d1a" }}>
                            {s.img ? (
                              <img src={s.img} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, background: "linear-gradient(135deg,rgba(230,57,70,.14),rgba(100,60,180,.14))" }}>
                                IMG
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>{String(s.desc || "").substring(0, 36)}...</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmtDur(s.dur)}</td>
                      <td style={{ fontWeight: 700, color: "var(--red)" }}>${s.price}</td>
                      <td>
                        <span className={s.active ? "badge bu" : "badge bc"}>{s.active ? "Active" : "Inactive"}</span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span className="ata" style={{ marginRight: 11 }} onClick={() => setSvcModal(s)}>
                          Edit
                        </span>
                        <span className="ata" style={{ color: "var(--muted)" }} onClick={() => setDelConfirm({ type: "service", id: s.id, name: s.name })}>
                          Delete
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {sec === "staff" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h1 className="sh">Active Staff</h1>
                <p className="ss" style={{ marginBottom: 0 }}>
                  Manage your team
                </p>
              </div>
              <button className="btn btn-p btn-sm" onClick={() => setStaffModal("add")}>
                + Add Staff
              </button>
            </div>
            <div className="glass tw">
              <table>
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Role</th>
                    <th>Services</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: 28 }}>
                        No staff members found
                      </td>
                    </tr>
                  ) : (
                    staff.map(s => (
                      <tr key={s.id}>
                        <td style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div className="iava" style={{ background: s.c }}>
                            {s.i}
                          </div>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                        </td>
                        <td>{s.role}</td>
                        <td>
                          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", maxWidth: 200 }}>
                            {s.services.map(id => {
                              const srv = services.find(x => x.id === id);
                              return (
                                <span key={id} style={{ background: "rgba(255,255,255,.05)", borderRadius: 5, padding: "2px 5px", fontSize: 10 }}>
                                  {srv?.name || "..."}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button className="btn btn-g btn-sm" style={{ marginRight: 6 }} onClick={() => setStaffModal(s)}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination current={curPages.staff} total={pages.staff} onPage={p => setCurPages(cp => ({ ...cp, staff: p }))} />
          </>
        )}

        {sec === "users" && (
          <>
            <h1 className="sh">Registered Users</h1>
            <p className="ss">Complete user database</p>
            <div className="glass tw">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>ID Image</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 28 }}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontFamily: "monospace", color: "var(--muted)", fontSize: 11 }}>{u.id}</td>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === "admin" ? "bu" : "ba"}`}>{u.role}</span>
                        </td>
                        <td>
                          {u.idDocument ? (
                            <a href={`${STATIC_BASE}/uploads/ids/${u.idDocument}`} target="_blank" rel="noreferrer" className="badge bg-p" style={{ fontSize: 10, textDecoration: 'none' }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              View ID
                            </a>
                          ) : (
                            <span style={{ color: "var(--muted)", fontSize: 11 }}>None</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <span style={{ color: u.status === "active" ? "var(--success)" : "var(--muted)" }}>● {u.status}</span>
                            <button className="btn btn-g btn-sm" style={{ padding: "4px 10px", height: "auto" }} onClick={() => setViewingUserDetail(u)}>
                              Details
                            </button>
                            {u.role !== "admin" && (
                              <button 
                                className="btn btn-o btn-sm" 
                                style={{ padding: "4px 10px", height: "auto", color: "var(--red)", border: "1px solid var(--border-red)" }} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDelConfirm({ type: "user", id: u.id, name: u.name });
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination current={curPages.users} total={pages.users} onPage={p => setCurPages(cp => ({ ...cp, users: p }))} />
          </>
        )}
        {sec === "approvals" && (
          <>
            <h1 className="sh">Staff Approvals</h1>
            <p className="ss">Review and approve new staff registration requests</p>
            {pendingStaff.length === 0 ? (
              <div className="glass" style={{ padding: 48, textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>All clear!</div>
                <p style={{ color: "var(--muted)", fontSize: 13 }}>No pending approval requests</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {pendingStaff.map(p => (
                  <div key={p.id} className="glass" style={{ padding: "clamp(14px,3vw,22px)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                      <div className="avt" style={{ background: `linear-gradient(135deg,${p.c},rgba(0,0,0,.3))`, width: 48, height: 48, fontSize: 17, flexShrink: 0 }}>
                        {p.i}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                          <span className="badge bw">Pending Approval</span>
                          <span className="badge bc" style={{ fontSize: 10 }}>
                            Inactive
                          </span>
                        </div>
                        <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 4 }}>
                          {p.role} - {p.email}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted2)" }}>Applied: {p.appliedAt}</div>
                      </div>
                      <div style={{ display: "flex", gap: 7, flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
                        <button className="btn btn-g btn-sm" onClick={() => setViewingStaff(p)}>
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {viewingStaff && (
          <ApprovalDetailsModal 
            staff={viewingStaff} 
            onApprove={approveStaff} 
            onReject={rejectStaff} 
            onClose={() => setViewingStaff(null)} 
          />
        )}

        {sec === "embed" && (
          <>
            <h1 className="sh">Embed Widget</h1>
            <p className="ss">Use this iframe code on other websites to show only booking form + user dashboard.</p>
            <div className="glass" style={{ padding: "clamp(14px,3vw,22px)", maxWidth: 860 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 8 }}>EMBED URL</div>
              <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 14, wordBreak: "break-all" }}>{embedUrl}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 8 }}>IFRAME CODE</div>
              <textarea className="inp" readOnly value={iframeCode} style={{ fontFamily: "monospace", minHeight: 120, marginBottom: 12 }} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-p btn-sm" onClick={copyEmbedCode}>
                  {copied ? "Copied" : "Copy Code"}
                </button>
                <a className="btn btn-g btn-sm" href={embedUrl} target="_blank" rel="noreferrer">
                  Open Embed Page
                </a>
              </div>
            </div>
          </>
        )}

        {sec === "payments" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h1 className="sh">Payments Settings</h1>
                <p className="ss" style={{ marginBottom: 0 }}>Configure Stripe Integration</p>
              </div>
              <div>
                {stripeConfig.connected ? (
                  <span className="badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                    <span style={{ marginRight: 6 }}>●</span> Connected
                  </span>
                ) : (
                  <span className="badge" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    Not Connected
                  </span>
                )}
              </div>
            </div>

            <div className="glass" style={{ padding: "clamp(16px,4vw,28px)", maxWidth: 700, marginBottom: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Stripe API Keys</div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  Enter your Stripe API keys. These will be used to process payments through the booking widget.
                  Find these in your Stripe Dashboard under Developers &gt; API keys.
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label className="lbl">PUBLISHABLE KEY</label>
                  <input 
                    className="inp" 
                    placeholder="pk_test_..." 
                    value={stripeConfig.publishableKey} 
                    onChange={e => setStripeConfig(p => ({ ...p, publishableKey: e.target.value }))} 
                    style={{ fontFamily: stripeConfig.publishableKey ? "monospace" : "inherit" }}
                  />
                  <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 6 }}>Used on the frontend to create payment elements safely.</div>
                </div>

                <div>
                  <label className="lbl">SECRET KEY</label>
                  <input 
                    className="inp" 
                    type={stripeConfig.secretKey.includes("sk_...") ? "text" : "password"}
                    placeholder="sk_test_..." 
                    value={stripeConfig.secretKey} 
                    onChange={e => setStripeConfig(p => ({ ...p, secretKey: e.target.value }))} 
                    style={{ fontFamily: stripeConfig.secretKey ? "monospace" : "inherit" }}
                  />
                  <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 6 }}>Used on the server securely to process charges. Never share this.</div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <button 
                    className="btn btn-p" 
                    onClick={saveStripeKeys} 
                    disabled={isSavingStripe || (!stripeConfig.publishableKey && !stripeConfig.secretKey)}
                  >
                    {isSavingStripe ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </div>
            </div>
            
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, marginTop: 30 }}>Recent Paid Bookings</h2>
            <div className="glass tw">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.filter(b => b.paid).length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 28 }}>
                        No paid bookings yet
                      </td>
                    </tr>
                  ) : (
                    bookings.filter(b => b.paid).slice(0, 5).map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600 }}>{b.u}</td>
                        <td style={{ color: "var(--muted)" }}>{b.svc}</td>
                        <td style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{b.dt}</td>
                        <td style={{ fontWeight: 700, color: "var(--success)" }}>{b.p}</td>
                        <td>
                          <span style={{ color: "var(--success)", fontSize: 12, fontWeight: 600 }}>✓ Paid</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {sec === "emails" && (
          <>
            <h1 className="sh">Email Templates</h1>
            <p className="ss">Customize the content of automated notifications.</p>
            <TemplateEditor templates={templates} onSave={saveTemplate} />
          </>
        )}
      </div>

      <div className="bnav">
        {nav.map(n => (
          <div key={n.id} className={`bni ${sec === n.id ? "act" : ""}`} onClick={() => changeSec(n.id)}>
            <span style={{ fontSize: 12, position: "relative" }}>
              {n.icon}
              {n.badge > 0 && (
                <span style={{ position: "absolute", top: -4, right: -5, background: "var(--warn)", color: "#000", borderRadius: 10, padding: "0 3px", fontSize: 8, fontWeight: 800, lineHeight: "14px" }}>
                  {n.badge}
                </span>
              )}
            </span>
            <span>{n.l}</span>
          </div>
        ))}
      </div>

      {svcModal && <ServiceModal svc={svcModal === "add" ? null : svcModal} services={services} onSave={saveSvc} onClose={() => setSvcModal(null)} />}
      {staffModal && <StaffModal member={staffModal === "add" ? null : staffModal} services={services} onSave={saveStaff} onClose={() => setStaffModal(null)} />}
      {delConfirm && <Confirm msg={`Delete "${delConfirm.name}"? This action cannot be undone.`} onOk={doDelete} onCancel={() => setDelConfirm(null)} />}
      {bDetail && <BookingDetailModal booking={bDetail} onClose={() => setBDetail(null)} onStatusChange={updateStatus} />}
      {viewingUserDetail && <UserDetailsModal user={viewingUserDetail} onClose={() => setViewingUserDetail(null)} />}
      <Toasts toasts={toasts} />
    </div>
  );
}
