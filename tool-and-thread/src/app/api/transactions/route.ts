import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CurrencyCode } from '@/lib/currency';

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json({ error: 'Invalid request body format' }, { status: 400 });
    }

    const { buyerName, items, currency = 'USD' } = body;

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
        total,
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

    console.log('Created transaction:', transaction); // Debug log

    // Format the response
    const response = {
      id: transaction.id,
      buyerName: transaction.buyerName,
      currency: transaction.currency,
      date: transaction.date.toISOString(),
      total: transaction.total,
      items: transaction.items.map((item: { id: any; name: any; price: any; quantity: any; }) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    };

    // Return the formatted response
    return new NextResponse(JSON.stringify(response), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create transaction',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
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

    return new NextResponse(JSON.stringify(transactions), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return new NextResponse(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to fetch transactions'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
