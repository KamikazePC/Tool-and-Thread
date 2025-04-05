"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Download, Trash2, Plus, Search, Filter, X } from "lucide-react";
import Link from "next/link";
import { parsePrice } from "@/lib/utils";
import { CurrencyCode, currencySymbols } from "@/lib/currency";
import { useTransactions } from "@/hooks/useTransactions";
import type { Transaction } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TransactionsPage() {
  const { transactions, isLoading, isDeleting, removeTransaction } =
    useTransactions();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

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
      toast.success("Transaction deleted successfully");
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      toast.error("Failed to delete transaction");
    }
  };

  const formatReceiptUrl = (transaction: Transaction) => {
    const params = new URLSearchParams();
    params.set("date", transaction.date.toString());
    params.set("buyer", transaction.buyerName);
    params.set("receiptNumber", transaction.receiptNumber);
    params.set("items", JSON.stringify(transaction.items));
    params.set("currency", transaction.currency);
    return `/receipt/${transaction.id}?${params.toString()}`;
  };

  const currencyTotals = transactions.reduce((acc, transaction) => {
    const total = transaction.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    acc[transaction.currency as CurrencyCode] =
      (acc[transaction.currency as CurrencyCode] || 0) + total;
    return acc;
  }, {} as Record<CurrencyCode, number>);

  // Filter transactions based on search query and filters
  const filteredTransactions = transactions.filter((transaction) => {
    // Search functionality
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = transaction.buyerName.toLowerCase().includes(query);
      const matchesReceiptNumber = transaction.receiptNumber
        .toLowerCase()
        .includes(query);
      const matchesItems = transaction.items.some((item) =>
        item.name.toLowerCase().includes(query)
      );

      if (!matchesName && !matchesReceiptNumber && !matchesItems) {
        return false;
      }
    }

    // Currency filter
    if (currencyFilter !== "all" && transaction.currency !== currencyFilter) {
      return false;
    }

    // Date filter
    if (dateFilter === "custom") {
      const transactionDate = new Date(transaction.date);

      if (startDate) {
        const filterStartDate = new Date(startDate);
        if (transactionDate < filterStartDate) {
          return false;
        }
      }

      if (endDate) {
        const filterEndDate = new Date(endDate);
        filterEndDate.setHours(23, 59, 59, 999); // End of the day
        if (transactionDate > filterEndDate) {
          return false;
        }
      }
    } else if (dateFilter === "today") {
      const today = new Date();
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getDate() === today.getDate() &&
        transactionDate.getMonth() === today.getMonth() &&
        transactionDate.getFullYear() === today.getFullYear()
      );
    } else if (dateFilter === "thisWeek") {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday
      endOfWeek.setHours(23, 59, 59, 999);

      const transactionDate = new Date(transaction.date);
      return transactionDate >= startOfWeek && transactionDate <= endOfWeek;
    } else if (dateFilter === "thisMonth") {
      const today = new Date();
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getMonth() === today.getMonth() &&
        transactionDate.getFullYear() === today.getFullYear()
      );
    }

    return true;
  });

  const resetFilters = () => {
    setSearchQuery("");
    setCurrencyFilter("all");
    setDateFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters =
    searchQuery || currencyFilter !== "all" || dateFilter !== "all";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-800 tracking-tight text-center sm:text-left">
          Transactions
        </h1>
        <Link href="/admin/transactions/new" className="w-full sm:w-auto">
          <Button className="bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors flex items-center gap-2 h-12 w-full sm:w-auto justify-center">
            <Plus className="h-5 w-5" />
            New Transaction
          </Button>
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <Input
              type="text"
              placeholder="Search by receipt number, customer name, or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-slate-300 focus:border-primary-400 focus:ring-primary-400"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className={`border-slate-300 ${
                showFilters
                  ? "bg-primary-50 text-primary-600"
                  : "text-slate-700"
              } font-medium`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                className="border-slate-300 text-slate-700 font-medium"
                onClick={resetFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Currency
              </Label>
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-full border-slate-300 focus:border-primary-400 focus:ring-primary-400 text-slate-700">
                  <SelectValue placeholder="Filter by currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-medium">
                    All Currencies
                  </SelectItem>
                  <SelectItem value="USD" className="font-medium">
                    <span className="flex items-center">
                      <span className="mr-2 text-primary-500 font-semibold">
                        $
                      </span>
                      US Dollar
                    </span>
                  </SelectItem>
                  <SelectItem value="GBP" className="font-medium">
                    <span className="flex items-center">
                      <span className="mr-2 text-primary-500 font-semibold">
                        £
                      </span>
                      British Pound
                    </span>
                  </SelectItem>
                  <SelectItem value="NGN" className="font-medium">
                    <span className="flex items-center">
                      <span className="mr-2 text-primary-500 font-semibold">
                        ₦
                      </span>
                      Nigerian Naira
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Date Range
              </Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full border-slate-300 focus:border-primary-400 focus:ring-primary-400 text-slate-700">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-medium">
                    All Time
                  </SelectItem>
                  <SelectItem value="today" className="font-medium">
                    Today
                  </SelectItem>
                  <SelectItem value="thisWeek" className="font-medium">
                    This Week
                  </SelectItem>
                  <SelectItem value="thisMonth" className="font-medium">
                    This Month
                  </SelectItem>
                  <SelectItem value="custom" className="font-medium">
                    Custom Range
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateFilter === "custom" && (
              <div className="sm:col-span-2 lg:col-span-1 grid grid-cols-2 gap-2">
                <div>
                  <Label
                    htmlFor="start-date"
                    className="text-sm font-semibold text-slate-700 mb-1.5 block"
                  >
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-slate-300 focus:border-primary-400 focus:ring-primary-400"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="end-date"
                    className="text-sm font-semibold text-slate-700 mb-1.5 block"
                  >
                    End Date
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-slate-300 focus:border-primary-400 focus:ring-primary-400"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Object.entries(currencyTotals).map(([currency, total]) => (
          <div
            key={currency}
            className="p-5 rounded-lg shadow-sm border border-slate-200 bg-white"
          >
            <div className="text-sm font-medium text-slate-500 mb-1">
              Total in {currency}
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {currencySymbols[currency as CurrencyCode]}
              {total.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Results count */}
      {hasActiveFilters && (
        <div className="mb-4 text-sm font-medium text-slate-600">
          Showing {filteredTransactions.length} of {transactions.length}{" "}
          transactions
        </div>
      )}

      {/* Desktop Table View (hidden on mobile) */}
      <div className="hidden sm:block bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[180px] text-slate-600">Date</TableHead>
                <TableHead className="text-slate-600">Receipt #</TableHead>
                <TableHead className="text-slate-600">Buyer</TableHead>
                <TableHead className="text-slate-600">Items</TableHead>
                <TableHead className="text-right text-slate-600">
                  Total
                </TableHead>
                <TableHead className="text-slate-600">Currency</TableHead>
                <TableHead className="w-[100px] text-slate-600">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => {
                  const formatPrice = (price: string | number) => {
                    const numericPrice = parsePrice(price);
                    const symbol =
                      currencySymbols[transaction.currency as CurrencyCode];
                    return `${symbol}${numericPrice.toFixed(2)}`;
                  };

                  const total = transaction.items.reduce(
                    (sum, item) => sum + Number(item.price) * item.quantity,
                    0
                  );

                  const formattedTotal = formatPrice(total);

                  return (
                    <TableRow
                      key={transaction.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <TableCell className="whitespace-nowrap text-slate-700 font-medium">
                        {format(
                          new Date(transaction.date),
                          "MMM d, yyyy, h:mm a"
                        )}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        <span
                          title={transaction.receiptNumber}
                          className="hover:cursor-help font-medium"
                        >
                          {transaction.receiptNumber.substring(0, 8)}...
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        {transaction.buyerName}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {transaction.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.quantity}x {item.name} (
                            {formatPrice(item.price)})
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-800">
                        {formattedTotal}
                      </TableCell>
                      <TableCell className="text-slate-600 font-medium">
                        {transaction.currency}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Link href={formatReceiptUrl(transaction)}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-primary-500 hover:text-primary-600 hover:bg-primary-50 h-10 w-10 min-w-10"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(transaction.id)}
                            disabled={isDeleting === transaction.id}
                            className="text-error hover:text-white hover:bg-error h-10 w-10 min-w-10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-slate-500"
                  >
                    No transactions found matching your filters.
                    {hasActiveFilters && (
                      <div className="mt-2">
                        <Button
                          variant="link"
                          onClick={resetFilters}
                          className="text-primary-500 font-medium"
                        >
                          Clear all filters
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View (shown only on mobile) */}
      <div className="sm:hidden space-y-4">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => {
            const formatPrice = (price: string | number) => {
              const numericPrice = parsePrice(price);
              const symbol =
                currencySymbols[transaction.currency as CurrencyCode];
              return `${symbol}${numericPrice.toFixed(2)}`;
            };

            const total = transaction.items.reduce(
              (sum, item) => sum + Number(item.price) * item.quantity,
              0
            );

            const formattedTotal = formatPrice(total);

            return (
              <div
                key={transaction.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-slate-800">
                      {transaction.buyerName}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {format(new Date(transaction.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-800">
                      {formattedTotal}
                    </div>
                    <div className="text-sm text-slate-500">
                      {transaction.currency}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mb-3">
                  <div className="text-sm text-slate-500 mb-1">Receipt</div>
                  <div className="font-medium text-slate-700 text-sm">
                    {transaction.receiptNumber.substring(0, 12)}...
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mb-3">
                  <div className="text-sm text-slate-500 mb-1">Items</div>
                  <div className="space-y-1">
                    {transaction.items.map((item, index) => (
                      <div key={index} className="text-sm text-slate-700">
                        {item.quantity}x {item.name} ({formatPrice(item.price)})
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between">
                  <div className="text-xs text-slate-500">
                    {format(new Date(transaction.date), "h:mm a")}
                  </div>
                  <div className="flex gap-1">
                    <Link href={formatReceiptUrl(transaction)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 min-w-10 rounded-full text-primary-500 hover:text-primary-600 hover:bg-primary-50"
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download Receipt</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(transaction.id)}
                      disabled={isDeleting === transaction.id}
                      className="h-10 w-10 min-w-10 rounded-full text-error hover:text-white hover:bg-error"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Transaction</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center text-slate-500">
            No transactions found matching your filters.
            {hasActiveFilters && (
              <div className="mt-2">
                <Button
                  variant="link"
                  onClick={resetFilters}
                  className="text-primary-500 font-medium"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
