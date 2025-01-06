import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateReceipt } from '@/lib/generatePDF';
import { CurrencyCode } from '@/lib/currency';
import type { Transaction } from '@/types';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = parseInt(context.params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      );
    }

    const dbTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!dbTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const transaction: Transaction = {
      ...dbTransaction,
      date: dbTransaction.date.toISOString(),
      total: dbTransaction.total.toString(),
      currency: dbTransaction.currency as CurrencyCode,
      items: dbTransaction.items.map(item => ({
        ...item,
        price: item.price.toString()
      }))
    };

    try {
      const pdfBuffer = await generateReceipt(transaction);

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="receipt-${id}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } catch (pdfError) {
      console.error('PDF Generation Error:', pdfError);
      return NextResponse.json(
        { error: 'Failed to generate PDF', details: pdfError instanceof Error ? pdfError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
