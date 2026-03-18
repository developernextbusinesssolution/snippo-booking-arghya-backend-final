export default function Pagination({ current, total, onPage }) {
  if (total <= 1) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginTop: 24, padding: "10px 0" }}>
      <button className="btn btn-g btn-sm" disabled={current === 1} onClick={() => onPage(current - 1)}>
        ← Prev
      </button>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
        Page <span style={{ color: "var(--text)" }}>{current}</span> of {total}
      </span>
      <button className="btn btn-g btn-sm" disabled={current === total} onClick={() => onPage(current + 1)}>
        Next →
      </button>
    </div>
  );
}
