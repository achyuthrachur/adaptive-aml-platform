import { generateCustomers, generateNetwork } from './seed';
import type { NetworkNode, NetworkEdge } from '@/types/network';

let _network: { nodes: NetworkNode[]; edges: NetworkEdge[] } | null = null;

function getAll() {
  if (!_network) {
    const customers = generateCustomers();
    _network = generateNetwork(customers);
  }
  return _network;
}

export function getNetworkNodes(): NetworkNode[] {
  return getAll().nodes;
}

export function getNetworkEdges(): NetworkEdge[] {
  return getAll().edges;
}

export function getNetworkNodeById(id: string): NetworkNode | undefined {
  return getAll().nodes.find(n => n.id === id);
}

export function getConnectedNodes(nodeId: string): NetworkNode[] {
  const { nodes, edges } = getAll();
  const connectedIds = new Set<string>();
  for (const e of edges) {
    if (e.source === nodeId) connectedIds.add(e.target);
    if (e.target === nodeId) connectedIds.add(e.source);
  }
  return nodes.filter(n => connectedIds.has(n.id));
}
