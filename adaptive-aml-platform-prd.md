# PRD — Adaptive AML Monitoring Platform
**Owner:** Crowe AI Innovation Team  
**Status:** Ready for development  
**Stack:** Next.js 14+ · TypeScript · Tailwind CSS · shadcn/ui · Recharts · Cytoscape.js · Claude / Anthropic API · Vercel  
**Brand:** Crowe (load crowe-brand.md for all visual decisions)

---

## 1. Purpose

A working demo platform that demonstrates the transition from static rules-based AML monitoring to adaptive behavioral intelligence. Built specifically to support the Goldman Sachs RFP response — the platform must make the argument visual and tangible: static rules miss what behavioral models and graph networks catch.

This is a demo, not a production system. All data is synthetic. No real transaction data is used anywhere.

---

## 2. Core Argument the Platform Must Prove

Every screen must reinforce one of these three points:

1. **Static rules produce false positives** — behavioral baselines show why most rule-fired alerts are noise
2. **ML models explain their reasoning** — every score has a reason, satisfying regulatory explainability requirements
3. **Graph networks surface what rules never see** — relationship-level risk is invisible to threshold-based systems

If a screen does not advance one of these three points, it does not belong in the demo.

---

## 3. Synthetic Data Requirements

All data must be generated at build time or seeded on first load. No external data sources. No real customer names, account numbers, or institution names.

### Customer profiles (seed 50 records)
Each customer has:
- `id` — UUID
- `name` — fictional (e.g. "Meridian Holdings LLC", "J. Carver")
- `segment` — one of: `private_wealth`, `corporate_treasury`, `correspondent_banking`, `retail`
- `peer_group` — assigned cluster (1–5 per segment)
- `baseline_monthly_volume` — number (USD)
- `baseline_transaction_count` — number
- `baseline_corridors` — array of country codes (2–4)
- `risk_score` — number 0–100
- `last_reviewed` — date

### Transactions (seed 200 records per customer, last 90 days)
Each transaction has:
- `id` — UUID
- `customer_id` — FK
- `date` — ISO date
- `amount` — USD
- `direction` — `inbound` | `outbound`
- `counterparty_name` — fictional
- `counterparty_jurisdiction` — country code
- `transaction_type` — `wire` | `ach` | `check` | `fx`
- `rule_fired` — boolean (did a static rule flag this?)
- `ml_score` — number 0–100 (simulated model score)
- `ml_features` — object with SHAP-style feature contributions (see Section 5.3)
- `is_true_positive` — boolean (ground truth for comparison panel)

### Network edges (seed relationship graph)
- 50 customer nodes
- 30 counterparty nodes (external entities — banks, shell companies, intermediaries)
- Edges represent transaction relationships with `volume` and `frequency` attributes
- 3 pre-seeded high-risk clusters with deliberate layering patterns built in
- 2 nodes pre-flagged as sanctioned-adjacent (indirect exposure, not direct)

---

## 4. Application Structure

```
src/
  app/
    (dashboard)/
      layout.tsx              # Sidebar + header shell
      page.tsx                # Redirects to /overview
      overview/
        page.tsx              # Landing summary view
      customers/
        page.tsx              # Customer list
        [id]/
          page.tsx            # Individual customer behavioral profile
      transactions/
        page.tsx              # Transaction scoring view
      network/
        page.tsx              # Graph visualization
      comparison/
        page.tsx              # Rules vs. model comparison panel
      sar/
        [transaction_id]/
          page.tsx            # SAR narrative generation
  api/
    sar-narrative/
      route.ts                # POST — calls Claude API, returns SAR draft
  components/
    ui/                       # shadcn primitives (restyled to Crowe brand)
    features/
      CustomerProfile/
      TransactionScorer/
      NetworkGraph/
      ComparisonPanel/
      SARGenerator/
  lib/
    data/
      seed.ts                 # All synthetic data generation logic
      customers.ts            # Customer data access functions
      transactions.ts         # Transaction data access functions
      network.ts              # Graph data access functions
    utils.ts
  types/
    customer.ts
    transaction.ts
    network.ts
  styles/
    globals.css               # Crowe CSS variables + base styles
```

