"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { CurrencyCode, currencySymbols } from "@/lib/currency";
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
    description?: string | null;
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
    description?: string;
    price?: string;
    quantity?: string;
  }>;
}

interface TransactionFormProps {
  onSubmit: (data: FormData) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

export default function TransactionForm({
  onSubmit,
  isSubmitting = false,
  onCancel,
}: TransactionFormProps) {
  const [buyerName, setBuyerName] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [items, setItems] = useState([
    {
      name: "",
      description: "",
      price: 0,
      quantity: 1,
    },
  ]);
  const [errors, setErrors] = useState<FormErrors>({});

  const parsePrice = (price: string | number): number => {
    if (typeof price === "number") return price;
    return parseFloat(price.replace(/[^0-9.-]+/g, "")) || 0;
  };

  const updateItem = (
    index: number,
    field: keyof (typeof items)[number],
    value: string | number
  ) => {
    const newItems = [...items];
    if (field === "description") {
      newItems[index] = { ...newItems[index], description: String(value) };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: "", description: "", price: 0, quantity: 1 }]);
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
    const formattedItems = items.map((item) => ({
      name: item.name,
      description: item.description || null,
      price: Number(item.price),
      quantity: Number(item.quantity),
    }));

    onSubmit({
      buyerName,
      items: formattedItems,
      currency,
      total: formattedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    });
  };

  const formattedTotal = items.reduce(
    (sum, item) => sum + parsePrice(item.price) * item.quantity,
    0
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 bg-white p-6 rounded-lg border border-slate-200 shadow-sm md:p-8"
    >
      <div className="space-y-6">
        <div>
          <Label
            htmlFor="buyerName"
            className="text-sm font-semibold text-slate-700 mb-1.5 block"
          >
            Customer Name
          </Label>
          <Input
            id="buyerName"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            required
            className="h-12 px-4 text-base"
          />
          {errors.buyerName && (
            <p className="text-sm text-error mt-1.5 font-medium">
              {errors.buyerName}
            </p>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-[1fr,1fr,auto,auto] sm:gap-4 items-end bg-slate-50 p-5 rounded-md">
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Currency
              </Label>
              <Select
                value={currency}
                onValueChange={(value) => setCurrency(value as CurrencyCode)}
              >
                <SelectTrigger className="w-full mt-1 border-slate-300 focus:border-primary-400 focus:ring-primary-400 text-slate-700 h-12">
                  <SelectValue>
                    {currency && (
                      <span className="flex items-center">
                        <span className="mr-2 text-primary-500 font-semibold">
                          {currencySymbols[currency]}
                        </span>
                        {currency === "USD"
                          ? "US Dollar"
                          : currency === "GBP"
                          ? "British Pound"
                          : "Nigerian Naira"}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
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
          </div>

          <h3 className="font-semibold text-slate-700 text-lg mb-2">Items</h3>
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-start bg-slate-50 p-5 rounded-md"
            >
              <div className="col-span-2 sm:col-span-1">
                <Label
                  htmlFor={`item-name-${index}`}
                  className="text-sm font-semibold text-slate-700 mb-1.5 block"
                >
                  Item Name
                </Label>
                <Input
                  id={`item-name-${index}`}
                  value={item.name}
                  onChange={(e) => updateItem(index, "name", e.target.value)}
                  required
                  className="h-12 px-4 text-base"
                />
                {errors.items?.[index]?.name && (
                  <p className="text-error text-sm mt-1.5 font-medium">
                    {errors.items[index].name}
                  </p>
                )}
              </div>

              <div className="col-span-1">
                <Label
                  htmlFor={`item-price-${index}`}
                  className="text-sm font-semibold text-slate-700 mb-1.5 block"
                >
                  Price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                    {currencySymbols[currency]}
                  </span>
                  <Input
                    id={`item-price-${index}`}
                    value={item.price}
                    onChange={(e) =>
                      updateItem(index, "price", parseInt(e.target.value) || 0)
                    }
                    className={`pl-10 border-slate-300 focus:border-primary-400 focus:ring-primary-400 h-12 text-base ${
                      errors.items?.[index]?.price ? "border-error" : ""
                    }`}
                    required
                  />
                </div>
                {errors.items?.[index]?.price && (
                  <p className="text-error text-sm mt-1.5 font-medium">
                    {errors.items[index].price}
                  </p>
                )}
              </div>

              <div className="col-span-1">
                <Label
                  htmlFor={`item-quantity-${index}`}
                  className="text-sm font-semibold text-slate-700 mb-1.5 block"
                >
                  Quantity
                </Label>
                <Input
                  id={`item-quantity-${index}`}
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", parseInt(e.target.value) || 0)
                  }
                  className={`border-slate-300 focus:border-primary-400 focus:ring-primary-400 h-12 px-4 text-base ${
                    errors.items?.[index]?.quantity ? "border-error" : ""
                  }`}
                />
                {errors.items?.[index]?.quantity && (
                  <p className="text-error text-sm mt-1.5 font-medium">
                    {errors.items[index].quantity}
                  </p>
                )}
              </div>

              <div className="col-span-2 sm:col-span-3">
                <Label
                  htmlFor={`item-description-${index}`}
                  className="text-sm font-semibold text-slate-700 mb-1.5 block"
                >
                  Description (Optional)
                </Label>
                <Input
                  id={`item-description-${index}`}
                  value={item.description || ""}
                  onChange={(e) =>
                    updateItem(index, "description", e.target.value)
                  }
                  placeholder="Enter item description"
                  className="h-12 px-4 text-base"
                />
              </div>

              <div className="col-span-2 sm:col-span-1 flex justify-end items-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeItem(index)}
                  className="bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700 h-12 w-12 min-w-12 p-0 rounded-full"
                  disabled={items.length <= 1}
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="sr-only">Remove Item</span>
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors font-medium h-12 text-base"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-200">
        <div className="text-lg font-semibold text-slate-800 font-serif">
          Total:{" "}
          <span className="text-primary-600">
            {currencySymbols[currency]}
            {formattedTotal.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-end gap-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 font-medium h-12 text-base w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary-500 hover:bg-primary-600 text-white transition-colors font-medium h-12 text-base w-full sm:w-auto"
        >
          {isSubmitting ? "Creating..." : "Create Transaction"}
        </Button>
      </div>
    </form>
  );
}
