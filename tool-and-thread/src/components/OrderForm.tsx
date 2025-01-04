'use client';

import { useState } from 'react';
import { OrderItem } from '../types/schema';

export default function OrderForm() {
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    name: '',
    quantity: 1,
    price: 0,
  });

  const addItem = () => {
    if (currentItem.name && currentItem.price > 0) {
      setItems([
        ...items,
        {
          id: crypto.randomUUID(),
          ...currentItem,
        },
      ]);
      setCurrentItem({ name: '', quantity: 1, price: 0 });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || items.length === 0) return;

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          items,
          total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Download receipt
        window.open(data.receiptUrl, '_blank');
        // Reset form
        setCustomerName('');
        setItems([]);
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
          Customer Name
        </label>
        <input
          type="text"
          id="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add Items</h3>
        <div className="grid grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Item name"
            value={currentItem.name}
            onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <input
            type="number"
            placeholder="Quantity"
            value={currentItem.quantity}
            onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
            min="1"
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <input
            type="number"
            placeholder="Price"
            value={currentItem.price}
            onChange={(e) => setCurrentItem({ ...currentItem, price: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.01"
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <button
          type="button"
          onClick={addItem}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add Item
        </button>
      </div>

      {items.length > 0 && (
        <div>
          <h3 className="text-lg font-medium">Order Items</h3>
          <ul className="mt-2 space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between p-2 bg-gray-50 rounded-md">
                <span>{item.name}</span>
                <span>Qty: {item.quantity}</span>
                <span>${item.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-right">
            <strong>Total: ${items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</strong>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        disabled={!customerName || items.length === 0}
      >
        Generate Receipt
      </button>
    </form>
  );
}
