import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Transaction, formatTransaction } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from "../auth/config";
import { CurrencyCode } from '@/lib/currency';

interface CreateTransactionBody {
  buyerName: string;
  itemName: string;
  price: string;
  currency?: CurrencyCode;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateTransactionBody = await req.json();
    
    if (body.buyerName && body.itemName && body.price) {
      const transaction = await prisma.transaction.create({
        data: {
          buyerName: body.buyerName,
          total: parseFloat(body.price),
          currency: body.currency || "NGN",
          userId: session.user.id,
          items: {
            create: [{
              name: body.itemName,
              price: parseFloat(body.price),
              quantity: 1
            }]
          }
        },
        include: {
          items: true
        }
      });

      return NextResponse.json(formatTransaction(transaction));
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  } catch (error: unknown) {
    if (error instanceof Error) {
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

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        items: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(transactions.map(formatTransaction));
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
