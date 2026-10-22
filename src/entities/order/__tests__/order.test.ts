import { describe, expect, it } from 'vitest';
import { getOrders } from '../order';

describe('entities/order', () => {
  it('returns orders with valid ids, amounts and statuses', async () => {
    const orders = await getOrders();
    expect(orders.length).toBeGreaterThan(0);
    for (const order of orders) {
      expect(order.id).toBeTruthy();
      expect(order.amount).toBeGreaterThan(0);
      expect(['pending', 'paid', 'cancelled'] as const).toContain(order.status);
    }
  });
});