import { CurrencyCode } from '@/lib/currency';
import type { Transaction as PrismaTransaction, Item as PrismaItem } from '@prisma/client';

export interface Item {
  id: number;
  name: string;
  price: string;
  quantity: number;
}

export interface Transaction {
  id: number;
  receiptNumber: string;
  buyerName: string;
  date: string;
  items: Item[];
  total: string;
  currency: CurrencyCode;
  userId: string;
}

// Helper function to convert Prisma types to our interface types
export function formatTransaction(transaction: PrismaTransaction & { items: PrismaItem[] }): Transaction {
  return {
    id: transaction.id,
    // Use a default receipt number if missing
    receiptNumber: (transaction as { receiptNumber?: string }).receiptNumber || `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    buyerName: transaction.buyerName,
    date: transaction.date.toISOString(),
    total: transaction.total.toString(),
    currency: transaction.currency as CurrencyCode,
    userId: transaction.userId,
    items: transaction.items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price.toString(),
      quantity: item.quantity
    }))
  };
}