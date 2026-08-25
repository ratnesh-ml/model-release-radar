# Model Release Radar

[![Validate](https://github.com/ratnesh-ml/model-release-radar/actions/workflows/validate.yml/badge.svg)](https://github.com/ratnesh-ml/model-release-radar/actions/workflows/validate.yml)

**Live demo:** [model-release-radar-ratnezhsingh-6317.vercel.app](https://model-release-radar-ratnezhsingh-6317.vercel.app)

I built Model Release Radar to make the conversation after model evaluation more concrete. A single score does not tell a reviewer whether a candidate should move forward. I wanted to put quality, latency, drift, and an explicit decision policy in one small interface where the outcome can be challenged.

The app is a client-side control-room prototype. A reviewer selects a synthetic candidate run, applies a policy, inspects the evidence, and sees a traceable **Release**, **Review**, or **Hold** discussion prompt. Everything is synthetic and stays in the browser.

## What I was practising

| Release question | What the demo makes visible |
| --- | --- |
| Is quality good enough? | A tunable minimum-F1 threshold and the candidate’s observed synthetic score. |
| Is it fast enough for the intended context? | A maximum-latency gate, visible headroom, and a deterministic mini-trend. |
| Has the input distribution moved too far? | A maximum-drift gate and a separate drift signal. |
| Is confidence quality acceptable? | A small calibration-error gate with an explicit fixed review limit. |
| Can different review styles be compared? | Balanced, strict, and latency-sensitive policy presets plus threshold overrides. |
| What does the candidate look like against another? | A selected-baseline comparison with quality, latency, and drift deltas. |
| What is behind a gate? | An evidence drawer with deterministic synthetic trends, review roles, and a gate-by-gate explanation. |
| What should happen when evidence is mixed? | A named Release, Review, or Hold outcome with the failed gates exposed. |
| Can the discussion be captured? | Up to four browser-local review snapshots and a downloadable local Markdown review brief. |

## Why this project belongs in my AI/ML portfolio

I am interested in the engineering work around a model, not only training it. This project is my portfolio-scale exercise in making a release decision inspectable. The interface does not replace governance; it helps show what a reviewer needs to ask before a model is labelled ready.

## Run it locally

```bash
pnpm install
pnpm dev
```

For a production check:

```bash
pnpm check
pnpm build
```

## Scope boundary

All candidates, thresholds, approvals, deterministic history points, and recommendations are synthetic. Browser-local review snapshots and downloaded briefs are demonstration artifacts only. The app does not connect to a registry, monitoring service, database, approval owner, or production deployment workflow. It is not an automated model-risk or governance system.

## Design and implementation notes

I used a colder **Gate Room** visual language: black-and-white audit surfaces, squared evidence panels, and cobalt only for active thresholds and evidence signals. The supplied design analyses influenced high-level hierarchy and interaction principles only; no proprietary asset, font, trademark, source code, or layout was copied.

## Verification and license

The Node 22 workflow runs `pnpm check` and `pnpm build` on pushes and pull requests. This demo uses generated visual assets and synthetic inputs only.

MIT licensed; see [LICENSE](LICENSE).
