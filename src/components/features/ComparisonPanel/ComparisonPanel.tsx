'use client';

import { useRef, useEffect, useState } from 'react';
import type { Transaction } from '@/types/transaction';
import type { Customer } from '@/types/customer';
import { formatCurrency, getRiskColor, FEATURE_LABELS } from '@/lib/utils';

interface Props {
  transactions: Transaction[];
  customerMap: Record<string, Customer>;
  rulesOnlyCount: number;
  confirmedBothCount: number;
  modelOnlyCount: number;
  agreementRate: number;
}

export default function ComparisonPanel({
  transactions,
  customerMap,
  rulesOnlyCount,
  confirmedBothCount,
  modelOnlyCount,
  agreementRate,
}: Props) {
  const rulesTx = transactions.filter(t => t.rule_fired);
  const modelTx = transactions.filter(t => t.ml_score > 70);

  const rulesListRef = useRef<HTMLDivElement>(null);
  const modelListRef = useRef<HTMLDivElement>(null);

  // IDs in both columns
  const bothIds = new Set(
    rulesTx.filter(t => t.ml_score > 70).map(t => t.id)
  );

  // Row height for connector lines (approximate)
  const ROW_HEIGHT = 44;

  // Track row positions for SVG connector lines
  const [connectors, setConnectors] = useState<{ y1: number; y2: number }[]>([]);

  useEffect(() => {
    // Build connector positions based on DOM
    const lines: { y1: number; y2: number }[] = [];
    if (!rulesListRef.current || !modelListRef.current) return;

    const rulesRows = rulesListRef.current.querySelectorAll('[data-txid]');
    const modelRows = modelListRef.current.querySelectorAll('[data-txid]');

    const rulesRect = rulesListRef.current.getBoundingClientRect();
    const modelRect = modelListRef.current.getBoundingClientRect();

    for (const ruleRow of Array.from(rulesRows)) {
      const txId = ruleRow.getAttribute('data-txid');
      if (!txId || !bothIds.has(txId)) continue;

      const modelRow = modelListRef.current.querySelector(`[data-txid="${txId}"]`);
      if (!modelRow) continue;

      const rr = ruleRow.getBoundingClientRect();
      const mr = modelRow.getBoundingClientRect();

      lines.push({
        y1: rr.top - rulesRect.top + rr.height / 2,
        y2: mr.top - modelRect.top + mr.height / 2,
      });
    }

    setConnectors(lines);
  }, [transactions]); // eslint-disable-line react-hooks/exhaustive-deps

  const ruleFalsePosCount = rulesTx.filter(t => !t.is_true_positive).length;
  const modelOnlyInList = modelTx.filter(t => !t.rule_fired).length;

  return (
    <div>
      {/* Summary stats bar */}
      <div style={{
        backgroundColor: '#011E41',
        borderRadius: 8,
        padding: '16px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 24,
      }}>
        <StatItem value={rulesOnlyCount.toString()} label="Rules-Only Alerts" sublabel="Est. false positives" color="#F5A800" />
        <StatItem value={confirmedBothCount.toString()} label="Confirmed by Both" sublabel="High confidence" color="#05AB8C" />
        <StatItem value={modelOnlyCount.toString()} label="Model-Only Detections" sublabel="Rules missed these" color="#0075C9" />
        <StatItem value={`${agreementRate}%`} label="Agreement Rate" sublabel="Rules + model overlap" color="white" />
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, position: 'relative' }}>
        {/* Left — Rules */}
        <div style={{ border: '1px solid #E0E0E0', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #E0E0E0', backgroundColor: '#F8F8F8' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#011E41' }}>Static Rules Engine</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#828282' }}>
              Threshold-based, jurisdiction-flagged, amount-triggered
            </p>
          </div>

          <div ref={rulesListRef} style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
            {rulesTx.map(tx => {
              const customer = customerMap[tx.customer_id];
              const isFalsePos = !tx.is_true_positive;
              const isConfirmed = tx.ml_score > 70;

              let rowBg = 'white';
              if (isFalsePos) rowBg = 'rgba(245,168,0,0.15)';
              if (isConfirmed) rowBg = 'rgba(5,171,140,0.1)';

              return (
                <div
                  key={tx.id}
                  data-txid={tx.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 16px',
                    borderBottom: '1px solid #F5F5F5',
                    backgroundColor: rowBg,
                    fontSize: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, color: '#011E41', marginBottom: 2 }}>
                      {customer?.name || tx.customer_id}
                    </div>
                    <div style={{ color: '#828282', fontSize: 11 }}>{tx.rule_label}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: '#011E41' }}>{formatCurrency(tx.amount)}</div>
                    {isFalsePos && !isConfirmed && (
                      <div style={{ fontSize: 10, color: '#F5A800' }}>Est. FP</div>
                    )}
                    {isConfirmed && (
                      <div style={{ fontSize: 10, color: '#05AB8C' }}>Confirmed</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid #E0E0E0',
            backgroundColor: '#F8F8F8',
            fontSize: 12,
            color: '#E5376B',
            fontWeight: 500,
          }}>
            {ruleFalsePosCount} of {rulesTx.length} alerts estimated false positive
          </div>
        </div>

        {/* Right — Model */}
        <div style={{ border: '1px solid #E0E0E0', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #E0E0E0', backgroundColor: '#F8F8F8' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#011E41' }}>Adaptive Behavioral Model</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#828282' }}>
              Peer group baseline, behavioral drift, feature attribution
            </p>
          </div>

          <div ref={modelListRef} style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
            {modelTx.map(tx => {
              const customer = customerMap[tx.customer_id];
              const isModelOnly = !tx.rule_fired;

              // Top feature
              const featureEntries = Object.entries(tx.ml_features) as [keyof typeof tx.ml_features, number][];
              featureEntries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
              const topFeature = FEATURE_LABELS[featureEntries[0]?.[0]] || '';

              return (
                <div
                  key={tx.id}
                  data-txid={tx.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 16px',
                    borderBottom: '1px solid #F5F5F5',
                    backgroundColor: isModelOnly ? 'rgba(5,171,140,0.15)' : 'white',
                    fontSize: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, color: '#011E41', marginBottom: 2 }}>
                      {customer?.name || tx.customer_id}
                    </div>
                    <div style={{ color: '#828282', fontSize: 11 }}>{topFeature}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: '#011E41' }}>{formatCurrency(tx.amount)}</div>
                      {isModelOnly && <div style={{ fontSize: 10, color: '#05AB8C' }}>Model only</div>}
                    </div>
                    <span style={{
                      backgroundColor: getRiskColor(tx.ml_score) + '22',
                      color: getRiskColor(tx.ml_score),
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      minWidth: 36,
                      textAlign: 'center',
                    }}>
                      {tx.ml_score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid #E0E0E0',
            backgroundColor: '#F8F8F8',
            fontSize: 12,
            color: '#05AB8C',
            fontWeight: 500,
          }}>
            {modelOnlyInList} risks identified not caught by rules
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({
  value,
  label,
  sublabel,
  color,
}: {
  value: string;
  label: string;
  sublabel: string;
  color: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'white', fontWeight: 500, marginTop: 6 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{sublabel}</div>
    </div>
  );
}
