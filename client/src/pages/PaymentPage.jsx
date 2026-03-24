import { useState, useEffect } from "react";
import Progress from "../components/Shared/Progress";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiRequest } from "../utils/api";

function CheckoutForm({ booking, onCreateBooking, onPaymentSuccess, amount, token }) {
  const stripe = useStripe();
  const elements = useElements();
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);

    const amountInCents = Math.round(parseFloat(String(booking.p).replace("$", "")) * 100);
    console.log("[Payment] Submitting elements for amount:", amountInCents);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      console.error("[Payment] Elements submit error:", submitError.message);
      setMsg(submitError.message);
      setBusy(false);
      return;
    }

    try {
      console.log("[Payment] Creating booking on backend...");
      // 1. Create booking and get clientSecret
      const res = await onCreateBooking({
        serviceId: booking.serviceId,
        staffId: booking.staffId,
        date: booking.dt,
        time: booking.t,
        details: { ...booking.det, notes: "Paid via summary page" }
      });

      if (!res.clientSecret) {
        throw new Error("Unable to initialize payment. Please try again.");
      }
      console.log("[Payment] Received clientSecret:", res.clientSecret.slice(0, 10) + "...");

      // 2. Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: res.clientSecret,
        confirmParams: {
          return_url: window.location.origin + "/user/dashboard/bookings",
        },
        redirect: "if_required"
      });

      if (error) {
        console.error("[Payment] Confirm error:", error.message);
        setMsg(error.message);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // 3. Mark booking as paid/upcoming
        await apiRequest(`/bookings/${res.booking.id}/status`, {
          method: "PATCH",
          token,
          body: { status: "upcoming" }
        });
        onPaymentSuccess();
      }
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
      <PaymentElement options={{ layout: "tabs" }} />
      {msg && <div style={{ color: "var(--red)", fontSize: 13, textAlign: "center", padding: 10, background: "rgba(230,57,70,0.1)", borderRadius: 8 }}>{msg}</div>}
      <button className="btn btn-p" disabled={busy || !stripe} style={{ width: "100%", padding: 14 }}>
        {busy ? "Processing..." : `Pay $${amount} & Confirm Booking`}
      </button>
    </form>
  );
}

export default function PaymentPage({ bookingId, onGoDash, onGoHome, stripeKey, token, onCreateBooking }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [stripePromise, setStripePromise] = useState(null);

  const appearance = {
    theme: 'night',
    variables: {
      colorPrimary: '#E63946',
      colorBackground: '#1a1a1a',
      colorText: '#ffffff',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  useEffect(() => {
    if (stripeKey) {
      setStripePromise(loadStripe(stripeKey));
    }
  }, [stripeKey]);

  useEffect(() => {
    if (bookingId === "summary") {
      const saved = sessionStorage.getItem("last_booking_summary");
      if (saved) {
        setBooking(JSON.parse(saved));
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  if (loading) return <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading summary...</div>;

  if (success) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 80 }}>✅</div>
        <h2 style={{ fontSize: 32, fontWeight: 900 }}>Payment Successful!</h2>
        <p style={{ color: "var(--muted)", maxWidth: 400 }}>Your booking has been confirmed. You can now access your dashboard to view details.</p>
        <button className="btn btn-p" onClick={onGoDash} style={{ padding: "12px 32px" }}>Go to Dashboard</button>
      </div>
    );
  }

  if (!booking && bookingId === "summary") {
    return (
      <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 24 }}>No Request Found</div>
        <p style={{ color: "var(--muted)" }}>Please start a new profile creation from the home page.</p>
        <button className="btn btn-p" onClick={onGoHome}>Go to Home</button>
      </div>
    );
  }


  return (
    <div className="se anim-fade-in" style={{ maxWidth: 900, margin: "60px auto", padding: "0 20px" }}>
      <Progress step={6} steps={["Date", "Time", "Service", "Staff", "Account", "Identity", "Summary"]} />
      
      <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 400px", gap: 32, alignItems: "start" }}>
        <div className="glass" style={{ padding: 40, borderRadius: 24 }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Session Summary</h2>
          <p style={{ color: "var(--muted)", marginBottom: 32 }}>Review your session details before finalizing.</p>
          
          <div style={{ textAlign: "left", display: "grid", gap: 12, padding: 24, background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Service</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{booking?.svc}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Specialist</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{booking?.stf}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Date</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{booking?.dt}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Time</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{booking?.t}</span>
            </div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>Amount to Pay</span>
              <span style={{ fontSize: 32, fontWeight: 900, color: "var(--red)" }}>
                {String(booking?.p).startsWith("$") ? booking?.p : `$${booking?.p}`}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
             <button className="btn btn-g" onClick={onGoHome} style={{ flex: 1 }}>Change Details</button>
          </div>
        </div>

        <div className="glass" style={{ padding: 32, borderRadius: 24 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Secure Payment</h3>
          {stripePromise && booking ? (
            <Elements stripe={stripePromise} options={{ 
              mode: 'payment', 
              amount: Math.round(parseFloat(String(booking.p).replace("$", "")) * 100), 
              currency: 'usd', 
              appearance,
              defaultValues: {
                billingDetails: {
                  name: booking.det?.name,
                  email: booking.det?.email,
                  phone: booking.det?.phone,
                  address: {
                    line1: booking.det?.address,
                    city: booking.det?.city,
                    state: booking.det?.state,
                    postal_code: booking.det?.zip,
                    country: booking.det?.country || 'IN',
                  }
                }
              }
            }}>
              <CheckoutForm 
                booking={booking} 
                onCreateBooking={onCreateBooking} 
                onPaymentSuccess={() => setSuccess(true)}
                amount={String(booking.p).replace("$", "")}
                token={token}
              />
            </Elements>
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
              Initializing payment system...
            </div>
          )}
          <div style={{ marginTop: 20, fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
            🔒 Secured by Stripe. Your payment info is never stored.
          </div>
        </div>
      </div>
      
      <style>{`.anim-fade-in { animation: fadeIn 0.5s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
