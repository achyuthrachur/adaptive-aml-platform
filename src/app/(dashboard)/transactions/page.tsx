import { Suspense } from 'react';
import { getTransactions } from '@/lib/data/transactions';
import { getCustomers } from '@/lib/data/customers';
import TransactionScorer from '@/components/features/TransactionScorer/TransactionScorer';

export default function TransactionsPage() {
  const transactions = getTransactions();
  const customers = getCustomers();
  const customerMap = Object.fromEntries(customers.map(c => [c.id, c]));

  return (
    <Suspense fallback={<div style={{ padding: 32, color: '#828282' }}>Loading transactions...</div>}>
      <TransactionScorer transactions={transactions} customerMap={customerMap} />
    </Suspense>
  );
}
