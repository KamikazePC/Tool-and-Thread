import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { Transaction, Item } from '@/types';
import { CurrencyCode } from '@/lib/currency';

interface CreateTransactionInput {
  buyerName: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  currency: CurrencyCode;
}

export function useTransactions() {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Use react-query to fetch transactions via axios
  const { data: transactions = [], isLoading, error } = useQuery<Transaction[], Error>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await axios.get('/api/transactions');
      return data;
    }
  });

  // Use react-query mutation for deleting a transaction
  const deleteMutation = useMutation<number, Error, number>({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/transactions/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Transaction[]>(['transactions'], (oldData = []) =>
        oldData.filter((t) => t.id !== deletedId)
      );
    },
  });

  // Use react-query mutation for creating a transaction
  const createMutation = useMutation<Transaction, Error, CreateTransactionInput>({
    mutationFn: async (data: CreateTransactionInput) => {
      const response = await axios.post('/api/transactions', data);
      return response.data;
    },
    onSuccess: (newTransaction) => {
      queryClient.setQueryData<Transaction[]>(['transactions'], (oldData = []) => [
        ...oldData,
        newTransaction,
      ]);
    },
  });

  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    });
    return formatter.format(amount);
  };

  // Add a new transaction using the mutation
  const addTransaction = async (data: CreateTransactionInput) => {
    await createMutation.mutateAsync(data);
  };

  // Wrap the delete mutation and maintain a quick-is-deleting flag
  const removeTransaction = async (id: number) => {
    setIsDeleting(id);
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (err) {
      console.error('Error deleting transaction:', err);
      throw err;
    } finally {
      setIsDeleting(null);
    }
  };

  const downloadReceipt = async (id: number) => {
    const transaction = transactions.find((t) => t.id === id);
    if (!transaction) return;

    const total = transaction.items.reduce(
      (sum: number, item: Item) => sum + Number(item.price) * item.quantity,
      0
    );

    const params = new URLSearchParams({
      id: id.toString(),
      date: new Date(transaction.date).toISOString(),
      buyer: transaction.buyerName,
      items: transaction.items
        .map(
          (item) =>
            `${item.quantity}x ${item.name} @ ${formatCurrency(
              Number(item.price),
              transaction.currency
            )}`
        )
        .join(','),
      total: formatCurrency(total, transaction.currency),
    });

    window.open(`/receipt/${id}?${params.toString()}`);
  };

  // Provide a function to manually refresh transactions
  const refreshTransactions = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  return {
    transactions,
    isLoading,
    error: error instanceof Error ? error.message : String(error),
    isDeleting,
    addTransaction,
    removeTransaction,
    downloadReceipt,
    refreshTransactions,
  };
}
