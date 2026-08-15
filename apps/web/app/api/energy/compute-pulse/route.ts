import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { energy: true, maxEnergy: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Add +2 Energy, ensuring we don't exceed maxEnergy
      const newEnergy = Math.min(user.energy + 2, user.maxEnergy);

      if (newEnergy > user.energy) {
        await tx.user.update({
          where: { id: userId },
          data: { energy: newEnergy }
        });
      }

      return NextResponse.json({ success: true, energy: newEnergy });
    });
  } catch (error: any) {
    console.error('Error in compute-pulse:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
