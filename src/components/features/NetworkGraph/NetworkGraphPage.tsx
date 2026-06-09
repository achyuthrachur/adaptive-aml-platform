'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Layers, Share2, AlertOctagon,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2,
  ArrowRight, BookOpen, ChevronDown,
} from 'lucide-react'
import type { NetworkNode, NetworkEdge } from '@/types/network'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface Props { nodes: NetworkNode[]; edges: NetworkEdge[] }

const SEGMENT_LABELS: Record<string, string> = {
  private_wealth: 'Private Wealth', corporate_treasury: 'Corp Treasury',
  correspondent_banking: 'Correspondent', retail: 'Retail',
}

const PATTERNS = [
  {
    icon: Layers, color: '#E5376B', cluster: 1,
    title: 'Layering Chain',
    body: 'A chain of transactions passes money through multiple intermediate entities. Each hop looks normal in isolation — the full chain is only visible in the graph.',
  },
  {
    icon: Share2, color: '#F5A800', cluster: 2,
    title: 'Hub Counterparty',
    body: 'One counterparty is connected to many unrelated customers across multiple segments. This "hub" pattern suggests a shared clearing mechanism.',
  },
  {
    icon: AlertOctagon, color: '#E5376B', cluster: 3,
    title: 'Sanctioned Adjacency',
    body: 'Customers are one hop away from a sanctioned entity — not transacting directly, but their counterparty is. This indirect exposure is invisible to rule-based screening.',
  },
]

const HOW_TO_READ = [
  {
    title: 'Blue circle = Customer',
    body: 'Each customer in the monitored portfolio. Size reflects their AML risk score — bigger circles carry higher risk.',
    preview: { shape: 'circle' as const, bg: '#1E4A80', border: 'rgba(255,255,255,0.3)', size: 20, borderWidth: 1.5 },
  },
  {
    title: 'Teal diamond = Counterparty',
    body: 'External entities customers transact with: other banks, wire recipients, shell companies. Their connections reveal patterns.',
    preview: { shape: 'diamond' as const, bg: '#059E84', border: 'rgba(255,255,255,0.3)', size: 16, borderWidth: 1.5 },
  },
  {
    title: 'Red circle = Sanctioned-adjacent',
    body: 'One hop from a sanctioned entity. Not directly sanctioned, but the risk flows through this connection.',
    preview: { shape: 'circle' as const, bg: '#B01D4A', border: '#FF6B9D', size: 20, borderWidth: 3 },
  },
  {
    title: 'Orange border = High-risk cluster',
    body: 'Transaction patterns strongly match known money-laundering behavior in the behavioral model.',
    preview: { shape: 'circle' as const, bg: '#1E4A80', border: '#F5A800', size: 20, borderWidth: 3 },
  },
  {
    title: 'Amber line = High-frequency',
    body: 'This transaction link occurred far more often than typical — a known structuring signal.',
    preview: { line: true as const, color: '#F5A800', dashed: false },
  },
  {
    title: 'Red dashed = Layering path',
    body: 'Part of a detected layering chain. Enable "Highlight layering chain" to isolate the full sequence.',
    preview: { line: true as const, color: '#E5376B', dashed: true },
  },
]

