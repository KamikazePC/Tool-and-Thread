import { useState, useEffect } from 'react';
import { Transaction } from '@/types';

export function useTransactions() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/transactions/initial');
      
      // Check if response is empty
      const text = await response.text();
      if (!text) {
        console.log('Empty response received');
        setTransactions([]);
        return;
      }

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON:', text);
        throw new Error('Invalid response format');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load transactions');
      }
      
      // Convert date strings to Date objects
      const processedData = data.map((t: any) => ({
        ...t,
        date: new Date(t.date)
      }));
      
      setTransactions(processedData);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const addTransaction = (newTransaction: Transaction) => {
    setTransactions(prev => [...prev, newTransaction]);
  };

  const removeTransaction = async (id: number) => {
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
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return {
    transactions,
    isLoading,
    error,
    addTransaction,
    removeTransaction,
    refreshTransactions: loadTransactions
  };
}
