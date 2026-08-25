/**
 * Review Console visual contract: a client-side, synthetic release review room.
 * Policies, review snapshots, and downloads remain in the visitor's browser.
 */
import { useEffect, useMemo, useState } from "react";
import "./radar-advanced.css";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Download,
  FileText,
  Gauge,
  GitCompareArrows,
  History,
  PanelRightOpen,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";

type Run = {
  id: string;
  label: string;
  f1: number;
  latency: number;
  drift: number;
  calibration: number;
  approvals: number;
  note: string;
  qualityTrend: number[];
  latencyTrend: number[];
  reviewRoles: string[];
  dataWindow: string;
};
type Policy = { minF1: number; maxLatency: number; maxDrift: number; name: string };
type Gate = { label: string; detail: string; pass: boolean; evidence: string };
type ReviewEntry = { id: string; candidate: string; decision: string; failures: number; policy: Policy; localOrder: number };

const RUNS: Run[] = [
  { id: "vision", label: "vision-gate-v3", f1: 0.94, latency: 128, drift: 0.06, calibration: 0.025, approvals: 2, note: "Image-quality classifier candidate with a low observed drift signal.", qualityTrend: [0.91, 0.92, 0.93, 0.94, 0.94, 0.94], latencyTrend: [140, 136, 132, 128, 130, 128], reviewRoles: ["Model owner", "Data reviewer"], dataWindow: "Synthetic validation slice / 6 runs" },
  { id: "retrieval", label: "evidence-retrieval-v2", f1: 0.91, latency: 274, drift: 0.11, calibration: 0.04, approvals: 1, note: "Retrieval candidate with one approval and elevated response time.", qualityTrend: [0.89, 0.9, 0.9, 0.91, 0.91, 0.91], latencyTrend: [236, 244, 257, 264, 271, 274], reviewRoles: ["Model owner"], dataWindow: "Synthetic retrieval suite / 6 runs" },
  { id: "forecast", label: "demand-forecast-v1", f1: 0.88, latency: 96, drift: 0.17, calibration: 0.08, approvals: 2, note: "Forecast candidate with a clear drift-review requirement.", qualityTrend: [0.9, 0.9, 0.89, 0.89, 0.88, 0.88], latencyTrend: [101, 99, 95, 97, 94, 96], reviewRoles: ["Model owner", "Domain reviewer"], dataWindow: "Synthetic temporal holdout / 6 runs" },
];
const PRESETS: Record<string, Policy> = {
  balanced: { name: "Balanced", minF1: 0.9, maxLatency: 220, maxDrift: 0.12 },
  strict: { name: "Strict", minF1: 0.93, maxLatency: 180, maxDrift: 0.08 },
  latency: { name: "Latency-sensitive", minF1: 0.88, maxLatency: 130, maxDrift: 0.14 },
};

function decisionFrom(gates: Gate[]) {
  const failures = gates.filter((gate) => !gate.pass).length;
  return { failures, label: failures === 0 ? "Release" : failures === 1 ? "Review" : "Hold" } as const;
}

function triggerDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function MiniTrend({ values, mode }: { values: number[]; mode: "quality" | "latency" }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = max === min ? 50 : 88 - ((value - min) / (max - min)) * 68;
    return `${x},${y}`;
  }).join(" ");
  return <svg className={`mini-trend ${mode}`} viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`${mode} trend for synthetic history`}><polyline points={points} /></svg>;
}

