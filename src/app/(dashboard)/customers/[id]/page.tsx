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

  // Peer group stats
  const peerAvgVolume = Math.round(peerCustomers.reduce((s, c) => s + c.baseline_monthly_volume, 0) / peerCustomers.length);
  const peerAvgTx = Math.round(peerCustomers.reduce((s, c) => s + c.baseline_transaction_count, 0) / peerCustomers.length);

  const volumeDelta = Math.round(((customer.baseline_monthly_volume - peerAvgVolume) / peerAvgVolume) * 100);
  const txDelta = Math.round(((customer.baseline_transaction_count - peerAvgTx) / peerAvgTx) * 100);

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
