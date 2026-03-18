import { useState } from "react";
import { slugify, fmtDur } from "../utils/helpers";
import AuthModal from "../components/Shared/AuthModal";

function ServiceCard({ svc, onBook }) {
  return (
    <div
      style={{
        background: "var(--glass)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform .2s, box-shadow .2s, border-color .2s",
        cursor: "pointer",
      }}
      className="svc-catalog-card"
      onClick={() => onBook(svc)}
    >
      {/* Service Image */}
      <div style={{ width: "100%", aspectRatio: "16/9", background: "#0d0d1a", overflow: "hidden", position: "relative" }}>
        {svc.img ? (
          <img
            src={svc.img}
            alt={svc.name}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .3s" }}
            className="svc-catalog-img"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
            🎬
          </div>
        )}
        {/* Duration badge */}
        <div style={{
          position: "absolute", bottom: 10, right: 12,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700,
          color: "#fff", border: "1px solid rgba(255,255,255,0.1)"
        }}>
          ⏱ {fmtDur(svc.dur)}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: "18px 20px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-.02em" }}>{svc.name}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, flex: 1 }}>{svc.desc}</div>
        <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted2)", fontWeight: 600 }}>Starting from</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--red)", letterSpacing: "-.03em" }}>${svc.price}<span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 400 }}>/hr</span></div>
        </div>
        <button
          className="btn btn-p"
          style={{ width: "100%", marginTop: 6, padding: "12px 0", fontSize: 14, fontWeight: 700, borderRadius: 10 }}
          onClick={(e) => { e.stopPropagation(); onBook(svc); }}
        >
          Book Now →
        </button>
      </div>
    </div>
  );
}

export default function HomePage({ user, onUserAuth, onGoDash, services, onBookService, embedMode = false, embedHeader = null }) {
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

  const handleBook = (svc) => {
    onBookService(svc);
  };

  const activeServices = services.filter(s => s.active);

  return (
    <>
      <style>{`
        .svc-catalog-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(230,57,70,0.15);
          border-color: rgba(230,57,70,0.3) !important;
        }
        .svc-catalog-card:hover .svc-catalog-img {
          transform: scale(1.04);
        }
      `}</style>

      <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
        {embedMode && embedHeader}

        {/* Hero Section */}
        <div style={{
          textAlign: "center",
          padding: embedMode ? "40px 20px 32px" : "80px 20px 50px",
          maxWidth: 700,
          margin: "0 auto"
        }}>
          <div style={{
            display: "inline-block",
            background: "var(--red-dim)",
            border: "1px solid var(--border-red)",
            borderRadius: 20,
            padding: "5px 14px",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--red)",
            letterSpacing: ".07em",
            marginBottom: 18
          }}>
            PROFESSIONAL STUDIO SERVICES
          </div>
          <h1 style={{
            fontSize: "clamp(32px, 6vw, 56px)",
            fontWeight: 900,
            letterSpacing: "-.04em",
            lineHeight: 1.1,
            marginBottom: 16,
            background: "linear-gradient(135deg, #fff 30%, rgba(255,255,255,.65))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Book Your Studio Session
          </h1>
          <p style={{
            fontSize: "clamp(14px, 2.5vw, 17px)",
            color: "var(--muted)",
            lineHeight: 1.7,
            maxWidth: 520,
            margin: "0 auto"
          }}>
            Reserve your recording, photography, or videography session in minutes. Choose your service to get started.
          </p>
        </div>

        {/* Services Grid */}
        <div style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 40px)"
        }}>
          {activeServices.length === 0 ? (
            <div className="glass" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
              No services available at the moment.
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
              gap: 24
            }}>
              {activeServices.map(svc => (
                <ServiceCard key={svc.id} svc={svc} onBook={handleBook} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth} />}
    </>
  );
}
