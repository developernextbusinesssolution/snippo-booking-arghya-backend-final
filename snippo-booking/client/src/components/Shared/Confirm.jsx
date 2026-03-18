export default function Confirm({ msg, onOk, onCancel }) {
  return (
    <div className="mov" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 340, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 38, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 9, letterSpacing: "-.02em" }}>Are you sure?</div>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>{msg}</p>
        <div style={{ display: "flex", gap: 9, justifyContent: "center" }}>
          <button className="btn btn-g" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onOk}>Delete</button>
        </div>
      </div>
    </div>
  );
}