export default function ModelReleaseRadar() {
  const [runId, setRunId] = useState("vision");
  const [baselineId, setBaselineId] = useState("retrieval");
  const [policy, setPolicy] = useState<Policy>(PRESETS.balanced);
  const [presetKey, setPresetKey] = useState("balanced");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ledger, setLedger] = useState<ReviewEntry[]>([]);
  const [toast, setToast] = useState("");
  const run = RUNS.find((item) => item.id === runId) ?? RUNS[0];
  const baseline = RUNS.find((item) => item.id === baselineId) ?? RUNS[1];
  const gates = useMemo<Gate[]>(() => [
    { label: "Evaluation quality", detail: `F1 ${run.f1.toFixed(2)} against minimum ${policy.minF1.toFixed(2)}.`, pass: run.f1 >= policy.minF1, evidence: "Synthetic held-out score; inspect task definition and error slices before a real decision." },
    { label: "Serving latency", detail: `${run.latency} ms against a ${policy.maxLatency} ms ceiling.`, pass: run.latency <= policy.maxLatency, evidence: "Synthetic p95 proxy; a real system needs load, cost, and reliability context." },
    { label: "Observed drift", detail: `Drift score ${run.drift.toFixed(2)} against a ${policy.maxDrift.toFixed(2)} review threshold.`, pass: run.drift <= policy.maxDrift, evidence: "PSI-style synthetic signal; investigate distribution changes before trusting a single score." },
    { label: "Calibration check", detail: `Calibration error ${run.calibration.toFixed(3)} against a fixed 0.050 review limit.`, pass: run.calibration <= 0.05, evidence: "A compact proxy for confidence quality, not a complete calibration study." },
    { label: "Approval evidence", detail: `${run.approvals} of 2 expected review approvals are recorded.`, pass: run.approvals === 2, evidence: "Recorded synthetic roles are visible in the evidence drawer." },
  ], [run, policy]);
  const decision = useMemo(() => decisionFrom(gates), [gates]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("model-release-review-ledger-v2");
      if (stored) setLedger(JSON.parse(stored) as ReviewEntry[]);
    } catch { /* optional browser persistence */ }
  }, []);
  useEffect(() => { try { window.localStorage.setItem("model-release-review-ledger-v2", JSON.stringify(ledger)); } catch { /* optional browser persistence */ } }, [ledger]);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2800); };
  const updatePolicy = <K extends keyof Policy>(key: K, value: Policy[K]) => { setPolicy((current) => ({ ...current, [key]: value, name: "Custom" })); setPresetKey("custom"); };
  const applyPreset = (key: string) => { const next = PRESETS[key]; setPolicy(next); setPresetKey(key); notify(`${next.name} policy applied.`); };
  const recordReview = () => {
    setLedger((current) => [{ id: `${Date.now()}`, candidate: run.label, decision: decision.label, failures: decision.failures, policy, localOrder: current.length + 1 }, ...current].slice(0, 4));
    notify("Synthetic review snapshot saved in this browser.");
  };
  const downloadBrief = () => {
    const failed = gates.filter((gate) => !gate.pass);
    const brief = `# Model Release Radar — synthetic review brief\n\n**Candidate:** ${run.label}\n**Recommended action:** ${decision.label}\n**Policy:** ${policy.name}\n\n## Policy thresholds\n- Minimum F1: ${policy.minF1.toFixed(2)}\n- Max latency: ${policy.maxLatency} ms\n- Max drift: ${policy.maxDrift.toFixed(2)}\n\n## Gate trace\n${gates.map((gate) => `- ${gate.pass ? "PASS" : "REVIEW"} — ${gate.label}: ${gate.detail}`).join("\n")}\n\n## Review prompt\n${failed.length ? failed.map((gate) => `- Resolve: ${gate.label}. ${gate.evidence}`).join("\n") : "- All synthetic gates pass. Confirm a real owner, evidence record, and appropriate model-risk review before any production release."}\n\n> This client-side Markdown file records a simulated portfolio review. It is not an automated production approval, telemetry record, or governance system.\n`;
    triggerDownload("model-release-radar-review-brief.md", brief);
    notify("Synthetic review brief downloaded locally.");
  };
  const selectRun = (id: string) => { setRunId(id); if (id === baselineId) setBaselineId(id === "vision" ? "retrieval" : "vision"); };

  return <div className="radar-app">
    <header className="radar-nav"><div className="radar-brand"><img src="/assets/model-release-radar-mark.png" alt="Model Release Radar mark" /> MODEL / RELEASE</div><nav className="radar-nav-links"><a href="#review">Review</a><a href="#compare">Compare</a><a href="#ledger">Local ledger</a></nav><span className="radar-meta">Synthetic evidence · browser-only</span></header>
    <main className="radar-shell">
      <section className="radar-hero"><div className="radar-hero-copy"><span className="eyebrow" style={{ color: "#9dc8ff" }}>Synthetic release-control demonstration</span><h1>One model.<br />More than one signal.</h1><p>Compare candidates, tune a simulated policy, open the evidence behind each gate, and produce a review record that stays on this device.</p><button className="radar-primary" onClick={() => document.getElementById("review")?.scrollIntoView({ behavior: "smooth" })}>Open the review console <ArrowRight size={15} style={{ display: "inline", marginLeft: 4 }} /></button></div><div className="radar-hero-art" aria-label="Abstract release-control signal visualization" /></section>

      <section className="radar-workspace" id="review"><aside className="radar-side"><span className="eyebrow">Candidate run</span><h2>Set the review policy.</h2><select className="run-select" value={runId} onChange={(event) => selectRun(event.target.value)} aria-label="Candidate model run">{RUNS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select><div className="side-kicker"><span>Policy presets</span><SlidersHorizontal size={15} /></div><div className="preset-grid">{Object.entries(PRESETS).map(([key, preset]) => <button key={key} className={`preset-button ${presetKey === key ? "selected" : ""}`} onClick={() => applyPreset(key)}>{preset.name}</button>)}</div><div className="side-kicker"><span>Threshold overrides</span><Gauge size={15} /></div><div className="threshold-row"><label>Minimum F1 <span>{policy.minF1.toFixed(2)}</span></label><input type="range" min=".80" max=".97" step=".01" value={policy.minF1} onChange={(event) => updatePolicy("minF1", Number(event.target.value))} /></div><div className="threshold-row"><label>Max latency <span>{policy.maxLatency} ms</span></label><input type="range" min="80" max="380" step="10" value={policy.maxLatency} onChange={(event) => updatePolicy("maxLatency", Number(event.target.value))} /></div><div className="threshold-row"><label>Max drift score <span>{policy.maxDrift.toFixed(2)}</span></label><input type="range" min=".04" max=".25" step=".01" value={policy.maxDrift} onChange={(event) => updatePolicy("maxDrift", Number(event.target.value))} /></div><div className="policy-note"><ShieldCheck size={14} /> Policy is a demo control, not a production rule.</div></aside>

      <div className="radar-main"><div className="radar-main-head"><div><span className="eyebrow">Decision trace / {policy.name}</span><h2>{run.label}</h2></div><p>{run.note} Candidate values are synthetic and this browser-only tool does not grant a production approval.</p></div><article className="decision-card"><div className="decision-top"><div><span className="eyebrow">Recommended action</span><h3>{decision.label}</h3></div><span className={`decision-status ${decision.label.toLowerCase()}`}>{decision.failures === 0 ? "All gates pass" : `${decision.failures} gate${decision.failures > 1 ? "s" : ""} needs attention`}</span></div><div className="metric-grid"><div className="metric"><span>F1 score</span><strong>{run.f1.toFixed(2)}</strong><small>{run.f1 >= policy.minF1 ? "meets floor" : "below floor"}</small></div><div className="metric"><span>Latency</span><strong>{run.latency}</strong><small>ms p95 demo</small></div><div className="metric"><span>Drift</span><strong>{run.drift.toFixed(2)}</strong><small>PSI-style demo</small></div><div className="metric"><span>Approvals</span><strong>{run.approvals}/2</strong><small>evidence recorded</small></div></div><div className="gate-list">{gates.map((gate) => <button className="gate-row gate-button" key={gate.label} onClick={() => setDrawerOpen(true)}><span className="gate-icon">{gate.pass ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}</span><strong>{gate.label}</strong><span className={`gate-state ${gate.pass ? "pass" : "fail"}`}>{gate.pass ? "passes" : "needs review"}</span><p>{gate.detail}</p><ChevronRight className="gate-chevron" size={14} /></button>)}</div><div className="decision-actions"><button className="radar-outline" onClick={() => setDrawerOpen(true)}><PanelRightOpen size={15} /> Inspect evidence</button><button className="radar-dark" onClick={recordReview}><Save size={15} /> Save review snapshot</button></div></article>

      <section className="radar-lower"><article className="radar-card"><div className="radar-card-copy"><span className="eyebrow">Signal profile</span><h3>Read the movement behind the score.</h3><p>Six deterministic synthetic points make the direction of quality and latency visible, without pretending to show operational telemetry.</p><div className="trend-grid"><div className="trend-card"><div><span>Quality history</span><b>{run.f1.toFixed(2)}</b></div><MiniTrend values={run.qualityTrend} mode="quality" /></div><div className="trend-card"><div><span>Latency history</span><b>{run.latency} ms</b></div><MiniTrend values={run.latencyTrend} mode="latency" /></div></div><div className="radar-note"><ShieldCheck size={15} style={{ display: "inline", marginRight: 7 }} />A release label is a structured discussion prompt. Production governance still needs owners, records, and appropriate model-risk review.</div></div></article><article className="radar-card evidence-preview"><img src="/assets/model-release-radar-evidence.jpg" alt="Abstract ML evaluation evidence cards" /><div className="radar-card-copy"><span className="eyebrow">Reviewer handoff</span><h3>Make the open questions portable.</h3><p>Download the simulated candidate, current policy, gate trace, and review prompts as a local Markdown file.</p><button className="radar-primary dark-action" onClick={downloadBrief}>Download review brief <Download size={15} style={{ display: "inline", marginLeft: 4 }} /></button></div></article></section></div></section>

      <section className="comparison-card" id="compare"><div className="comparison-header"><div><span className="eyebrow">Candidate comparison</span><h2>Compare the release conversation.</h2></div><div className="baseline-select"><label htmlFor="baseline-run">Baseline</label><select id="baseline-run" value={baselineId} onChange={(event) => setBaselineId(event.target.value)}>{RUNS.filter((item) => item.id !== runId).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div></div><p>Numbers remain synthetic. Deltas are relative to the selected baseline and are useful only for this simulated review exercise.</p><div className="comparison-table" role="table"><div className="comparison-row comparison-head" role="row"><span>Candidate</span><span>F1</span><span>Latency</span><span>Drift</span><span>Gate view</span></div>{RUNS.map((item) => { const itemDecision = decisionFrom([
        { label: "quality", detail: "", pass: item.f1 >= policy.minF1, evidence: "" }, { label: "latency", detail: "", pass: item.latency <= policy.maxLatency, evidence: "" }, { label: "drift", detail: "", pass: item.drift <= policy.maxDrift, evidence: "" }, { label: "calibration", detail: "", pass: item.calibration <= .05, evidence: "" }, { label: "approvals", detail: "", pass: item.approvals === 2, evidence: "" },
      ]); return <button className={`comparison-row ${item.id === runId ? "active" : ""}`} onClick={() => selectRun(item.id)} key={item.id}><span><b>{item.label}</b>{item.id === baselineId && <small>baseline</small>}</span><span>{item.f1.toFixed(2)} <em className={item.f1 - baseline.f1 >= 0 ? "up" : "down"}>{item.id === baselineId ? "—" : `${item.f1 - baseline.f1 >= 0 ? "+" : ""}${(item.f1 - baseline.f1).toFixed(2)}`}</em></span><span>{item.latency} <em className={item.latency - baseline.latency <= 0 ? "up" : "down"}>{item.id === baselineId ? "—" : `${item.latency - baseline.latency >= 0 ? "+" : ""}${item.latency - baseline.latency}`}</em></span><span>{item.drift.toFixed(2)} <em className={item.drift - baseline.drift <= 0 ? "up" : "down"}>{item.id === baselineId ? "—" : `${item.drift - baseline.drift >= 0 ? "+" : ""}${(item.drift - baseline.drift).toFixed(2)}`}</em></span><span className={`table-decision ${itemDecision.label.toLowerCase()}`}>{itemDecision.label}</span></button>; })}</div></section>

      <section className="ledger-card" id="ledger"><div className="ledger-header"><div><span className="eyebrow">Local review ledger</span><h2>Remember the policy used for a demo decision.</h2></div>{ledger.length > 0 && <button className="radar-text-button" onClick={() => { setLedger([]); notify("Local review ledger cleared."); }}>Clear ledger</button>}</div>{ledger.length === 0 ? <div className="radar-empty"><History size={22} /><p>Save a review snapshot to keep a small local history of synthetic candidate decisions and policies.</p></div> : <div className="review-ledger">{ledger.map((entry) => <div className="review-ledger-row" key={entry.id}><span className={`table-decision ${entry.decision.toLowerCase()}`}>{entry.decision}</span><b>{entry.candidate}</b><span>{entry.policy.name} policy</span><span>{entry.failures} failing gate{entry.failures === 1 ? "" : "s"}</span><small>local snapshot {entry.localOrder}</small></div>)}</div>}</section>

      <footer className="radar-footer">Model Release Radar · Synthetic signals, client-side policy rules, and explainable decision traces for portfolio discussion.</footer>
    </main>
    {drawerOpen && <div className="evidence-drawer-backdrop" role="presentation" onMouseDown={() => setDrawerOpen(false)}><aside className="evidence-drawer" role="dialog" aria-modal="true" aria-label="Synthetic candidate evidence" onMouseDown={(event) => event.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">Evidence drawer</span><h2>{run.label}</h2></div><button className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close evidence drawer"><X size={17} /></button></div><p className="drawer-intro">{run.dataWindow}. Every element below is deterministic synthetic demonstration data.</p><div className="drawer-block"><span>Recorded review roles</span><div className="role-pills">{run.reviewRoles.map((role) => <b key={role}><UsersRound size={13} /> {role}</b>)}</div></div><div className="drawer-block"><span>Gate evidence</span>{gates.map((gate) => <div className="drawer-gate" key={gate.label}><strong>{gate.label}</strong><p>{gate.evidence}</p></div>)}</div><div className="drawer-block"><span>Current review prompt</span><p>{decision.failures === 0 ? "All synthetic gates pass. Name a real decision owner and attach reviewed evidence before any release." : "Open each failing gate, validate the source data and policy, then record who owns the follow-up."}</p></div><button className="radar-dark full-width" onClick={downloadBrief}><FileText size={15} /> Download this review brief</button></aside></div>}
    {toast && <div className="radar-toast"><Sparkles size={14} style={{ display: "inline", marginRight: 7 }} />{toast}</div>}
  </div>;
}
