import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '../../../../utils/prisma';
import { isDeveloper } from '../../../../lib/auth';

export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || !isDeveloper(sessionClaims)) {
      return NextResponse.json({ error: 'Unauthorized. Developer or Admin role required.' }, { status: 403 });
    }

    const user = await prisma.user.findFirst({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found in DB' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        energy: user.maxEnergy,
        lastEnergyRefill: new Date(),
      }
    });

    return NextResponse.json({ success: true, energy: updatedUser.energy });
  } catch (error: any) {
    console.error('Error refilling energy:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
