'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, flexRender, createColumnHelper, type SortingState,
} from '@tanstack/react-table'
import { TrendingUp, Minus, Search, ChevronUp, ChevronDown, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Customer } from '@/types/customer'
import { formatCurrency, formatDate } from '@/lib/utils'
import ExplainerBanner from '@/components/ui/ExplainerBanner'
import RiskBadge from '@/components/ui/RiskBadge'
import TermTooltip from '@/components/ui/TermTooltip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const SEGMENT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  private_wealth: { bg: '#EEF2FF', color: '#4338CA', label: 'Private Wealth' },
  corporate_treasury: { bg: '#F0FDF4', color: '#15803D', label: 'Corp Treasury' },
  correspondent_banking: { bg: '#FFF7ED', color: '#C2410C', label: 'Correspondent' },
  retail: { bg: '#F0F9FF', color: '#0369A1', label: 'Retail' },
}

const columnHelper = createColumnHelper<Customer>()

export default function CustomerTable({ customers }: { customers: Customer[] }) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'risk_score', desc: true }])
  const [segmentFilter, setSegmentFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [nameSearch, setNameSearch] = useState('')

  const filtered = useMemo(() => customers.filter(c => {
    if (segmentFilter !== 'all' && c.segment !== segmentFilter) return false
    if (riskFilter === 'low' && c.risk_score >= 40) return false
    if (riskFilter === 'medium' && (c.risk_score < 40 || c.risk_score > 70)) return false
    if (riskFilter === 'high' && c.risk_score <= 70) return false
    if (nameSearch && !c.name.toLowerCase().includes(nameSearch.toLowerCase())) return false
    return true
  }), [customers, segmentFilter, riskFilter, nameSearch])

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: info => <span className="font-medium text-[#011E41]">{info.getValue()}</span>,
    }),
    columnHelper.accessor('segment', {
      header: 'Segment',
      cell: info => {
        const seg = SEGMENT_COLORS[info.getValue()]
        return (
          <span style={{ backgroundColor: seg.bg, color: seg.color }} className="px-2 py-0.5 rounded text-xs font-medium">
            {seg.label}
          </span>
        )
      },
    }),
    columnHelper.accessor('peer_group', {
      header: () => (
        <TermTooltip term="Peer Group" definition="Customers in the same segment and behavioral cluster. Anomaly detection compares each transaction against this group's baseline patterns.">
          Peer Group
        </TermTooltip>
      ),
      cell: info => <span className="text-[#828282]">Group {info.getValue()}</span>,
    }),
    columnHelper.accessor('baseline_monthly_volume', {
      header: () => (
        <TermTooltip term="Baseline Volume" definition="The customer's expected monthly transaction volume, established from 90 days of historical activity. Significant deviations from this baseline increase the ML risk score.">
          Baseline Volume
        </TermTooltip>
      ),
      cell: info => <span className="tabular-nums text-right block">{formatCurrency(info.getValue())}</span>,
    }),
    columnHelper.accessor('risk_score', {
      header: 'Risk Score',
      cell: info => <RiskBadge score={info.getValue()} />,
    }),
    columnHelper.display({
      id: 'drift',
      header: () => (
        <TermTooltip term="Drift" definition="Whether this customer's recent behavior is diverging significantly from their own historical baseline. Rising drift scores indicate the customer's activity pattern is changing.">
          Drift
        </TermTooltip>
      ),
      cell: ({ row }) => row.original.risk_score > 70
        ? <TrendingUp size={15} className="text-[#E5376B]" />
        : <Minus size={15} className="text-[#BDBDBD]" />,
    }),
    columnHelper.accessor('last_reviewed', {
      header: 'Last Reviewed',
      cell: info => <span className="text-[#828282]">{formatDate(info.getValue())}</span>,
    }),
    columnHelper.display({
      id: 'action',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={e => { e.stopPropagation(); router.push(`/customers/${row.original.id}`) }}
        >
          View Profile
        </Button>
      ),
    }),
  ], [router])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const clearFilters = () => { setSegmentFilter('all'); setRiskFilter('all'); setNameSearch('') }

  return (
    <div>
      <ExplainerBanner
        title="Customer behavioral profiles — who should be reviewed?"
        insight="Each customer has a behavioral baseline built from 90 days of transaction history. The risk score reflects how far their recent activity has drifted from that baseline and from peers in the same segment. High-drift customers warrant closer examination regardless of whether a static rule fired."
        pillars={[
          {
            icon: Users,
            title: 'Peer Group Benchmarking',
            body: 'Customers are grouped by segment and activity pattern. Outliers within their peer group receive higher scores even if amounts stay below rule thresholds.',
            color: '#0075C9',
          },
          {
            icon: TrendingUp,
            title: 'Behavioral Drift',
            body: 'A rising drift score means the customer\'s behavior is changing — not necessarily malicious, but worth investigating. Drift catches structuring and gradual pattern shifts.',
            color: '#E5376B',
          },
        ]}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Select value={segmentFilter} onValueChange={v => setSegmentFilter(v)}>
          <SelectTrigger className="w-[168px]"><SelectValue placeholder="All Segments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Segments</SelectItem>
            <SelectItem value="private_wealth">Private Wealth</SelectItem>
            <SelectItem value="corporate_treasury">Corp Treasury</SelectItem>
            <SelectItem value="correspondent_banking">Correspondent</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
          </SelectContent>
        </Select>

        <Select value={riskFilter} onValueChange={v => setRiskFilter(v)}>
          <SelectTrigger className="w-[148px]"><SelectValue placeholder="All Risk Levels" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="low">Low · &lt; 40</SelectItem>
            <SelectItem value="medium">Medium · 40–70</SelectItem>
            <SelectItem value="high">High · &gt; 70</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-[260px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#BDBDBD]" />
          <Input
            placeholder="Search customers…"
            value={nameSearch}
            onChange={e => setNameSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <span className="text-xs text-[#828282] ml-auto tabular-nums">{filtered.length} customers</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[#E0E0E0] overflow-hidden shadow-card bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-[#E0E0E0] bg-[#F8F9FB]">
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-[#828282] whitespace-nowrap select-none"
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && <ChevronUp size={12} />}
                      {header.column.getIsSorted() === 'desc' && <ChevronDown size={12} />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-[#BDBDBD]">
                      <Users size={36} strokeWidth={1.5} />
                      <div>
                        <p className="text-sm font-medium text-[#828282]">No customers match your filters</p>
                        <p className="text-xs mt-1">Try adjusting the segment or risk level filter</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <motion.tr
                    key={row.id}
                    layout
                    onClick={() => router.push(`/customers/${row.original.id}`)}
                    className="border-b border-[#F5F5F5] cursor-pointer hover:bg-[#F8F9FB] transition-colors duration-100"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-2.5 text-[#011E41] align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  )
}
