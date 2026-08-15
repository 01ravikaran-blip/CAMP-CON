import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, action: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, action } = await params;
    
    return await prisma.$transaction(async (tx: any) => {
      const connection = await tx.connectionRequest.findUnique({
        where: { id }
      });

      if (!connection) {
        throw new Error('Connection request not found');
      }

      if (action === 'cancel') {
        if (connection.requesterId !== userId) {
          throw new Error('Unauthorized to cancel this request');
        }
        if (connection.status !== 'PENDING') {
          throw new Error('Only pending requests can be cancelled');
        }

        const refund = Math.floor(connection.energySpent * 0.9);
        
        await tx.user.update({
          where: { id: userId },
          data: { energy: { increment: refund } }
        });

        const updatedConnection = await tx.connectionRequest.update({
          where: { id },
          data: { status: 'CANCELLED' }
        });

        return NextResponse.json({ success: true, status: 'CANCELLED', refund, connection: updatedConnection });
      } 
      
      else if (action === 'accept') {
        if (connection.targetId !== userId) {
          throw new Error('Unauthorized to accept this request');
        }
        if (connection.status !== 'PENDING') {
          throw new Error('Only pending requests can be accepted');
        }

        // 48 hour TTL for chat
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);

        const updatedConnection = await tx.connectionRequest.update({
          where: { id },
          data: {
            status: 'ACCEPTED',
            chatExpiresAt: expiresAt
          }
        });

        return NextResponse.json({ success: true, status: 'ACCEPTED', connection: updatedConnection });
      }

      else if (action === 'reject') {
        if (connection.targetId !== userId) {
          throw new Error('Unauthorized to reject this request');
        }
        if (connection.status !== 'PENDING') {
          throw new Error('Only pending requests can be rejected');
        }

        // 0% refund, penaltyMultiplier = 2.0 (we set penaltyMultiplier to 2.0 to be used for next times)
        // Wait, the prompt says "PenaltyMultiplier = 2.0 is permanently flagged on the relation (A->B)". 
        // Our schema has penaltyMultiplier on ConnectionRequest, so next time A requests B, we check the latest REJECTED connection.
        const updatedConnection = await tx.connectionRequest.update({
          where: { id },
          data: { 
            status: 'REJECTED',
            penaltyMultiplier: 2.0
          }
        });

        return NextResponse.json({ success: true, status: 'REJECTED', connection: updatedConnection });
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    });
  } catch (error: any) {
    console.error('Error handling request action:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}
