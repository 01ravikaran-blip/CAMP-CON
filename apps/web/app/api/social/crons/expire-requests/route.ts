import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function GET(req: NextRequest) {
  // In a real production setup, we would secure this route with a CRON secret:
  // if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const expiredRequests = await prisma.connectionRequest.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: sevenDaysAgo }
      }
    });

    if (expiredRequests.length === 0) {
      return NextResponse.json({ success: true, message: 'No expired requests to process', processed: 0 });
    }

    // Process all expirations in a transaction
    await prisma.$transaction(
      expiredRequests.map((req: any) => {
        const refundAmount = Math.floor(req.energySpent * 0.5); // 50% refund

        return prisma.user.update({
          where: { id: req.requesterId },
          data: {
            energy: { increment: refundAmount },
            sentRequests: {
              update: {
                where: { id: req.id },
                data: { status: 'EXPIRED' }
              }
            }
          }
        });
      })
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Expired requests processed', 
      processed: expiredRequests.length 
    });
  } catch (error: any) {
    console.error('Error expiring requests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
