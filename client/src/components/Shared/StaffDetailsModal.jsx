import { useState, useEffect } from "react";
import { calcCommissionPrice } from "../../utils/helpers";
import { apiRequest } from "../../utils/api";

/**
 * Shared modal component to display complete staff information.
 */
export default function StaffDetailsModal({ member, onClose }) {
  const [imgErr, setImgErr] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (member && activeTab === "reviews") {
      fetchReviews();
    }
  }, [member, activeTab]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await apiRequest(`/reviews/staff/${member.id}`);
      setReviews(res || []);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const hasImage = member.profileImage && !imgErr;

  return (
    <div className="mov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420, textAlign: "center" }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 11,
            right: 11,
            background: "none",
            border: "none",
            color: "var(--muted)",
            cursor: "pointer",
            fontSize: 19,
            width: 32,
            height: 32,
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>

        {/* Profile image */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            overflow: "hidden",
            background: `linear-gradient(135deg,${member.c || "#E63946"},rgba(0,0,0,.35))`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            fontWeight: 800,
            margin: "0 auto 14px",
            border: "3px solid rgba(255,255,255,.08)",
            boxShadow: "0 6px 24px rgba(0,0,0,.35)",
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
            member.i || member.name?.[0] || "?"
          )}
        </div>

        {/* Name & Designation */}
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>{member.role}</div>
        
        {member.reviewCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 12, fontSize: 14 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {"⭐".repeat(Math.round(member.rating || 0))}
            </div>
            <span style={{ fontWeight: 800, color: "var(--text)" }}>{member.rating?.toFixed(1)}</span>
            <span style={{ color: "var(--muted2)" }}>({member.reviewCount} reviews)</span>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
          <button 
            onClick={() => setActiveTab("info")}
            style={{ flex: 1, padding: "10px 0", background: "none", border: "none", borderBottom: activeTab === "info" ? "2px solid var(--red)" : "none", color: activeTab === "info" ? "var(--red)" : "var(--muted)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >Info</button>
          <button 
            onClick={() => setActiveTab("reviews")}
            style={{ flex: 1, padding: "10px 0", background: "none", border: "none", borderBottom: activeTab === "reviews" ? "2px solid var(--red)" : "none", color: activeTab === "reviews" ? "var(--red)" : "var(--muted)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >Reviews ({member.reviewCount || 0})</button>
        </div>

        <div style={{ maxHeight: 400, overflowY: "auto", padding: "2px" }}>
          {activeTab === "info" ? (
            <>
        {(member.experience || member.totalWorkDone > 0) && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 18,
              background: "var(--glass)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "12px 18px",
              marginBottom: 14,
            }}
          >
            {member.experience && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "var(--red)" }}>
                  {member.experience}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Experience</div>
              </div>
            )}
            {member.experience && member.totalWorkDone > 0 && (
              <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch" }} />
            )}
            {member.totalWorkDone > 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "var(--red)" }}>
                  {member.totalWorkDone}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  Projects Completed
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rate info */}
        {member.hourlyRate > 0 && (
          <div
            style={{
              padding: "12px 18px",
              background: "rgba(230,57,70,0.08)",
              border: "1px solid var(--border-red)",
              borderRadius: 12,
              marginBottom: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--red)", letterSpacing: ".05em", marginBottom: 2 }}>HOURLY RATE (+15%)</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>${calcCommissionPrice(member.hourlyRate)} / Hour</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--red)", letterSpacing: ".05em", marginBottom: 2 }}>2 HOURS RATE</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>${calcCommissionPrice(member.hourlyRate) * 2} / 2 Hours</div>
            </div>
          </div>
        )}

          {/* Bio */}
          {member.bio && (
            <div
              style={{
                background: "var(--glass)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "12px 16px",
                fontSize: 13,
                color: "var(--muted)",
                lineHeight: 1.7,
                textAlign: "left",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--muted2)",
                  letterSpacing: ".06em",
                  marginBottom: 6,
                }}
              >
                BIO
              </div>
              {member.bio}
            </div>
          )}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
              {loadingReviews ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, background: "rgba(255,255,255,0.03)", borderRadius: 16 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>
                  <div style={{ fontWeight: 700 }}>No reviews yet</div>
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>Be the first to review {member.name} after your session!</p>
                </div>
              ) : (
                reviews.map(r => (
                  <div key={r.id} style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 14, border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{r.user_name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ fontSize: 14 }}>
                        {"⭐".repeat(r.rating)}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.8)" }}>"{r.comment}"</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button className="btn btn-g" style={{ width: "100%" }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
