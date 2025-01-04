'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CurrencyCode, currencySymbols } from '@/lib/currency';
import { Item } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from 'react-hot-toast';
import { Trash2, Plus } from 'lucide-react';

type NewItem = Omit<Item, 'id'>;

type ItemError = {
  name?: string;
  price?: string;
  quantity?: string;
};

type FormErrors = {
  buyerName?: string;
  items?: Record<number, ItemError>;
};

type TransactionFormProps = {
  onSubmit: (data: { buyerName: string; items: NewItem[]; currency: CurrencyCode }) => void;
  isSubmitting?: boolean;
};

export default function TransactionForm({ onSubmit, isSubmitting = false }: TransactionFormProps) {
  const [buyerName, setBuyerName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [items, setItems] = useState<NewItem[]>([{ 
    name: '', 
    price: '0',
    quantity: 1 
  }]);
  const [errors, setErrors] = useState<FormErrors>({});

  const parsePrice = (price: string | number): number => {
    if (typeof price === 'number') return price;
    return parseFloat(price.replace(/[^0-9.-]+/g, "")) || 0;
  };

  const updateItem = (index: number, field: keyof NewItem, value: string | number) => {
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
      { name: '', price: '0', quantity: 1 }
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!buyerName.trim()) {
      newErrors.buyerName = 'Customer name is required';
      isValid = false;
    }

    const itemErrors: Record<number, ItemError> = {};
    items.forEach((item, index) => {
      const error: ItemError = {};
      
      if (!item.name.trim()) {
        error.name = 'Item name is required';
        isValid = false;
      }
      
      if (parsePrice(item.price) <= 0) {
        error.price = 'Price must be greater than 0';
        isValid = false;
      }
      
      if (item.quantity < 1) {
        error.quantity = 'Quantity must be at least 1';
        isValid = false;
      }

      if (Object.keys(error).length > 0) {
        itemErrors[index] = error;
      }
    });

    if (Object.keys(itemErrors).length > 0) {
      newErrors.items = itemErrors;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    onSubmit({
      buyerName,
      items,
      currency
    });
  };

  const formattedTotal = (() => {
    const total = items.reduce((sum, item) => {
      return sum + (parsePrice(item.price) * item.quantity);
    }, 0);
    return `${currencySymbols[currency]}${total.toFixed(2)}`;
  })();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="buyerName">Customer Name</Label>
        <Input
          id="buyerName"
          value={buyerName}
          onChange={(e) => setBuyerName(e.target.value)}
          placeholder="Enter customer name"
          className={errors.buyerName ? "border-destructive" : ""}
          required
        />
        {errors.buyerName && (
          <p className="text-sm text-destructive">{errors.buyerName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Currency</Label>
        <Select value={currency} onValueChange={(value: CurrencyCode) => setCurrency(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">US Dollar ($)</SelectItem>
            <SelectItem value="GBP">British Pound (£)</SelectItem>
            <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex gap-4 items-start">
            <div className="flex-1">
              <Label htmlFor={`item-${index}-name`}>Item Name</Label>
              <Input
                id={`item-${index}-name`}
                value={item.name}
                onChange={(e) => updateItem(index, 'name', e.target.value)}
                className={errors.items?.[index]?.name ? 'border-red-500' : ''}
              />
              {errors.items?.[index]?.name && (
                <p className="text-red-500 text-sm mt-1">{errors.items[index].name}</p>
              )}
            </div>
            <div className="w-32">
              <Label htmlFor={`item-${index}-price`}>Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {currencySymbols[currency]}
                </span>
                <Input
                  id={`item-${index}-price`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={parsePrice(item.price)}
                  onChange={(e) => updateItem(index, 'price', e.target.value)}
                  className={`pl-7 ${errors.items?.[index]?.price ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.items?.[index]?.price && (
                <p className="text-red-500 text-sm mt-1">{errors.items[index].price}</p>
              )}
            </div>
            <div className="w-24">
              <Label htmlFor={`item-${index}-quantity`}>Quantity</Label>
              <Input
                id={`item-${index}-quantity`}
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                className={errors.items?.[index]?.quantity ? 'border-red-500' : ''}
              />
              {errors.items?.[index]?.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.items[index].quantity}</p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-6"
              onClick={() => removeItem(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
        <div className="text-lg font-semibold">
          Total: {formattedTotal}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Transaction'}
        </Button>
      </div>
    </form>
  );
}
