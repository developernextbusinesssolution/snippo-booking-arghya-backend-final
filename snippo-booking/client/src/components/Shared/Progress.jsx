import { STEPS } from "../../utils/helpers";

export default function Progress({ step, skipService = false }) {
  const effectiveSteps = skipService ? STEPS.slice(1) : STEPS;
  const currentVisualStep = skipService ? step - 1 : step;

  return (
    <>
      <div className="prog">
        {effectiveSteps.map((l, i) => (
          <div className="prog-step" key={i}>
            <div className="prog-lw">
              <div className={`pdot ${i < currentVisualStep ? "pd" : i === currentVisualStep ? "pa" : "pf"}`}>
                {i < currentVisualStep ? "✓" : i + 1}
              </div>
              {i < effectiveSteps.length - 1 && (
                <div className={`pline ${i < currentVisualStep ? "done" : ""}`} />
              )}
            </div>
            <div className={`plbl ${i === currentVisualStep ? "act" : i < currentVisualStep ? "done" : ""}`}>
              {l}
            </div>
          </div>
        ))}
      </div>
      <div className="prog-mini">
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 1 }}>
            {effectiveSteps[currentVisualStep]}
          </div>
        </div>
        <div className="pm-dots">
          {effectiveSteps.map((_, i) => (
            <div key={i} className={`pm ${i < currentVisualStep ? "done" : i === currentVisualStep ? "act" : ""}`} />
          ))}
        </div>
      </div>
    </>
  );
}
