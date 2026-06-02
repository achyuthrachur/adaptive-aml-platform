export interface MLFeatures {
  amount_vs_baseline: number;
  corridor_familiarity: number;
  peer_group_deviation: number;
  counterparty_risk: number;
  velocity_last_7d: number;
  transaction_type_shift: number;
}

export interface Transaction {
  id: string;
  customer_id: string;
  date: string;
  amount: number;
  direction: 'inbound' | 'outbound';
  counterparty_name: string;
  counterparty_jurisdiction: string;
  transaction_type: 'wire' | 'ach' | 'check' | 'fx';
  rule_fired: boolean;
  rule_label: string | null;
  ml_score: number;
  ml_features: MLFeatures;
  is_true_positive: boolean;
}
