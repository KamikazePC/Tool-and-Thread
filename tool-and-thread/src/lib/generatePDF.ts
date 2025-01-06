import { jsPDF } from 'jspdf';
import { formatCurrency } from './currency';
import { Transaction } from '@/types';

export async function generateReceipt(transaction: Transaction): Promise<Buffer> {
  const doc = new jsPDF();
  
  // Helper function to add text and move cursor
  const addText = (text: string, y: number, options: { align?: 'left' | 'center' | 'right' | 'justify', fontSize?: number } = {}) => {
    const defaults: { align: 'left' | 'center' | 'right' | 'justify', fontSize: number } = { align: 'left', fontSize: 12 };
    const settings = { ...defaults, ...options };
    
    doc.setFontSize(settings.fontSize);
    doc.text(text, settings.align === 'center' ? doc.internal.pageSize.width / 2 : settings.align === 'right' ? doc.internal.pageSize.width - 20 : 20, y, {
      align: settings.align,
      maxWidth: doc.internal.pageSize.width - 40
    });
  };

  // Company Header
  addText('TailorTrack', 20, { fontSize: 24, align: 'center' });
  addText('Receipt', 30, { fontSize: 16, align: 'center' });

  // Receipt Details
  addText(`Date: ${new Date(transaction.date).toLocaleDateString()}`, 50);
  addText(`Receipt Number: #${transaction.id}`, 60);

  // Customer Details
  addText('Customer Details', 80, { fontSize: 14 });
  addText(`Name: ${transaction.buyerName}`, 90);

  // Transaction Details
  addText('Transaction Details', 110, { fontSize: 14 });
  
  // Table Headers
  let yPos = 120;
  doc.setFontSize(12);
  doc.text('Item', 20, yPos);
  doc.text('Qty', 100, yPos);
  doc.text('Price', 140, yPos);
  doc.text('Amount', 170, yPos);

  yPos += 10;

  // Table Content
  transaction.items.forEach((item) => {
    doc.text(item.name, 20, yPos);
    doc.text(item.quantity.toString(), 100, yPos);
    doc.text(formatCurrency(parseFloat(item.price), transaction.currency), 140, yPos);
    doc.text(formatCurrency(parseFloat(item.price) * item.quantity, transaction.currency), 170, yPos);
    yPos += 10;
  });

  yPos += 10;

  // Total
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Amount: ${formatCurrency(parseFloat(transaction.total), transaction.currency)}`, 170, yPos, { align: 'right' });

  // Footer
  addText('Thank you for your business!', 200, { fontSize: 10, align: 'center' });
  addText('For any queries, please contact us at support@tailortrack.com', 210, { fontSize: 10, align: 'center' });

  // Convert to Buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}