---

## 5. Screen Specifications

### 5.1 Overview Page (`/overview`)

**Purpose:** Executive summary. One-glance view of the platform's value proposition.

**Layout:** Full-width dashboard. Four KPI cards at top, two panels below.

**KPI cards (left to right):**
1. Total alerts fired by static rules — last 30 days
2. Alerts suppressed by behavioral model (estimated false positives)
3. Net new risks identified by ML not caught by rules
4. High-risk network clusters detected

**Left panel — Alert Disposition Breakdown:**
- Stacked bar chart (Recharts)
- X-axis: last 4 weeks
- Bars: rule-only alerts / model-confirmed alerts / model-only alerts
- Colors: Crowe Amber (rule-only) / Crowe Teal (confirmed) / Crowe Blue (model-only)
- Background: Crowe Indigo Dark per data viz standards

**Right panel — Risk Score Distribution:**
- Histogram of ML risk scores across all customers
- Overlaid vertical line showing static rules threshold
- Annotation showing how many customers above the threshold were not caught by rules
- Background: Crowe Indigo Dark

**No filters on this page.** It is a fixed summary view.

---

### 5.2 Customer List (`/customers`)

**Purpose:** Browse all 50 synthetic customers, filter by segment and risk level.

**Layout:** Full-width table using `@tanstack/react-table`.

**Columns:**
- Name
- Segment
- Peer Group
- Baseline Monthly Volume (formatted USD)
- Current Risk Score (color-coded badge: green < 40, amber 40–70, red > 70)
- Behavioral Drift Indicator (up/down/stable icon — Lucide React)
- Last Reviewed
- Action: "View Profile" button

**Filters (top of table):**
- Segment dropdown (all / private_wealth / corporate_treasury / correspondent_banking / retail)
- Risk level dropdown (all / low / medium / high)
- Search by name (text input)

**Sorting:** All columns sortable. Default sort: risk score descending.

**Clicking any row navigates to `/customers/[id]`.**

---

### 5.3 Customer Behavioral Profile (`/customers/[id]`)

**Purpose:** The core behavioral intelligence view. This screen makes the clustering argument visual.

**Layout:** Two-column. Left column: customer metadata + peer group. Right column: behavioral charts.

**Left column:**

Customer header card:
- Name, segment, peer group label
- Risk score (large, color-coded)
- Baseline stats: avg monthly volume, avg transaction count, primary corridors

Peer group card:
- Label: "Peer Group [N] — [Segment]"
- Number of customers in this peer group
- Peer group avg monthly volume
- Peer group avg transaction count
- Delta indicators: how this customer compares to peer group average (+ / - %)

**Right column — four charts, stacked vertically:**

1. **Transaction Volume Over Time**
   - Line chart (Recharts)
   - Customer's 90-day transaction volume vs. peer group average (two lines)
   - Annotate any point where customer diverges > 2 standard deviations from peer group
   - X-axis: dates. Y-axis: USD volume.

2. **Corridor Activity Heatmap**
   - Grid: rows = counterparty jurisdictions, columns = weeks
   - Cell color intensity = transaction volume
   - New corridors (not in baseline) highlighted with Crowe Amber border
   - Use CSS grid, not a library — keep it lightweight

3. **Transaction Type Breakdown**
   - Donut chart (Recharts)
   - wire / ach / check / fx proportions
   - Compare current 30 days vs. baseline in a small legend

4. **Behavioral Drift Score Over Time**
   - Area chart (Recharts)
   - Single line: composite drift score (0–100) calculated as deviation from all baseline metrics
   - Threshold line at 60: above this triggers review recommendation
   - Fill area above threshold with Crowe Coral at 20% opacity

**Bottom panel — Recent Transactions:**
- Table of last 20 transactions for this customer
- Columns: Date / Amount / Direction / Counterparty / Jurisdiction / Rule Fired / ML Score
- Rule Fired: red badge if true, gray if false
- ML Score: color-coded (same thresholds as risk score)
- Each row has a "View Score Detail" link — navigates to `/transactions` filtered to that transaction

