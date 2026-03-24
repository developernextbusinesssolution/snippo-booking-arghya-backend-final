import React, { useState, useEffect, Fragment } from "react";
import Toasts, { useToast } from "../components/Shared/Toasts";
import { apiRequest } from "../utils/api";

export default function SecurityDash({ user: initialUser, onSignOut, token }) {
  const [user, setUser] = useState(initialUser);
  const [tab, setTab] = useState("shifts");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingAvail, setSavingAvail] = useState(false);
  const { toasts, toast } = useToast();

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const [avail, setAvail] = useState(initialUser?.availability || DAYS.map(d => ({ day: d, enabled: d !== "Saturday" && d !== "Sunday", startTime: "09:00", endTime: "20:00" })));

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/security/shifts", { token });
      setBookings(res.bookings || []);
    } catch (e) {
      toast(e.message || "Failed to load shifts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
    // eslint-disable-next-line
  }, []);

  const handleVerify = async (id) => {
    try {
      await apiRequest(`/security/bookings/${id}/verify`, { method: "POST", token });
      toast("Booking verified successfully!", "success");
      fetchShifts();
    } catch (e) {
      toast(e.message || "Verification failed", "error");
    }
  };

  const saveAvail = async () => {
    setSavingAvail(true);
    try {
      const res = await apiRequest("/security/availability", { method: "PUT", token, body: { availability: avail } });
      setAvail(res.availability);
      toast("Availability saved!", "success");
    } catch (e) {
      toast(e.message || "Failed to save availability", "error");
    } finally {
      setSavingAvail(false);
    }
  };

  const bmap = { upcoming: "bu", completed: "bc", cancelled: "bx", active: "ba" };

  // Group bookings by Date, then by Time Slot
  const groupedShifts = bookings.reduce((acc, b) => {
    const date = b.dt;
    const time = b.t;
    if (!acc[date]) acc[date] = {};
    if (!acc[date][time]) acc[date][time] = [];
    acc[date][time].push(b);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedShifts).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="dash">
      <div className="sidebar">
        <div style={{ padding: "9px 10px 13px", borderBottom: "1px solid var(--border)", marginBottom: 7 }}>
          <div className="avt" style={{ background: `linear-gradient(135deg,#10b981,rgba(0,0,0,.3))`, width: 36, height: 36, fontSize: 13, marginBottom: 7 }}>
            {user?.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{user?.name || "Security"}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{user?.roleTitle || "Security Officer"}</div>
        </div>
        
        <div className={`sitem ${tab === "shifts" ? "act" : ""}`} onClick={() => setTab("shifts")}>
          <span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </span>
          Duty Schedule
        </div>

        <div className={`sitem ${tab === "availability" ? "act" : ""}`} onClick={() => setTab("availability")}>
          <span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </span>
          Availability
        </div>

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
        {tab === "shifts" && (
          <>
            <h1 className="sh">Duty Verification Schedule</h1>
            <p className="ss">Showing all upcoming and active bookings that require security verification.</p>
            
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading verification slots...</div>
            ) : bookings.length === 0 ? (
              <div className="glass" style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>All Clear</div>
                <p style={{ color: "var(--muted)", fontSize: 13 }}>No bookings scheduled for today</p>
              </div>
            ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {sortedDates.map(date => (
              <div key={date}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, var(--border))' }}></div>
                  <div className="badge bc" style={{ fontSize: 13, padding: '5px 15px', borderRadius: 20 }}>📅 {date}</div>
                  <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, var(--border), transparent)' }}></div>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {Object.keys(groupedShifts[date]).sort().map(time => (
                    <div key={time} className="glass" style={{ padding: "0 0 0 0", overflow: 'hidden' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 18px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--p)' }}>
                        🕒 {time} Slot
                      </div>
                      <div className="tw">
                        <table style={{ margin: 0, border: 'none' }}>
                          <tbody>
                            {groupedShifts[date][time].map(b => (
                              <Fragment key={b.id}>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td style={{ padding: '15px 18px', verticalAlign: 'top' }}>
                                    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>{b.u}</div>
                                    <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                        {b.email}
                                      </span>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                        {b.phone || "No phone"}
                                      </span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '15px 18px', verticalAlign: 'top' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700 }}>{b.stf}</div>
                                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>Assigned Staff</div>
                                  </td>
                                  <td style={{ padding: '15px 18px', verticalAlign: 'top' }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{b.svc}</div>
                                    <div style={{ fontSize: 11, color: "var(--p)", marginTop: 4, fontWeight: 600 }}>
                                      👥 {b.peopleCount || 1} { (b.peopleCount || 1) > 1 ? "People" : "Person" }
                                    </div>
                                  </td>
                                  <td style={{ padding: '15px 18px', verticalAlign: 'top', textAlign: 'right' }}>
                                    <div style={{ fontSize: 11, color: 'var(--muted2)', marginBottom: 8, fontFamily: 'monospace' }}>#{b.id}</div>
                                    {b.verifiedBySecurity ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                        <span style={{ color: "var(--success)", fontSize: 13, fontWeight: 700 }}>✓ Verified</span>
                                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Checked-in by You</span>
                                      </div>
                                    ) : (
                                      <button 
                                        className="btn btn-p btn-sm"
                                        style={{ padding: "6px 16px", height: "auto", boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
                                        onClick={() => handleVerify(b.id)}
                                      >
                                        Verify Attendance
                                      </button>
                                    )}
                                  </td>
                                </tr>
                                {b.notes && (
                                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td colSpan="4" style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.01)', fontSize: 11, color: 'var(--muted)' }}>
                                      <span style={{ fontWeight: 700, color: 'var(--muted2)' }}>Notes: </span> {b.notes}
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
            )}
          </>
        )}

        {tab === "availability" && (
          <div style={{ maxWidth: 640 }}>
            <h1 className="sh">Shift Availability</h1>
            <p className="ss">Set your active working hours. Customers will see these slots in the booking system if assigned.</p>
            
            <div className="glass" style={{ padding: "20px 24px" }}>
              {DAYS.map((d, index) => {
                const dayAvail = avail.find(a => a.day === d) || { day: d, enabled: false, startTime: "09:00", endTime: "20:00" };
                return (
                  <div key={d} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: index < 6 ? "1px solid var(--border)" : "none", gap: 15, flexWrap: 'wrap' }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 120 }}>
                      <input 
                        type="checkbox" 
                        checked={dayAvail.enabled} 
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                        onChange={e => {
                          const newAvail = [...avail];
                          const foundIdx = newAvail.findIndex(a => a.day === d);
                          if (foundIdx > -1) newAvail[foundIdx].enabled = e.target.checked;
                          else newAvail.push({ day: d, enabled: e.target.checked, startTime: "09:00", endTime: "20:00" });
                          setAvail(newAvail);
                        }}
                      />
                      <span style={{ fontWeight: 600, color: dayAvail.enabled ? "var(--text)" : "var(--muted)" }}>{d}</span>
                    </div>

                    {dayAvail.enabled ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input 
                          type="time" 
                          className="inp" 
                          style={{ padding: '4px 8px', width: 110, height: 32, fontSize: 13 }}
                          value={dayAvail.startTime}
                          onChange={e => {
                            const newAvail = [...avail];
                            newAvail.find(a => a.day === d).startTime = e.target.value;
                            setAvail(newAvail);
                          }}
                        />
                        <span style={{ color: "var(--muted)" }}>to</span>
                        <input 
                          type="time" 
                          className="inp" 
                          style={{ padding: '4px 8px', width: 110, height: 32, fontSize: 13 }}
                          value={dayAvail.endTime}
                          onChange={e => {
                            const newAvail = [...avail];
                            newAvail.find(a => a.day === d).endTime = e.target.value;
                            setAvail(newAvail);
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{ color: "var(--muted)", fontSize: 13, fontStyle: 'italic' }}>Off Duty</div>
                    )}
                  </div>
                );
              })}
              
              <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px dashed var(--border)" }}>
                <button className={`btn btn-p ${savingAvail ? "loading" : ""}`} onClick={saveAvail} disabled={savingAvail} style={{ width: '100%', maxWidth: 200 }}>
                  {savingAvail ? "Saving..." : "Save Availability"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bnav">
        <div className={`bni ${tab === "shifts" ? "act" : ""}`} onClick={() => setTab("shifts")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Shifts</span>
        </div>
        <div className={`bni ${tab === "availability" ? "act" : ""}`} onClick={() => setTab("availability")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>Availability</span>
        </div>
      </div>
      
      <Toasts toasts={toasts} />
    </div >   
  );
}
