import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });
    }

    if (userId === targetUserId) {
      return NextResponse.json({ error: 'Cannot target yourself' }, { status: 400 });
    }

    const [requester, targetUser, existingRequest] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.user.findUnique({ where: { id: targetUserId } }),
      prisma.connectionRequest.findFirst({
        where: { requesterId: userId, targetId: targetUserId },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    if (!requester || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Rank is simplified here as popularityScore relative ordering isn't strictly defined as a real-time rank query in the prompt,
    // so we will mock a rank or calculate it based on a simple ordering if needed.
    // To strictly get rank, we'd need to count how many users have higher popularity.
    const higherPopularityCount = await prisma.user.count({
      where: {
        tenantId: targetUser.tenantId,
        popularityScore: { gt: targetUser.popularityScore }
      }
    });
    const targetRank = higherPopularityCount + 1;

    let baseCost = 25; // Default General Batch

    if (targetRank >= 1 && targetRank <= 10) {
      baseCost = 100 + (11 - targetRank) * 20;
    } else if (targetRank >= 11 && targetRank <= 60) {
      baseCost = 80;
    } else if (targetRank >= 61 && targetRank <= 110) {
      baseCost = 50;
    }

    // Reverse Request Logic: If requester has better rank (lower number) than target, cost is 10
    const requesterHigherCount = await prisma.user.count({
      where: {
        tenantId: requester.tenantId,
        popularityScore: { gt: requester.popularityScore }
      }
    });
    const requesterRank = requesterHigherCount + 1;

    if (requesterRank < targetRank) {
      baseCost = 10;
    }

    // Apply Penalty Multiplier if the last request was rejected
    let penaltyMultiplier = 1.0;
    if (existingRequest && existingRequest.status === 'REJECTED') {
      penaltyMultiplier = 2.0; // The penalty flag is per relation
    }

    const finalCost = baseCost * penaltyMultiplier;

    return NextResponse.json({
      targetRank,
      baseCost,
      penaltyMultiplier,
      finalCost,
      requesterEnergy: requester.energy
    });
  } catch (error) {
    console.error('Error calculating request cost:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
