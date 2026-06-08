'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, flexRender, createColumnHelper, type SortingState,
} from '@tanstack/react-table'
import { TrendingUp, Minus, Search, ChevronUp, ChevronDown, Users, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Customer } from '@/types/customer'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const SEGMENT_META: Record<string, { label: string; color: string; bg: string }> = {
  private_wealth:       { label: 'Private Wealth',  color: '#4338CA', bg: '#EEF2FF' },
  corporate_treasury:   { label: 'Corp Treasury',   color: '#15803D', bg: '#F0FDF4' },
  correspondent_banking:{ label: 'Correspondent',   color: '#C2410C', bg: '#FFF7ED' },
  retail:               { label: 'Retail',           color: '#0369A1', bg: '#F0F9FF' },
}

function riskMeta(score: number) {
  if (score > 70) return { color: '#E5376B', bg: 'rgba(229,55,107,0.08)', border: '#E5376B' }
  if (score >= 40) return { color: '#F5A800', bg: 'rgba(245,168,0,0.08)', border: '#F5A800' }
  return { color: '#05AB8C', bg: 'rgba(5,171,140,0.06)', border: '#05AB8C' }
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

  // Risk distribution counts
  const riskCounts = useMemo(() => ({
    high: filtered.filter(c => c.risk_score > 70).length,
    medium: filtered.filter(c => c.risk_score >= 40 && c.risk_score <= 70).length,
    low: filtered.filter(c => c.risk_score < 40).length,
  }), [filtered])

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Customer',
      cell: info => {
        const c = info.row.original
        const rm = riskMeta(c.risk_score)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: rm.bg, color: rm.color, border: `1px solid ${rm.border}30` }}>
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-[#011E41]">{c.name}</div>
              <div className="text-xs text-[#828282]">{SEGMENT_META[c.segment]?.label}</div>
            </div>
          </div>
        )
      },
    }),
    columnHelper.accessor('peer_group', {
      header: 'Group',
      cell: info => <span className="text-sm text-[#828282]">G{info.getValue()}</span>,
    }),
    columnHelper.accessor('baseline_monthly_volume', {
      header: 'Baseline Vol.',
      cell: info => <span className="tabular-nums text-sm font-medium text-[#011E41]">{formatCurrency(info.getValue())}</span>,
    }),
    columnHelper.accessor('risk_score', {
      header: 'Risk Score',
      cell: info => {
        const score = info.getValue()
        const rm = riskMeta(score)
        return (
          <div className="flex items-center gap-2.5">
            <div className="h-1.5 w-20 rounded-full overflow-hidden bg-[#F0F0F0]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                className="h-full rounded-full"
                style={{ backgroundColor: rm.color }}
              />
            </div>
            <span className="tabular-nums text-sm font-bold w-8" style={{ color: rm.color }}>{score}</span>
          </div>
        )
      },
    }),
    columnHelper.display({
      id: 'drift',
      header: 'Drift',
      cell: ({ row }) => row.original.risk_score > 70
        ? <div className="flex items-center gap-1 text-[#E5376B]"><TrendingUp size={13} /><span className="text-xs font-medium">Rising</span></div>
        : <div className="flex items-center gap-1 text-[#BDBDBD]"><Minus size={13} /><span className="text-xs">Stable</span></div>,
    }),
    columnHelper.accessor('last_reviewed', {
      header: 'Last Review',
      cell: info => <span className="text-sm text-[#828282]">{formatDate(info.getValue())}</span>,
    }),
    columnHelper.display({
      id: 'action',
      header: '',
      cell: ({ row }) => (
        <motion.button
          whileHover={{ x: 2 }}
          onClick={e => { e.stopPropagation(); router.push(`/customers/${row.original.id}`) }}
          className="flex items-center gap-1 text-xs font-medium text-[#0075C9] hover:text-[#0050AD] transition-colors"
        >
          Profile <ArrowRight size={11} />
        </motion.button>
      ),
    }),
  ], [router])

  const table = useReactTable({
    data: filtered, columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-4">
      {/* Risk distribution summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'High Risk', count: riskCounts.high, color: '#E5376B', bg: 'rgba(229,55,107,0.08)', desc: 'Score > 70 · immediate review' },
          { label: 'Medium Risk', count: riskCounts.medium, color: '#F5A800', bg: 'rgba(245,168,0,0.08)', desc: 'Score 40–70 · monitor closely' },
          { label: 'Low Risk', count: riskCounts.low, color: '#05AB8C', bg: 'rgba(5,171,140,0.06)', desc: 'Score < 40 · routine' },
        ].map((band, i) => (
          <motion.div
            key={band.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border p-4"
            style={{ borderColor: band.color + '30', backgroundColor: band.bg }}
          >
            <div className="flex items-end justify-between">
              <div>
                <div className="tabular-nums font-bold leading-none mb-1" style={{ fontSize: 32, color: band.color }}>{band.count}</div>
                <div className="text-sm font-semibold text-[#011E41]">{band.label}</div>
                <div className="text-xs text-[#828282] mt-0.5">{band.desc}</div>
              </div>
              <div className="text-sm font-medium tabular-nums text-[#828282]">
                {filtered.length > 0 ? Math.round((band.count / filtered.length) * 100) : 0}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
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
          <Input placeholder="Search customers…" value={nameSearch} onChange={e => setNameSearch(e.target.value)} className="pl-8" />
        </div>
        <span className="text-xs text-[#828282] ml-auto tabular-nums">{filtered.length} customers</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E0E0E0] overflow-hidden shadow-card bg-white">
        <table className="w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="bg-[#F8F9FB] border-b-2 border-[#E0E0E0]">
                {hg.headers.map(header => (
                  <th key={header.id} onClick={header.column.getToggleSortingHandler()}
                    className="px-4 py-3 text-left text-xs font-semibold text-[#828282] whitespace-nowrap select-none"
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}>
                    <div className="flex items-center gap-1.5">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && <ChevronUp size={11} />}
                      {header.column.getIsSorted() === 'desc' && <ChevronDown size={11} />}
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
                        <p className="text-sm font-medium text-[#828282]">No customers match filters</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => { setSegmentFilter('all'); setRiskFilter('all'); setNameSearch('') }}>
                        Clear Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, idx) => {
                  const rm = riskMeta(row.original.risk_score)
                  return (
                    <motion.tr
                      key={row.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                      onClick={() => router.push(`/customers/${row.original.id}`)}
                      className="border-b border-[#F5F5F5] cursor-pointer hover:bg-[#F8F9FB] transition-colors duration-100 group"
                      style={{ borderLeft: `3px solid ${rm.border}` }}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-4 py-3 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  )
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  )
}
