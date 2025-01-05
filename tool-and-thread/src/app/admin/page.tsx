"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Download, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { parsePrice } from '@/lib/utils';
import { CurrencyCode, currencySymbols } from '@/lib/currency';
import { useTransactions } from '@/hooks/useTransactions';
import type { Transaction } from '@/types';
import TransactionForm from '@/components/TransactionForm';
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

export default function AdminPage() {
  const { transactions, isLoading, isDeleting, removeTransaction } = useTransactions();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

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

  const handleSubmit = async (data: { buyerName: string; items: Array<{ name: string; price: number; quantity: number }>; currency: CurrencyCode }) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyerName: data.buyerName,
          items: data.items.map(item => ({
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity)
          })),
          currency: data.currency
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      await response.json();
      setShowForm(false);
      window.location.reload();
      toast.success('Transaction created successfully');
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatReceiptUrl = (transaction: Transaction) => {
    const params = new URLSearchParams();
    params.set('date', transaction.date.toString());
    params.set('buyer', transaction.buyerName);
    params.set('items', transaction.items.map(item => 
      `${item.quantity}x ${item.name} @ ${currencySymbols[transaction.currency as CurrencyCode]}${Number(item.price).toFixed(2)}`
    ).join(','));
    const total = transaction.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    params.set('total', `${currencySymbols[transaction.currency as CurrencyCode]}${total.toFixed(2)}`);
    params.set('currency', transaction.currency);
    return `/receipt/${transaction.id}?${params.toString()}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button onClick={() => setShowForm(true)}>
          New Transaction
        </Button>
      </div>

      {showForm && (
        <div className="mb-8">
          <TransactionForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Date</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead className="hidden sm:table-cell">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
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
                <TableRow key={transaction.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(transaction.date), "MMM d, yyyy, h:mm a")}
                  </TableCell>
                  <TableCell>{transaction.buyerName}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {items.map((item, index) => (
                      <div key={index}>{item}</div>
                    ))}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formattedTotal}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link
                        href={formatReceiptUrl(transaction)}
                        className="hover:text-primary"
                      >
                        <Download className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        disabled={isDeleting === transaction.id}
                        className={`hover:text-red-600 ${
                          isDeleting === transaction.id ? "opacity-50" : ""
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
