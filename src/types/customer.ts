export interface Customer {
  id: string;
  name: string;
  segment: 'private_wealth' | 'corporate_treasury' | 'correspondent_banking' | 'retail';
  peer_group: number;
  baseline_monthly_volume: number;
  baseline_transaction_count: number;
  baseline_corridors: string[];
  risk_score: number;
  last_reviewed: string;
}
