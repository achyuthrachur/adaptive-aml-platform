import { generateCustomers } from './seed';
import type { Customer } from '@/types/customer';

let _customers: Customer[] | null = null;

export function getCustomers(): Customer[] {
  if (!_customers) {
    _customers = generateCustomers();
  }
  return _customers;
}

export function getCustomerById(id: string): Customer | undefined {
  return getCustomers().find(c => c.id === id);
}

export function getCustomersBySegment(segment: Customer['segment']): Customer[] {
  return getCustomers().filter(c => c.segment === segment);
}

export function getPeerGroupCustomers(segment: Customer['segment'], peer_group: number): Customer[] {
  return getCustomers().filter(c => c.segment === segment && c.peer_group === peer_group);
}
