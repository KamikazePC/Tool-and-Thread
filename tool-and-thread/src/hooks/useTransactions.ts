import { useState, useEffect, useCallback } from 'react';
import type { Transaction } from '@/types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    });
    return formatter.format(amount);
  };

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTransaction = (newTransaction: Transaction) => {
    setTransactions(prev => [...prev, newTransaction]);
  };

  const removeTransaction = async (id: number) => {
    setIsDeleting(id);
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      setTransactions(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    } finally {
      setIsDeleting(null);
    }
  };

  const downloadReceipt = async (id: number) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    const total = transaction.items.reduce(
      (sum, item) => sum + (Number(item.price) * item.quantity),
      0
    );

    const params = new URLSearchParams({
      id: id.toString(),
      date: new Date(transaction.date).toISOString(),
      buyer: transaction.buyerName,
      items: transaction.items.map(item => 
        `${item.quantity}x ${item.name} @ ${formatCurrency(Number(item.price), transaction.currency)}`
      ).join(','),
      total: formatCurrency(total, transaction.currency)
    });

    window.open(`/receipt/${id}?${params.toString()}`);
  };

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    isLoading,
    error,
    isDeleting,
    addTransaction,
    removeTransaction,
    downloadReceipt,
    refreshTransactions: loadTransactions
  };
}
