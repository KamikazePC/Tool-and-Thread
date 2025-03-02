import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from "../../auth/config";

// Simple solution: use standard named export with direct parameter access
export async function DELETE(req: NextRequest) {
  // Extract the ID from the pathname (more reliable)
  const pathname = req.nextUrl.pathname;
  const idMatch = pathname.match(/\/api\/transactions\/(\d+)$/);
  const idString = idMatch ? idMatch[1] : '';
  
  console.log('DELETE request received for transaction ID:', idString);
  
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session?.user?.id) {
      console.log('No user session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse ID from path
    const id = parseInt(idString);
    console.log('Parsed transaction ID:', id, typeof id);

    if (isNaN(id)) {
      console.log('Invalid transaction ID - not a number');
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      );
    }

    try {
      // First check if the transaction exists
      console.log('Checking if transaction exists with ID:', id);
      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          user: true
        }
      });
      
      console.log('Transaction found:', transaction);
      
      if (!transaction) {
        console.log('Transaction not found in database');
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }

      console.log('Transaction user ID:', transaction.userId);
      console.log('Current user ID:', session.user.id);
      console.log('User IDs match:', transaction.userId === session.user.id);

      // Check if the transaction belongs to the current user
      if (transaction.userId !== session.user.id) {
        console.log('Unauthorized - Transaction belongs to a different user');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Delete the transaction
      console.log('Deleting transaction with ID:', id);
      try {
        // First delete related items due to the relationship
        await prisma.item.deleteMany({
          where: { transactionId: id }
        });
        
        // Then delete the transaction
        await prisma.transaction.delete({
          where: { id }
        });
        
        console.log('Transaction deleted successfully');
        return NextResponse.json({ message: 'Transaction deleted successfully' });
      } catch (deleteError) {
        console.error('Prisma error when deleting transaction:', deleteError);
        return NextResponse.json(
          { error: 'Database error while deleting transaction' },
          { status: 500 }
        );
      }
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        { error: 'Database error while fetching transaction' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}