import { notFound } from 'next/navigation';
import { getTransactionById } from '@/lib/data/transactions';
import { getCustomerById } from '@/lib/data/customers';
import SARGenerator from '@/components/features/SARGenerator/SARGenerator';

export default function SARPage({ params }: { params: { transaction_id: string } }) {
  const transaction = getTransactionById(params.transaction_id);
  if (!transaction) notFound();

  const customer = getCustomerById(transaction.customer_id);
  if (!customer) notFound();

  return <SARGenerator transaction={transaction} customer={customer} />;
}
