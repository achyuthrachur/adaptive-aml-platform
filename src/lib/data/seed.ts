import seedrandom from 'seedrandom';
import type { Customer } from '@/types/customer';
import type { Transaction, MLFeatures } from '@/types/transaction';
import type { NetworkNode, NetworkEdge } from '@/types/network';

const rng = seedrandom('adaptive-aml-2024');

function rand(min: number, max: number): number {
  return min + rng() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

const JURISDICTIONS = [
  'United States', 'United Kingdom', 'Germany', 'France', 'Singapore',
  'Hong Kong', 'Switzerland', 'Luxembourg', 'Netherlands', 'Canada',
  'Cayman Islands', 'British Virgin Islands', 'Panama', 'UAE',
  'Mexico', 'Brazil', 'China', 'Japan', 'Australia', 'India',
];

const HIGH_RISK_JURISDICTIONS = ['Cayman Islands', 'British Virgin Islands', 'Panama', 'UAE'];

const COUNTERPARTY_NAMES = [
  'Meridian Capital LLC', 'Harlow Trade Partners', 'Apex Global Holdings',
  'Nexus Financial Group', 'Crestwood Investments', 'Fairway Asset Management',
  'Stonebridge Capital', 'Lakeside Trading Co', 'Summit Financial Partners',
  'R. Castellan', 'T. Voss', 'M. Aldridge', 'S. Fontaine', 'J. Whitmore',
  'Cascade Trading Ltd', 'Orbit Capital Group', 'Terrace Wealth Management',
  'Ironwood Holdings', 'Clearwater Asset Group', 'Pinnacle Trade LLC',
  'Brentwood Financial Services', 'Crossroads Investment Group', 'Embankment Capital',
  'A. Reyes', 'L. Thornton', 'K. Nakamura', 'D. Okonkwo', 'C. Bellamy',
  'Redstone Capital Partners', 'Silvergate Financial', 'Goldstream Ventures',
  'Equinox Trading', 'Northfield Capital', 'Harbor Point Investments',
  'Ridgeline Holdings', 'Continental Asset Management', 'Pacific Rim Trading',
  'Atlantic Capital Group', 'Midtown Financial Partners', 'Westgate Investments',
];

const RULE_LABELS = [
  'OFAC jurisdiction',
  'Amount > $10,000',
  'Velocity: 3+ wires in 7 days',
  'New correspondent',
];

// 50 customers: 12 PW, 13 CT, 12 CB, 13 retail
const CUSTOMER_NAMES = {
  private_wealth: [
    'R. Castellan', 'T. Voss', 'M. Aldridge', 'S. Fontaine', 'J. Whitmore',
    'A. Reyes', 'L. Thornton', 'K. Nakamura', 'D. Okonkwo', 'C. Bellamy',
    'P. Harrington', 'E. Novak',
  ],
  corporate_treasury: [
    'Meridian Capital LLC', 'Harlow Trade Partners', 'Apex Global Holdings',
    'Nexus Financial Group', 'Crestwood Investments', 'Fairway Asset Management',
    'Stonebridge Capital', 'Lakeside Trading Co', 'Summit Financial Partners',
    'Cascade Trading Ltd', 'Orbit Capital Group', 'Terrace Wealth Management',
    'Ironwood Holdings',
  ],
  correspondent_banking: [
    'Clearwater Asset Group', 'Pinnacle Trade LLC', 'Brentwood Financial Services',
    'Crossroads Investment Group', 'Embankment Capital', 'Redstone Capital Partners',
    'Silvergate Financial', 'Goldstream Ventures', 'Equinox Trading',
    'Northfield Capital', 'Harbor Point Investments', 'Ridgeline Holdings',
  ],
  retail: [
    'Continental Asset Mgmt', 'Pacific Rim Trading', 'Atlantic Capital Group',
    'Midtown Financial', 'Westgate Investments', 'B. Whitfield', 'G. Sorensen',
    'F. Delacroix', 'H. Brennan', 'I. Castillo', 'N. Varga', 'O. Lindqvist',
    'Q. Ferreira',
  ],
};

// Build customers
export function generateCustomers(): Customer[] {
  const customers: Customer[] = [];
  let id = 1;

  const segments = [
    { segment: 'private_wealth' as const, count: 12, volMin: 500000, volMax: 5000000, txMin: 10, txMax: 30 },
    { segment: 'corporate_treasury' as const, count: 13, volMin: 1000000, volMax: 20000000, txMin: 20, txMax: 60 },
    { segment: 'correspondent_banking' as const, count: 12, volMin: 2000000, volMax: 50000000, txMin: 30, txMax: 80 },
    { segment: 'retail' as const, count: 13, volMin: 5000, volMax: 50000, txMin: 5, txMax: 15 },
  ];

  // Pre-assign which customers get high risk scores
  // 8 above 70, 3 above 85 — distribute across segments
  const highRiskIndices = new Set([2, 5, 8, 14, 18, 23, 31, 42]);
  const veryHighRiskIndices = new Set([8, 14, 23]);

  for (const seg of segments) {
    const names = CUSTOMER_NAMES[seg.segment];
    for (let i = 0; i < seg.count; i++) {
      const globalIdx = id - 1;
      let risk_score: number;
      if (veryHighRiskIndices.has(globalIdx)) {
        risk_score = Math.round(rand(86, 97));
      } else if (highRiskIndices.has(globalIdx)) {
        risk_score = Math.round(rand(71, 85));
      } else {
        risk_score = Math.round(rand(20, 69));
      }

      const peer_group = ((i % 5) + 1);
      const baseVol = rand(seg.volMin, seg.volMax);
      const baseTx = randInt(seg.txMin, seg.txMax);

      // Build baseline corridors — 2–5 jurisdictions
      const corridorCount = randInt(2, 5);
      const corridors: string[] = [];
      const safeJurisdictions = JURISDICTIONS.filter(j => !HIGH_RISK_JURISDICTIONS.includes(j));
      while (corridors.length < corridorCount) {
        const j = pick(safeJurisdictions);
        if (!corridors.includes(j)) corridors.push(j);
      }

      // Last reviewed: random date in last 365 days
      const daysAgo = randInt(1, 365);
      const reviewed = new Date(2024, 11, 1);
      reviewed.setDate(reviewed.getDate() - daysAgo);

      customers.push({
        id: `CUST-${String(id).padStart(4, '0')}`,
        name: names[i] || `Customer ${id}`,
        segment: seg.segment,
        peer_group,
        baseline_monthly_volume: Math.round(baseVol),
        baseline_transaction_count: baseTx,
        baseline_corridors: corridors,
        risk_score,
        last_reviewed: reviewed.toISOString().split('T')[0],
      });
      id++;
    }
  }

  return customers;
}

function generateTransactionId(n: number): string {
  return `TXN-${String(n).padStart(7, '0')}`;
}

function dateInRange(startDate: Date, endDate: Date): string {
  const range = endDate.getTime() - startDate.getTime();
  const d = new Date(startDate.getTime() + rng() * range);
  return d.toISOString().split('T')[0];
}

export function generateTransactions(customers: Customer[]): Transaction[] {
  const transactions: Transaction[] = [];
  let txCount = 0;

  const endDate = new Date('2024-12-01');
  const startDate = new Date('2024-09-03'); // 90 days back

  const txPerMonthBySegment: Record<string, { min: number; max: number }> = {
    retail: { min: 5, max: 15 },
    private_wealth: { min: 10, max: 30 },
    corporate_treasury: { min: 20, max: 60 },
    correspondent_banking: { min: 30, max: 80 },
  };

  for (const customer of customers) {
    const segConfig = txPerMonthBySegment[customer.segment];
    // 3 months of activity
    const totalTx = randInt(segConfig.min * 3, segConfig.max * 3);

    for (let i = 0; i < totalTx; i++) {
      txCount++;
      const txDate = dateInRange(startDate, endDate);

      // Amount: based on baseline monthly volume, per-transaction average ± variance
      const avgTxAmount = customer.baseline_monthly_volume / customer.baseline_transaction_count;
      const amountVariance = rand(0.2, 3.0);
      const amount = Math.round(avgTxAmount * amountVariance);

      const direction = rng() < 0.55 ? 'outbound' : 'inbound';
      const txType = pickWeighted(
        ['wire', 'ach', 'check', 'fx'],
        [
          customer.segment === 'correspondent_banking' ? 50 : 30,
          25,
          15,
          customer.segment === 'private_wealth' ? 20 : 10,
        ]
      ) as Transaction['transaction_type'];

      // Counterparty: mostly from baseline corridors, sometimes new
      const useNewCorridor = rng() < 0.12;
      let jurisdiction: string;
      if (useNewCorridor) {
        const newOptions = JURISDICTIONS.filter(j => !customer.baseline_corridors.includes(j));
        jurisdiction = pick(newOptions);
      } else {
        jurisdiction = pick(customer.baseline_corridors);
      }

      const counterpartyName = pick(COUNTERPARTY_NAMES);

      // Determine if rule fires (~15% of all transactions)
      // Higher chance for high risk jurisdictions, high amounts, high velocity
      let ruleProbability = 0.1;
      if (HIGH_RISK_JURISDICTIONS.includes(jurisdiction)) ruleProbability = 0.6;
      if (amount > 10000 && customer.segment === 'retail') ruleProbability = Math.max(ruleProbability, 0.5);
      if (useNewCorridor && customer.segment === 'correspondent_banking') ruleProbability = Math.max(ruleProbability, 0.4);

      const rule_fired = rng() < ruleProbability;
      let rule_label: string | null = null;
      if (rule_fired) {
        if (HIGH_RISK_JURISDICTIONS.includes(jurisdiction)) rule_label = 'OFAC jurisdiction';
        else if (amount > 10000) rule_label = 'Amount > $10,000';
        else if (useNewCorridor) rule_label = 'New correspondent';
        else rule_label = pick(RULE_LABELS);
      }

      // ML score — intentionally diverges from rule_fired
      // High risk customers have higher baseline ml_scores
      let mlBase = customer.risk_score * 0.4 + rand(-15, 15);

      // Amount anomaly contribution
      if (amountVariance > 2.0) mlBase += rand(10, 25);
      if (useNewCorridor) mlBase += rand(8, 20);
      if (HIGH_RISK_JURISDICTIONS.includes(jurisdiction)) mlBase += rand(5, 15);
      if (txType === 'wire' && customer.segment === 'retail') mlBase += rand(10, 20);

      // Key divergence: some rule-fired transactions get low ml_score
      if (rule_fired && rng() < 0.6) {
        mlBase = rand(20, 55); // false positive — rule fired but model says low risk
      }
      // Some high ml_score transactions have no rule
      if (!rule_fired && customer.risk_score > 70 && rng() < 0.3) {
        mlBase = rand(72, 92); // model-only catch
      }

      const ml_score = Math.min(100, Math.max(0, Math.round(mlBase)));

      // is_true_positive: 60% of rule_fired are false positives
      let is_true_positive = false;
      if (rule_fired) {
        is_true_positive = rng() > 0.6; // 40% true positive
      } else if (ml_score > 70) {
        is_true_positive = rng() < 0.7; // 70% of model-only catches are true positives
      }

      // ML features: values -30 to +30, sum ≈ ml_score - 50
      const targetSum = ml_score - 50;
      const f1 = Math.round((amountVariance - 1.5) * 18);
      const f2 = Math.round(useNewCorridor ? rand(-5, 5) : rand(-15, -5));
      const f3 = Math.round(rand(-15, 15));
      const f4 = Math.round(HIGH_RISK_JURISDICTIONS.includes(jurisdiction) ? rand(5, 20) : rand(-10, 5));
      const f5 = Math.round(rand(-10, 15));
      const currentSum = f1 + f2 + f3 + f4 + f5;
      const f6 = Math.round(targetSum - currentSum);

      const ml_features: MLFeatures = {
        amount_vs_baseline: Math.max(-30, Math.min(30, f1)),
        corridor_familiarity: Math.max(-30, Math.min(30, f2)),
        peer_group_deviation: Math.max(-30, Math.min(30, f3)),
        counterparty_risk: Math.max(-30, Math.min(30, f4)),
        velocity_last_7d: Math.max(-30, Math.min(30, f5)),
        transaction_type_shift: Math.max(-30, Math.min(30, f6)),
      };

      transactions.push({
        id: generateTransactionId(txCount),
        customer_id: customer.id,
        date: txDate,
        amount,
        direction,
        counterparty_name: counterpartyName,
        counterparty_jurisdiction: jurisdiction,
        transaction_type: txType,
        rule_fired,
        rule_label,
        ml_score,
        ml_features,
        is_true_positive,
      });
    }
  }

  // Sort by date descending
  transactions.sort((a, b) => b.date.localeCompare(a.date));
  return transactions;
}

export function generateNetwork(customers: Customer[]): { nodes: NetworkNode[]; edges: NetworkEdge[] } {
  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];
  let edgeCount = 0;

  // Helper to add edge
  const addEdge = (source: string, target: string, volume: number, frequency: number, isLayering = false) => {
    edges.push({
      id: `EDGE-${String(++edgeCount).padStart(4, '0')}`,
      source,
      target,
      volume,
      frequency,
      is_layering_path: isLayering,
    });
  };

  // Pattern 1 — Layering cluster (cluster_id: 1)
  // Chain: custA → cpX → cpY → cpZ → custB
  const custA = customers[8]; // high risk customer
  const custB = customers[14]; // another high risk customer

  nodes.push({ id: custA.id, label: custA.name, type: 'customer', segment: custA.segment, risk_score: custA.risk_score, total_volume: 450000, is_sanctioned_adjacent: false, is_high_risk_cluster: true, cluster_id: 1 });

  const layeringNodes = [
    { id: 'CP-LAY-001', label: 'Meridian Shell Corp', type: 'counterparty' as const, total_volume: 420000, is_sanctioned_adjacent: false, is_high_risk_cluster: true, cluster_id: 1 },
    { id: 'CP-LAY-002', label: 'Apex Offshore Ltd', type: 'counterparty' as const, total_volume: 390000, is_sanctioned_adjacent: false, is_high_risk_cluster: true, cluster_id: 1 },
    { id: 'CP-LAY-003', label: 'Crestwood BVI Holdings', type: 'counterparty' as const, total_volume: 360000, is_sanctioned_adjacent: false, is_high_risk_cluster: true, cluster_id: 1 },
  ];

  nodes.push(...layeringNodes);
  nodes.push({ id: custB.id, label: custB.name, type: 'customer', segment: custB.segment, risk_score: custB.risk_score, total_volume: 340000, is_sanctioned_adjacent: false, is_high_risk_cluster: true, cluster_id: 1 });

  // Layering chain edges — each hop looks small individually
  addEdge(custA.id, 'CP-LAY-001', 120000, 8, true);
  addEdge('CP-LAY-001', 'CP-LAY-002', 115000, 7, true);
  addEdge('CP-LAY-002', 'CP-LAY-003', 110000, 6, true);
  addEdge('CP-LAY-003', custB.id, 105000, 5, true);

  // Pattern 2 — Hub counterparty (cluster_id: 2)
  // One counterparty connected to 9 customers from 3+ segments
  const hubNode: NetworkNode = {
    id: 'CP-HUB-001',
    label: 'Nexus Clearing House',
    type: 'counterparty',
    total_volume: 8500000,
    is_sanctioned_adjacent: false,
    is_high_risk_cluster: true,
    cluster_id: 2,
  };
  nodes.push(hubNode);

  const hubCustomerIndices = [1, 4, 7, 13, 16, 20, 25, 33, 40];
  for (const idx of hubCustomerIndices) {
    const c = customers[idx];
    if (!nodes.find(n => n.id === c.id)) {
      nodes.push({ id: c.id, label: c.name, type: 'customer', segment: c.segment, risk_score: c.risk_score, total_volume: rand(200000, 900000), is_sanctioned_adjacent: false, is_high_risk_cluster: true, cluster_id: 2 });
    }
    addEdge(c.id, 'CP-HUB-001', Math.round(rand(150000, 800000)), randInt(12, 30));
  }

  // Pattern 3 — Sanctioned adjacency (cluster_id: 3)
  const sanctionedNode: NetworkNode = {
    id: 'CP-SANC-001',
    label: 'Harlow Offshore Partners',
    type: 'counterparty',
    total_volume: 2200000,
    is_sanctioned_adjacent: true,
    is_high_risk_cluster: false,
    cluster_id: 3,
  };
  nodes.push(sanctionedNode);

  const sancCust1 = customers[31];
  const sancCust2 = customers[42];

  for (const c of [sancCust1, sancCust2]) {
    if (!nodes.find(n => n.id === c.id)) {
      nodes.push({ id: c.id, label: c.name, type: 'customer', segment: c.segment, risk_score: c.risk_score, total_volume: Math.round(rand(500000, 2000000)), is_sanctioned_adjacent: false, is_high_risk_cluster: false, cluster_id: 3 });
    }
    addEdge(c.id, 'CP-SANC-001', Math.round(rand(300000, 900000)), randInt(4, 10));
  }

  // Standard nodes — remaining customers (up to 15 more) and counterparties
  const usedCustomerIds = new Set(nodes.filter(n => n.type === 'customer').map(n => n.id));
  const remainingCustomers = customers.filter(c => !usedCustomerIds.has(c.id)).slice(0, 15);

  for (const c of remainingCustomers) {
    nodes.push({ id: c.id, label: c.name, type: 'customer', segment: c.segment, risk_score: c.risk_score, total_volume: Math.round(rand(50000, 500000)), is_sanctioned_adjacent: false, is_high_risk_cluster: false });
    // Connect to 1–3 standard counterparties
    const cpCount = randInt(1, 3);
    for (let j = 0; j < cpCount; j++) {
      const cpId = `CP-STD-${String(j + 1).padStart(3, '0')}`;
      if (!nodes.find(n => n.id === cpId)) {
        nodes.push({ id: cpId, label: pick(COUNTERPARTY_NAMES.slice(20)), type: 'counterparty', total_volume: Math.round(rand(100000, 1000000)), is_sanctioned_adjacent: false, is_high_risk_cluster: false });
      }
      addEdge(c.id, cpId, Math.round(rand(20000, 200000)), randInt(2, 12));
    }
  }

  return { nodes, edges };
}
