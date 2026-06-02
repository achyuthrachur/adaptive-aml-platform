'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MousePointerClick, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Transaction } from '@/types/transaction';
import type { Customer } from '@/types/customer';
import { formatCurrency, formatDate, getRiskColor, FEATURE_LABELS, FEATURE_DESCRIPTIONS } from '@/lib/utils';

const SEGMENT_LABELS: Record<string, string> = {
  private_wealth: 'Private Wealth',
  corporate_treasury: 'Corp Treasury',
  correspondent_banking: 'Correspondent',
  retail: 'Retail',
};

const PAGE_SIZE = 20;

interface Props {
  transactions: Transaction[];
  customerMap: Record<string, Customer>;
}

export default function TransactionScorer({ transactions, customerMap }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('selected');

  const [segmentFilter, setSegmentFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [ruleFiredFilter, setRuleFiredFilter] = useState('all');
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [page, setPage] = useState(0);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const selectedRowRef = useRef<HTMLTableRowElement>(null);

  const filtered = transactions.filter(tx => {
    const customer = customerMap[tx.customer_id];
    if (segmentFilter !== 'all' && customer?.segment !== segmentFilter) return false;
    if (directionFilter !== 'all' && tx.direction !== directionFilter) return false;
    if (ruleFiredFilter === 'yes' && !tx.rule_fired) return false;
    if (ruleFiredFilter === 'no' && tx.rule_fired) return false;
    if (tx.ml_score < scoreRange[0] || tx.ml_score > scoreRange[1]) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Auto-select from query param
  useEffect(() => {
    if (selectedId) {
      const tx = transactions.find(t => t.id === selectedId);
      if (tx) {
        setSelectedTx(tx);
        // Find which page
        const idx = filtered.findIndex(t => t.id === selectedId);
        if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE));
      }
    }
  }, [selectedId, transactions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to selected row
  useEffect(() => {
    if (selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedTx]);

  const handleSelect = useCallback((tx: Transaction) => {
    setSelectedTx(tx);
    router.push(`/transactions?selected=${tx.id}`, { scroll: false });
  }, [router]);

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px',
    border: '1px solid #E0E0E0',
    borderRadius: 6,
    fontSize: 12,
    fontFamily: 'Arial, sans-serif',
    backgroundColor: 'white',
    color: '#011E41',
  };

  return (
    <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 56px - 64px)', minHeight: 0 }}>
      {/* Left panel */}
      <div style={{
        width: 420,
        minWidth: 420,
        borderRight: '1px solid #E0E0E0',
        display: 'flex',
        flexDirection: 'column',
        paddingRight: 24,
        overflow: 'hidden',
      }}>
        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #F0F0F0' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select value={segmentFilter} onChange={e => { setSegmentFilter(e.target.value); setPage(0); }} style={selectStyle}>
              <option value="all">All Segments</option>
              <option value="private_wealth">Private Wealth</option>
              <option value="corporate_treasury">Corp Treasury</option>
              <option value="correspondent_banking">Correspondent</option>
              <option value="retail">Retail</option>
            </select>
            <select value={directionFilter} onChange={e => { setDirectionFilter(e.target.value); setPage(0); }} style={selectStyle}>
              <option value="all">All Directions</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
            <select value={ruleFiredFilter} onChange={e => { setRuleFiredFilter(e.target.value); setPage(0); }} style={selectStyle}>
              <option value="all">All Rules</option>
              <option value="yes">Rule Fired</option>
              <option value="no">No Rule</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#828282', whiteSpace: 'nowrap' }}>Score:</span>
            <input type="range" min={0} max={100} value={scoreRange[0]}
              onChange={e => setScoreRange([Number(e.target.value), scoreRange[1]])}
              style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: '#011E41', minWidth: 24 }}>{scoreRange[0]}</span>
            <input type="range" min={0} max={100} value={scoreRange[1]}
              onChange={e => setScoreRange([scoreRange[0], Number(e.target.value)])}
              style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: '#011E41', minWidth: 24 }}>{scoreRange[1]}</span>
          </div>
          <span style={{ fontSize: 11, color: '#828282' }}>{filtered.length} transactions</span>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
              <tr style={{ borderBottom: '2px solid #E0E0E0' }}>
                {['Date', 'Customer', 'Amount', 'Jurisdiction', 'Rule', 'Score'].map(h => (
                  <th key={h} style={{ padding: '8px 8px', textAlign: 'left', fontSize: 11, color: '#828282', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(tx => {
                const isSelected = selectedTx?.id === tx.id;
                const customer = customerMap[tx.customer_id];
                return (
                  <tr
                    key={tx.id}
                    ref={isSelected ? selectedRowRef : null}
                    onClick={() => handleSelect(tx)}
                    style={{
                      borderBottom: '1px solid #F5F5F5',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(245,168,0,0.15)' : 'white',
                      borderLeft: isSelected ? '3px solid #F5A800' : '3px solid transparent',
                      transition: 'background-color 0.1s',
                    }}
                  >
                    <td style={{ padding: '7px 8px', whiteSpace: 'nowrap' }}>{tx.date}</td>
                    <td style={{ padding: '7px 8px', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {customer?.name || tx.customer_id}
                    </td>
                    <td style={{ padding: '7px 8px', whiteSpace: 'nowrap' }}>{formatCurrency(tx.amount)}</td>
                    <td style={{ padding: '7px 8px', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.counterparty_jurisdiction}
                    </td>
                    <td style={{ padding: '7px 8px' }}>
                      {tx.rule_fired
                        ? <span style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>Fired</span>
                        : <span style={{ backgroundColor: '#F3F4F6', color: '#6B7280', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>Clear</span>
                      }
                    </td>
                    <td style={{ padding: '7px 8px' }}>
                      <span style={{ color: getRiskColor(tx.ml_score), fontWeight: 700 }}>{tx.ml_score}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #F0F0F0' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ background: 'none', border: 'none', cursor: page === 0 ? 'not-allowed' : 'pointer', color: page === 0 ? '#BDBDBD' : '#011E41' }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: 12, color: '#828282' }}>Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            style={{ background: 'none', border: 'none', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', color: page >= totalPages - 1 ? '#BDBDBD' : '#011E41' }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, paddingLeft: 24, overflowY: 'auto' }}>
        {!selectedTx ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#BDBDBD', gap: 12 }}>
            <MousePointerClick size={40} />
            <span style={{ fontSize: 14 }}>Select a transaction to view score detail</span>
          </div>
        ) : (
          <TransactionDetail tx={selectedTx} customer={customerMap[selectedTx.customer_id]} />
        )}
      </div>
    </div>
  );
}

function TransactionDetail({ tx, customer }: { tx: Transaction; customer?: Customer }) {
  const router = useRouter();
  const riskColor = getRiskColor(tx.ml_score);

  const features = Object.entries(tx.ml_features) as [keyof typeof tx.ml_features, number][];
  const sortedFeatures = [...features].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const maxMagnitude = Math.max(...features.map(([, v]) => Math.abs(v)));

  // Top 2 positive features by magnitude
  const positiveFeatures = sortedFeatures.filter(([, v]) => v > 0).slice(0, 2);

  // Plain English summary
  const corridorNegative = tx.ml_features.corridor_familiarity < 0;
  const summary = buildSummary(tx, positiveFeatures.map(([k]) => FEATURE_LABELS[k] || k), corridorNegative);

  return (
    <div style={{ maxWidth: 580 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#828282', marginBottom: 8 }}>
          {tx.id.substring(0, 11)}...
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          {customer && (
            <>
              <span style={{ fontWeight: 600, fontSize: 15, color: '#011E41' }}>{customer.name}</span>
              <span style={{
                backgroundColor: '#EEF2FF', color: '#4F46E5',
                padding: '1px 8px', borderRadius: 4, fontSize: 11,
              }}>
                {SEGMENT_LABELS[customer.segment] || customer.segment}
              </span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#828282', flexWrap: 'wrap' }}>
          <span>{formatCurrency(tx.amount)}</span>
          <span style={{ color: tx.direction === 'outbound' ? '#E5376B' : '#05AB8C', textTransform: 'capitalize' }}>{tx.direction}</span>
          <span>{formatDate(tx.date)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 700, color: riskColor, lineHeight: 1 }}>
            {tx.ml_score}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#828282' }}>ML Risk Score</span>
            {tx.rule_fired && (
              <span style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                {tx.rule_label || 'Rule Fired'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SHAP bars */}
      <div style={{ border: '1px solid #E0E0E0', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: '#011E41' }}>
          Feature Attribution
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sortedFeatures.map(([key, value]) => {
            const isPositive = value >= 0;
            const barWidthPct = maxMagnitude > 0 ? (Math.abs(value) / maxMagnitude) * 45 : 0;

            return (
              <div key={key}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#011E41', minWidth: 160 }}>
                    {FEATURE_LABELS[key] || key}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#828282', marginBottom: 6 }}>
                  {FEATURE_DESCRIPTIONS[key] || ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  {/* Negative side */}
                  <div style={{ width: '45%', display: 'flex', justifyContent: 'flex-end' }}>
                    {!isPositive && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 11, color: '#05AB8C', fontWeight: 600 }}>{value}</span>
                        <div style={{ width: barWidthPct + '%', minWidth: 4, height: 16, backgroundColor: '#05AB8C', borderRadius: '3px 0 0 3px' }} />
                      </div>
                    )}
                  </div>
                  {/* Center line */}
                  <div style={{ width: 2, height: 20, backgroundColor: '#E0E0E0', margin: '0 1px' }} />
                  {/* Positive side */}
                  <div style={{ width: '45%' }}>
                    {isPositive && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: barWidthPct + '%', minWidth: 4, height: 16, backgroundColor: '#E5376B', borderRadius: '0 3px 3px 0' }} />
                        <span style={{ fontSize: 11, color: '#E5376B', fontWeight: 600 }}>+{value}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div style={{
        backgroundColor: '#F8F9FA',
        border: '1px solid #E0E0E0',
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
        fontSize: 13,
        lineHeight: 1.6,
        color: '#444',
      }}>
        {summary}
      </div>

      {/* SAR button */}
      {tx.ml_score > 70 && (
        <button
          onClick={() => router.push(`/sar/${tx.id}`)}
          style={{
            width: '100%',
            padding: '12px 0',
            backgroundColor: '#F5A800',
            color: '#011E41',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          Generate SAR Draft →
        </button>
      )}
    </div>
  );
}

function buildSummary(tx: Transaction, topPositiveFeatures: string[], corridorNegative: boolean): string {
  let text = `This transaction received a score of ${tx.ml_score} out of 100.`;

  if (topPositiveFeatures.length > 0) {
    text += ` The primary risk drivers were ${topPositiveFeatures.join(' and ')}.`;
  }

  if (corridorNegative) {
    text += ' The counterparty jurisdiction is consistent with this customer\'s historical activity, which reduced the score.';
  }

  if (tx.rule_fired && !tx.is_true_positive) {
    text += ' A static rule was triggered on this transaction, but behavioral analysis suggests this is likely a false positive.';
  }

  return text;
}
