# HANDOFF — Adaptive AML Monitoring Platform

## Status
**Complete initial build** — all 7 screens built, TypeScript clean, production build passes.

## What Was Done
- Full Next.js 14 app scaffolded manually (directory name incompatible with create-next-app)
- Types: `Customer`, `Transaction`, `NetworkNode`, `NetworkEdge` defined
- Seed data: 50 customers, ~3000+ transactions (90-day window), 3 explicit network patterns
- Layout shell: Crowe Indigo sidebar, Amber active state, dynamic page title header
- Screen 1 — Overview: 4 KPI cards + stacked bar chart + histogram
- Screen 2 — Customer List: TanStack table with segment/risk/name filters, sortable columns
- Screen 3 — Customer Profile: 2-col layout, 4 charts (line, heatmap, donut, drift area), 20-row tx table
- Screen 4 — Transaction Scoring: split panel, SHAP bars, plain-English summary, SAR link
- Screen 5 — Network Graph: Cytoscape.js (dynamic import, SSR false), 3 pattern types
- Screen 6 — Comparison Panel: side-by-side rules vs model, summary stats bar
- Screen 7 — SAR Generator: OpenAI API (gpt-4o), copy/regenerate, disclaimer

## Key Decisions
- **OpenAI API** (not Anthropic) per user instruction during build
- `cytoscape-cose-bilkent` layout requested but `cose` built-in used (cose-bilkent requires separate registration)
- Network graph uses `react-cytoscapejs` v2 with `any` type cast for props (no official TS types for v2)
- `downlevelIteration: true` added to tsconfig for `for...of` on DOM NodeList

## Files Touched
```
src/types/customer.ts
src/types/transaction.ts
src/types/network.ts
src/lib/data/seed.ts
src/lib/data/customers.ts
src/lib/data/transactions.ts
src/lib/data/network.ts
src/lib/utils.ts
src/styles/globals.css
src/app/layout.tsx
src/app/page.tsx
src/app/(dashboard)/layout.tsx
src/app/(dashboard)/page.tsx
src/app/(dashboard)/overview/page.tsx
src/app/(dashboard)/customers/page.tsx
src/app/(dashboard)/customers/[id]/page.tsx
src/app/(dashboard)/transactions/page.tsx
src/app/(dashboard)/network/page.tsx
src/app/(dashboard)/comparison/page.tsx
src/app/(dashboard)/sar/[transaction_id]/page.tsx
src/app/api/sar-narrative/route.ts
src/components/features/Overview/OverviewCharts.tsx
src/components/features/CustomerProfile/CustomerTable.tsx
src/components/features/CustomerProfile/CustomerProfileClient.tsx
src/components/features/TransactionScorer/TransactionScorer.tsx
src/components/features/NetworkGraph/NetworkGraphPage.tsx
src/components/features/ComparisonPanel/ComparisonPanel.tsx
src/components/features/SARGenerator/SARGenerator.tsx
```

## What To Do Next
1. **Add `OPENAI_API_KEY`** to `.env.local` (copy from `.env.local.example`) for SAR generation to work
2. **Optional**: Register `cytoscape-cose-bilkent` layout if you want cluster-aware layout instead of `cose`
3. **Optional**: Tune seed data ratios (false positive %, model-only catch %) to improve the demo story
4. **Optional**: Add `cytoscape-layout-utilities` for more distinct cluster spacing
5. **Deploy**: `vercel --prod` after setting `OPENAI_API_KEY` in Vercel env vars

## Verify Command
```
npm run dev
# open http://localhost:3000
# check: /overview → /customers → /customers/CUST-0009 → /transactions → /network → /comparison → /sar/[any high-score tx id]
```
