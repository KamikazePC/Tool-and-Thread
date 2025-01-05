import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Transaction } from '@/types';
import PDFDocument from 'pdfkit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Handle transaction creation
    if (body.buyerName && body.itemName && body.price) {
      const transaction = await prisma.transaction.create({
        data: {
          buyerName: body.buyerName,
          total: body.price.toString(),
          items: {
            create: [{
              name: body.itemName,
              price: body.price.toString(),
              quantity: 1
            }]
          }
        },
        include: {
          items: true
        }
      });

      return NextResponse.json({
        ...transaction,
        date: transaction.date.toISOString(),
        total: transaction.total.toString(),
        items: transaction.items.map(item => ({
          ...item,
          price: item.price.toString()
        }))
      } as Transaction);
    }
    
    // Handle PDF generation
    const { customerName, items, total, id } = body;
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      const result = Buffer.concat(chunks);
      // In a production environment, we would save this to cloud storage
      // For now, we'll just send it directly
      return new NextResponse(result, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="receipt-${id}.pdf"`,
        },
      });
    });

    doc.fontSize(25).text('Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Customer: ${customerName}`);
    doc.moveDown();
    
    items.forEach((item: any) => {
      doc.text(`${item.name} - Qty: ${item.quantity} - $${item.price.toFixed(2)}`);
    });
    
    doc.moveDown();
    doc.fontSize(16).text(`Total: $${total.toFixed(2)}`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(10).text(new Date().toLocaleString(), { align: 'center' });
    
    doc.end();

    return NextResponse.json({ 
      success: true, 
      message: 'Order created successfully',
      // receiptUrl would be added here in production
    });

  } catch (error: unknown) {
    console.error('Error processing order:', error);
    return NextResponse.json(
      { success: false, message: 'Error processing order' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        date: 'desc'
      }
    });
    return NextResponse.json(transactions);
  } catch (error: unknown) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Error fetching transactions' }, 
      { status: 500 }
    );
  }
}
