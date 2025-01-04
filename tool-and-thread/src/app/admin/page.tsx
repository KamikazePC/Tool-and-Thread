'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Download, Trash2 } from 'lucide-react';
import Link from 'next/link';
import TransactionForm from '@/components/TransactionForm';
import AdminClient from './AdminClient';
import { CurrencyCode, currencySymbols } from '@/lib/currency';
import { useTransactions } from '@/hooks/useTransactions';
import type { Transaction, Item } from '@/types';

type NewItem = Omit<Item, 'id'>;
type FormData = {
  buyerName: string;
  items: NewItem[];
  currency: CurrencyCode;
};

export default function AdminPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const { transactions, isLoading, addTransaction, removeTransaction } = useTransactions();

  const parsePrice = (priceStr: string | number): number => {
    if (typeof priceStr === 'number') return priceStr;
    return parseFloat(priceStr.replace(/[^0-9.-]+/g, "")) || 0;
  };

  const handleSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Convert string prices to numbers for API
      const formattedData = {
        ...data,
        items: data.items.map(item => ({
          ...item,
          price: parseFloat(item.price), // Convert string to number for API
          quantity: Number(item.quantity)
        }))
      };

      console.log('Submitting transaction:', formattedData);

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      let responseData;
      try {
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to create transaction';
        throw new Error(errorMessage);
      }

      console.log('Transaction created:', responseData);
      addTransaction(responseData);
      setShowForm(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setIsDeleting(id);
    try {
      await removeTransaction(id);
    } catch (error) {
      setError('Failed to delete transaction');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" suppressHydrationWarning>
      <div className="flex justify-between items-center mb-8" suppressHydrationWarning>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
        >
          New Transaction
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" suppressHydrationWarning>
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8" suppressHydrationWarning>
          <TransactionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8" suppressHydrationWarning>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" suppressHydrationWarning />
          <p className="mt-2 text-gray-600">Loading transactions...</p>
        </div>
      ) : (
        <div className="rounded-md border" suppressHydrationWarning>
          <div className="py-3 px-4 text-sm font-medium bg-muted grid grid-cols-4 gap-4" suppressHydrationWarning>
            <div>DATE</div>
            <div>BUYER</div>
            <div>ITEMS</div>
            <div className="text-right">TOTAL</div>
          </div>
          <div className="divide-y" suppressHydrationWarning>
            {transactions.map((transaction) => {
              const formatPrice = (price: string | number) => {
                const numericPrice = parsePrice(price);
                const symbol = currencySymbols[transaction.currency];
                return `${symbol}${numericPrice.toFixed(2)}`;
              };

              const items = transaction.items.map(
                (item) => `${item.quantity}x ${item.name} @ ${formatPrice(item.price)}`
              );

              const total = transaction.items.reduce(
                (sum, item) => sum + (Number(item.price) * item.quantity),
                0
              );

              const formattedTotal = `${currencySymbols[transaction.currency]}${total.toFixed(2)}`;

              return (
                <div
                  key={transaction.id}
                  className="grid grid-cols-4 gap-4 p-4 items-center"
                  suppressHydrationWarning
                >
                  <div className="text-sm" suppressHydrationWarning>
                    {format(new Date(transaction.date), "MMM d, yyyy, h:mm a")}
                  </div>
                  <div className="text-sm" suppressHydrationWarning>{transaction.buyerName}</div>
                  <div className="text-sm space-y-1" suppressHydrationWarning>
                    {items.map((item, index) => (
                      <div key={index} suppressHydrationWarning>{item}</div>
                    ))}
                  </div>
                  <div className="text-sm text-right" suppressHydrationWarning>
                    {formattedTotal}
                    <div className="inline-flex gap-2 ml-2">
                      <Link
                        href={{
                          pathname: `/receipt/${transaction.id}`,
                          query: {
                            id: transaction.id,
                            date: new Date(transaction.date).toISOString(),
                            buyer: transaction.buyerName,
                            items: items.join(','),
                            total: formattedTotal
                          }
                        }}
                        className="hover:text-primary"
                      >
                        <Download className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        disabled={isDeleting === transaction.id}
                        className={`hover:text-red-600 ${isDeleting === transaction.id ? 'opacity-50' : ''}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
