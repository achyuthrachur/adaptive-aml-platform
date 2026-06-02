import { getCustomers } from '@/lib/data/customers';
import CustomerTable from '@/components/features/CustomerProfile/CustomerTable';

export default function CustomersPage() {
  const customers = getCustomers();
  return <CustomerTable customers={customers} />;
}
