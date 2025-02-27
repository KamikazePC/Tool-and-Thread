'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from 'lucide-react';
import { CurrencyCode, currencySymbols } from '@/lib/currency';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormData {
  buyerName: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  currency: CurrencyCode;
  total: number;
}

interface FormErrors {
  buyerName?: string;
  items?: Array<{
    name?: string;
    price?: string;
    quantity?: string;
  }>;
}

interface TransactionFormProps {
  onSubmit: (data: FormData) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

export default function TransactionForm({ onSubmit, isSubmitting = false, onCancel }: TransactionFormProps) {
  const [buyerName, setBuyerName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [items, setItems] = useState([{ 
    name: '',
    price: 0,
    quantity: 1 
  }]);
  const [errors, setErrors] = useState<FormErrors>({});

  const parsePrice = (price: string | number): number => {
    if (typeof price === 'number') return price;
    return parseFloat(price.replace(/[^0-9.-]+/g, "")) || 0;
  };

  const updateItem = (index: number, field: keyof typeof items[number], value: string | number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { name: '', price: 0, quantity: 1 }
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: FormErrors = {};
    let validationFailed = false;
    
    if (!buyerName.trim()) {
      newErrors.buyerName = "Buyer name is required";
      validationFailed = true;
    }

    items.forEach((item, index) => {
      if (!item.name.trim()) {
        if (!newErrors.items) newErrors.items = [];
        newErrors.items[index] = newErrors.items[index] || {};
        newErrors.items[index].name = "Item name is required";
        validationFailed = true;
      }
      if (!item.price || item.price <= 0) {
        if (!newErrors.items) newErrors.items = [];
        newErrors.items[index] = newErrors.items[index] || {};
        newErrors.items[index].price = "Valid price is required";
        validationFailed = true;
      }
    });

    if (validationFailed) {
      setErrors(newErrors);
      return;
    }

    // Format items to ensure price is a number
    const formattedItems = items.map(item => ({
      ...item,
      price: Number(item.price),
      quantity: Number(item.quantity)
    }));

    onSubmit({
      buyerName,
      items: formattedItems,
      currency,
      total: formattedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
  };

  const formattedTotal = items.reduce((sum, item) => sum + (parsePrice(item.price) * item.quantity), 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg border border-slate-200 shadow-sm md:p-8">
      <div className="space-y-6">
        <div>
          <Label htmlFor="buyerName" className="text-sm font-semibold text-slate-700 mb-1.5 block">Customer Name</Label>
          <Input
            id="buyerName"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            className="mt-1 border-slate-300 focus:border-primary-400 focus:ring-primary-400"
            required
          />
          {errors.buyerName && (
            <p className="text-sm text-error mt-1.5 font-medium">{errors.buyerName}</p>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-[1fr,1fr,auto,auto] sm:gap-4 items-end bg-slate-50 p-5 rounded-md">
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-1.5 block">Currency</Label>
              <Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}>
                <SelectTrigger className="w-full mt-1 border-slate-300 focus:border-primary-400 focus:ring-primary-400 text-slate-700">
                  <SelectValue>
                    {currency && (
                      <span className="flex items-center">
                        <span className="mr-2 text-primary-500 font-semibold">{currencySymbols[currency]}</span>
                        {currency === "USD" ? "US Dollar" : currency === "GBP" ? "British Pound" : "Nigerian Naira"}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD" className="font-medium">
                    <span className="flex items-center">
                      <span className="mr-2 text-primary-500 font-semibold">$</span>
                      US Dollar
                    </span>
                  </SelectItem>
                  <SelectItem value="GBP" className="font-medium">
                    <span className="flex items-center">
                      <span className="mr-2 text-primary-500 font-semibold">£</span>
                      British Pound
                    </span>
                  </SelectItem>
                  <SelectItem value="NGN" className="font-medium">
                    <span className="flex items-center">
                      <span className="mr-2 text-primary-500 font-semibold">₦</span>
                      Nigerian Naira
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {items.map((item, index) => (
            <div key={index} className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-[1fr,1fr,auto,auto] sm:gap-4 items-end bg-slate-50 p-5 rounded-md">
              <div>
                <Label htmlFor={`item-name-${index}`} className="text-sm font-semibold text-slate-700 mb-1.5 block">Item Name</Label>
                <Input
                  id={`item-name-${index}`}
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  className="mt-1 border-slate-300 focus:border-primary-400 focus:ring-primary-400"
                  required
                />
                {errors.items?.[index]?.name && (
                  <p className="text-error text-sm mt-1.5 font-medium">{errors.items[index].name}</p>
                )}
              </div>

              <div>
                <Label htmlFor={`item-price-${index}`} className="text-sm font-semibold text-slate-700 mb-1.5 block">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                    {currencySymbols[currency]}
                  </span>
                  <Input
                    id={`item-price-${index}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={parsePrice(item.price)}
                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                    className={`pl-7 border-slate-300 focus:border-primary-400 focus:ring-primary-400 ${errors.items?.[index]?.price ? 'border-error' : ''}`}
                  />
                </div>
                {errors.items?.[index]?.price && (
                  <p className="text-error text-sm mt-1.5 font-medium">{errors.items[index].price}</p>
                )}
              </div>

              <div>
                <Label htmlFor={`item-quantity-${index}`} className="text-sm font-semibold text-slate-700 mb-1.5 block">Quantity</Label>
                <Input
                  id={`item-quantity-${index}`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  className={`border-slate-300 focus:border-primary-400 focus:ring-primary-400 ${errors.items?.[index]?.quantity ? 'border-error' : ''}`}
                />
                {errors.items?.[index]?.quantity && (
                  <p className="text-error text-sm mt-1.5 font-medium">{errors.items[index].quantity}</p>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
                className="mt-1 text-slate-500 hover:text-error hover:bg-error/10"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove item</span>
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-200">
        <div className="text-lg font-semibold text-slate-800 font-serif">
          Total: <span className="text-primary-600">{currencySymbols[currency]}{formattedTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="border-slate-300 text-slate-700 hover:bg-slate-50 font-medium">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="bg-primary-500 hover:bg-primary-600 text-white transition-colors font-medium">
          {isSubmitting ? 'Creating...' : 'Create Transaction'}
        </Button>
      </div>
    </form>
  );
}
