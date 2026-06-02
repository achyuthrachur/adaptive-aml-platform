import { getTransactions } from '@/lib/data/transactions';
import { getCustomers } from '@/lib/data/customers';
import ComparisonPanel from '@/components/features/ComparisonPanel/ComparisonPanel';

export default function ComparisonPage() {
  const transactions = getTransactions();
  const customers = getCustomers();
  const customerMap = Object.fromEntries(customers.map(c => [c.id, c]));

  const rulesOnlyCount = transactions.filter(t => t.rule_fired && t.ml_score <= 70).length;
  const confirmedBothCount = transactions.filter(t => t.rule_fired && t.ml_score > 70).length;
  const modelOnlyCount = transactions.filter(t => !t.rule_fired && t.ml_score > 70).length;

  const totalFlagged = rulesOnlyCount + confirmedBothCount + modelOnlyCount;
  const agreementRate = totalFlagged > 0 ? Math.round((confirmedBothCount / totalFlagged) * 100) : 0;

  return (
    <ComparisonPanel
      transactions={transactions}
      customerMap={customerMap}
      rulesOnlyCount={rulesOnlyCount}
      confirmedBothCount={confirmedBothCount}
      modelOnlyCount={modelOnlyCount}
      agreementRate={agreementRate}
    />
  );
}
