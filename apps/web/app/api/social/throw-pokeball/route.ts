import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId, initialMessage } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });
    }

    if (userId === targetUserId) {
      return NextResponse.json({ error: 'Cannot throw a Pokéball at yourself' }, { status: 400 });
    }

    // Run calculations inside transaction to ensure atomic updates
    return await prisma.$transaction(async (tx: any) => {
      const requester = await tx.user.findUnique({ where: { id: userId } });
      const targetUser = await tx.user.findUnique({ where: { id: targetUserId } });
      const existingRequest = await tx.connectionRequest.findFirst({
        where: { requesterId: userId, targetId: targetUserId },
        orderBy: { createdAt: 'desc' }
      });

      if (!requester || !targetUser) {
        throw new Error('User not found');
      }
      
      if (existingRequest && ['PENDING', 'ACCEPTED'].includes(existingRequest.status)) {
        throw new Error('An active connection or pending request already exists');
      }

      // Calculate cost
      const higherPopularityCount = await tx.user.count({
        where: {
          tenantId: targetUser.tenantId,
          popularityScore: { gt: targetUser.popularityScore }
        }
      });
      const targetRank = higherPopularityCount + 1;

      let baseCost = 25;
      if (targetRank >= 1 && targetRank <= 10) {
        baseCost = 100 + (11 - targetRank) * 20;
      } else if (targetRank >= 11 && targetRank <= 60) {
        baseCost = 80;
      } else if (targetRank >= 61 && targetRank <= 110) {
        baseCost = 50;
      }

      const requesterHigherCount = await tx.user.count({
        where: {
          tenantId: requester.tenantId,
          popularityScore: { gt: requester.popularityScore }
        }
      });
      const requesterRank = requesterHigherCount + 1;

      if (requesterRank < targetRank) {
        baseCost = 10;
      }

      let penaltyMultiplier = 1.0;
      if (existingRequest && existingRequest.status === 'REJECTED') {
        penaltyMultiplier = 2.0;
      }

      let totalEnergyCost = baseCost * penaltyMultiplier;
      
      let usedFreePitch = false;
      if (initialMessage) {
        if (requester.freeMessageCount > 0) {
          usedFreePitch = true;
        } else {
          totalEnergyCost += 15; // 15 Energy for additional outgoing request messages
        }
      }

      const isHandshakeHour = process.env.NEXT_PUBLIC_HANDSHAKE_HOUR === 'true';
      if (isHandshakeHour) {
        totalEnergyCost = 0;
      }

      if (requester.energy < totalEnergyCost) {
        throw new Error(`Insufficient energy. You need ${totalEnergyCost} energy but have ${requester.energy}.`);
      }

      // Deduct energy & update user
      await tx.user.update({
        where: { id: userId },
        data: {
          energy: { decrement: totalEnergyCost },
          ...(usedFreePitch ? { freeMessageCount: { decrement: 1 } } : {})
        }
      });

      // Create Connection Request
      const connection = await tx.connectionRequest.create({
        data: {
          tenantId: requester.tenantId,
          requesterId: userId,
          targetId: targetUserId,
          status: 'PENDING',
          energySpent: totalEnergyCost,
          penaltyMultiplier: penaltyMultiplier,
        }
      });

      // Attach initial message if provided
      if (initialMessage) {
        await tx.directMessage.create({
          data: {
            connectionId: connection.id,
            senderId: userId,
            content: initialMessage,
            isRequestPitch: true
          }
        });
        
        // Decrement free monthly token is already handled in user update
      }

      return NextResponse.json({ success: true, connection, energyRemaining: requester.energy - totalEnergyCost });
    });
  } catch (error: any) {
    console.error('Error throwing pokeball:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}
