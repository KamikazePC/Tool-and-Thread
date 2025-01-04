export interface Customer {
  id: string;
  name: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  createdAt: Date;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface Receipt {
  id: string;
  orderId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  generatedAt: Date;
  pdfUrl: string;
}
