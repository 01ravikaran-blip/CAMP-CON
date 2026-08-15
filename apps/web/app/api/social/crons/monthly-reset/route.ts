import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function GET(req: NextRequest) {
  // In a real production setup, secure this with a CRON_SECRET.
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find users whose lastEnergyRefill is older than 30 days
    const usersToReset = await prisma.user.findMany({
      where: {
        lastEnergyRefill: { lt: thirtyDaysAgo }
      },
      select: { id: true }
    });

    if (usersToReset.length === 0) {
      return NextResponse.json({ success: true, message: 'No users need pitch reset', processed: 0 });
    }

    // Reset freeMessageCount to 1 and update lastEnergyRefill to now
    const result = await prisma.user.updateMany({
      where: {
        id: { in: usersToReset.map(u => u.id) }
      },
      data: {
        freeMessageCount: 1,
        lastEnergyRefill: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Monthly pitch reset completed', 
      processed: result.count 
    });
  } catch (error: any) {
    console.error('Error during monthly reset:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