---

### 5.4 Transaction Scoring View (`/transactions`)

**Purpose:** Show individual transaction scores with full SHAP-style feature attribution. This is the explainability screen.

**Layout:** Left panel = transaction list. Right panel = score detail for selected transaction.

**Left panel — Transaction list:**
- Table of all 200 transactions (paginated, 20 per page)
- Columns: Date / Customer / Amount / Jurisdiction / Rule Fired / ML Score
- Filters: customer segment / direction / rule fired (yes/no) / score range slider
- Clicking a row loads the score detail in the right panel

**Right panel — Score Detail:**

Renders when a transaction is selected. Empty state with instructions when none selected.

Score header:
- Transaction ID (truncated UUID)
- Customer name + segment
- Amount + direction + date
- ML Score: large number (0–100), color-coded
- Rule Fired: yes/no badge

**SHAP Feature Attribution panel:**
Horizontal bar chart showing contribution of each feature to the final score.

Features to display (these are pre-computed in the seed data `ml_features` object):
- `amount_vs_baseline` — how far the amount deviates from customer baseline
- `corridor_familiarity` — is this a known corridor for this customer?
- `peer_group_deviation` — how does this compare to peer group norms?
- `counterparty_risk` — pre-assigned counterparty risk flag (0/1)
- `velocity_last_7d` — transaction frequency in the last 7 days vs. baseline
- `transaction_type_shift` — unusual transaction type for this customer?

Each feature:
- Bar length = contribution magnitude (positive = increases score, negative = decreases)
- Positive bars: Crowe Coral
- Negative bars: Crowe Teal
- Label on each bar: feature name + contribution value (e.g. "+18", "-7")
- Brief plain-English description below the bar (hardcoded per feature — no AI call for this)

**Below the chart:**
- Plain-English summary paragraph (hardcoded template populated from feature values, not AI-generated)
- Example: "This transaction was flagged primarily because the amount was 3.2x the customer's 90-day average and the counterparty jurisdiction has not appeared in this customer's prior activity. Peer group comparison and transaction type were within normal range and reduced the overall score."

**SAR link:**
- If ML Score > 70: show "Generate SAR Draft" button — navigates to `/sar/[transaction_id]`
- If ML Score ≤ 70: button is absent

---

### 5.5 Network Graph (`/network`)

**Purpose:** Make relationship-level risk visual. This is the graph networks argument.

**Library:** Cytoscape.js — loaded client-side only (`dynamic import`, `ssr: false`)

**Layout:** Full screen minus sidebar. Controls panel on the left (280px fixed). Graph canvas fills remaining space.

**Controls panel:**
- Filter by node type: all / customers / counterparties / flagged only
- Filter by edge weight: slider (minimum transaction volume threshold)
- Highlight mode toggle: "Show layering patterns" — when on, pre-seeded layering clusters are highlighted
- Reset view button
- Selected node detail (renders below controls when a node is clicked)

**Graph rendering:**

Node types and visual treatment:
- Customer nodes: circle, Crowe Indigo Dark fill, white label, size proportional to total transaction volume
- Counterparty nodes: diamond, Crowe Teal fill, white label
- Sanctioned-adjacent nodes: any node type, Crowe Coral fill, warning icon
- High-risk cluster nodes: amber border (3px)

Edge types:
- Standard transaction relationship: gray, weight proportional to volume
- High-frequency edges (top 10% by frequency): Crowe Amber, slightly thicker
- Edges connecting to sanctioned-adjacent nodes: Crowe Coral dashed

**Pre-seeded patterns that must be visually evident:**
1. **Layering cluster** — a chain of 4–5 nodes where funds pass through sequentially, no single hop looks suspicious alone
2. **Hub counterparty** — one counterparty node connected to 8+ customer nodes from different segments (potential money mule coordinator pattern)
3. **Sanctioned adjacency** — a customer connected to a counterparty connected to a sanctioned-adjacent node (indirect exposure)

