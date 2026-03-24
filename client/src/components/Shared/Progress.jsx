import { STEPS } from "../../utils/helpers";

export default function Progress({ step, forceTotal, label, steps }) {
  const currentSteps = steps || STEPS;
  const currentLabel = label || currentSteps[step];

  return (
    <>
      <div className="prog">
        {currentSteps.map((l, i) => (
          <div className="prog-step" key={i}>
            <div className="prog-lw">
              <div className={`pdot ${i < step ? "pd" : i === step ? "pa" : "pf"}`}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < currentSteps.length - 1 && (
                <div className={`pline ${i < step ? "done" : ""}`} />
              )}
            </div>
            <div className={`plbl ${i === step ? "act" : i < step ? "done" : ""}`}>
              {l}
            </div>
          </div>
        ))}
      </div>
      <div className="prog-mini">
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 1, textTransform: "uppercase", letterSpacing: ".05em" }}>
            Step {step + 1}: {currentLabel}
          </div>
        </div>
        <div className="pm-dots">
          {currentSteps.map((_, i) => (
            <div key={i} className={`pm ${i < step ? "done" : i === step ? "act" : ""}`} />
          ))}
        </div>
      </div>
    </>
  );
}
