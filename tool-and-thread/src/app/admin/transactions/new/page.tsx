"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTransactions } from '@/hooks/useTransactions';
import TransactionForm from '@/components/TransactionForm';
import { CurrencyCode } from '@/lib/currency';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewTransactionPage() {
  const router = useRouter();
  const { addTransaction } = useTransactions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleSubmit = async (data: { 
    buyerName: string; 
    items: Array<{ name: string; price: number; quantity: number }>; 
    currency: CurrencyCode; 
    total: number;
  }) => {
    try {
      setIsSubmitting(true);
      await addTransaction({
        buyerName: data.buyerName,
        items: data.items.map(item => ({
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity)
        })),
        currency: data.currency,
      });
      toast.success('Transaction created successfully');
      router.push('/admin/transactions');
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/transactions">
          <Button variant="ghost" className="p-0 h-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transactions
          </Button>
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">New Transaction</h1>
      </div>

      <div className="max-w-3xl mx-auto">
        <TransactionForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => router.push('/admin/transactions')}
        />
      </div>
    </div>
  );
}