**Selected node detail panel (below controls):**
Renders when any node is clicked:
- Node name + type
- If customer: segment, risk score, total 90-day volume
- If counterparty: jurisdiction, total volume, number of connected customers
- Connected nodes list (names only, clickable — navigates to customer profile if applicable)
- If sanctioned-adjacent: explicit warning message with hop count to sanctioned entity

**No zoom controls in the UI — use native Cytoscape.js scroll-to-zoom and drag-to-pan.**

---

### 5.6 Rules vs. Model Comparison Panel (`/comparison`)

**Purpose:** Side-by-side view showing where static rules and the ML model agree, and critically, where they diverge. This is the clearest argument for adaptive monitoring.

**Layout:** Full width. Two columns of equal width, separated by a vertical divider. Summary stats bar at top.

**Summary stats bar (4 metrics):**
1. Alerts fired by rules only (false positives the model suppressed)
2. Alerts confirmed by both (true positives)
3. Risks caught by model only (missed by rules)
4. Agreement rate (%)

**Left column — Rules Engine:**
- Header: "Static Rules Engine"
- Subheader: "Threshold-based, jurisdiction-flagged, amount-triggered"
- List of all transactions where `rule_fired = true`
- Each row: customer name / amount / rule that triggered (hardcoded rule labels: "OFAC jurisdiction", "Amount > $10,000", "Velocity: 3+ wires in 7 days", "New correspondent")
- Rows where `is_true_positive = false` highlighted with Crowe Amber background (these are false positives)
- Count at bottom: "X of Y alerts estimated false positive"

**Right column — Adaptive ML Model:**
- Header: "Adaptive Behavioral Model"
- Subheader: "Peer group baseline, behavioral drift, feature attribution"
- List of all transactions where `ml_score > 70`
- Each row: customer name / amount / ML score / top contributing feature
- Rows where `rule_fired = false` highlighted with Crowe Teal background (model-only catches)
- Count at bottom: "X risks identified not caught by rules"

**Intersection highlight:**
- Transactions that appear in both columns are visually linked with a horizontal connector line
- This makes the overlap and divergence legible at a glance

**No pagination — show all flagged transactions. If list is long, make columns scrollable independently.**

---

### 5.7 SAR Narrative Generator (`/sar/[transaction_id]`)

**Purpose:** One-click AI-generated SAR narrative for any high-risk transaction. Demonstrates how AI reduces the manual burden of SAR preparation.

**Layout:** Single column, centered, max-width 860px.

**Header section:**
- Transaction ID
- Customer name + segment
- Amount + date + counterparty jurisdiction
- ML Score badge
- Top 3 contributing features (chips/tags)

**Generate button:**
- Label: "Generate SAR Draft"
- On click: POST to `/api/sar-narrative` with transaction data
- Loading state: show skeleton with "Generating narrative..." label
- Do not auto-generate on page load — require explicit button press

**API route (`/api/sar-narrative`):**

Receives: transaction object + customer object + top features

Prompt structure sent to Claude:

```
You are a BSA/AML compliance officer drafting a Suspicious Activity Report (SAR) narrative.

Generate a formal SAR narrative based on the following transaction data. 
The narrative should:
- Follow FinCEN SAR narrative best practices
- Describe the subject, the suspicious activity, and why it is suspicious
- Reference the specific behavioral indicators that elevated the risk score
- Be written in third person, past tense
- Be between 150 and 250 words
- Not include any headers, bullet points, or formatting — plain paragraphs only
- Not include placeholder text or bracketed fields — use the data provided

Transaction data:
[inject transaction object as JSON]

Customer behavioral context:
[inject customer object as JSON]

Primary risk indicators:
[inject top 3 ml_features as plain English descriptions]
```

Model: `claude-sonnet-4-20250514`  
Max tokens: 1000  
Temperature: not set (use default)

**Output rendering:**
- Narrative text rendered in a styled card
- Crowe Indigo Dark background, white text, generous padding
- "Copy to clipboard" button (Lucide `Copy` icon)
- "Regenerate" button — re-fires the API call
- Disclaimer below card: "This narrative is AI-generated and requires review by a qualified BSA officer before submission."

