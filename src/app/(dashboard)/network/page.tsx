import { getNetworkNodes, getNetworkEdges } from '@/lib/data/network';
import NetworkGraphPage from '@/components/features/NetworkGraph/NetworkGraphPage';

export default function NetworkPage() {
  const nodes = getNetworkNodes();
  const edges = getNetworkEdges();
  return <NetworkGraphPage nodes={nodes} edges={edges} />;
}
