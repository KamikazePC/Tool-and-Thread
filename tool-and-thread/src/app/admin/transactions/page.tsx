"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Download, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { parsePrice } from '@/lib/utils';
import { CurrencyCode, currencySymbols } from '@/lib/currency';
import { useTransactions } from '@/hooks/useTransactions';
import type { Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TransactionsPage() {
  const { transactions, isLoading, isDeleting, removeTransaction } = useTransactions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const handleDelete = async (id: number) => {
    try {
      await removeTransaction(id);
      toast.success('Transaction deleted successfully');
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  const formatReceiptUrl = (transaction: Transaction) => {
    const params = new URLSearchParams();
    params.set('date', transaction.date.toString());
    params.set('buyer', transaction.buyerName);
    params.set('receiptNumber', transaction.receiptNumber);
    params.set('items', transaction.items.map(item => 
      `${item.quantity}x ${item.name} @ ${currencySymbols[transaction.currency as CurrencyCode]}${Number(item.price).toFixed(2)}`
    ).join(','));
    const total = transaction.items.reduce(
      (sum, item) => sum + (Number(item.price) * item.quantity),
      0
    );
    params.set('total', `${currencySymbols[transaction.currency as CurrencyCode]}${total.toFixed(2)}`);
    params.set('currency', transaction.currency);
    return `/receipt/${transaction.id}?${params.toString()}`;
  };

  const currencyTotals = transactions.reduce((acc, transaction) => {
    const total = transaction.items.reduce(
      (sum, item) => sum + (Number(item.price) * item.quantity),
      0
    );
    acc[transaction.currency as CurrencyCode] = (acc[transaction.currency as CurrencyCode] || 0) + total;
    return acc;
  }, {} as Record<CurrencyCode, number>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-800 tracking-tight">Transactions</h1>
        <Link href="/admin/transactions/new">
          <Button className="bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Transaction
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Object.entries(currencyTotals).map(([currency, total]) => (
          <div key={currency} className="p-5 rounded-lg shadow-sm border border-slate-200 bg-white">
            <div className="text-sm font-medium text-slate-500 mb-1">Total in {currency}</div>
            <div className="text-2xl font-bold text-slate-800">
              {currencySymbols[currency as CurrencyCode]}{total.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[180px] text-slate-600">Date</TableHead>
                <TableHead className="text-slate-600">Receipt #</TableHead>
                <TableHead className="text-slate-600">Buyer</TableHead>
                <TableHead className="hidden sm:table-cell text-slate-600">Items</TableHead>
                <TableHead className="text-right text-slate-600">Total</TableHead>
                <TableHead className="text-slate-600">Currency</TableHead>
                <TableHead className="w-[100px] text-slate-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => {
                const formatPrice = (price: string | number) => {
                  const numericPrice = parsePrice(price);
                  const symbol = currencySymbols[transaction.currency as CurrencyCode];
                  return `${symbol}${numericPrice.toFixed(2)}`;
                };

                const items = transaction.items.map(
                  (item) => `${item.quantity}x ${item.name} @ ${formatPrice(item.price)}`
                );

                const total = transaction.items.reduce(
                  (sum, item) => sum + (Number(item.price) * item.quantity),
                  0
                );

                const formattedTotal = formatPrice(total);

                return (
                  <TableRow key={transaction.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="whitespace-nowrap text-slate-700 font-medium">
                      {format(new Date(transaction.date), "MMM d, yyyy, h:mm a")}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      <span 
                        title={transaction.receiptNumber} 
                        className="hover:cursor-help font-medium"
                      >
                        {transaction.receiptNumber.substring(0, 8)}...
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">{transaction.buyerName}</TableCell>
                    <TableCell className="hidden sm:table-cell text-slate-600">
                      {items.map((item, index) => (
                        <div key={index} className="text-sm">{item}</div>
                      ))}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-800">{formattedTotal}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{transaction.currency}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Link href={formatReceiptUrl(transaction)}>
                          <Button variant="ghost" size="icon" className="text-primary-500 hover:text-primary-600 hover:bg-primary-50">
                            <Download className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(transaction.id)}
                          disabled={isDeleting === transaction.id}
                          className="text-error hover:text-white hover:bg-error"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}