# Model Release Radar

Model Release Radar is an interactive, client-side control-room prototype for an ML release conversation. It lets a reviewer choose a synthetic model run, adjust quality, latency, and drift thresholds, and inspect the evidence behind a simulated **Release**, **Review**, or **Hold** recommendation.

**Live demo:** [model-release-radar-ratnezhsingh-6317.vercel.app](https://model-release-radar-ratnezhsingh-6317.vercel.app)

## Why this project exists

Model projects are often shown as training notebooks or isolated metrics. This app demonstrates the next question: how can an ML practitioner make a release decision transparent, inspectable, and open to challenge? It is a portfolio-scale learning application, not a production governance service.

## Features

| Capability | What it does |
| --- | --- |
| Candidate runs | Switches among three labelled synthetic model candidates. |
| Policy controls | Lets the reviewer tune minimum F1, maximum latency, and maximum drift thresholds. |
| Traceable decision | Converts visible gates into a clear Release, Review, or Hold outcome. |
| Evidence profile | Shows quality, latency headroom, and drift headroom without relying on a single opaque score. |
| Safe handoff | Generates a browser-only review-note confirmation; no data is sent or stored remotely. |

## Run locally

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

All runs, thresholds, approvals, and output recommendations are synthetic. This interface does not connect to a registry, monitoring service, database, or production approval workflow. It should not be presented as an automated model-risk or governance system.

## Design

Model Release Radar uses a colder release-control language: black and white audit surfaces, squared evidence panels, and cobalt only for active thresholds and evidence signals. The supplied Meta, Apple, and Uber design analyses informed broad principles of hierarchy and interaction only; no proprietary asset, font, source code, trademark, or layout was copied.

## License

MIT. Generated visual assets and synthetic demonstration inputs only.