**Error handling:**
- If API call fails: show error message "Narrative generation failed. Please try again." with retry button
- Do not show raw error details

---

## 6. Navigation and Layout Shell

**Sidebar (fixed left, 240px):**
- Crowe logo (white wordmark on Indigo Dark — `crowe-logo-white-wordmark.png`)
- Nav items with Lucide icons:
  - Overview (`LayoutDashboard`)
  - Customers (`Users`)
  - Transactions (`ArrowLeftRight`)
  - Network (`Network`)
  - Comparison (`GitCompare`)
- Active state: Crowe Amber left border + slightly lighter background
- Sidebar background: Crowe Indigo Dark (`#011E41`)

**Header (top, full width minus sidebar):**
- Page title (dynamic, matches current route)
- Right side: "Goldman Sachs Demo" label in small muted text — makes the demo context explicit
- No user auth — this is a demo, no login required
- Background: white with bottom border (`#E0E0E0`)

**No mobile layout required.** This is a desktop demo for a presentation context. Minimum supported viewport: 1280px wide.

---

## 7. Visual and Brand Standards

Apply Crowe brand throughout. Key rules for this platform:

- **Primary background:** white (`#FFFFFF`) for content areas
- **Sidebar and all data visualization backgrounds:** Crowe Indigo Dark (`#011E41`)
- **Primary accent:** Crowe Amber (`#F5A800`) for CTAs, active states, highlights
- **Risk high:** Crowe Coral (`#E5376B`)
- **Risk low / positive signal:** Crowe Teal (`#05AB8C`)
- **Neutral:** Crowe Indigo Bright (`#003F9F`) for secondary elements
- **Typography:** Arial as primary web font (Helvetica Now is not a Google Font — Arial is the specified fallback)
- **Data visualization backgrounds must always be Crowe Indigo Dark** — never white
- **No gradients as backgrounds** — flat Indigo Dark only
- **Aesthetic direction:** Luxury / refined. Clean, institutional, high-information-density without clutter

---

## 8. API Configuration

**Environment variables required:**
```env
ANTHROPIC_API_KEY=                  # Claude API key — server-side only, never expose to client
NEXT_PUBLIC_APP_URL=                # Vercel deployment URL
```

**The Anthropic API key must never be referenced in any client-side code.** All Claude API calls go through `/api/sar-narrative/route.ts` only.

---

## 9. Data Layer

No database. All synthetic data is generated in `lib/data/seed.ts` and imported directly into components as static JSON. This keeps the demo stateless and deployment-simple.

`seed.ts` exports:
- `customers: Customer[]` — 50 records
- `transactions: Transaction[]` — all transactions across all customers
- `networkNodes: NetworkNode[]` — all nodes
- `networkEdges: NetworkEdge[]` — all edges

All types defined in `src/types/`. No `any`. No optional chaining on known fields.

The seed data must be deterministic — same output every run. Use a seeded random number generator (e.g. a simple LCG or `seedrandom` library) so the data looks realistic but is always consistent.

---

## 10. What Claude Code Must Not Decide

The following must not be left to interpretation:

- **Color values** — all specified in Section 7. Use exact hex codes.
- **Which transactions are false positives** — set `is_true_positive` in seed data explicitly. Do not derive it from ML score alone.
- **SAR prompt wording** — use the exact prompt in Section 5.7. Do not paraphrase or simplify it.
- **Cytoscape.js node shapes** — customers are circles, counterparties are diamonds. Do not use other shapes.
- **The three pre-seeded network patterns** — layering cluster, hub counterparty, sanctioned adjacency. These must be present and visually distinct. Build them explicitly into `seed.ts`.
- **Navigation structure** — six routes exactly as specified. Do not add, remove, or rename routes.
- **Font** — Arial only. Do not substitute Inter, Roboto, or system-ui.
- **No authentication** — do not add a login page or auth middleware.
- **No mobile breakpoints** — desktop only, 1280px minimum.
