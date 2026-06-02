import { generateCustomers, generateTransactions } from './seed';
import type { Transaction } from '@/types/transaction';

let _transactions: Transaction[] | null = null;

function getAll(): Transaction[] {
  if (!_transactions) {
    const customers = generateCustomers();
    _transactions = generateTransactions(customers);
  }
  return _transactions;
}

export function getTransactions(): Transaction[] {
  return getAll();
}

export function getTransactionById(id: string): Transaction | undefined {
  return getAll().find(t => t.id === id);
}

export function getTransactionsByCustomer(customerId: string): Transaction[] {
  return getAll().filter(t => t.customer_id === customerId);
}

export function getTransactionsInLastDays(days: number): Transaction[] {
  const cutoff = new Date('2024-12-01');
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return getAll().filter(t => t.date >= cutoffStr);
}
