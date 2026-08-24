/**
 * Model Release Radar visual contract: black-and-white release-control room,
 * cobalt only for an explicit signal, and every simulated decision is traceable.
 */
import { useMemo, useState } from "react";
import { Activity, ArrowRight, CheckCircle2, CircleAlert, Gauge, GitPullRequest, ShieldCheck, SlidersHorizontal } from "lucide-react";

type Run = { id: string; label: string; f1: number; latency: number; drift: number; calibration: number; approvals: number; note: string };
const RUNS: Run[] = [
  { id: "vision", label: "vision-gate-v3", f1: .94, latency: 128, drift: .06, calibration: .025, approvals: 2, note: "Image-quality classifier candidate with a low observed drift signal." },
  { id: "retrieval", label: "evidence-retrieval-v2", f1: .91, latency: 274, drift: .11, calibration: .04, approvals: 1, note: "Retrieval candidate with one approval and elevated response time." },
  { id: "forecast", label: "demand-forecast-v1", f1: .88, latency: 96, drift: .17, calibration: .08, approvals: 2, note: "Forecast candidate with a clear drift-review requirement." },
];

export default function ModelReleaseRadar() {
  const [runId, setRunId] = useState("vision");
  const [minF1, setMinF1] = useState(.9);
  const [maxLatency, setMaxLatency] = useState(220);
  const [maxDrift, setMaxDrift] = useState(.12);
  const [toast, setToast] = useState("");
  const run = RUNS.find((item) => item.id === runId) ?? RUNS[0];
  const gates = useMemo(() => [
    { label: "Evaluation quality", detail: `F1 ${run.f1.toFixed(2)} against minimum ${minF1.toFixed(2)}.`, pass: run.f1 >= minF1 },
    { label: "Serving latency", detail: `${run.latency} ms against a ${maxLatency} ms ceiling.`, pass: run.latency <= maxLatency },
    { label: "Observed drift", detail: `Drift score ${run.drift.toFixed(2)} against a ${maxDrift.toFixed(2)} review threshold.`, pass: run.drift <= maxDrift },
    { label: "Approval evidence", detail: `${run.approvals} of 2 expected review approvals are recorded.`, pass: run.approvals === 2 },
  ], [run, minF1, maxLatency, maxDrift]);
  const failed = gates.filter((gate) => !gate.pass).length;
  const decision = failed === 0 ? "Release" : failed === 1 ? "Review" : "Hold";
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2500); };

  return <div className="radar-app">
    <header className="radar-nav"><div className="radar-brand"><img src="/assets/model-release-radar-mark.png" alt="Model Release Radar mark" /> MODEL / RELEASE</div><span style={{ color: "#bfbfbf", fontSize: 12 }}>Synthetic evidence · browser-only demo</span></header>
    <main className="radar-shell">
      <section className="radar-hero"><div className="radar-hero-copy"><span className="eyebrow" style={{ color: "#9dc8ff" }}>Synthetic release-control demonstration</span><h1>One model. One release decision.</h1><p>Inspect a candidate run, tune its policy thresholds, and see which evidence justifies a simulated release, review, or hold outcome.</p><button className="radar-primary" onClick={() => document.getElementById("review")?.scrollIntoView({ behavior: "smooth" })}>Run a review <ArrowRight size={15} style={{ display: "inline", marginLeft: 4 }} /></button></div><div className="radar-hero-art" aria-label="Abstract release-control signal visualization" /></section>
      <section className="radar-workspace" id="review"><aside className="radar-side"><span className="eyebrow">Candidate run</span><h2>Set the policy.</h2><select className="run-select" value={runId} onChange={(event) => setRunId(event.target.value)} aria-label="Candidate model run">{RUNS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select><div className="side-kicker"><span>Release thresholds</span><SlidersHorizontal size={15} /></div><div className="threshold-row"><label>Minimum F1 <span>{minF1.toFixed(2)}</span></label><input type="range" min=".80" max=".97" step=".01" value={minF1} onChange={(event) => setMinF1(Number(event.target.value))} /></div><div className="threshold-row"><label>Max latency <span>{maxLatency} ms</span></label><input type="range" min="80" max="380" step="10" value={maxLatency} onChange={(event) => setMaxLatency(Number(event.target.value))} /></div><div className="threshold-row"><label>Max drift score <span>{maxDrift.toFixed(2)}</span></label><input type="range" min=".04" max=".25" step=".01" value={maxDrift} onChange={(event) => setMaxDrift(Number(event.target.value))} /></div></aside>
      <div className="radar-main"><div className="radar-main-head"><div><span className="eyebrow">Decision trace</span><h2>{run.label}</h2></div><p>{run.note} This is a browser-only, synthetic portfolio scenario — not an automated production approval system.</p></div><article className="decision-card"><div className="decision-top"><div><span className="eyebrow">Recommended action</span><h3>{decision}</h3></div><span className={`decision-status ${decision.toLowerCase()}`}>{failed === 0 ? "All gates pass" : `${failed} gate${failed > 1 ? "s" : ""} needs attention`}</span></div><div className="metric-grid"><div className="metric"><span>F1 score</span><strong>{run.f1.toFixed(2)}</strong><small>{run.f1 >= minF1 ? "meets floor" : "below floor"}</small></div><div className="metric"><span>Latency</span><strong>{run.latency}</strong><small>ms p95 demo</small></div><div className="metric"><span>Drift</span><strong>{run.drift.toFixed(2)}</strong><small>PSI-style demo</small></div><div className="metric"><span>Approvals</span><strong>{run.approvals}/2</strong><small>evidence recorded</small></div></div><div className="gate-list">{gates.map((gate) => <div className="gate-row" key={gate.label}><span className="gate-icon">{gate.pass ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}</span><strong>{gate.label}</strong><span className={`gate-state ${gate.pass ? "pass" : "fail"}`}>{gate.pass ? "passes" : "needs review"}</span><p>{gate.detail}</p></div>)}</div></article>
      <section className="radar-lower"><article className="radar-card"><div className="radar-card-copy"><span className="eyebrow">Signal profile</span><h3>Read the evidence, not just the color.</h3><div className="signal-rows"><div className="signal"><span>Quality</span><div className="signal-meter"><i className="cobalt" style={{ width: `${run.f1 * 100}%` }} /></div><b>{Math.round(run.f1 * 100)}%</b></div><div className="signal"><span>Latency headroom</span><div className="signal-meter"><i style={{ width: `${Math.max(8, 100 - run.latency / 4)}%` }} /></div><b>{Math.max(0, maxLatency - run.latency)} ms</b></div><div className="signal"><span>Drift headroom</span><div className="signal-meter"><i style={{ width: `${Math.max(8, 100 - run.drift * 320)}%` }} /></div><b>{Math.max(0, maxDrift - run.drift).toFixed(2)}</b></div></div><div className="radar-note"><ShieldCheck size={15} style={{ display: "inline", marginRight: 7 }} />A release label is a structured discussion prompt. Production governance still needs owners, records, and appropriate model-risk review.</div></div></article><article className="radar-card"><img src="/assets/model-release-radar-evidence.jpg" alt="Abstract ML evaluation evidence cards" /><div className="radar-card-copy"><span className="eyebrow">Reviewer handoff</span><h3>Package the open questions.</h3><p>Generate a compact handoff note with the candidate, failed gates, and review prompts. It stays in this browser and does not send data anywhere.</p><button className="radar-primary" style={{ background: "#050505", color: "#fff" }} onClick={() => notify(`${decision} note prepared for ${run.label} (demo).`)}>Prepare review note <GitPullRequest size={15} style={{ display: "inline", marginLeft: 4 }} /></button></div></article></section></div></section>
      <footer style={{ marginTop: 30, color: "#777", fontSize: 11, lineHeight: 1.6 }}>Model Release Radar · Synthetic signals, client-side rules, and an explainable decision trace for portfolio discussion.</footer>
    </main>{toast && <div className="radar-toast"><Activity size={14} style={{ display: "inline", marginRight: 7 }} />{toast}</div>}
  </div>;
}
