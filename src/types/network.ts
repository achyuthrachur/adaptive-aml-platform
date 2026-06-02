export type NodeType = 'customer' | 'counterparty';

export interface NetworkNode {
  id: string;
  label: string;
  type: NodeType;
  segment?: string;
  risk_score?: number;
  total_volume: number;
  is_sanctioned_adjacent: boolean;
  is_high_risk_cluster: boolean;
  cluster_id?: number;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  volume: number;
  frequency: number;
  is_layering_path: boolean;
}
