"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download,Plus, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { CurrencyCode } from '@/lib/currency';
import { Transaction } from '@/types';

// Define currency symbols
const currencySymbols: Record<CurrencyCode, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
};

export default function AdminPage() {
  const { transactions, isLoading } = useTransactions();
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

  const recentTransactions = transactions.slice(0, 5);
  
  // Group transactions by currency
  const currencyTotals = transactions.reduce((acc, transaction) => {
    const currency = transaction.currency as CurrencyCode;
    const transactionTotal = transaction.items.reduce(
      (sum, item) => sum + (Number(item.price) * item.quantity),
      0
    );
    
    if (!acc[currency]) {
      acc[currency] = 0;
    }
    
    acc[currency] += transactionTotal;
    return acc;
  }, {} as Record<CurrencyCode, number>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-800 tracking-tight">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-serif text-slate-800">Total Transactions</CardTitle>
            <CardDescription className="text-sm text-slate-500">All time transaction count</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary-600">{transactions.length}</p>
          </CardContent>
          <CardFooter>
            <Link href="/admin/transactions" className="text-sm font-medium text-primary-500 hover:text-primary-600 hover:underline transition-colors">
              View all transactions
            </Link>
          </CardFooter>
        </Card>
        
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-serif text-slate-800">Total Revenue</CardTitle>
            <CardDescription className="text-sm text-slate-500">Combined value by currency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(currencyTotals).map(([currency, total]) => (
              <p key={currency} className="text-2xl font-bold text-slate-700">
                {currencySymbols[currency as CurrencyCode]}{total.toFixed(2)} 
                <span className="text-sm ml-1 font-medium text-slate-500">{currency}</span>
              </p>
            ))}
            {Object.keys(currencyTotals).length === 0 && (
              <p className="text-2xl font-bold text-slate-400">No transactions yet</p>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/admin/transactions" className="text-sm font-medium text-primary-500 hover:text-primary-600 hover:underline transition-colors">
              View details
            </Link>
          </CardFooter>
        </Card>
        
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-serif text-slate-800">Quick Actions</CardTitle>
            <CardDescription className="text-sm text-slate-500">Common transaction operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/transactions/new">
              <Button className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors">
                <Plus className="h-4 w-4" />
                New Transaction
              </Button>
            </Link>
            <Link href="/admin/transactions">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                <ListFilter className="h-4 w-4" />
                View All Transactions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif font-bold text-slate-800">Recent Transactions</h2>
          <Link href="/admin/transactions">
            <Button variant="ghost" size="sm" className="text-primary-500 hover:text-primary-600 hover:bg-primary-50 font-medium transition-colors">View All</Button>
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Receipt #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Customer</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Total</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {recentTransactions.map((transaction) => {
                const total = transaction.items.reduce(
                  (sum, item) => sum + (Number(item.price) * item.quantity),
                  0
                );
                
                return (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {transaction.receiptNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {transaction.buyerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">
                      {currencySymbols[transaction.currency as CurrencyCode]}{total.toFixed(2)} {transaction.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link href={formatReceiptUrl(transaction)}>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
