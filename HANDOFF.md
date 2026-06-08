# HANDOFF — Adaptive AML Monitoring Platform

## Status
**Production-deployed and complete.** All 7 screens built, UI polished, Crowe-branded, deployed to Vercel with GitHub CI.

**Live URL:** https://adaptive-aml-platform.vercel.app  
**GitHub:** https://github.com/achyuthrachur/adaptive-aml-platform

---

## What Was Built

### Platform (Goldman Sachs RFP demo)
Next.js 14 + TypeScript + Tailwind + shadcn/ui + Recharts + Cytoscape.js + Framer Motion + OpenAI (gpt-5). 100% synthetic data via `seedrandom` — deterministic, no real customer data.

### 7 Screens
| Route | Screen |
|---|---|
| `/overview` | KPI cards + stacked bar + ML score histogram + how-model-works section |
| `/customers` | TanStack table, shadcn filters, risk badges, empty states |
| `/customers/[id]` | Volume line chart, corridor heatmap, tx type donut, drift area, 20-row tx table |
| `/transactions` | SHAP feature attribution bars (animated), collapsible explainer, SAR button |
| `/network` | Cytoscape.js dark canvas, cose-bilkent layout, 3 risk patterns, collapsible sidebar |
| `/comparison` | Rules vs model side-by-side, connector lines, ExplainerBanner |
| `/sar/[id]` | OpenAI gpt-5 SAR narrative, Skeleton loader, next-steps guide |

### Architecture
- **Data**: `src/lib/data/seed.ts` — 50 customers, ~3000+ transactions, 3 explicit network patterns
- **Types**: `src/types/` — Customer, Transaction, NetworkNode, NetworkEdge
- **Shared UI**: `src/components/ui/` — ExplainerBanner, TermTooltip, MetricCard, RiskBadge + full shadcn primitives
- **API**: `src/app/api/sar-narrative/route.ts` — OpenAI gpt-5, server-side only

---

## Key Decisions
- **OpenAI API** (not Anthropic) — user instruction
- **gpt-5** model for SAR narrative
- **cose-bilkent** layout: `gravity: 0.85, tileDisconnected: false, idealEdgeLength: 70` — tuned for ~50 nodes
- **shadcn/ui** built manually (corporate proxy blocks the shadcn CDN)
- **Radix UI** installed directly as deps instead of shadcn CLI
- **System font stack** (Segoe UI → Arial) — Google Fonts blocked by corporate proxy
- **Crowe Root CA** exported to `$APPDATA/crowe-ca.pem` for Vercel CLI SSL fix
- **Base font size**: 15px (bumped from 13px after demo feedback)

---

## Environment
- `.env.local` — `OPENAI_API_KEY` set (do not commit)
- Vercel env var `OPENAI_API_KEY` set in production
- GitHub linked to Vercel — every push to `main` auto-deploys

---

## What To Do Next
- Test network graph layout at various screen sizes — may need further gravity/repulsion tuning
- Consider adding a `next-env.d.ts` to `.gitignore` (currently committed)
- Optional: add `cytoscape-layout-utilities` for more precise cluster positioning
- Optional: upgrade from Next.js 14.2.29 (has known security advisory)

## Verify Command
```
npm run dev
# open http://localhost:3000
```
