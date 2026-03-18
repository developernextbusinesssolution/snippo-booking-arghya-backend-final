import { useState } from "react";

export function useToast() {
  const [ts, setTs] = useState([]);
  const toast = (msg, type = "success") => {
    const id = Date.now();
    setTs((t) => [...t, { id, msg, type }]);
    setTimeout(() => setTs((t) => t.filter((x) => x.id !== id)), 3000);
  };
  return { toasts: ts, toast };
}

export default function Toasts({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"} {t.msg}
        </div>
      ))}
    </div>
  );
}
