import { CurrencyCode } from '@/lib/currency';

export interface Item {
  id: number;
  name: string;
  price: string;
  quantity: number;
}

export interface Transaction {
  id: number;
  buyerName: string;
  items: Item[];
  currency: CurrencyCode;
  date: string;
  total: string;
}