export default function NetworkGraphPage({ nodes, edges }: Props) {
  const router = useRouter()
  const graphRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showCustomers, setShowCustomers] = useState(true)
  const [showCounterparties, setShowCounterparties] = useState(true)
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false)
  const [minEdgeVolume, setMinEdgeVolume] = useState(0)
  const [showLayering, setShowLayering] = useState(false)
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<NetworkEdge | null>(null)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const [howToOpen, setHowToOpen] = useState(false)

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

  const nodeSize = (riskScore?: number) => {
    if (!riskScore) return 44
    return Math.min(64, 44 + Math.max(0, riskScore - 50) / 4)
  }

  const buildElements = useCallback(() => [
    ...filteredNodes.map(n => ({
      data: {
        id: n.id,
        label: n.label.length > 12 ? n.label.substring(0, 10) + '…' : n.label,
        type: n.type, segment: n.segment, risk_score: n.risk_score,
        total_volume: n.total_volume,
        is_sanctioned_adjacent: n.is_sanctioned_adjacent ? 1 : 0,
        is_high_risk_cluster: n.is_high_risk_cluster ? 1 : 0,
        cluster_id: n.cluster_id,
        _size: nodeSize(n.risk_score),
        _isLayeringCluster: n.cluster_id === 1 ? 1 : 0,
      },
    })),
    ...filteredEdges.map(e => ({
      data: {
        id: e.id, source: e.source, target: e.target,
        volume: e.volume, frequency: e.frequency,
        is_layering_path: e.is_layering_path ? 1 : 0,
        _isHighFreq: e.frequency >= highFreqThreshold ? 1 : 0,
      },
    })),
  ], [filteredNodes, filteredEdges, highFreqThreshold]) // eslint-disable-line react-hooks/exhaustive-deps

  const buildStylesheet = useCallback((layering: boolean) => [
    {
      selector: 'node[type = "customer"]',
      style: {
        shape: 'ellipse' as const,
        width: 'data(_size)', height: 'data(_size)',
        'background-color': '#1E4A80',
        'border-width': 2,
        'border-color': 'rgba(255,255,255,0.22)',
        label: 'data(label)',
        color: '#FFFFFF',
        'font-size': 11,
        'font-family': 'system-ui, Arial',
        'text-valign': 'bottom' as const,
        'text-halign': 'center' as const,
        'text-margin-y': 6,
        'text-wrap': 'none' as const,
        'text-background-color': '#050E1A',
        'text-background-opacity': 0.88,
        'text-background-padding': 3,
        'text-background-shape': 'roundrectangle' as const,
      },
    },
    {
      selector: 'node[type = "counterparty"]',
      style: {
        shape: 'diamond' as const,
        width: 44, height: 44,
        'background-color': '#059E84',
        'border-width': 2,
        'border-color': 'rgba(255,255,255,0.28)',
        label: 'data(label)',
        color: '#FFFFFF',
        'font-size': 11,
        'font-family': 'system-ui, Arial',
        'text-valign': 'bottom' as const,
        'text-halign': 'center' as const,
        'text-margin-y': 9,
        'text-wrap': 'none' as const,
        'text-background-color': '#050E1A',
        'text-background-opacity': 0.88,
        'text-background-padding': 3,
        'text-background-shape': 'roundrectangle' as const,
      },
    },
    {
      selector: 'node[is_sanctioned_adjacent = 1]',
      style: { 'background-color': '#B01D4A', 'border-width': 4, 'border-color': '#FF6B9D', width: 52, height: 52 },
    },
    {
      selector: 'node[is_high_risk_cluster = 1]',
      style: { 'border-width': 3.5, 'border-color': '#F5A800' },
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 4, 'border-color': '#F5A800',
        'overlay-color': '#F5A800', 'overlay-opacity': 0.18, 'overlay-padding': 8,
      },
    },
    {
      selector: 'edge',
      style: {
        'line-color': 'rgba(255,255,255,0.14)',
        width: 1.5,
        'curve-style': 'bezier' as const,
        'target-arrow-shape': 'triangle' as const,
        'target-arrow-color': 'rgba(255,255,255,0.14)',
        'arrow-scale': 0.7,
        opacity: 0.8,
      },
    },
    {
      selector: 'edge[_isHighFreq = 1]',
      style: { 'line-color': '#F5A800', width: 3, 'target-arrow-color': '#F5A800', opacity: 0.9 },
    },
    {
      selector: 'edge[is_layering_path = 1]',
      style: {
        'line-color': '#E5376B',
        'line-style': 'dashed' as const,
        'line-dash-pattern': [8, 4],
        width: 3, 'target-arrow-color': '#E5376B', opacity: 1,
      },
    },
    ...(layering ? [
      { selector: 'node[_isLayeringCluster != 1]', style: { opacity: 0.08 } },
      { selector: 'edge[is_layering_path != 1]', style: { opacity: 0.04 } },
      { selector: 'node[_isLayeringCluster = 1]', style: { width: 54, height: 54, 'border-width': 4, 'border-color': '#E5376B', opacity: 1 } },
    ] : []),
  ], [])

  const layoutConfig = {
    name: 'cose-bilkent',
    animate: true,
    animationDuration: 1200,
    animationEasing: 'ease-out',
    fit: true,
    padding: 40,
    nodeDimensionsIncludeLabels: true,
    idealEdgeLength: 55,
    nodeRepulsion: 2800,
    gravity: 0.55,
    numIter: 2500,
    coolingFactor: 0.95,
    tileDisconnected: true,
    tilingPaddingVertical: 10,
    tilingPaddingHorizontal: 10,
  }

  // Mount Cytoscape directly — bypasses react-cytoscapejs React 18 compatibility issue
  useEffect(() => {
    if (!graphRef.current) return
    let mounted = true
    let cy: any = null // eslint-disable-line @typescript-eslint/no-explicit-any

    const init = async () => {
      try {
        const [cytoscapeModule, coseBilkentModule] = await Promise.all([
          import('cytoscape'),
          import('cytoscape-cose-bilkent'),
        ])
        if (!mounted || !graphRef.current) return

        const cytoscape = cytoscapeModule.default
        try { cytoscape.use(coseBilkentModule.default) } catch { /* already registered */ }

        cy = cytoscape({
          container: graphRef.current,
          elements: buildElements(),
          style: buildStylesheet(false) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          layout: layoutConfig as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          userZoomingEnabled: true,
          userPanningEnabled: true,
          autoungrabify: false,
        })

        cyRef.current = cy
        if (mounted) setIsLoading(false)

        cy.on('layoutstop', () => {
          // Redistribute disconnected components evenly across the canvas
          const comps = cy.elements().components()
          if (comps.length > 1 && graphRef.current) {
            const canvasW = graphRef.current.offsetWidth
            const canvasH = graphRef.current.offsetHeight
            const cols = comps.length <= 3 ? comps.length : Math.ceil(Math.sqrt(comps.length))
            const rows = Math.ceil(comps.length / cols)
            const pad = 60
            const cellW = (canvasW - pad * 2) / cols
            const cellH = (canvasH - pad * 2) / rows

            // Sort components largest-first so biggest cluster goes top-left
            const sorted = [...comps].sort((a: any, b: any) => b.length - a.length)

            sorted.forEach((comp: any, i: number) => {
              const row = Math.floor(i / cols)
              const col = i % cols
              const targetX = pad + col * cellW + cellW / 2
              const targetY = pad + row * cellH + cellH / 2
              const bb = comp.boundingBox({ includeLabels: false })
              const cx = (bb.x1 + bb.x2) / 2
              const cy2 = (bb.y1 + bb.y2) / 2
              const dx = targetX - cx
              const dy = targetY - cy2
              comp.nodes().forEach((n: any) => {
                const p = n.position()
                n.position({ x: p.x + dx, y: p.y + dy })
              })
            })
          }
          setTimeout(() => cy.fit(cy.elements(), 24), 80)
        })
        cy.on('tap', 'node', (evt: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          setSelectedNode(nodes.find(n => n.id === evt.target.id()) || null)
        })
        cy.on('tap', (evt: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (evt.target === cy) setSelectedNode(null)
        })
        cy.on('mouseover', 'edge', (evt: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          evt.target.style({ 'line-color': 'rgba(255,255,255,0.5)', width: 3, opacity: 1 })
          const edge = edges.find(e => e.id === evt.target.id()) || null
          if (edge) {
            setHoveredEdge(edge)
            if (graphRef.current) {
              const rect = graphRef.current.getBoundingClientRect()
              const pan = cy.pan(), zoom = cy.zoom()
              const mid = evt.target.midpoint()
              setHoverPos({ x: mid.x * zoom + pan.x + rect.left, y: mid.y * zoom + pan.y + rect.top })
            }
          }
        })
        cy.on('mouseout', 'edge', (evt: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          const isLayering = evt.target.data('is_layering_path')
          const isHighFreq = evt.target.data('_isHighFreq')
          evt.target.style({
            'line-color': isLayering ? '#E5376B' : isHighFreq ? '#F5A800' : 'rgba(255,255,255,0.14)',
            width: isLayering || isHighFreq ? 3 : 1.5,
            opacity: isLayering ? 1 : 0.8,
          })
          setHoveredEdge(null); setHoverPos(null)
        })
      } catch (err) {
        console.error('[NetworkGraph] Cytoscape init error:', err)
        if (mounted) setIsLoading(false)
      }
    }

    init()
    return () => {
      mounted = false
      if (cy) { cy.destroy(); cyRef.current = null }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update elements when filters change (after initial mount)
  useEffect(() => {
    const cy = cyRef.current
    if (!cy || isLoading) return
    cy.batch(() => { cy.elements().remove(); cy.add(buildElements()) })
    cy.layout(layoutConfig).run()
  }, [showFlaggedOnly, showCustomers, showCounterparties, minEdgeVolume]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update stylesheet when layering changes
  useEffect(() => {
    const cy = cyRef.current
    if (!cy || isLoading) return
    cy.style(buildStylesheet(showLayering) as any).update() // eslint-disable-line @typescript-eslint/no-explicit-any
  }, [showLayering, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const connectedNodes = selectedNode
    ? nodes.filter(n => edges.some(e =>
        (e.source === selectedNode.id && e.target === n.id) ||
        (e.target === selectedNode.id && e.source === n.id)
      ))
    : []

  const fitAll = () => cyRef.current?.fit(cyRef.current.elements(), 30)
  const zoomIn = () => { const cy = cyRef.current; if (cy) { cy.zoom(cy.zoom() * 1.3); cy.center() } }
  const zoomOut = () => { const cy = cyRef.current; if (cy) { cy.zoom(cy.zoom() * 0.75); cy.center() } }

  const canvasStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #091525 0%, #040D18 60%, #07111F 100%)',
    backgroundImage: [
      'linear-gradient(145deg, #091525 0%, #040D18 60%, #07111F 100%)',
      'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)',
    ].join(', '),
    backgroundSize: '100% 100%, 48px 48px',
    boxShadow: showLayering ? 'inset 0 0 140px rgba(229,55,107,0.08)' : 'none',
    transition: 'box-shadow 0.5s ease',
  }

  return (
    <div className="flex h-[calc(100vh-52px)] -mx-6 -my-6 overflow-hidden">
      {/* Sidebar */}
      <div
        className="flex flex-col bg-white overflow-hidden flex-shrink-0"
        style={{
          width: sidebarOpen ? 280 : 0,
          minWidth: sidebarOpen ? 280 : 0,
          borderRight: sidebarOpen ? '1px solid #E0E0E0' : 'none',
          transition: 'width 220ms ease, min-width 220ms ease',
        }}
      >
        <div className="w-[280px] flex flex-col overflow-y-auto flex-1">
          <div className="p-4 space-y-4">

            {/* How to read */}
            <div className="rounded-xl overflow-hidden border border-[#E0E0E0]">
              <button
                onClick={() => setHowToOpen(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-[#F8F9FB] hover:bg-[#F0F2F5] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={13} className="text-[#0075C9]" />
                  <span className="text-xs font-semibold text-[#011E41]">How to read this graph</span>
                </div>
                <ChevronDown size={12} className="text-[#828282] transition-transform"
                  style={{ transform: howToOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              <AnimatePresence>
                {howToOpen && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    transition={{ duration: 0.2 }} className="overflow-hidden"
                  >
                    <div className="px-3 py-3 space-y-3 border-t border-[#E0E0E0] bg-white">
                      {HOW_TO_READ.map((item, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="flex items-center justify-center w-8 flex-shrink-0 pt-0.5">
                            {'line' in item.preview ? (
                              <svg width="32" height="12">
                                <line x1="0" y1="6" x2="28" y2="6"
                                  stroke={item.preview.color} strokeWidth="2.5"
                                  strokeDasharray={item.preview.dashed ? '6,3' : undefined} />
                                <polygon points="28,3 32,6 28,9" fill={item.preview.color} />
                              </svg>
                            ) : (
                              <div style={{
                                width: item.preview.size, height: item.preview.size,
                                backgroundColor: item.preview.bg,
                                border: `${item.preview.borderWidth}px solid ${item.preview.border}`,
                                borderRadius: item.preview.shape === 'diamond' ? 0 : '50%',
                                transform: item.preview.shape === 'diamond' ? 'rotate(45deg)' : 'none',
                                flexShrink: 0,
                              }} />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-[#011E41] mb-0.5">{item.title}</div>
                            <div className="text-[11px] text-[#6B7280] leading-relaxed">{item.body}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Display filters */}
            <div>
              <div className="text-2xs font-semibold text-[#828282] uppercase tracking-widest mb-2">Show / Hide</div>
              <div className="space-y-1.5">
                {[
                  { id: 'cust', label: 'Customers (circles)', checked: showCustomers, fn: setShowCustomers },
                  { id: 'cp', label: 'Counterparties (diamonds)', checked: showCounterparties, fn: setShowCounterparties },
                  { id: 'flag', label: 'Flagged nodes only', checked: showFlaggedOnly, fn: setShowFlaggedOnly },
                ].map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Checkbox id={item.id} checked={item.checked} onCheckedChange={v => item.fn(!!v)} />
                    <Label htmlFor={item.id} className="text-xs text-[#4F4F4F]">{item.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Edge volume */}
            <div>
              <div className="text-2xs font-semibold text-[#828282] uppercase tracking-widest mb-1.5">Min Transaction Volume</div>
              <p className="text-[11px] text-[#9CA3AF] mb-2 leading-relaxed">Hide low-value connections to focus on significant flows</p>
              <input type="range" min={0} max={maxVol} step={10000} value={minEdgeVolume}
                onChange={e => setMinEdgeVolume(+e.target.value)} className="w-full accent-[#011E41] h-1.5" />
              <span className="text-[11px] text-[#828282] tabular-nums">≥ {formatCurrency(minEdgeVolume)}</span>
            </div>

            <Separator />

            {/* Layering toggle */}
            <div className="rounded-lg border p-3 transition-colors"
              style={{ borderColor: showLayering ? '#E5376B40' : '#E0E0E0', backgroundColor: showLayering ? 'rgba(229,55,107,0.04)' : '#F8F9FB' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Checkbox id="layering" checked={showLayering} onCheckedChange={v => setShowLayering(!!v)} />
                <Label htmlFor="layering" className="text-xs font-semibold cursor-pointer"
                  style={{ color: showLayering ? '#E5376B' : '#011E41' }}>
                  Highlight layering chain
                </Label>
              </div>
              <p className="text-[11px] leading-relaxed text-[#9CA3AF]">
                Fades all other nodes so you can trace the detected layering sequence
              </p>
            </div>

            <Separator />

            {/* Risk patterns */}
            <div>
              <div className="text-2xs font-semibold text-[#828282] uppercase tracking-widest mb-2.5">Detected Risk Patterns</div>
              <div className="space-y-2">
                {PATTERNS.map(p => {
                  const Icon = p.icon
                  const active = showLayering && p.cluster === 1
                  return (
                    <div key={p.cluster} className="rounded-lg p-3 border text-xs transition-colors"
                      style={{ borderColor: active ? p.color + '50' : '#E0E0E0', backgroundColor: active ? `${p.color}0D` : '#F8F9FB' }}>
                      <div className="flex items-center gap-1.5 font-semibold text-[#011E41] mb-1">
                        <Icon size={11} style={{ color: p.color }} />
                        {p.title}
                      </div>
                      <p className="text-[11px] text-[#6B7280] leading-relaxed">{p.body}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Quick legend */}
            <div>
              <div className="text-2xs font-semibold text-[#828282] uppercase tracking-widest mb-2">Quick Reference</div>
              <div className="space-y-1.5 text-xs">
                {[
                  { shape: 'circle' as const, bg: '#1E4A80', border: 'rgba(0,0,0,0.15)', bw: 1.5, label: 'Customer' },
                  { shape: 'diamond' as const, bg: '#059E84', border: 'rgba(0,0,0,0.15)', bw: 1.5, label: 'Counterparty' },
                  { shape: 'circle' as const, bg: '#B01D4A', border: '#FF6B9D', bw: 2, label: 'Sanctioned-adjacent' },
                  { shape: 'circle' as const, bg: 'transparent', border: '#F5A800', bw: 2.5, label: 'High-risk cluster' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div style={{
                      width: 12, height: 12, flexShrink: 0,
                      backgroundColor: item.bg,
                      border: `${item.bw}px solid ${item.border}`,
                      borderRadius: item.shape === 'diamond' ? 0 : '50%',
                      transform: item.shape === 'diamond' ? 'rotate(45deg)' : 'none',
                    }} />
                    <span className="text-[#4F4F4F]">{item.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-0.5">
                  <svg width="22" height="10">
                    <line x1="0" y1="5" x2="18" y2="5" stroke="#E5376B" strokeWidth="2" strokeDasharray="5,3" />
                    <polygon points="18,3 22,5 18,7" fill="#E5376B" />
                  </svg>
                  <span className="text-[#4F4F4F]">Layering path</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="22" height="10">
                    <line x1="0" y1="5" x2="18" y2="5" stroke="#F5A800" strokeWidth="2.5" />
                    <polygon points="18,3 22,5 18,7" fill="#F5A800" />
                  </svg>
                  <span className="text-[#4F4F4F]">High-frequency edge</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected node detail */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="border-t-2 border-[#011E41]/10 p-4"
                style={{ background: 'linear-gradient(135deg, #F8FAFF 0%, #F0F4FF 100%)' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-bold text-[#011E41] leading-tight pr-1">{selectedNode.label}</h3>
                  <Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0" onClick={() => setSelectedNode(null)}>
                    <X size={11} />
                  </Button>
                </div>

                <Badge variant={selectedNode.type === 'customer' ? 'default' : 'teal'} className="mb-2 text-2xs">
                  {selectedNode.type === 'customer' ? 'Customer' : 'Counterparty'}
                </Badge>

                {selectedNode.is_sanctioned_adjacent && (
                  <div className="rounded-lg bg-[#FEF0F4] border border-[#FECACA] p-2.5 mb-2 text-xs text-[#991B1B] leading-relaxed">
                    <strong>⚠ Sanctioned-adjacent</strong><br />
                    This entity's counterparty has sanctions exposure — indirect risk flows through this connection.
                  </div>
                )}

                <div className="space-y-1.5 text-xs mt-2">
                  {selectedNode.type === 'customer' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[#828282]">Segment</span>
                        <span className="font-medium text-[#011E41]">{SEGMENT_LABELS[selectedNode.segment || ''] || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#828282]">Risk Score</span>
                        <span className="font-bold tabular-nums px-2 py-0.5 rounded-full text-xs"
                          style={{
                            color: selectedNode.risk_score && selectedNode.risk_score > 70 ? '#E5376B' : selectedNode.risk_score && selectedNode.risk_score > 40 ? '#F5A800' : '#05AB8C',
                            backgroundColor: selectedNode.risk_score && selectedNode.risk_score > 70 ? 'rgba(229,55,107,0.1)' : selectedNode.risk_score && selectedNode.risk_score > 40 ? 'rgba(245,168,0,0.1)' : 'rgba(5,171,140,0.1)',
                          }}>
                          {selectedNode.risk_score ?? '—'}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#828282]">Total Volume</span>
                    <span className="font-semibold tabular-nums text-[#011E41]">{formatCurrency(selectedNode.total_volume)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#828282]">Direct connections</span>
                    <span className="font-semibold text-[#011E41]">{connectedNodes.length}</span>
                  </div>
                </div>

                {connectedNodes.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] text-[#828282] mb-1.5 font-semibold">Connected entities</div>
                    <div className="flex flex-wrap gap-1">
                      {connectedNodes.slice(0, 8).map(n => (
                        <button key={n.id}
                          onClick={() => n.type === 'customer' ? router.push(`/customers/${n.id}`) : setSelectedNode(n)}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: n.type === 'customer' ? '#EEF2FF' : '#F0FDF4',
                            color: n.type === 'customer' ? '#4338CA' : '#15803D',
                          }}>
                          {n.label.length > 11 ? n.label.substring(0, 9) + '…' : n.label}
                        </button>
                      ))}
                      {connectedNodes.length > 8 && (
                        <span className="text-[10px] text-[#828282] self-center">+{connectedNodes.length - 8} more</span>
                      )}
                    </div>
                  </div>
                )}

                {selectedNode.type === 'customer' && (
                  <Button variant="outline" size="sm" className="w-full mt-3 h-7 text-xs"
                    onClick={() => router.push(`/customers/${selectedNode.id}`)}>
                    View Full Profile <ArrowRight size={11} className="ml-1" />
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!selectedNode && (
            <div className="border-t border-[#E0E0E0] p-3 text-[11px] text-[#BDBDBD] text-center">
              Click any node to inspect its connections
            </div>
          )}
        </div>
      </div>

      {/* Graph canvas */}
      <div className="flex-1 relative overflow-hidden" style={canvasStyle}>
        {/* Sidebar toggle */}
        <button onClick={() => setSidebarOpen(v => !v)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-5 h-12 rounded-r-lg transition-colors"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* Loading overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4"
              style={{ background: 'linear-gradient(145deg, #091525 0%, #040D18 100%)' }}>
              <div className="flex gap-3">
                {[0, 0.15, 0.3].map(d => (
                  <motion.div key={d} className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: d }} />
                ))}
              </div>
              <p className="text-xs font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Mapping relationship network…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title banner */}
        <div className="absolute top-4 left-8 z-20">
          <div className="rounded-lg px-4 py-2.5"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-xs font-bold text-white leading-none mb-0.5">Transaction Network</div>
            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {filteredNodes.length} entities · {filteredEdges.length} transaction links
            </div>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5">
          {[
            { fn: fitAll, icon: <Maximize2 size={14} />, title: 'Fit all in view' },
            { fn: zoomIn, icon: <ZoomIn size={14} />, title: 'Zoom in' },
            { fn: zoomOut, icon: <ZoomOut size={14} />, title: 'Zoom out' },
          ].map((btn, i) => (
            <button key={i} onClick={btn.fn} title={btn.title}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-white/20"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}>
              {btn.icon}
            </button>
          ))}
        </div>

        {/* Bottom guide strip */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="flex items-center gap-4 rounded-full px-5 py-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Hover a line to see transaction details</span>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Click a node to inspect</span>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Drag to pan · Scroll to zoom</span>
          </div>
        </div>

        {/* Edge hover tooltip */}
        <AnimatePresence>
          {hoveredEdge && hoverPos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.12 }}
              className="fixed z-50 pointer-events-none rounded-xl shadow-2xl px-4 py-3 min-w-[200px]"
              style={{
                left: hoverPos.x + 14, top: hoverPos.y - 60,
                backgroundColor: 'rgba(4,13,24,0.95)',
                border: `1px solid ${hoveredEdge.is_layering_path ? 'rgba(229,55,107,0.5)' : hoveredEdge.frequency >= highFreqThreshold ? 'rgba(245,168,0,0.5)' : 'rgba(255,255,255,0.15)'}`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1.5 w-8 rounded-full"
                  style={{ backgroundColor: hoveredEdge.is_layering_path ? '#E5376B' : hoveredEdge.frequency >= highFreqThreshold ? '#F5A800' : 'rgba(255,255,255,0.3)' }} />
                <span className="text-[11px] font-semibold text-white">
                  {hoveredEdge.is_layering_path ? 'Layering path' : hoveredEdge.frequency >= highFreqThreshold ? 'High-frequency link' : 'Transaction link'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between gap-6">
                  <span className="text-[11px] text-white/50">Total volume</span>
                  <span className="text-[11px] font-semibold tabular-nums text-white">{formatCurrency(hoveredEdge.volume)}</span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-[11px] text-white/50">Frequency</span>
                  <span className="text-[11px] font-semibold tabular-nums text-white">{hoveredEdge.frequency}× transactions</span>
                </div>
                {hoveredEdge.is_layering_path && (
                  <div className="mt-2 pt-2 border-t border-white/10 text-[11px] leading-relaxed" style={{ color: '#E5376B' }}>
                    Part of detected layering sequence — multiple hops designed to obscure the origin of funds.
                  </div>
                )}
                {hoveredEdge.frequency >= highFreqThreshold && !hoveredEdge.is_layering_path && (
                  <div className="mt-2 pt-2 border-t border-white/10 text-[11px] leading-relaxed" style={{ color: '#F5A800' }}>
                    Unusually high frequency between these entities — potential structuring signal.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cytoscape graph container — mounted via useEffect */}
        <div ref={graphRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}
