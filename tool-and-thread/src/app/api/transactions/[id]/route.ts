import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    // Extract 'id' from the request URL
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '', 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      );
    }

    // Delete the transaction from the database
    await prisma.transaction.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
