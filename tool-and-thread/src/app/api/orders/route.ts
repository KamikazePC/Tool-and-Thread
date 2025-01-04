import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Handle transaction creation
    if (body.buyerName && body.itemName && body.price) {
      const transaction = await prisma.transaction.create({
        data: {
          buyerName: body.buyerName,
          total: body.price,
          items: {
            create: [{
              name: body.itemName,
              price: body.price,
              quantity: 1
            }]
          }
        },
        include: {
          items: true
        }
      });
      return NextResponse.json(transaction);
    }
    
    // Handle PDF generation
    const { customerName, items, total } = body;
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      // In a production environment, we would save this to cloud storage
      // and return a URL instead of the raw buffer
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

  } catch (error) {
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
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Error fetching transactions' }, 
      { status: 500 }
    );
  }
}
