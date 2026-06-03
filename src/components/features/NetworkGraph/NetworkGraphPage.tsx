'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, X, Layers, Share2, AlertOctagon } from 'lucide-react'
import type { NetworkNode, NetworkEdge } from '@/types/network'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

const CytoscapeComponent = dynamic(
  async () => {
    const [cytoscape, coseBilkent, ReactCytoscape] = await Promise.all([
      import('cytoscape'),
      import('cytoscape-cose-bilkent'),
      import('react-cytoscapejs'),
    ])
    try { cytoscape.default.use(coseBilkent.default) } catch { /* already registered */ }
    return ReactCytoscape
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8F9FB] gap-4">
        <Skeleton className="w-[80%] h-[60%] rounded-xl" />
        <p className="text-xs text-[#828282]">Loading network graph…</p>
      </div>
    ),
  }
)

interface Props { nodes: NetworkNode[]; edges: NetworkEdge[] }

const SEGMENT_LABELS: Record<string, string> = {
  private_wealth: 'Private Wealth', corporate_treasury: 'Corp Treasury',
  correspondent_banking: 'Correspondent', retail: 'Retail',
}

const PATTERNS = [
  {
    icon: Layers,
    color: '#E5376B',
    title: 'Pattern 1 — Layering Chain',
    body: 'Five nodes form a chain: Customer A → Shell Corp X → Offshore Y → BVI Z → Customer B. Each individual hop appears small-volume. Total chain volume is significant. Classic layering typology.',
    cluster: 1,
  },
  {
    icon: Share2,
    color: '#F5A800',
    title: 'Pattern 2 — Hub Counterparty',
    body: 'One counterparty connected to 9 customers across 3+ segments with high transaction frequency. A single entity acting as clearing house across unrelated customers is a structuring indicator.',
    cluster: 2,
  },
  {
    icon: AlertOctagon,
    color: '#E5376B',
    title: 'Pattern 3 — Sanctioned Adjacency',
    body: 'Two customers with no direct sanctions exposure transact with a sanctioned-adjacent entity. 1-hop indirect exposure is invisible to rules but surfaces immediately in graph analysis.',
    cluster: 3,
  },
]

