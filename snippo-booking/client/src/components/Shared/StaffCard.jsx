import { useState } from "react";
import { calcCommissionPrice } from "../../utils/helpers";

/**
 * Public-facing staff card displayed on the user/client side.
 * Shows profile image (or initials fallback), name, designation, specialist, and a Details button.
 */
export default function StaffCard({ member, onDetails }) {
  const [imgErr, setImgErr] = useState(false);

  const specialist = member.role || "Specialist";
  const hasImage = member.profileImage && !imgErr;

  return (
    <div
      className="glass"
      style={{
        padding: "clamp(16px,3vw,24px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 12,
        transition: "transform .2s, box-shadow .2s",
        cursor: "default",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,.35)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          background: `linear-gradient(135deg,${member.c || "#E63946"},rgba(0,0,0,.35))`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: 800,
          border: "2px solid rgba(255,255,255,.08)",
          boxShadow: "0 4px 18px rgba(0,0,0,.3)",
        }}
      >
        {hasImage ? (
          <img
            src={member.profileImage}
            alt={member.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgErr(true)}
          />
        ) : (
          member.i || (member.name?.[0] || "?")
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2, letterSpacing: "-.02em" }}>
          {member.name}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
          {member.role}
        </div>
        {member.reviewCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 8, fontSize: 12 }}>
            <span style={{ color: "#fbbf24" }}>⭐</span>
            <span style={{ fontWeight: 700, color: "var(--text)" }}>{member.rating?.toFixed(1)}</span>
            <span style={{ color: "var(--muted2)" }}>({member.reviewCount})</span>
          </div>
        )}
        <div
          style={{
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: 20,
            background: "var(--red-dim)",
            border: "1px solid var(--border-red)",
            color: "var(--red)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".04em",
          }}
        >
          {specialist}
        </div>
        
        {member.hourlyRate > 0 && (
          <div style={{ marginTop: 10, fontSize: 14, fontWeight: 800, color: "var(--red)" }}>
            ${calcCommissionPrice(member.hourlyRate) * 2} / 2 Hours
          </div>
        )}
      </div>

      {/* Details button */}
      <button
        className="btn btn-g btn-sm"
        style={{ width: "100%", marginTop: 4, fontSize: 12 }}
        onClick={() => onDetails(member)}
      >
        Details
      </button>
    </div>
  );
}
