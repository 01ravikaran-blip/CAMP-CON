import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { game, wagerAmount, currency, outcome, multiplier = 1 } = await req.json();

    if (!wagerAmount || wagerAmount < 10 || wagerAmount > 50) {
      return NextResponse.json({ error: 'Wager amount must be between 10 and 50' }, { status: 400 });
    }

    const isPoints = currency === 'POINTS';

    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const balance = isPoints ? (user as any).points : user.energy;

      if (balance < wagerAmount) {
        throw new Error(`Insufficient ${currency} balance`);
      }

      let newBalance = balance - wagerAmount;
      let profit = 0;

      if (outcome === 'WIN') {
        profit = Math.floor(wagerAmount * multiplier);
        newBalance = balance + profit; // Refund original wager + profit
      } else {
        profit = -wagerAmount;
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        // @ts-ignore - Prisma client generation mismatch in monorepo
        data: isPoints ? { points: newBalance } : { energy: newBalance }
      });

      return { updatedUser, profit };
    });

    return NextResponse.json({
      success: true,
      profit: result.profit,
      newBalance: isPoints ? (result.updatedUser as any).points : result.updatedUser.energy
    });

  } catch (error: any) {
    console.error('Wager Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
