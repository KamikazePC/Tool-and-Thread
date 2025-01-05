import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Transaction } from "@/types";

interface CreateTransactionBody {
  buyerName: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  currency: string;
}

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    let body: CreateTransactionBody;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json({ error: 'Invalid request body format' }, { status: 400 });
    }

    const { buyerName, items, currency } = body;

    console.log('Received transaction data:', { buyerName, items, currency }); // Debug log

    // Validate required fields
    if (!buyerName || typeof buyerName !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing buyerName' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid or missing items array' }, { status: 400 });
    }

    // Validate each item
    for (const item of items) {
      if (!item.name || typeof item.name !== 'string') {
        return NextResponse.json({ error: 'Invalid or missing item name' }, { status: 400 });
      }
      if (typeof item.price !== 'number' || isNaN(item.price) || item.price <= 0) {
        return NextResponse.json({ error: 'Invalid item price' }, { status: 400 });
      }
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    console.log('Creating transaction with data:', {
      buyerName,
      currency,
      total,
      items
    }); // Debug log

    // Create transaction with items
    const transaction = await prisma.transaction.create({
      data: {
        buyerName,
        currency,
        total: Number(total),
        date: new Date(),
        items: {
          create: items.map(item => ({
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity) || 1
          }))
        }
      },
      include: {
        items: true
      }
    });

    const response = {
      id: transaction.id,
      buyerName: transaction.buyerName,
      currency: transaction.currency,
      date: transaction.date.toString(),
      total: transaction.total.toString(),
      items: transaction.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price.toString(),
        quantity: item.quantity
      }))
    } as Transaction;

    // Return the formatted response
    return NextResponse.json(response, {
      status: 201,
    });

  } catch (error: unknown) {
    console.error('Error creating transaction:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create transaction',
      details: error instanceof Error ? error.stack : undefined
    }, {
      status: 500,
    });
  }
}

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        items: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      buyerName: t.buyerName,
      currency: t.currency,
      date: t.date.toString(),
      total: t.total.toString(),
      items: t.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price.toString(),
        quantity: item.quantity
      }))
    })) as Transaction[];

    return NextResponse.json(formattedTransactions);
  } catch (error: unknown) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
