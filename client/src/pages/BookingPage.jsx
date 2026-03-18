import { useState } from "react";
import { slugify } from "../utils/helpers";
import BookingForm from "../components/Booking/BookingForm";
import AuthModal from "../components/Shared/AuthModal";
import { PublicHeader } from "../components/Layout/Headers";

export default function BookingPage({
  serviceSlug,
  services,
  staff,
  bookings,
  busySlots,
  onCreateBooking,
  onGoDash,
  onGoHome,
  stripeKey,
  token,
  user,
  onUserAuth,
  onLoginClick,
  onSignOut,
  onGoAdmin,
  onGoStaff,
  embedMode = false,
  embedHeader = null,
}) {
  const [showAuth, setShowAuth] = useState(false);
  const [authCb, setAuthCb] = useState(null);

  const handleNeedAuth = (cb) => {
    setAuthCb(() => cb);
    setShowAuth(true);
  };

  const handleAuth = (u) => {
    setShowAuth(false);
    onUserAuth(u);
    if (authCb) { authCb(u); setAuthCb(null); }
  };

  // Find the matching service by slug
  const preselectedService = services.find(
    (s) => s.active && slugify(s.name) === serviceSlug
  ) || null;

  return (
    <>
      {embedMode && embedHeader}
      <div className="home" style={embedMode ? { paddingTop: 14, minHeight: "auto" } : undefined}>
        <div className="home-form">
          {/* Back to home link */}
          <div style={{ marginBottom: 18 }}>
            <button
              className="btn btn-g btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
              onClick={onGoHome}
            >
              ← Back to Services
            </button>
          </div>

          {/* Page Title */}
          <div className="home-title">
            {preselectedService ? preselectedService.name : "Book a Session"}
          </div>
          <div className="home-sub">
            <span>
              {preselectedService
                ? preselectedService.desc
                : "Select your details below to complete your booking."}
            </span>
          </div>

          <BookingForm
            user={user}
            onNeedAuth={handleNeedAuth}
            services={services}
            staff={staff}
            bookings={bookings}
            busySlots={busySlots}
            onCreateBooking={onCreateBooking}
            onGoDash={onGoDash}
            onGoHome={onGoHome}
            stripeKey={stripeKey}
            token={token}
            preselectedService={preselectedService}
          />
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth} />}
    </>
  );
}