export default function NetworkGraphPage({ nodes, edges }: Props) {
  const router = useRouter()
  const [showCustomers, setShowCustomers] = useState(true)
  const [showCounterparties, setShowCounterparties] = useState(true)
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false)
  const [minEdgeVolume, setMinEdgeVolume] = useState(0)
  const [showLayering, setShowLayering] = useState(false)
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [infoDismissed, setInfoDismissed] = useState(false)

  const maxVol = Math.max(...edges.map(e => e.volume), 1)
  const sortedFreq = [...edges].sort((a, b) => b.frequency - a.frequency)
  const highFreqThreshold = sortedFreq[Math.floor(sortedFreq.length * 0.1)]?.frequency ?? 20

  const filteredNodes = nodes.filter(n => {
    if (showFlaggedOnly && !n.is_sanctioned_adjacent && !n.is_high_risk_cluster) return false
    if (n.type === 'customer' && !showCustomers) return false
    if (n.type === 'counterparty' && !showCounterparties) return false
    return true
  })
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id))
  const filteredEdges = edges.filter(e =>
    filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target) && e.volume >= minEdgeVolume
  )

  const elements = [
    ...filteredNodes.map(n => ({
      data: {
        id: n.id,
        label: n.label.length > 14 ? n.label.substring(0, 12) + '…' : n.label,
        type: n.type, segment: n.segment, risk_score: n.risk_score,
        total_volume: n.total_volume, is_sanctioned_adjacent: n.is_sanctioned_adjacent,
        is_high_risk_cluster: n.is_high_risk_cluster, cluster_id: n.cluster_id,
        _isLayeringCluster: n.cluster_id === 1,
      },
    })),
    ...filteredEdges.map(e => ({
      data: {
        id: e.id, source: e.source, target: e.target,
        volume: e.volume, frequency: e.frequency, is_layering_path: e.is_layering_path,
        _isHighFreq: e.frequency >= highFreqThreshold,
      },
    })),
  ]

  const stylesheet = [
    { selector: 'node[type = "customer"]', style: { shape: 'ellipse', width: 32, height: 32, 'background-color': '#011E41', label: 'data(label)', color: 'white', 'font-size': 9, 'text-valign': 'center', 'text-halign': 'center', 'font-family': 'Inter, Arial', 'text-wrap': 'ellipsis', 'text-max-width': '30px' } },
    { selector: 'node[type = "counterparty"]', style: { shape: 'diamond', width: 32, height: 32, 'background-color': '#05AB8C', label: 'data(label)', color: 'white', 'font-size': 9, 'text-valign': 'center', 'text-halign': 'center', 'font-family': 'Inter, Arial', 'text-wrap': 'ellipsis', 'text-max-width': '30px' } },
    { selector: 'node[is_sanctioned_adjacent = 1]', style: { 'background-color': '#E5376B', 'border-width': 3, 'border-color': 'white' } },
    { selector: 'node[is_high_risk_cluster = 1]', style: { 'border-width': 3, 'border-color': '#F5A800' } },
    { selector: 'node:selected', style: { 'border-width': 4, 'border-color': '#F5A800', 'overlay-color': '#F5A800', 'overlay-opacity': 0.15, 'overlay-padding': 4 } },
    { selector: 'edge', style: { 'line-color': '#D0D5DD', width: 1, 'curve-style': 'bezier', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#D0D5DD', 'arrow-scale': 0.6, opacity: 0.8 } },
    { selector: 'edge[_isHighFreq = 1]', style: { 'line-color': '#F5A800', width: 2.5, 'target-arrow-color': '#F5A800', opacity: 1 } },
    { selector: 'edge[is_layering_path = 1]', style: { 'line-color': '#E5376B', 'line-style': 'dashed', width: 2.5, 'target-arrow-color': '#E5376B', opacity: 1 } },
    ...(showLayering ? [
      { selector: 'node[_isLayeringCluster != 1]', style: { opacity: 0.15 } },
      { selector: 'edge[is_layering_path != 1]', style: { opacity: 0.08 } },
    ] : []),
  ]

  const handleCyReady = useCallback((cy: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    cy.on('tap', 'node', (evt: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const nodeId = evt.target.id()
      setSelectedNode(nodes.find(n => n.id === nodeId) || null)
    })
    cy.on('tap', (evt: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (evt.target === cy) setSelectedNode(null)
    })
  }, [nodes])

  const connectedNodes = selectedNode
    ? nodes.filter(n => edges.some(e => (e.source === selectedNode.id && e.target === n.id) || (e.target === selectedNode.id && e.source === n.id)))
    : []

  return (
    <div className="flex h-[calc(100vh-52px-48px)] -mx-6 -my-6 overflow-hidden">
      {/* Controls */}
      <div className="w-[260px] min-w-[260px] bg-white border-r border-[#E0E0E0] flex flex-col overflow-y-auto">
        <div className="p-4 space-y-5">
          {/* Filters */}
          <div>
            <div className="text-xs font-semibold text-[#828282] uppercase tracking-wider mb-2.5">Display</div>
            <div className="space-y-2">
              {[
                { id: 'customers', label: 'Customers', checked: showCustomers, onCheck: setShowCustomers },
                { id: 'counterparties', label: 'Counterparties', checked: showCounterparties, onCheck: setShowCounterparties },
                { id: 'flagged', label: 'Flagged nodes only', checked: showFlaggedOnly, onCheck: setShowFlaggedOnly },
              ].map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox id={item.id} checked={item.checked} onCheckedChange={v => item.onCheck(!!v)} />
                  <Label htmlFor={item.id} className="text-sm">{item.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-xs font-semibold text-[#828282] uppercase tracking-wider mb-2">Min Edge Volume</div>
            <input type="range" min={0} max={maxVol} step={10000} value={minEdgeVolume}
              onChange={e => setMinEdgeVolume(+e.target.value)}
              className="w-full accent-[#011E41] h-1.5" />
            <span className="text-xs text-[#828282] tabular-nums">≥ {formatCurrency(minEdgeVolume)}</span>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2">
              <Checkbox id="layering" checked={showLayering} onCheckedChange={v => setShowLayering(!!v)} />
              <Label htmlFor="layering" className="text-sm font-semibold" style={{ color: showLayering ? '#E5376B' : '#011E41' }}>
                Highlight layering chain
              </Label>
            </div>
            {showLayering && (
              <p className="text-xs text-[#828282] mt-1.5 leading-relaxed">Non-cluster nodes faded. Red chain = Pattern 1 layering path.</p>
            )}
          </div>

          <Separator />

          {/* Legend */}
          <div>
            <div className="text-xs font-semibold text-[#828282] uppercase tracking-wider mb-2.5">Legend</div>
            <div className="space-y-1.5 text-xs">
              {[
                { shape: 'circle', color: '#011E41', label: 'Customer' },
                { shape: 'diamond', color: '#05AB8C', label: 'Counterparty' },
                { shape: 'circle', color: '#E5376B', label: 'Sanctioned-adjacent' },
                { shape: 'border', color: '#F5A800', label: 'High-risk cluster' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div style={{
                    width: 12, height: 12, flexShrink: 0,
                    backgroundColor: item.shape === 'border' ? 'transparent' : item.color,
                    border: item.shape === 'border' ? `2px solid ${item.color}` : 'none',
                    borderRadius: item.shape === 'circle' ? '50%' : item.shape === 'diamond' ? 0 : '50%',
                    transform: item.shape === 'diamond' ? 'rotate(45deg)' : 'none',
                  }} />
                  <span className="text-[#4F4F4F]">{item.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1">
                <div className="w-5 h-0.5 bg-[#E5376B] border-t-2 border-dashed border-[#E5376B]" style={{ borderTop: '2px dashed #E5376B', background: 'none' }} />
                <span className="text-[#4F4F4F]">Layering path</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-0.5 bg-[#F5A800]" style={{ height: 2.5, borderRadius: 1 }} />
                <span className="text-[#4F4F4F]">High-frequency edge</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pattern callout cards */}
          <div>
            <div className="text-xs font-semibold text-[#828282] uppercase tracking-wider mb-2.5">Risk Patterns</div>
            <div className="space-y-2">
              {PATTERNS.map((p) => {
                const Icon = p.icon
                return (
                  <div
                    key={p.cluster}
                    className="rounded-md p-3 border text-xs transition-colors"
                    style={{
                      borderColor: (showLayering && p.cluster === 1) ? p.color : '#E0E0E0',
                      backgroundColor: (showLayering && p.cluster === 1) ? `${p.color}0A` : '#F8F9FB',
                    }}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-[#011E41] mb-1">
                      <Icon size={11} style={{ color: p.color }} />
                      {p.title}
                    </div>
                    <p className="text-[#828282] leading-relaxed">{p.body}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Selected node detail */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="border-t border-[#E0E0E0] p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-[#011E41] leading-tight pr-2">{selectedNode.label}</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => setSelectedNode(null)}>
                  <X size={12} />
                </Button>
              </div>

              <Badge variant={selectedNode.type === 'customer' ? 'default' : 'teal'} className="mb-3 text-2xs">
                {selectedNode.type === 'customer' ? 'Customer' : 'Counterparty'}
              </Badge>

              {selectedNode.is_sanctioned_adjacent && (
                <div className="rounded-md bg-[#FEF0F4] border border-[#FECACA] p-2.5 mb-3 text-xs text-[#992A5C] leading-relaxed">
                  ⚠ Sanctioned-adjacent. Flagged for indirect sanctions exposure — 1-hop connection to a restricted entity.
                </div>
              )}

              <div className="space-y-1.5 text-xs">
                {selectedNode.type === 'customer' && (
                  <>
                    <div className="flex justify-between"><span className="text-[#828282]">Segment</span><span className="font-medium text-[#011E41]">{SEGMENT_LABELS[selectedNode.segment || ''] || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[#828282]">Risk Score</span><span className="font-bold tabular-nums" style={{ color: selectedNode.risk_score && selectedNode.risk_score > 70 ? '#E5376B' : selectedNode.risk_score && selectedNode.risk_score > 40 ? '#F5A800' : '#05AB8C' }}>{selectedNode.risk_score ?? '—'}</span></div>
                  </>
                )}
                <div className="flex justify-between"><span className="text-[#828282]">Total Volume</span><span className="font-medium tabular-nums text-[#011E41]">{formatCurrency(selectedNode.total_volume)}</span></div>
                {selectedNode.type === 'counterparty' && (
                  <div className="flex justify-between"><span className="text-[#828282]">Connected customers</span><span className="font-medium text-[#011E41]">{connectedNodes.filter(n => n.type === 'customer').length}</span></div>
                )}
              </div>

              {connectedNodes.length > 0 && (
                <div className="mt-3">
                  <div className="text-2xs text-[#828282] mb-1.5 font-medium">Connected nodes</div>
                  <div className="flex flex-wrap gap-1">
                    {connectedNodes.slice(0, 8).map(n => (
                      <button
                        key={n.id}
                        onClick={() => n.type === 'customer' ? router.push(`/customers/${n.id}`) : setSelectedNode(n)}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: n.type === 'customer' ? '#EEF2FF' : '#F0FDF4',
                          color: n.type === 'customer' ? '#4338CA' : '#15803D',
                        }}
                      >
                        {n.label.length > 13 ? n.label.substring(0, 11) + '…' : n.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedNode && (
          <div className="border-t border-[#E0E0E0] p-4 text-xs text-[#BDBDBD] text-center">
            Click a node to inspect it
          </div>
        )}
      </div>

      {/* Graph canvas */}
      <div className="flex-1 relative overflow-hidden bg-[#F8F9FB]">
        {/* Info overlay */}
        <AnimatePresence>
          {!infoDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-[520px] w-full px-4"
            >
              <div className="rounded-lg bg-white/95 backdrop-blur-sm border border-[#E0E0E0] shadow-card-hover px-4 py-3 flex items-start gap-3">
                <Info size={16} className="text-[#0075C9] flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-xs text-[#011E41] leading-relaxed">
                  <strong>Reading this graph: </strong>
                  Circles = Customers · Diamonds = Counterparties · Red fill = Sanctioned-adjacent · Orange border = High-risk cluster ·
                  Red dashed edges = Layering chain · Orange edges = High-frequency
                </div>
                <button onClick={() => setInfoDismissed(true)} className="flex-shrink-0 text-[#BDBDBD] hover:text-[#828282] transition-colors ml-1">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CytoscapeComponent
          elements={elements}
          style={{ width: '100%', height: '100%' }}
          stylesheet={stylesheet as any} // eslint-disable-line @typescript-eslint/no-explicit-any
          layout={{ name: 'cose-bilkent', animate: false, padding: 50, nodeDimensionsIncludeLabels: true, idealEdgeLength: 80, nodeRepulsion: 8000, gravity: 0.25, numIter: 2500 } as any} // eslint-disable-line @typescript-eslint/no-explicit-any
          cy={handleCyReady}
        />
      </div>
    </div>
  )
}
