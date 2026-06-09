import { notFound } from 'next/navigation';
import { getCustomerById, getPeerGroupCustomers } from '@/lib/data/customers';
import { getTransactionsByCustomer } from '@/lib/data/transactions';
import CustomerProfileClient from '@/components/features/CustomerProfile/CustomerProfileClient';

export default function CustomerProfilePage({ params }: { params: { id: string } }) {
  const customer = getCustomerById(params.id);
  if (!customer) notFound();

  const peerCustomers = getPeerGroupCustomers(customer.segment, customer.peer_group);
  const transactions = getTransactionsByCustomer(customer.id);
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  // Peer group stats — guard against empty peer group to avoid NaN/division-by-zero
  const peerCount = Math.max(peerCustomers.length, 1);
  const peerAvgVolume = Math.round(peerCustomers.reduce((s, c) => s + c.baseline_monthly_volume, 0) / peerCount);
  const peerAvgTx = Math.round(peerCustomers.reduce((s, c) => s + c.baseline_transaction_count, 0) / peerCount);

  const volumeDelta = peerAvgVolume > 0 ? Math.round(((customer.baseline_monthly_volume - peerAvgVolume) / peerAvgVolume) * 100) : 0;
  const txDelta = peerAvgTx > 0 ? Math.round(((customer.baseline_transaction_count - peerAvgTx) / peerAvgTx) * 100) : 0;

  return (
    <CustomerProfileClient
      customer={customer}
      transactions={transactions}
      peerGroupSize={peerCustomers.length}
      peerAvgVolume={peerAvgVolume}
      peerAvgTx={peerAvgTx}
      volumeDelta={volumeDelta}
      txDelta={txDelta}
    />
  );
}
