'use client';

import { useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import type { Transaction } from '@/types/transaction';
import type { Customer } from '@/types/customer';
import { formatCurrency, formatDate, getRiskColor, FEATURE_LABELS } from '@/lib/utils';

const SEGMENT_LABELS: Record<string, string> = {
  private_wealth: 'Private Wealth',
  corporate_treasury: 'Corporate Treasury',
  correspondent_banking: 'Correspondent Banking',
  retail: 'Retail',
};

interface Props {
  transaction: Transaction;
  customer: Customer;
}

export default function SARGenerator({ transaction, customer }: Props) {
  const [narrative, setNarrative] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Top 3 features by absolute magnitude
  const featureEntries = Object.entries(transaction.ml_features) as [keyof typeof transaction.ml_features, number][];
  featureEntries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const topFeatures = featureEntries.slice(0, 3);
  const topFeatureStrings = topFeatures.map(([k, v]) => `${FEATURE_LABELS[k] || k}: ${v > 0 ? '+' : ''}${v}`);

  const riskColor = getRiskColor(transaction.ml_score);

  async function generateNarrative() {
    setLoading(true);
    setError('');
    setNarrative('');

    try {
      const res = await fetch('/api/sar-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction,
          customer,
          topFeatures: topFeatureStrings,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNarrative(data.narrative || '');
    } catch (err) {
      setError('Narrative generation failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingTop: 48 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#011E41', margin: '0 0 8px' }}>
          SAR Draft Generator
        </h1>

        <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#828282', marginBottom: 16 }}>
          {transaction.id}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#011E41' }}>{customer.name}</span>
          <span style={{
            backgroundColor: '#EEF2FF', color: '#4F46E5',
            padding: '2px 10px', borderRadius: 4, fontSize: 12,
          }}>
            {SEGMENT_LABELS[customer.segment] || customer.segment}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#828282', flexWrap: 'wrap', marginBottom: 16 }}>
          <span>{formatCurrency(transaction.amount)}</span>
          <span style={{ textTransform: 'capitalize', color: transaction.direction === 'outbound' ? '#E5376B' : '#05AB8C' }}>
            {transaction.direction}
          </span>
          <span>{formatDate(transaction.date)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{
            backgroundColor: riskColor + '22',
            color: riskColor,
            padding: '4px 12px',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 700,
          }}>
            ML Score: {transaction.ml_score}
          </span>
          {transaction.rule_fired && (
            <span style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
              {transaction.rule_label || 'Rule Fired'}
            </span>
          )}
        </div>

        {/* Top feature chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {topFeatures.map(([k, v]) => (
            <span
              key={k}
              style={{
                backgroundColor: '#F5A800',
                color: '#011E41',
                padding: '4px 12px',
                borderRadius: 16,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {FEATURE_LABELS[k] || k}: {v > 0 ? '+' : ''}{v}
            </span>
          ))}
        </div>
      </div>

      {/* Generate button */}
      {!narrative && !loading && (
        <button
          onClick={generateNarrative}
          style={{
            width: '100%',
            padding: '14px 0',
            backgroundColor: '#F5A800',
            color: '#011E41',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
            marginBottom: 24,
          }}
        >
          Generate SAR Draft
        </button>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{
          padding: '24px',
          backgroundColor: '#F8F8F8',
          border: '1px solid #E0E0E0',
          borderRadius: 8,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            border: '2px solid #F5A800', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ color: '#828282', fontSize: 14 }}>Generating narrative...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          padding: 16,
          backgroundColor: '#FEE2E2',
          border: '1px solid #FECACA',
          borderRadius: 8,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <span style={{ color: '#DC2626', fontSize: 13 }}>{error}</span>
          <button
            onClick={generateNarrative}
            style={{
              padding: '6px 14px',
              backgroundColor: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Narrative output */}
      {narrative && (
        <>
          <div style={{
            backgroundColor: '#011E41',
            borderRadius: 8,
            padding: 32,
            marginBottom: 16,
          }}>
            <p style={{
              color: 'white',
              fontSize: 15,
              lineHeight: 1.7,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}>
              {narrative}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button
              onClick={copyToClipboard}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px',
                backgroundColor: 'white',
                color: '#011E41',
                border: '1px solid #011E41',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {copied ? <Check size={16} color="#05AB8C" /> : null}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>

            <button
              onClick={generateNarrative}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px',
                backgroundColor: '#F5A800',
                color: '#011E41',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              <RefreshCw size={14} />
              Regenerate
            </button>
          </div>

          <p style={{ color: '#828282', fontSize: 12, margin: 0 }}>
            This narrative is AI-generated and requires review by a qualified BSA officer before submission.
          </p>
        </>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
