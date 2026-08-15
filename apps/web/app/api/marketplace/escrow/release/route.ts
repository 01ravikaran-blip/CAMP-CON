import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionId } = await req.json();

    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 });
    }

    // Use Prisma transaction to ensure atomic updates
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // @ts-ignore
      const transaction = await (tx as any).transaction.findUnique({
        where: { id: transactionId },
        include: { listing: true }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.buyerId !== userId) {
        throw new Error('Only the buyer can release the escrow');
      }

      if (transaction.escrowStatus !== 'HELD') {
        throw new Error('Escrow is not in a HELD state');
      }

      // Update the transaction status
      // @ts-ignore
      const updatedTx = await (tx as any).transaction.update({
        where: { id: transactionId },
        data: { escrowStatus: 'RELEASED' }
      });

      // Mark the listing as SOLD
      // @ts-ignore
      await (tx as any).marketplaceListing.update({
        where: { id: transaction.listingId },
        data: { status: 'SOLD' }
      });

      // If it was paid in points, we transfer the points from Escrow to the Seller
      // (Assuming the points were deducted from the buyer when the transaction was created)
      if (transaction.paymentType === 'IN_APP_POINTS' && transaction.amount > 0) {
        await tx.user.update({
          where: { id: transaction.sellerId },
          // @ts-ignore
          data: { points: { increment: transaction.amount } }
        });
      }

      return updatedTx;
    });

    return NextResponse.json({
      success: true,
      message: 'Escrow released successfully to seller',
      transaction: result
    });

  } catch (error: any) {
    console.error('Error releasing escrow:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
