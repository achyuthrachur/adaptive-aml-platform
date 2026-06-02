'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { NetworkNode, NetworkEdge } from '@/types/network';
import { formatCurrency } from '@/lib/utils';

// Cytoscape must be client-side only — no SSR.
// We register cytoscape-cose-bilkent inside the dynamic import so it runs in the
// same module context as react-cytoscapejs, guaranteeing the layout exists before use.
const CytoscapeComponent = dynamic(
  async () => {
    const [cytoscape, coseBilkent, ReactCytoscape] = await Promise.all([
      import('cytoscape'),
      import('cytoscape-cose-bilkent'),
      import('react-cytoscapejs'),
    ]);
    // Register only once — cytoscape.use() is idempotent but guard anyway
    try {
      cytoscape.default.use(coseBilkent.default);
    } catch {
      // already registered
    }
    return ReactCytoscape;
  },
  { ssr: false }
);

interface Props {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

const SEGMENT_LABELS: Record<string, string> = {
  private_wealth: 'Private Wealth',
  corporate_treasury: 'Corp Treasury',
  correspondent_banking: 'Correspondent',
  retail: 'Retail',
};

type CyStylesheet = {
  selector: string;
  style: Record<string, unknown>;
};

export default function NetworkGraphPage({ nodes, edges }: Props) {
  const router = useRouter();
  const [filterNodeTypes, setFilterNodeTypes] = useState<Set<string>>(new Set(['customers', 'counterparties']));
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [minEdgeVolume, setMinEdgeVolume] = useState(0);
  const [showLayering, setShowLayering] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  const maxVol = Math.max(...edges.map(e => e.volume));
  const sortedFreq = [...edges].sort((a, b) => b.frequency - a.frequency);
  const top10PctIdx = Math.floor(sortedFreq.length * 0.1);
  const highFreqThreshold = sortedFreq[top10PctIdx]?.frequency ?? 20;

  const filteredNodes = nodes.filter(n => {
    if (showFlaggedOnly && !n.is_sanctioned_adjacent && !n.is_high_risk_cluster) return false;
    if (n.type === 'customer' && !filterNodeTypes.has('customers')) return false;
    if (n.type === 'counterparty' && !filterNodeTypes.has('counterparties')) return false;
    return true;
  });
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = edges.filter(e =>
    filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target) && e.volume >= minEdgeVolume
  );

  // Build Cytoscape elements — avoid duplicate keys by not spreading the full object
  const elements = [
    ...filteredNodes.map(n => ({
      data: {
        id: n.id,
        label: n.label.length > 16 ? n.label.substring(0, 14) + '…' : n.label,
        type: n.type,
        segment: n.segment,
        risk_score: n.risk_score,
        total_volume: n.total_volume,
        is_sanctioned_adjacent: n.is_sanctioned_adjacent,
        is_high_risk_cluster: n.is_high_risk_cluster,
        cluster_id: n.cluster_id,
        _isLayeringCluster: n.cluster_id === 1,
      },
    })),
    ...filteredEdges.map(e => ({
      data: {
        id: e.id,
        source: e.source,
        target: e.target,
        volume: e.volume,
        frequency: e.frequency,
        is_layering_path: e.is_layering_path,
        _isHighFreq: e.frequency >= highFreqThreshold,
      },
    })),
  ];

