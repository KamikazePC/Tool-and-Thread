import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateReceipt } from '@/lib/generatePDF';
import { formatTransaction } from '@/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Extract 'id' from the URL path instead of search parameters
    const pathname = request.nextUrl.pathname;
    const idMatch = pathname.match(/\/api\/receipts\/(\d+)$/);
    const idString = idMatch ? idMatch[1] : '';
    const id = parseInt(idString);
    
    console.log('Processing receipt request for transaction ID:', id);
    
    if (isNaN(id)) {
      console.error('Invalid transaction ID from path:', pathname);
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      );
    }

    const dbTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!dbTransaction) {
      console.error('Transaction not found in database for ID:', id);
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Use the formatTransaction helper instead of manual conversion
    // This ensures consistent handling of the receiptNumber
    const transaction = formatTransaction(dbTransaction);
    
    try {
      console.log('Generating PDF for transaction:', id);
      const pdfBuffer = await generateReceipt(transaction);
      console.log('PDF generated successfully, size:', pdfBuffer.length);

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="receipt-${transaction.receiptNumber}.pdf"`,
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
    console.error('Receipt API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
