'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { TrendingUp, Minus, Search, ChevronUp, ChevronDown } from 'lucide-react';
import type { Customer } from '@/types/customer';
import { formatCurrency, formatDate, getRiskColor } from '@/lib/utils';

const SEGMENT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  private_wealth: { bg: '#EEF2FF', color: '#4F46E5', label: 'Private Wealth' },
  corporate_treasury: { bg: '#F0FDF4', color: '#15803D', label: 'Corp Treasury' },
  correspondent_banking: { bg: '#FFF7ED', color: '#C2410C', label: 'Correspondent' },
  retail: { bg: '#F0F9FF', color: '#0369A1', label: 'Retail' },
};

const columnHelper = createColumnHelper<Customer>();

export default function CustomerTable({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'risk_score', desc: true }]);
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [nameSearch, setNameSearch] = useState('');

  const filtered = useMemo(() => {
    return customers.filter(c => {
      if (segmentFilter !== 'all' && c.segment !== segmentFilter) return false;
      if (riskFilter === 'low' && c.risk_score >= 40) return false;
      if (riskFilter === 'medium' && (c.risk_score < 40 || c.risk_score > 70)) return false;
      if (riskFilter === 'high' && c.risk_score <= 70) return false;
      if (nameSearch && !c.name.toLowerCase().includes(nameSearch.toLowerCase())) return false;
      return true;
    });
  }, [customers, segmentFilter, riskFilter, nameSearch]);

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: info => <span style={{ fontWeight: 500 }}>{info.getValue()}</span>,
    }),
    columnHelper.accessor('segment', {
      header: 'Segment',
      cell: info => {
        const seg = SEGMENT_COLORS[info.getValue()];
        return (
          <span style={{ backgroundColor: seg.bg, color: seg.color, padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500 }}>
            {seg.label}
          </span>
        );
      },
    }),
    columnHelper.accessor('peer_group', {
      header: 'Peer Group',
      cell: info => <span style={{ textAlign: 'center', display: 'block' }}>Group {info.getValue()}</span>,
    }),
    columnHelper.accessor('baseline_monthly_volume', {
      header: 'Baseline Volume',
      cell: info => <span style={{ display: 'block', textAlign: 'right' }}>{formatCurrency(info.getValue())}</span>,
    }),
    columnHelper.accessor('risk_score', {
      header: 'Risk Score',
      cell: info => {
        const score = info.getValue();
        const color = getRiskColor(score);
        return (
          <span style={{ backgroundColor: color + '22', color, padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
            {score}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'drift',
      header: 'Drift',
      cell: ({ row }) => {
        const score = row.original.risk_score;
        if (score > 70) return <TrendingUp size={16} color="#E5376B" />;
        return <Minus size={16} color="#BDBDBD" />;
      },
    }),
    columnHelper.accessor('last_reviewed', {
      header: 'Last Reviewed',
      cell: info => formatDate(info.getValue()),
    }),
    columnHelper.display({
      id: 'action',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/customers/${row.original.id}`); }}
          style={{
            padding: '4px 12px',
            backgroundColor: '#011E41',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          View Profile
        </button>
      ),
    }),
  ], [router]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const selectStyle: React.CSSProperties = {
    padding: '6px 12px',
    border: '1px solid #E0E0E0',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: 'Arial, sans-serif',
    backgroundColor: 'white',
    color: '#011E41',
    cursor: 'pointer',
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={segmentFilter} onChange={e => setSegmentFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Segments</option>
          <option value="private_wealth">Private Wealth</option>
          <option value="corporate_treasury">Corporate Treasury</option>
          <option value="correspondent_banking">Correspondent Banking</option>
          <option value="retail">Retail</option>
        </select>

        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Risk Levels</option>
          <option value="low">Low (&lt;40)</option>
          <option value="medium">Medium (40–70)</option>
          <option value="high">High (&gt;70)</option>
        </select>

        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#828282' }} />
          <input
            type="text"
            placeholder="Search customers..."
            value={nameSearch}
            onChange={e => setNameSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 12px 6px 32px',
              border: '1px solid #E0E0E0',
              borderRadius: 6,
              fontSize: 13,
              fontFamily: 'Arial, sans-serif',
              outline: 'none',
            }}
          />
        </div>

        <span style={{ color: '#828282', fontSize: 13, marginLeft: 'auto' }}>
          {filtered.length} customers
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', border: '1px solid #E0E0E0', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif' }}>
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} style={{ backgroundColor: '#F8F8F8', borderBottom: '1px solid #E0E0E0' }}>
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#828282',
                      cursor: header.column.getCanSort() ? 'pointer' : 'default',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                onClick={() => router.push(`/customers/${row.original.id}`)}
                style={{
                  borderBottom: '1px solid #F0F0F0',
                  cursor: 'pointer',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#F8FAFF'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'white'; }}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} style={{ padding: '10px 16px', fontSize: 13, color: '#011E41', verticalAlign: 'middle' }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
