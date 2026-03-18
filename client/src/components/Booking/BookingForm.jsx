import { useState, useEffect } from "react";
import { STEPS, MNS, DS, TIMES, cal, fmtDur, calcCommissionPrice } from "../../utils/helpers";
import Progress from "../Shared/Progress";
import StaffDetailsModal from "../Shared/StaffDetailsModal";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { apiRequest } from "../../utils/api";

function S1({ sel, onSel, services }) {
// ... (S1 component stays the same)
  return (
    <div className="se">

      <div className="sg">
        {services.filter(s => s.active).map(s => (
          <div key={s.id} className={`scard ${sel?.id === s.id ? "sel" : ""}`} onClick={() => onSel(s)}>
            <div className="simg">
              {s.img ? <img src={s.img} alt={s.name} loading="lazy" /> : <div className="simg-fb">🧖</div>}
            </div>
            <div className="sbody">
              <div className="sname">{s.name}</div>
              <div className="sdesc">{s.desc}</div>
              <div className="smeta">
                <span className="sprice">${s.price}<span style={{fontSize: 10, color: 'var(--muted)', fontWeight: 400, marginLeft: 2}}>/hr</span></span>
                <span className="sdur">⏱ {fmtDur(s.dur)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function S2({ sel, onSel, staff, svcId, onDetails }) {
  const list = staff.filter(s => s.active && (!svcId || s.services.includes(svcId)));
  return (
    <div className="se">

      {list.length === 0 ? (
        <div className="glass" style={{ padding: 28, textAlign: "center", color: "var(--muted)" }}>
          No specialists available for this service
        </div>
      ) : (
        <div className="staffg" style={{ gap: 16 }}>
          {list.map(s => (
            <div 
              key={s.id} 
              className={`stcard ${sel?.id === s.id ? "sel" : ""}`} 
              style={{ 
                cursor: "default", 
                padding: 16,
                borderColor: sel?.id === s.id ? '#2ecc17' : 'var(--border)',
                boxShadow: sel?.id === s.id ? '0 0 15px rgba(46, 204, 23, 0.2)' : 'none'
              }}
            >
              <div 
                onClick={() => onSel(s)} 
                style={{ cursor: "pointer" }}
              >
                <div
                  className="avt"
                  style={{
                    width: 64,
                    height: 64,
                    margin: "0 auto 12px",
                    background: s.profileImage ? "transparent" : `linear-gradient(135deg,${s.c},rgba(0,0,0,.3))`,
                    fontSize: 22,
                    overflow: 'hidden'
                  }}
                >
                  {s.profileImage ? (
                    <img src={s.profileImage} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    s.i
                  )}
                </div>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>{s.role}</div>
                {s.hourlyRate > 0 && <div style={{ fontSize: 12, color: "var(--red)", fontWeight: 700, marginBottom: 6 }}>${calcCommissionPrice(s.hourlyRate) * 2} / 2 Hours</div>}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {sel?.id === s.id ? (
                  <div 
                    style={{ 
                      padding: '8px 0', 
                      borderRadius: 8, 
                      background: 'linear-gradient(135deg, #2ecc17, #24b011)',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(46, 204, 23, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 32
                    }}
                  >
                    ✓ Selected
                  </div>
                ) : (
                  <button 
                    className="btn btn-p btn-sm" 
                    style={{ fontSize: 11, padding: '6px 0', width: '100%', height: 32 }}
                    onClick={() => onSel(s)}
                  >
                    Select
                  </button>
                )}
                <button 
                  className="btn btn-g btn-sm" 
                  style={{ fontSize: 11, padding: '4px 0', width: '100%' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDetails(s);
                  }}
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function S3({ selDate, selTime, onDate, onTime, busySlots, stf }) {
  const now = new Date();
  const [mn, setMn] = useState(now.getMonth());
  const [yr, setYr] = useState(now.getFullYear());
  const days = cal(yr, mn);
  const selStr = selDate ? `${selDate.getFullYear()}-${selDate.getMonth()}-${selDate.getDate()}` : "";

  // Dynamic booking check from global busySlots
  const blockedTimes = (busySlots || [])
    .filter(b => b.staffId === stf?.id && b.dt === (selDate ? selDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }) : ""))
    .map(b => b.t);

  // Staff availability check (0=Sunday, 1=Monday, etc.)
  // s.avail mapping: [Mon, Tue, Wed, Thu, Fri, Sat, Sun] 
  // Date.getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const isOffDay = (date) => {
    if (!stf || !stf.avail) return false;
    const dayIndex = date.getDay(); // 0-6 (Sun-Sat)
    const availIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Map Sun to 6, Mon to 0
    return !stf.avail[availIndex];
  };

  const to12h = t24 => {
    const [h, m] = t24.split(":");
    let hr = parseInt(h, 10);
    const ampm = hr >= 12 ? "PM" : "AM";
    if (hr > 12) hr -= 12;
    if (hr === 0) hr = 12;
    return `${hr}:${m} ${ampm}`;
  };

  const isSlotDisabled = (t) => {
    if (!selDate) return true;
    if (isOffDay(selDate)) return true;
    return blockedTimes.includes(to12h(t));
  };

  return (
    <div className="se">

      <div className="dtg">
        <div className="glass" style={{ padding: "clamp(12px,3vw,18px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button
              className="btn btn-g btn-sm btn-icon"
              onClick={() => (mn === 0 ? (setMn(11), setYr(y => y - 1)) : setMn(m => m - 1))}
            >
              ‹
            </button>
            <span style={{ fontWeight: 700, fontSize: 13 }}>
              {MNS[mn]} {yr}
            </span>
            <button
              className="btn btn-g btn-sm btn-icon"
              onClick={() => (mn === 11 ? (setMn(0), setYr(y => y + 1)) : setMn(m => m + 1))}
            >
              ›
            </button>
          </div>
          <div className="calg">
            {DS.map(d => (
              <div key={d} className="cdn">
                {d}
              </div>
            ))}
            {days.map((d, i) => {
              if (!d) return <div key={i} className="cd cem" />;
              const date = new Date(yr, mn, d);
              const past = date < new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const today = d === now.getDate() && mn === now.getMonth() && yr === now.getFullYear();
              return (
                <div
                  key={i}
                  className={`cd${past ? " cpast" : ""}${today ? " ctoday" : ""}${
                    selStr === `${yr}-${mn}-${d}` ? " csel" : ""
                  }`}
                  onClick={() => !past && onDate(date)}
                >
                  {d}
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div
            style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 10, letterSpacing: ".07em" }}
          >
            AVAILABLE TIMES
          </div>
          <div className="tg">
            {isOffDay(selDate || new Date()) && selDate && (
              <div style={{ gridColumn: "1/-1", padding: 20, textAlign: "center", color: "var(--red)", fontSize: 13, fontWeight: 600 }}>
                Specialist is not available on this day
              </div>
            )}
            {TIMES.map(t => {
              const disabled = isSlotDisabled(t);
              return (
                <div
                  key={t}
                  className={`ts${disabled ? " tbk" : ""}${selTime === t ? " tsel" : ""}`}
                  onClick={() => !disabled && onTime(t)}
                >
                  {t}
                  {disabled ? (blockedTimes.includes(to12h(t)) ? " ✕" : " Off") : ""}
                </div>
              );
            })}
          </div>
          {selDate && selTime && (
            <div className="glass" style={{ padding: 13, marginTop: 11, borderColor: "var(--border-red)" }}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Selected</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {selDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </div>
              <div style={{ color: "var(--red)", fontWeight: 700, marginTop: 2 }}>{selTime}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// S4 (Details) removed as requested

function S5({ svc, stf, date, time, det, onChange }) {
  return (
    <div className="se" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="glass" style={{ padding: "clamp(14px,4vw,24px)" }}>
        <div
          style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".07em", marginBottom: 11 }}
        >
          BOOKING SUMMARY
        </div>
        {[
          ["Service", svc?.name],
          ["Specialist", stf?.name],
          [
            "Date",
            date?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
          ],
          ["Time", time],
          ["Duration", fmtDur(svc?.dur)],
        ].map(([l, v]) => (
          <div key={l} className="srow">
            <span className="slbl">{l}</span>
            <span className="sval">{v}</span>
          </div>
        ))}
        
        <div style={{ marginTop: 20 }}>
          <label className="lbl" style={{ fontSize: 10, color: "var(--muted)", marginBottom: 6, display: "block" }}>
            SPECIAL NOTES (OPTIONAL)
          </label>
          <textarea
            className="inp"
            style={{ minHeight: 80, fontSize: 13 }}
            placeholder="Any special requests for your session?"
            value={det.notes || ""}
            onChange={e => onChange({ ...det, notes: e.target.value })}
          />
        </div>

        <div
          style={{
            marginTop: 18,
            paddingTop: 18,
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600 }}>Total Price</span>
          <span style={{ fontSize: "clamp(24px,5vw,30px)", fontWeight: 900, color: "var(--red)", letterSpacing: "-.03em" }}>
            ${computedPrice(svc, stf)}
          </span>
        </div>
      </div>
    </div>
  );
}

function StripeCheckoutForm({ svc, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setErr("");
    setLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          setErr(error.message);
        } else {
          setErr("An unexpected error occurred.");
        }
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess();
      }
    } catch (e) {
      setErr(e.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass" style={{ padding: "clamp(14px,4vw,24px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Amount due</span>
        <span style={{ fontSize: "clamp(22px,5vw,28px)", fontWeight: 900, color: "var(--red)", letterSpacing: "-.03em" }}>
          ${svc?.computedPrice ?? svc?.price}
        </span>
      </div>
      
      <div style={{ marginBottom: 11 }}>
        <PaymentElement options={{
          layout: "tabs",
        }} />
      </div>

      {err && (
        <div
          style={{
            color: "var(--red)",
            fontSize: 12,
            marginTop: 9,
            padding: "9px 11px",
            background: "rgba(230,57,70,.08)",
            borderRadius: 8,
          }}
        >
          ⚠ {err}
        </div>
      )}
      
      <button
        className="btn btn-p"
        type="submit"
        style={{ width: "100%", marginTop: 16, padding: 14, fontSize: 14 }}
        disabled={loading || !stripe}
      >
        {loading ? (
          <span className="ld">
            <span>●</span>
            <span>●</span>
            <span>●</span>
          </span>
        ) : (
          `🔒 Pay $${svc?.computedPrice ?? svc?.price} Securely`
        )}
      </button>
    </form>
  );
}

function S6({ svc, onSuccess, stripeKey, token }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [fetchErr, setFetchErr] = useState("");

  useEffect(() => {
    if (stripeKey) {
      setStripePromise(loadStripe(stripeKey));
    }
  }, [stripeKey]);

  useEffect(() => {
    const initPayment = async () => {
      try {
        const { clientSecret } = await apiRequest("/payments/create-intent", {
          method: "POST",
          token,
          body: { amount: svc.computedPrice ?? svc.price, currency: "usd" }
        });
        setClientSecret(clientSecret);
      } catch (err) {
        console.error("Payment init error:", err);
        setFetchErr(err.message || "Failed to initialize payment");
      }
    };
    const amount = computedPrice(svc, null);
    if (token && amount) initPayment();
  }, [token, svc?.computedPrice, svc?.price]);

  if (!stripeKey) {
    return (
      <div className="se" style={{ textAlign: "center", padding: 40 }}>
        <div className="glass" style={{ padding: 20 }}>
          <div style={{ color: "var(--red)", fontWeight: 700 }}>Stripe is not configured</div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Please contact administrator to set up payments.</p>
        </div>
      </div>
    );
  }

  if (fetchErr) {
    return (
      <div className="se" style={{ maxWidth: 460, margin: "0 auto" }}>
        <div className="glass" style={{ padding: 20, textAlign: "center", borderColor: "var(--red)" }}>
          <div style={{ color: "var(--red)", fontWeight: 700, marginBottom: 8 }}>Payment Initialization Failed</div>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>{fetchErr}</p>
        </div>
      </div>
    );
  }

  if (!clientSecret || !stripePromise) {
    return (
      <div className="se" style={{ textAlign: "center", padding: 40 }}>
        <div className="ld">
          <span>●</span>
          <span>●</span>
          <span>●</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>Initializing secure checkout...</p>
      </div>
    );
  }

  return (
    <div className="se" style={{ maxWidth: 460, margin: "0 auto" }}>
      <Elements stripe={stripePromise} options={{ 
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#e63946',
            colorBackground: 'rgba(255,255,255,0.05)',
            colorText: '#ffffff',
            colorDanger: '#e63946',
            borderRadius: '8px',
          },
        }
      }}>
        <StripeCheckoutForm svc={svc} onSuccess={onSuccess} />
      </Elements>
    </div>
  );
}

function S7({ svc, stf, date, time, booking, onDash, onRebook }) {
  const ref = booking?.id || "BK-" + (2410 + Math.floor(Math.random() * 90));
  return (
    <div className="se" style={{ textAlign: "center", maxWidth: 500, margin: "0 auto" }}>
      <div className="check-c">✓</div>
      <h2 style={{ fontSize: "clamp(22px,5vw,30px)", fontWeight: 900, marginBottom: 9, letterSpacing: "-.03em" }}>
        You're all booked!
      </h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
        Appointment confirmed. A confirmation email has been sent.
      </p>
      <div className="glass" style={{ padding: "clamp(13px,4vw,24px)", textAlign: "left", marginBottom: 18 }}>
        {[
          ["Booking Ref", <span className="refcode" key="ref">{ref}</span>],
          ["Service", svc?.name],
          ["Specialist", stf?.name],
          ["When", `${date?.toLocaleDateString("en-US", { month: "long", day: "numeric" })} at ${time}`],
          ["Status", <span className="badge bu" key="stat">✓ Confirmed</span>],
        ].map(([l, v]) => (
          <div key={l} className="srow">
            <span className="slbl">{l}</span>
            <span className="sval">{v}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn btn-p" onClick={onDash}>
          View My Dashboard
        </button>
        <button className="btn btn-g" onClick={onRebook}>
          Book Another
        </button>
      </div>
    </div>
  );
}

function computedPrice(svc, stf) {
  if (!svc) return 0;
  if (stf?.hourlyRate > 0) {
    const durationHours = parseInt(svc.dur || '120') / 60;
    const commissionedRate = calcCommissionPrice(stf.hourlyRate);
    return Math.round(durationHours * commissionedRate);
  }
  return svc.price;
}

export default function BookingForm({ user, onNeedAuth, services, staff, bookings, busySlots, onCreateBooking, onGoDash, onGoHome, stripeKey, token, preselectedService }) {
  const [step, setStep] = useState(preselectedService ? 1 : 0);
  const [svc, setSvc] = useState(preselectedService || null);
  const [stf, setStf] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [det, setDet] = useState({});
  const [createdBooking, setCreatedBooking] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);

  // Persistence for redirect recovery
  useEffect(() => {
    if (svc || stf || date || time) {
      localStorage.setItem("pending_booking", JSON.stringify({
        svcId: svc?.id,
        stfId: stf?.id,
        date: date?.toISOString(),
        time,
        det: { notes: det.notes }, // Only keep notes
        step 
      }));
    }
  }, [svc, stf, date, time, det.notes, step]);

  // Restore state on mount (if no staff selected yet)
  useEffect(() => {
    if (!stf) {
      const saved = localStorage.getItem("pending_booking");
      if (saved) {
        try {
          const { svcId, stfId, date: savedDate, time: savedTime, det: savedDet, step: savedStep } = JSON.parse(saved);
          const foundSvc = services.find(s => s.id === svcId);
          const foundStf = staff.find(s => s.id === stfId);
          if (foundSvc) setSvc(foundSvc);
          if (foundStf) setStf(foundStf);
          if (savedDate) setDate(new Date(savedDate));
          if (savedTime) setTime(savedTime);
          if (savedDet) setDet(savedDet);
          if (savedStep !== undefined) setStep(savedStep);
        } catch (e) {
          console.warn("Failed to restore pending booking", e);
        }
      }
    }
  }, [services, staff]);

  // Sync preselected service
  useEffect(() => {
    if (preselectedService) {
      setSvc(preselectedService);
      if (step === 0) setStep(1);
    }
  }, [preselectedService]);

  // Handle Stripe Redirect Return
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const clientSecret = query.get("payment_intent_client_secret");

    if (clientSecret && stripeKey && services.length > 0 && staff.length > 0) {
      const finishRedirect = async () => {
        setIsProcessingRedirect(true);
        const stripe = await loadStripe(stripeKey);
        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

        if (paymentIntent && paymentIntent.status === "succeeded") {
          // Recover data from localStorage
          const saved = localStorage.getItem("pending_booking");
          if (saved) {
            try {
              const { svcId, stfId, date: savedDate, time: savedTime, det: savedDet } = JSON.parse(saved);
              const foundSvc = services.find(s => s.id === svcId);
              const foundStf = staff.find(s => s.id === stfId);
              
              if (foundSvc && foundStf) {
                setSvc(foundSvc);
                setStf(foundStf);
                setDate(new Date(savedDate));
                setTime(savedTime);
                setDet(savedDet);

                const payload = { serviceId: svcId, staffId: stfId, date: localDateString, time: savedTime, details: { notes: savedDet?.notes } };
                const booking = await onCreateBooking?.(payload);
                setCreatedBooking(booking || null);
                setStep(5);
                
                localStorage.removeItem("pending_booking");
                // Clean URL
                window.history.replaceState({}, "", window.location.pathname);
              }
            } catch (err) {
              console.error("Redirect recovery failed:", err);
            }
          }
        }
        setIsProcessingRedirect(false);
      };

      finishRedirect();
    }
  }, [stripeKey, services, staff]);

  if (isProcessingRedirect) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div className="ld"><span>●</span><span>●</span><span>●</span></div>
        <p style={{ marginTop: 20, color: "var(--muted)" }}>Completing your booking...</p>
      </div>
    );
  }

  const canNext = () => {
    if (step === 0) return !!svc;
    if (step === 1) return !!stf;
    if (step === 2) return !!date && !!time;
    return true;
  };

  const handleSvcSel = s => {
    setSvc(s);
  };

  const next = () => {
    if (step === 0) {
      if (!svc) return;
      setStep(1);
      return;
    }
    if (step === 3) {
      if (!user) {
        onNeedAuth(() => setStep(4));
        return;
      }
    }
    setStep(s => Math.min(s + 1, 5));
  };

  const back = () => {
    const minStep = preselectedService ? 1 : 0;
    setStep(s => Math.max(s - 1, minStep));
  };

  const reset = () => {
    setStep(preselectedService ? 1 : 0);
    if (!preselectedService) setSvc(null);
    setStf(null);
    setDate(null);
    setTime(null);
    setDet({});
    setCreatedBooking(null);
  };

  const createBooking = async () => {
    if (!svc || !stf || !date || !time) throw new Error("Missing booking details");
    
    // Best practice for global bookings: Send the literal calendar date (YYYY-MM-DD) 
    // instead of an ISO string (which shifts the day based on local timezone offsets).
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const localDateString = `${y}-${m}-${d}`;

    const price = computedPrice(svc, stf);
    const payload = { 
      serviceId: svc.id, 
      staffId: stf.id, 
      date: localDateString, 
      time, 
      details: { notes: det.notes }, // Only need notes here now
      overridePrice: price 
    };
    const booking = await onCreateBooking?.(payload);
    setCreatedBooking(booking || null);
    setStep(5);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Progress step={step} skipService={!!preselectedService} />
      <div>
        {step === 0 && !preselectedService && <S1 sel={svc} onSel={handleSvcSel} services={services} />}
        {step === 1 && <S2 sel={stf} onSel={setStf} staff={staff} svcId={svc?.id} onDetails={setSelectedStaff} />}
        {step === 2 && <S3 selDate={date} selTime={time} onDate={setDate} onTime={setTime} busySlots={busySlots || bookings} stf={stf} />}
        {step === 3 && <S5 svc={svc ? {...svc, computedPrice: computedPrice(svc, stf)} : svc} stf={stf} date={date} time={time} det={det} onChange={setDet} />}
        {step === 4 && <S6 svc={svc ? {...svc, computedPrice: computedPrice(svc, stf)} : svc} onSuccess={createBooking} stripeKey={stripeKey} token={token} />}
        {step === 5 && (
          <S7 svc={svc} stf={stf} date={date} time={time} booking={createdBooking} onDash={onGoDash} onRebook={reset} />
        )}
      </div>
      {selectedStaff && (
        <StaffDetailsModal member={selectedStaff} onClose={() => setSelectedStaff(null)} />
      )}
      {step < 5 && (
        <div className="bfoot">
          <button 
            className="btn btn-g btn-sm" 
            onClick={back} 
            disabled={step === (preselectedService ? 1 : 0)}
          >
            ← Back
          </button>

          {step < 4 && (
            <button className="btn btn-p btn-sm" onClick={next} disabled={!canNext()}>
              {step === 3 ? "Pay Now →" : "Continue →"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
