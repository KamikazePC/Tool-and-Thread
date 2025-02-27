import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Transaction, formatTransaction } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from "../auth/config";
import { CurrencyCode } from '@/lib/currency';
import { Prisma } from '@prisma/client';

// Updated to match the structure being sent from useTransactions
interface CreateTransactionBody {
  buyerName: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  currency: CurrencyCode;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Add more detailed logging to diagnose session issues
    console.log('Session in transaction creation:', session);
    console.log('User ID from session:', session?.user?.id);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - No valid user session' }, { status: 401 });
    }

    const body: CreateTransactionBody = await req.json();
    
    if (body.buyerName && body.items && body.items.length > 0) {
      // Calculate total from items
      const total = body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Add validation for user ID to prevent foreign key constraint violation
      const userId = session.user.id;
      
      // Check if the user exists in the database
      const userExists = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!userExists) {
        console.error('User not found in database:', userId);
        return NextResponse.json({ error: 'User account not found' }, { status: 400 });
      }
      
      const data = {
        buyerName: body.buyerName,
        total,
        currency: body.currency || "NGN",
        userId,
        items: {
          create: body.items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
          }))
        }
      };

      console.log('Transaction data being created:', JSON.stringify(data, null, 2));

      const transaction = await prisma.transaction.create({
        data,
        include: {
          items: true
        }
      });

      return NextResponse.json(formatTransaction(transaction));
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Transaction creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Since we can't directly query by userId, let's use a different approach
    // Let's get all transactions and filter on the application side
    const allTransactions = await prisma.transaction.findMany({
      include: {
        items: true,
        user: true
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    // Filter transactions that belong to the current user
    const userTransactions = allTransactions.filter(tx => tx.user.id === session.user.id);

    return NextResponse.json(userTransactions.map(formatTransaction));
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Transaction fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