  const stylesheet: CyStylesheet[] = [
    {
      selector: 'node[type = "customer"]',
      style: {
        shape: 'ellipse',
        width: 30,
        height: 30,
        'background-color': '#011E41',
        label: 'data(label)',
        color: 'white',
        'font-size': 10,
        'text-valign': 'center',
        'text-halign': 'center',
        'font-family': 'Arial',
        'text-wrap': 'ellipsis',
        'text-max-width': '28px',
      },
    },
    {
      selector: 'node[type = "counterparty"]',
      style: {
        shape: 'diamond',
        width: 30,
        height: 30,
        'background-color': '#05AB8C',
        label: 'data(label)',
        color: 'white',
        'font-size': 10,
        'text-valign': 'center',
        'text-halign': 'center',
        'font-family': 'Arial',
        'text-wrap': 'ellipsis',
        'text-max-width': '28px',
      },
    },
    {
      selector: 'node[is_sanctioned_adjacent = 1]',
      style: {
        'background-color': '#E5376B',
        'border-width': 3,
        'border-color': 'white',
      },
    },
    {
      selector: 'node[is_high_risk_cluster = 1]',
      style: {
        'border-width': 3,
        'border-color': '#F5A800',
      },
    },
    {
      selector: 'edge',
      style: {
        'line-color': '#BDBDBD',
        width: 1,
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        'target-arrow-color': '#BDBDBD',
        'arrow-scale': 0.7,
      },
    },
    {
      selector: 'edge[_isHighFreq = 1]',
      style: {
        'line-color': '#F5A800',
        width: 2,
        'target-arrow-color': '#F5A800',
      },
    },
    {
      selector: 'edge[is_layering_path = 1]',
      style: {
        'line-color': '#E5376B',
        'line-style': 'dashed',
        width: 2,
        'target-arrow-color': '#E5376B',
      },
    },
    ...(showLayering ? [
      {
        selector: 'node[_isLayeringCluster != 1]',
        style: { opacity: 0.2 },
      },
      {
        selector: 'edge[is_layering_path != 1]',
        style: { opacity: 0.2 },
      },
    ] : []),
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCyReady = useCallback((cy: any) => {
    cy.on('tap', 'node', (evt: any) => {
      const nodeId = evt.target.id();
      setSelectedNode(nodes.find(n => n.id === nodeId) || null);
    });
    cy.on('tap', (evt: any) => {
      if (evt.target === cy) setSelectedNode(null);
    });
  }, [nodes]);

  const connectedNodes = selectedNode
    ? nodes.filter(n => {
        return edges.some(e =>
          (e.source === selectedNode.id && e.target === n.id) ||
          (e.target === selectedNode.id && e.source === n.id)
        );
      })
    : [];

  const toggleFilterType = (type: string) => {
    setFilterNodeTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px - 64px)', margin: '-32px', overflow: 'hidden' }}>
      {/* Controls panel */}
      <div style={{
        width: 280,
        minWidth: 280,
        backgroundColor: '#F8F8F8',
        borderRight: '1px solid #E0E0E0',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        overflowY: 'auto',
      }}>
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#011E41' }}>Node Types</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={filterNodeTypes.has('customers')} onChange={() => toggleFilterType('customers')} />
              Customers
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={filterNodeTypes.has('counterparties')} onChange={() => toggleFilterType('counterparties')} />
              Counterparties
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={showFlaggedOnly} onChange={e => setShowFlaggedOnly(e.target.checked)} />
              Flagged Only
            </label>
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#011E41' }}>Min Edge Volume</h3>
          <input
            type="range" min={0} max={maxVol} step={10000} value={minEdgeVolume}
            onChange={e => setMinEdgeVolume(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <span style={{ fontSize: 11, color: '#828282' }}>&ge; {formatCurrency(minEdgeVolume)}</span>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            <input type="checkbox" checked={showLayering} onChange={e => setShowLayering(e.target.checked)} />
            <span style={{ color: showLayering ? '#E5376B' : '#011E41' }}>Show layering patterns</span>
          </label>
          {showLayering && (
            <p style={{ margin: '8px 0 0', fontSize: 11, color: '#828282' }}>
              Non-cluster nodes faded. Layering chain highlighted in red.
            </p>
          )}
        </div>

        {/* Legend */}
        <div>
          <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#011E41' }}>Legend</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
            <LegendItem color="#011E41" shape="circle" label="Customer" />
            <LegendItem color="#05AB8C" shape="diamond" label="Counterparty" />
            <LegendItem color="#E5376B" shape="circle" label="Sanctioned-adjacent" />
            <LegendItem border label="High-risk cluster" />
            <LegendItem edgeColor="#E5376B" dashed label="Layering path" />
            <LegendItem edgeColor="#F5A800" label="High-frequency edge" />
          </div>
        </div>

        {/* Selected node detail */}
        {selectedNode && (
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #E0E0E0',
            borderRadius: 8,
            padding: 16,
          }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#011E41' }}>
              {selectedNode.label}
            </h3>
            <span style={{
              backgroundColor: selectedNode.type === 'customer' ? '#EEF2FF' : '#F0FDF4',
              color: selectedNode.type === 'customer' ? '#4F46E5' : '#15803D',
              padding: '1px 8px', borderRadius: 4, fontSize: 11, display: 'inline-block', marginBottom: 10,
            }}>
              {selectedNode.type === 'customer' ? 'Customer' : 'Counterparty'}
            </span>

            {selectedNode.is_sanctioned_adjacent && (
              <div style={{
                backgroundColor: '#FEE2E2',
                border: '1px solid #FECACA',
                borderRadius: 6,
                padding: 10,
                marginBottom: 10,
                fontSize: 11,
                color: '#DC2626',
              }}>
                &#9888; Sanctioned-adjacent entity. This node has been flagged for indirect sanctions exposure.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              {selectedNode.type === 'customer' && (
                <>
                  <DetailRow label="Segment" value={SEGMENT_LABELS[selectedNode.segment || ''] || selectedNode.segment || '—'} />
                  <DetailRow label="Risk Score" value={selectedNode.risk_score?.toString() || '—'} />
                </>
              )}
              <DetailRow label="Total Volume" value={formatCurrency(selectedNode.total_volume)} />
              {selectedNode.type === 'counterparty' && (
                <DetailRow label="Connected Customers" value={connectedNodes.filter(n => n.type === 'customer').length.toString()} />
              )}
            </div>

            {connectedNodes.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: '#828282', marginBottom: 6 }}>Connected nodes:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {connectedNodes.slice(0, 8).map(n => (
                    <button
                      key={n.id}
                      onClick={() => n.type === 'customer' ? router.push(`/customers/${n.id}`) : setSelectedNode(n)}
                      style={{
                        padding: '2px 8px',
                        backgroundColor: n.type === 'customer' ? '#EEF2FF' : '#F0FDF4',
                        color: n.type === 'customer' ? '#4F46E5' : '#15803D',
                        border: 'none',
                        borderRadius: 12,
                        fontSize: 11,
                        cursor: 'pointer',
                        fontFamily: 'Arial, sans-serif',
                      }}
                    >
                      {n.label.length > 15 ? n.label.substring(0, 13) + '…' : n.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!selectedNode && (
          <div style={{ color: '#828282', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
            Click a node to see details
          </div>
        )}
      </div>

      {/* Cytoscape canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <CytoscapeComponent
          elements={elements}
          style={{ width: '100%', height: '100%' }}
          stylesheet={stylesheet as any} // eslint-disable-line @typescript-eslint/no-explicit-any
          layout={{
            name: 'cose-bilkent',
            animate: false,
            padding: 40,
            nodeDimensionsIncludeLabels: true,
            idealEdgeLength: 80,
            nodeRepulsion: 8000,
            gravity: 0.25,
            numIter: 2500,
          } as any} // eslint-disable-line @typescript-eslint/no-explicit-any
          cy={handleCyReady}
        />
      </div>
    </div>
  );
}

function LegendItem({
  color,
  shape,
  border,
  label,
  edgeColor,
  dashed,
}: {
  color?: string;
  shape?: string;
  border?: boolean;
  label: string;
  edgeColor?: string;
  dashed?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {edgeColor ? (
        <div style={{ width: 20, height: 2, backgroundColor: dashed ? 'transparent' : edgeColor, borderTop: dashed ? `2px dashed ${edgeColor}` : 'none' }} />
      ) : (
        <div style={{
          width: 12,
          height: 12,
          backgroundColor: border ? 'transparent' : color,
          border: border ? '2px solid #F5A800' : 'none',
          borderRadius: shape === 'diamond' ? 0 : '50%',
          transform: shape === 'diamond' ? 'rotate(45deg)' : 'none',
          flexShrink: 0,
        }} />
      )}
      <span style={{ color: '#444' }}>{label}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#828282' }}>{label}</span>
      <span style={{ color: '#011E41', fontWeight: 500 }}>{value}</span>
    </div>
  );
}
