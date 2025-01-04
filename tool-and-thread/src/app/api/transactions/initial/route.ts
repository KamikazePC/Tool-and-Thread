import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching initial transactions...'); // Debug log
    
    const transactions = await prisma.transaction.findMany({
      include: {
        items: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    console.log('Found transactions:', transactions); // Debug log
    
    // Ensure we return an empty array if no transactions
    return NextResponse.json(transactions || []);
  } catch (error) {
    console.error('Error loading initial transactions:', error);
    
    // Ensure we return a valid JSON response even in error cases
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load initial transactions' },
      { status: 500 }
    );
  }
}
