"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download,Plus, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { CurrencyCode } from '@/lib/currency';

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Transactions</CardTitle>
            <CardDescription>All time transaction count</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{transactions.length}</p>
          </CardContent>
          <CardFooter>
            <Link href="/admin/transactions" className="text-sm text-blue-600 hover:underline">
              View all transactions
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Combined value by currency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(currencyTotals).map(([currency, total]) => (
              <p key={currency} className="text-xl font-bold">
                {currencySymbols[currency as CurrencyCode]}{total.toFixed(2)} {currency}
              </p>
            ))}
            {Object.keys(currencyTotals).length === 0 && (
              <p className="text-xl font-bold">No transactions yet</p>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/admin/transactions" className="text-sm text-blue-600 hover:underline">
              View details
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common transaction operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/transactions/new">
              <Button className="w-full flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                New Transaction
              </Button>
            </Link>
            <Link href="/admin/transactions">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <ListFilter className="h-4 w-4" />
                View All Transactions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <Link href="/admin/transactions">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions.map((transaction) => {
                const total = transaction.items.reduce(
                  (sum, item) => sum + (Number(item.price) * item.quantity),
                  0
                );
                
                return (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.receiptNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.buyerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {currencySymbols[transaction.currency as CurrencyCode]}{total.toFixed(2)} {transaction.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link href={`/receipt/${transaction.id}`}>
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
